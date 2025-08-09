import { ChatOllama } from "@langchain/ollama";
import { Message, ChatCalendarContext } from "@/types";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

import { getDateEvents, getNextXHoursEvents } from "@/agent/tools";
import { AgentUtils } from "@/agent/utils";
import { AgentCommands } from "@/agent/commands";
import { PromptBuilder } from "@/agent/prompts";

import agent from "@/agent/agent";
import { AIMessageChunk, isAIMessageChunk } from "@langchain/core/messages";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, calendarContext }: { messages: Message[]; calendarContext: ChatCalendarContext } = await req.json();

        // Get the latest message from the user
        const lastMessage = messages[messages.length - 1];
        const userPrompt = lastMessage?.content || '';

        // Initialize agent utilities
        const agentUtils = new AgentUtils(calendarContext);
        const agentCommands = new AgentCommands(calendarContext);
        const promptBuilder = new PromptBuilder(calendarContext);

        // Analyze user intent and get contextual information
        const intentAnalysis = agentUtils.analyzeIntent(userPrompt);
        const smartSuggestions = agentUtils.generateSmartSuggestions();
        const priorityInsights = agentUtils.getPriorityInsights();

        // Check if the user message contains a direct command
        const commandPattern = /^\/(\w+)(?:\s+(.*))?$/;
        const commandMatch = userPrompt.match(commandPattern);

        let detectedCommand = null;
        let commandParams = null;

        if (commandMatch) {
            detectedCommand = commandMatch[1];
            commandParams = commandMatch[2];
        }

        if (detectedCommand) {
            const commandResult = agentCommands.executeCommand(detectedCommand, commandParams);

            if (commandResult.success) {
                // Return command result as a stream
                const encoder = new TextEncoder();
                const readableStream = new ReadableStream({
                    start(controller) {
                        const data = `data: ${JSON.stringify({ content: commandResult.message })}\n\n`;
                        controller.enqueue(encoder.encode(data));
                        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                        controller.close();
                    },
                });

                return new Response(readableStream, {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    },
                });
            }
        }

        // Build system prompt with context
        const systemMessageContent = promptBuilder.buildSystemPrompt(
            intentAnalysis,
            smartSuggestions,
            priorityInsights
        );

        // Stream the response
        const langchainMessages = messages.map(msg => {
            if (msg.role === 'user') {
                return new HumanMessage(msg.content);
            } else {
                return new AIMessage(msg.content);
            }
        });

        const stream = await agent.streamEvents(
            { messages: langchainMessages },
            { version: "v2", signal: req.signal }
        );

        // Create a readable stream for the response
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const { event, data, name } = chunk;
                        console.log(chunk)
                        // on_tool_start does not give id, so we handle it here
                        if (event === "on_chat_model_end" && data.output.tool_calls?.length > 0) {
                            // Handle tool calls
                            for (const toolCall of data.output.tool_calls) {
                                const toolData = `data: ${JSON.stringify({
                                    type: 'tool_start',
                                    content: `<tool id="${toolCall.id}">Tool called: ${toolCall.name}`,
                                    toolName: toolCall.name,
                                    toolId: toolCall.id
                                })}\n\n`;
                                controller.enqueue(encoder.encode(toolData));
                            }
                        }
                        // if (event === "on_tool_start") {
                        //     // console.log('Tool started:', chunk);
                        //     const toolData = `data: ${JSON.stringify({
                        //         type: 'tool_start',
                        //         content: `<tool id="${name}">Tool being called: ${name}`,
                        //         toolName: name,
                        //     })}\n\n`;
                        //     controller.enqueue(encoder.encode(toolData));
                        // }

                        else if (event === "on_tool_end") {
                            console.log(data)
                            // console.log('Tool ended:', chunk);
                            const toolId = data?.output?.tool_call_id || name;
                            const toolData = `data: ${JSON.stringify({
                                type: 'tool_end',
                                content: `</tool id="${toolId}">`,
                                toolName: name,
                                output: data?.output,
                                toolId: data?.output.tool_call_id
                            })}\n\n`;
                            controller.enqueue(encoder.encode(toolData));
                        }

                        else if (event === "on_chat_model_stream") {
                            // Handle AI message streaming
                            const content = data?.chunk?.content || '';
                            if (content) {
                                const streamData = `data: ${JSON.stringify({
                                    type: 'message',
                                    content
                                })}\n\n`;
                                controller.enqueue(encoder.encode(streamData));
                            }
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error: any) {
                    if (req.signal.aborted && error.name === 'AbortError') {
                        console.log('Stream aborted');
                    } else {
                        console.error('Stream error:', error);
                        controller.error(error);
                    }
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('API Error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to process request' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}