'use client';
import React, { useState, useRef, useEffect } from "react";
import { Send, Ellipsis, Square } from "lucide-react"
import { Button } from "@/components/ui/button";
import AIUIMessage from "./chat/AIMessage";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

import { useCalendarContext } from "@/context/calendarContext";

import { ChatCalendarContext } from "@/types";


const ChatAssistant = () => {
    const [messages, setMessages] = useState<(HumanMessage | AIMessage | ToolMessage)[]>([]); // UI messages with tool tags
    const [agentMessages, setAgentMessages] = useState<(HumanMessage | AIMessage | ToolMessage)[]>([]); // Clean agent messages
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState('');
    const [waitingForResponse, setWaitingForResponse] = useState(false);
    const [showQuickCommands, setShowQuickCommands] = useState(false);
    const messageInputRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [chatCalendarContext, setChatCalendarContext] = useState<ChatCalendarContext | null>(null);

    const { calendars, tasks, events } = useCalendarContext();

    const quickCommands = [
        { label: "📅 Mi agenda de hoy", command: "/agenda" },
        { label: "✅ Resumen de tareas", command: "/tareas" },
        { label: "🕒 Tiempo libre", command: "/tiempo-libre" },
        { label: "📊 Carga de trabajo", command: "/carga" },
        { label: "⏰ Próximos eventos", command: "/próximos" },
        { label: "📈 Vista semanal", command: "/semana" },
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    useEffect(() => {
        setChatCalendarContext({
            calendars,
            tasks,
            events,
        });
    }, [calendars, tasks, events]);


    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            setIsLoading(false);
            setWaitingForResponse(false);
            return;
        } else if (!input.trim()) return;

        await sendMessage(input.trim());
    };

    const handleQuickCommand = async (command: string) => {
        await sendMessage(command);
        setShowQuickCommands(false);
    };

    const sendMessage = async (messageContent: string) => {
        const userMessage = new HumanMessage(messageContent);

        messageInputRef.current!.style.height = 'auto'; // Reset height before setting new value
        setMessages(prev => [...prev, userMessage]);
        setAgentMessages(prev => [...prev, userMessage]); // Add to both arrays
        setInput('');
        setIsLoading(true);
        setStreamingMessage('');
        setWaitingForResponse(true);

        // Create a new AbortController for this request
        abortControllerRef.current = new AbortController();

        let assistantContent = '';
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: agentMessages.concat([userMessage]),
                    calendarContext: chatCalendarContext,
                }),
                signal: abortControllerRef.current.signal, // Add signal for cancellation
            });

            if (!response.ok) {
                throw new Error('Failed to fetch response');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                setWaitingForResponse(false);
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                // Streaming finished
                                break;
                            } else {
                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.type === 'final_conversation') {
                                        setAgentMessages(parsed.agentMessages);
                                    }
                                    else if (parsed.type === 'tool_start') {
                                        assistantContent += parsed.content;
                                        setStreamingMessage(assistantContent);
                                    }
                                    else if (parsed.type === 'tool_end') {
                                        assistantContent += parsed.content;
                                        setStreamingMessage(assistantContent);
                                    }
                                    else if (parsed.type === 'message' && parsed.content) {
                                        assistantContent += parsed.content;
                                        setStreamingMessage(assistantContent);
                                    }
                                    else if (parsed.content && !parsed.type) {
                                        assistantContent += parsed.content;
                                        setStreamingMessage(assistantContent);
                                    }
                                } catch (error) {
                                    console.error('Error parsing chunk:', error);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error: Error | any) {
            if (abortControllerRef.current?.signal.aborted && error.name === 'AbortError') {
                console.log('Request aborted');
            } else {
                console.error('Error:', error);
                assistantContent = 'Lo siento, hubo un error al procesar tu mensaje. Asegúrate de que Ollama esté ejecutándose en tu sistema.';
            }
        } finally {
            const assistantMessage = new AIMessage(assistantContent);
            setMessages(prev => [...prev, assistantMessage]);
            setStreamingMessage('');
            setIsLoading(false);
            setWaitingForResponse(false);
            abortControllerRef.current = null;
        }
    };

    return (
        <div style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: "16px 0",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
        }}>
            <div
                className="flex-1 overflow-y-auto gap-4 flex flex-col px-6 min-h-0 max-h-full"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#bdbdbd #f5f5f5"
                }}
            >
                <style>
                    {`
                        /* For Chrome, Edge, and Safari */
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 6px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #bdbdbd;
                            border-radius: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: #f5f5f5;
                        }
                    `}
                </style>
                {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-lg mb-2">👋 ¡Hola! Soy tu asistente de IA</div>
                        <div className="text-sm mb-4">
                            Te ayudo a organizar tu calendario y tareas. Puedes preguntarme cosas como:
                        </div>
                        <div className="text-sm text-left max-w-md mx-auto space-y-1">
                            <div>• "¿Qué tengo programado hoy?"</div>
                            <div>• "Muéstrame mis tareas pendientes"</div>
                            <div>• "¿Cuándo estoy libre?"</div>
                            <div>• "¿Cómo está mi carga de trabajo?"</div>
                        </div>
                        <div className="text-xs mt-4 text-gray-400">
                            💡 Tip: Haz clic en ⚡ para ver comandos rápidos
                        </div>
                    </div>
                )}
                {messages.map((msg, index) => {
                    return (<div key={index} style={{
                        textAlign: msg._getType() === "ai" ? "left" : "right",
                    }}>
                        {msg._getType() === "ai" ? (
                            <AIUIMessage message={msg.content as string} />
                        ) : (
                            <div style={{
                                background: "#d1e7dd",
                                borderRadius: 6,
                                padding: "4px 8px",
                                display: "inline-block",
                                maxWidth: "80%",
                                wordWrap: "break-word"
                            }}>
                                <AIUIMessage message={msg.content as string} />
                            </div>
                        )}
                    </div>
                    )
                })}

                {/* Show waiting message if waiting for response */}
                {waitingForResponse && (
                    <div style={{ textAlign: "left" }}>
                        <Ellipsis className="animate-blink" />
                        <style>
                            {`
                                @keyframes blink {
                                    0% { opacity: 1; }
                                    50% { opacity: 0.2; }
                                    100% { opacity: 1; }
                                }
                                .animate-blink {
                                    animation: blink 1s infinite;
                                }
                            `}
                        </style>
                    </div>
                )}

                {/* Show streaming message */}
                {streamingMessage && (
                    <div style={{ textAlign: "left" }}>
                        <AIUIMessage message={streamingMessage} />
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Commands */}
            {showQuickCommands && (
                <div className="mx-4 mb-2 p-3 bg-gray-50 rounded-lg border">
                    <div className="text-sm font-medium text-gray-700 mb-2">Comandos rápidos:</div>
                    <div className="grid grid-cols-2 gap-2">
                        {quickCommands.map((cmd, index) => (
                            <Button
                                key={index}
                                variant="ghost"
                                size="sm"
                                className="justify-start text-left text-xs h-8"
                                onClick={() => handleQuickCommand(cmd.command)}
                                disabled={isLoading}
                            >
                                {cmd.label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <div className="relative mx-4">
                <form onSubmit={handleSubmit}>
                    <div className="relative">
                        <textarea
                            value={input}
                            ref={messageInputRef}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Envía un mensaje..."
                            className="w-full min-h-[40px] max-h-[300px] resize-none overflow-y-auto pl-10 pr-10 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isLoading}
                            rows={1}
                            style={{
                                scrollbarWidth: "thin",
                                scrollbarColor: "#bdbdbd #f5f5f5"
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = Math.min(target.scrollHeight, 300) + 'px';
                            }}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => setShowQuickCommands(!showQuickCommands)}
                            className="absolute left-1 bottom-0 transform -translate-y-1/4 h-8 w-8"
                            disabled={isLoading}
                            title="Comandos rápidos"
                        >
                            <span className="text-sm">⚡</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            type="submit"
                            disabled={!input.trim() && !isLoading}
                            className="absolute right-1 bottom-0 transform -translate-y-1/4 h-8 w-8"
                        >
                            {isLoading ? <Square className="fill-current" fill="currentColor" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatAssistant;
