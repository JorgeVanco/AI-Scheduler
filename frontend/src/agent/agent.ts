import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
    }),
});

import { tool } from "@langchain/core/tools";
import { z } from "zod";

const searchTool = tool((_) => {
    // This is a placeholder for the actual implementation
    return "Cold, with a low of 3℃";
}, {
    name: "search",
    description:
        "Use to surf the web, fetch current information, check the weather, and retrieve other information.",
    schema: z.object({
        query: z.string().describe("The query to use in your search."),
    }),
});

const tools = [searchTool];

import { ToolNode } from "@langchain/langgraph/prebuilt";

const toolNode = new ToolNode(tools);

import { ChatOllama } from "@langchain/ollama";

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
        const systemMessage = new SystemMessage("You are a helpful AI assistant for calendar and task management");
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