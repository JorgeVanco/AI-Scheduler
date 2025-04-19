import os
from dotenv import load_dotenv
from typing import Any, TypedDict, Annotated, Dict
import operator

# Agent imports
from langchain_ollama import ChatOllama
from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage, ToolMessage

# from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from langfuse import Langfuse
from langfuse.callback import CallbackHandler
from langgraph.graph.state import CompiledStateGraph

# Prompts
from src.prompts import (
    AGENT_SYSTEM,
    PLANNER_PROMPT,
    EVENT_CREATOR_PROMPT,
    PLANNER_SYSTEM,
    REVIEW_PROMT,
    REVIEWER_PROMPT,
    REVIEWER_SYSTEM,
)

try:
    from src.personal_prompt import PERSONAL_PROMPT
except ImportError:
    PERSONAL_PROMPT = ""

# Models imports
from src.models import (
    CalendarEvent,
    TaskListModel,
    CalendarEventList,
    TasksList,
)

# Tools imports
from src.tools import (
    create_calendar_event,
    list_calendars,
    get_calendar_events,
    list_tasks,
    get_tasks,
    get_current_time,
    get_date_in_iso_format,
    sum_to_date,
)

load_dotenv()


# GRAPH
class ScheduleState(TypedDict):
    # Processing metadata
    messages: Annotated[
        list[AnyMessage], operator.add
    ]  # Track conversation with LLM for analysis
    current_time: str

    calendars: CalendarEventList  # List of calendars
    events: list[CalendarEvent]  # List of calendar events
    tasks: list[TaskListModel]  # List of tasks
    schedule: str  # Generated schedule
    feedback: str  # Feedback of the schedule

    rewrites: int  # Number of rewrites done


class Agent:
    def __init__(
        self, model, tools, checkpointer=None, system: str = "", max_rewrites: int = 3
    ) -> None:
        self.checkpointer = checkpointer
        self.system = system
        self.max_rewrites = max_rewrites

        self.graph = self.build_graph()

        self.tools = {t.name: t for t in tools}
        self.model = model.bind_tools(tools)
        self.planner = model

    def build_graph(self) -> CompiledStateGraph:
        graph = StateGraph(ScheduleState)
        graph.add_node("get_current_time", self.get_current_time)
        graph.add_node("get_calendars", self.get_calendars)
        graph.add_node("get_calendar_events", self.get_calendar_events)
        graph.add_node("get_tasks", self.get_tasks)
        graph.add_node("plan", self.plan)
        graph.add_node("review", self.review)
        graph.add_node("prompt_event_creation", self.prompt_event_creation)
        graph.add_node("llm", self.call_llm)
        graph.add_node("action", self.take_action)

        graph.add_edge("get_current_time", "get_calendars")
        graph.add_edge("get_calendars", "get_calendar_events")
        graph.add_edge("get_calendar_events", "get_tasks")
        graph.add_edge("get_tasks", "plan")
        graph.add_edge("plan", "review")
        graph.add_conditional_edges(
            "review",
            self.confirm_schedule,
            {True: "prompt_event_creation", False: "plan"},
        )
        graph.add_edge("prompt_event_creation", "llm")
        graph.add_conditional_edges(
            "llm", self.exists_action, {True: "action", False: END}
        )
        graph.add_edge("action", "llm")

        graph.set_entry_point("get_current_time")
        return graph.compile(checkpointer=self.checkpointer)

    def get_current_time(self, state: ScheduleState) -> Dict[str, Any]:
        current_time = get_current_time.invoke("")
        return {"current_time": current_time}

    def get_calendars(self, state: ScheduleState) -> Dict[str, Any]:
        calendars = list_calendars()
        return {"calendars": calendars}

    def get_calendar_events(self, state: ScheduleState) -> Dict[str, Any]:
        events = [
            {calendar.summary: get_calendar_events(calendar.id)}
            for calendar in state["calendars"]
        ]
        events = CalendarEventList(events=events)
        return {"events": events}

    def get_tasks(self, state: ScheduleState) -> Dict[str, Any]:
        tasks_lists = list_tasks()
        tasks = [
            {task_list.title: get_tasks(task_list.id)} for task_list in tasks_lists
        ]
        tasks = TasksList(tasks=tasks)
        return {"tasks": tasks}

    def plan(self, state: ScheduleState) -> Dict[str, Any]:
        prompts = [
            SystemMessage(PLANNER_SYSTEM),
            HumanMessage(
                content=PLANNER_PROMPT.format(
                    current_time=state["current_time"],
                    events=state["events"],
                    tasks=state["tasks"],
                )
                + PERSONAL_PROMPT,
            ),
        ]

        if state.get("feedback", None) is not None:
            prompts.append(
                HumanMessage(
                    content=REVIEW_PROMT.format(
                        schedule=state["schedule"], feedback=state["feedback"]
                    )
                )
            )

        message = self.planner.invoke(prompts)
        return {"messages": [message], "schedule": message.content}

    def review(self, state: ScheduleState) -> Dict[str, Any]:
        message = self.planner.invoke(
            [
                SystemMessage(REVIEWER_SYSTEM),
                HumanMessage(
                    content=REVIEWER_PROMPT.format(
                        schedule=state["schedule"], events=state["events"]
                    )
                    + PERSONAL_PROMPT,
                ),
            ]
        )

        return {
            "messages": [message],
            "feedback": message.content,
            "rewrites": state.get("rewrites", 0) + 1,
        }

    def confirm_schedule(self, state: ScheduleState) -> bool:
        """Check if the schedule needs to be rewritten based on the review"""
        return (
            "OK" in state["feedback"]
            and "CHANGES" not in state["feedback"]
            or state["rewrites"] >= self.max_rewrites
        )

    def prompt_event_creation(self, state: ScheduleState) -> Dict[str, Any]:
        """Add the event creation prompt to the messages once after planning"""
        return {
            "messages": [
                SystemMessage(
                    content=self.system + f"The current date is {state['current_time']}"
                ),
                HumanMessage(
                    content=EVENT_CREATOR_PROMPT.format(schedule=state["schedule"])
                ),
            ]
        }

    def call_llm(self, state: ScheduleState) -> Dict[str, Any]:
        messages = state["messages"]
        message = self.model.invoke(messages)
        return {"messages": [message]}

    def exists_action(self, state: ScheduleState) -> bool:
        result = state["messages"][-1]
        return len(result.tool_calls) > 0

    def take_action(self, state: ScheduleState) -> Dict[str, list]:
        tool_calls = state["messages"][-1].tool_calls
        results = []
        for t in tool_calls:
            print(f"Calling: {t}")
            result = self.tools[t["name"]].invoke(t["args"])
            results.append(
                ToolMessage(tool_call_id=t["id"], name=t["name"], content=str(result))
            )
        print("Back to the model!")
        return {"messages": results}


def run_agent() -> None:
    for event in agent.graph.stream(
        {"messages": messages}, config={"callbacks": [langfuse_handler]}
    ):
        for v in event.values():
            if "messages" in v:
                v["messages"][-1].pretty_print()


if __name__ == "__main__":
    langfuse = Langfuse(
        secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
        public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
        host=os.getenv("LANGFUSE_HOST"),
    )
    langfuse_handler = CallbackHandler()

    # Initialize our LLM
    model = ChatOllama(model="llama3.1:8b", temperature=0, max_tokens=4000)
    tools = [
        get_current_time,
        get_date_in_iso_format,
        sum_to_date,
        create_calendar_event,
    ]
    agent = Agent(
        model,
        tools,
        checkpointer=None,
        system=AGENT_SYSTEM,
    )
    messages = []

    run_agent()
