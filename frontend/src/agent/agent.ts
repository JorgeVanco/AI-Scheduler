import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
// import { ChatOllama } from "@langchain/ollama";
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { allTools } from "./tools/index";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";

const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
    }),
});

// Combine all tools: original search tool + new calendar/task/time tools
const tools = [new DuckDuckGoSearch({ maxResults: 5 }), ...allTools]; // [searchTool, ...allTools];

const toolNode = new ToolNode(tools);

// const model = new ChatOllama({
//     baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
//     model: process.env.OLLAMA_MODEL || "llama3.2",
//     temperature: 0.1,
// });
const model = new ChatTogetherAI({
    apiKey: process.env.TOGETHER_AI_API_KEY,
    model: process.env.TOGETHER_AI_MODEL || "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free", // Default to a specific model if not set
    temperature: 0.1,
})

const boundModel = model.bindTools(tools);

import { StateGraph, END } from "@langchain/langgraph";
import { AIMessage, SystemMessage } from "@langchain/core/messages";

const routeMessage = (state: typeof StateAnnotation.State) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1] as AIMessage;
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
        const systemMessage = new SystemMessage(`You are an advanced AI assistant for calendar and task management. You MUST respond in the same language the user is using in their messages.

LANGUAGE RULES:
- If user writes in Spanish, respond in Spanish
- If user writes in English, respond in English
- If user writes in any other language, respond in that language
- Always maintain a helpful, professional tone regardless of language

TOOL USAGE STRATEGY:
1. Always use tools when you need current information
2. Use get_calendars before creating events if user doesn't specify a calendar
3. Use get_task_lists before creating tasks if user doesn't specify a task list
4. Use get_current_time when you need to know the current date/time
5. Use add_time to calculate future/past dates for scheduling

AVAILABLE TOOLS:

SEARCH TOOL:
- duckduckgo_search: Search the web for current information (returns top 5 results)

CALENDAR MANAGEMENT:
- get_calendars: Retrieve all user's Google calendars with their IDs and names
- get_events: Fetch events from specific calendars within date ranges (defaults to primary calendar and today)
- create_event: Create new calendar events with title, description, datetime, location, attendees
- search_events: Search for events by text query across calendars
- get_free_busy: Check availability and find free time slots

TASK MANAGEMENT:
- get_task_lists: Get all user's task lists with IDs and names
- get_tasks: Retrieve tasks from specific task lists
- create_task: Create new tasks with title, notes, and due dates

TIME UTILITIES:
- get_current_time: Get current date/time in any timezone
- add_time: Calculate future/past dates (add/subtract time)
- format_datetime: Format dates in various formats
- calculate_time_difference: Calculate duration between two dates

CRITICAL INSTRUCTIONS:
1. ALWAYS use tools when you need current information (calendars, events, tasks)
2. NEVER modify calendar IDs, task list IDs, or event IDs - use them EXACTLY as provided
3. When creating events, get calendar list first if user doesn't specify a calendar
4. When creating tasks, get task lists first if user doesn't specify a task list
5. Use proper ISO datetime format for all date/time operations
6. Be proactive - suggest relevant actions based on user's calendar context
7. Provide clear, actionable responses with specific next steps
8. When managing times that are in different timezones, think if it is an online event that might require timezone conversion, or if the time should be kept because the user might be in that timezone when it requires.
9. When creating many events at the same time, first list them to make sure you do not mess it up, and then create them one by one. Do not create any test events.


Current date: ${new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })} at ${new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })}`);
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