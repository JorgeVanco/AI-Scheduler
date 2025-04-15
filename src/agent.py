import os
from dotenv import load_dotenv
from typing import Any

# Agent imports
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
from langfuse import Langfuse
from langfuse.decorators import observe
from langgraph.checkpoint.memory import MemorySaver

# Tools imports
from src.tools import (
    create_calendar_event,
    get_current_time,
    get_date_in_iso_format,
    sum_to_date,
)

load_dotenv()

langfuse = Langfuse(
    secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
    public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
    host=os.getenv("LANGFUSE_HOST"),
)

# Initialize our LLM
model = ChatOllama(model="llama3.1:8b", temperature=0)
tools = [get_current_time, get_date_in_iso_format, sum_to_date, create_calendar_event]
model = model.bind_tools(tools)

memory = MemorySaver()
agent_executor = create_react_agent(model, tools, checkpointer=memory)


@observe
def run_agent() -> dict[str, Any] | Any:
    config = {"configurable": {"thread_id": "abc123"}}
    for step in agent_executor.stream(
        {
            "messages": [
                HumanMessage(
                    content=f"Please create a calendar event for a meeting in 2 days at 5pm that will last for an hour in the calendar with id {os.getenv('CALENDAR_ID')}. The current date is {get_current_time.invoke('')}. "
                )
            ]
        },
        config,
        stream_mode="values",
    ):
        step["messages"][-1].pretty_print()
    return step


# @observe
# def run_agent() -> dict[str, Any] | Any:
#     config = {"configurable": {"thread_id": "abc123"}}
#     result = agent_executor.invoke(
#         {
#             "messages": [
#                 HumanMessage(
#                     content=f"Please create a calendar event for a meeting in 2 days at 5pm that will last for an hour in the calendar with id {os.getenv('CALENDAR_ID')}. First use the tools to get the correct times and dates and then create the calendar event with the output of those tool calls. Always check the current date to make sure you know the date and use it. The current date is {get_current_time.invoke('')}. "
#                 )
#             ]
#         },
#         config,
#     )
#     print(result)
#     return result


@observe
def main() -> None:
    return run_agent()


if __name__ == "__main__":
    main()
