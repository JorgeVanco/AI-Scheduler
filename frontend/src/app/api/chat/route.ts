/* eslint-disable  @typescript-eslint/no-explicit-any */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { NextResponse } from 'next/server';

import { ChatCalendarContext } from "@/types";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage, isSystemMessage, BaseMessage } from "@langchain/core/messages";
import { CallbackHandler } from "langfuse-langchain";

import { AgentUtils } from "@/agent/utils";
import { AgentCommands } from "@/agent/commands";
import { PromptBuilder } from "@/agent/prompts";

import agent from "@/agent/agent";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    kwargs: {
        content: string;
        tool_call_id: string;
        name: string;
        tool_calls?: any[];
        additional_kwargs?: any;
    };
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messages, calendarContext }: { messages: ChatMessage[]; calendarContext: ChatCalendarContext } = await req.json();

        // Get the latest message from the user
        const lastMessage = messages[messages.length - 1];
        const userPrompt = typeof lastMessage?.content === 'string' ? lastMessage.content : '';

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
            const commandResult = agentCommands.executeCommand(detectedCommand, commandParams ? { date: commandParams } : undefined);

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
        const langchainMessages: (HumanMessage | AIMessage | ToolMessage | SystemMessage)[] = [new SystemMessage(systemMessageContent), ...messages.map(msg => {
            if (msg.role === 'user' || msg.id.includes('HumanMessage')) {
                return new HumanMessage(msg.kwargs.content);
            }
            else if (msg.role === 'assistant' || msg.id.includes('AIMessage') || msg.id.includes('AIMessageChunk')) {
                // Create AIMessage and preserve tool_calls
                const aiMessage = new AIMessage(msg.kwargs.content);
                if (msg.kwargs.tool_calls) {
                    aiMessage.tool_calls = msg.kwargs.tool_calls;
                }
                if (msg.kwargs.additional_kwargs) {
                    aiMessage.additional_kwargs = msg.kwargs.additional_kwargs;
                }
                return aiMessage;
            }
            else if (msg.role === 'tool' || msg.id.includes('ToolMessage')) {
                return new ToolMessage(msg.kwargs.content, msg.kwargs.tool_call_id, msg.kwargs.name);
            } else {
                // Fallback - create AIMessage
                const aiMessage = new AIMessage(msg.kwargs.content);
                if (msg.kwargs.tool_calls) {
                    aiMessage.tool_calls = msg.kwargs.tool_calls;
                }
                if (msg.kwargs.additional_kwargs) {
                    aiMessage.additional_kwargs = msg.kwargs.additional_kwargs;
                }
                return aiMessage;
            }
        })];

        const config = {
            "configurable": {
                "thread_id": crypto.randomUUID(),
                "accessToken": session.accessToken
            },
        };

        const langfuseHandler = new CallbackHandler({
            publicKey: process.env.LANGFUSE_PUBLIC_KEY,
            secretKey: process.env.LANGFUSE_SECRET_KEY,
            baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
        });

        const stream = agent.streamEvents(
            { messages: langchainMessages },
            { version: "v2", signal: req.signal, callbacks: [langfuseHandler], ...config }
        );

        // Create a readable stream for the response
        const encoder = new TextEncoder();
        let finalAgentMessages: (AIMessage | HumanMessage | ToolMessage | SystemMessage)[] = [];

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const { event, data, name } = chunk;

                        if (event === "on_chain_end" && name === "LangGraph") {
                            finalAgentMessages = data.output.messages || [];
                            if (isSystemMessage(finalAgentMessages[0])) {
                                finalAgentMessages = finalAgentMessages.slice(1);
                            }
                        }

                        // on_tool_start does not give id, so we handle it here
                        if (event === "on_chat_model_end" && data.output.tool_calls?.length > 0) {
                            // Handle tool calls
                            for (const toolCall of data.output.tool_calls) {
                                const toolData = `data: ${JSON.stringify({
                                    type: 'tool_start',
                                    content: `Tool called: ${toolCall.name}`,
                                    toolName: toolCall.name,
                                    tool_call_id: toolCall.id
                                })}\n\n`;
                                controller.enqueue(encoder.encode(toolData));
                            }
                        }

                        else if (event === "on_tool_end") {
                            const tool_call_id = data?.output?.tool_call_id || name;
                            const toolData = `data: ${JSON.stringify({
                                type: 'tool_end',
                                content: ``,
                                toolName: name,
                                output: data?.output,
                                tool_call_id: data?.output?.tool_call_id
                            })}\n\n`;
                            controller.enqueue(encoder.encode(toolData));
                        }

                        else if (event === "on_chain_start") {
                            // Handle tool call failures
                            if (data?.input?.messages[0].content?.includes("Error:")) {
                                const tool_call_id = data?.input?.messages[0].tool_call_id
                                const errorMsg = data?.input?.messages[0].content || 'Unknown error';
                                const errorData = `data: ${JSON.stringify({
                                    type: 'tool_error',
                                    content: `Tool call failed: ${errorMsg}`,
                                    toolName: name,
                                    error: errorMsg,
                                    tool_call_id: tool_call_id
                                })}\n\n`;
                                controller.enqueue(encoder.encode(errorData));
                            }
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

                    if (finalAgentMessages.length > 0) {
                        // Serialize messages properly to preserve all properties
                        const serializedMessages = finalAgentMessages.map(msg => {
                            const baseMsg = {
                                id: msg.id,
                                content: msg.content,
                                additional_kwargs: msg.additional_kwargs,
                                response_metadata: msg.response_metadata
                            };

                            // Check message type by constructor name or id
                            const messageType = msg.constructor?.name || '';
                            const isAIMessage = messageType === 'AIMessage' || messageType === 'AIMessageChunk' ||
                                (msg.id && (msg.id.includes('AIMessage') || msg.id.includes('AIMessageChunk')));
                            const isHumanMessage = messageType === 'HumanMessage' ||
                                (msg.id && msg.id.includes('HumanMessage'));
                            const isToolMessage = messageType === 'ToolMessage' ||
                                (msg.id && msg.id.includes('ToolMessage'));

                            if (isAIMessage) {
                                return {
                                    ...baseMsg,
                                    type: 'ai',
                                    tool_calls: (msg as any).tool_calls,
                                    tool_call_chunks: (msg as any).tool_call_chunks,
                                    invalid_tool_calls: (msg as any).invalid_tool_calls,
                                    usage_metadata: (msg as any).usage_metadata
                                };
                            } else if (isHumanMessage) {
                                return {
                                    ...baseMsg,
                                    type: 'human'
                                };
                            } else if (isToolMessage) {
                                return {
                                    ...baseMsg,
                                    type: 'tool',
                                    tool_call_id: (msg as any).tool_call_id,
                                    name: (msg as any).name
                                };
                            } else {
                                return {
                                    ...baseMsg,
                                    type: 'unknown'
                                };
                            }
                        });

                        const finalStateData = `data: ${JSON.stringify({
                            type: 'final_conversation',
                            agentMessages: serializedMessages
                        })}\n\n`;
                        controller.enqueue(encoder.encode(finalStateData));
                    }

                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error: unknown) {
                    if (req.signal.aborted && (error as Error).name === 'AbortError') {
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