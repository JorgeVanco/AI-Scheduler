import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOllama } from "@langchain/ollama";
import { allTools } from "./tools/index";

const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
    }),
});

// Combine all tools: original search tool + new calendar/task/time tools
const tools = [...allTools]; // [searchTool, ...allTools];

const toolNode = new ToolNode(tools);

const model = new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2",
    temperature: 0.7,
});

const boundModel = model.bindTools(tools);

import { StateGraph, END } from "@langchain/langgraph";
import { AIMessage, SystemMessage } from "@langchain/core/messages";

const routeMessage = (state: typeof StateAnnotation.State) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1] as AIMessage;
    // console.log(messages)
    // If no tools are called, we can finish (respond to the user)
    if (!lastMessage?.tool_calls?.length) {
        return END;
    }
    // Otherwise if there is, we continue and call the tools
    return "tools";
};

const callModel = async (
    state: typeof StateAnnotation.State,
) => {
    // For versions of @langchain/core < 0.2.3, you must call `.stream()`
    // and aggregate the message from chunks instead of calling `.invoke()`.
    const { messages } = state;

    // Add a default system message if none exists
    let messagesToSend = messages;
    if (!messages.some(msg => msg instanceof SystemMessage)) {
        const systemMessage = new SystemMessage(`You are a helpful AI assistant for calendar and task management. You have access to the following capabilities:

CALENDAR MANAGEMENT:
- Get list of user's calendars
- View events from specific calendars within date ranges
- Create new calendar events with details like title, description, start/end times, location, and attendees

TASK MANAGEMENT:
- Get list of user's task lists
- View tasks from specific task lists
- Create new tasks with title, notes, and due dates

TIME UTILITIES:
- Get current date and time in any timezone
- Calculate time differences between dates
- Format dates and times in various formats
- Add or subtract time from dates (minutes, hours, days, weeks, months, years)

Always use the appropriate tools to help users manage their calendars and tasks effectively. When creating events or tasks, ask for necessary details and provide helpful suggestions.`);
        messagesToSend = [systemMessage, ...messages];
    }

    const responseMessage = await boundModel.invoke(messagesToSend);
    return { messages: [responseMessage] };
};

const workflow = new StateGraph(StateAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", routeMessage)
    .addEdge("tools", "agent");

const agent = workflow.compile();
console.log("Agent workflow compiled successfully");

export default agent;