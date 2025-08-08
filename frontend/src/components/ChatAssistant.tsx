'use client';
import React, { useState, useRef, useEffect } from "react";
import { Send, Ellipsis, Square } from "lucide-react"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AIMessage from "./chat/AIMessage";
import { set } from "react-hook-form";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const ChatAssistant = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState('');
    const [waitingForResponse, setWaitingForResponse] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

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

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
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
                    messages: [...messages, userMessage],
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
                                    if (parsed.content) {
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
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantContent,
            };
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
                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        textAlign: msg.role === "assistant" ? "left" : "right",
                    }}>
                        {msg.role === "assistant" ? (
                            <AIMessage message={msg.content} />
                        ) : (
                            <div style={{
                                background: "#d1e7dd",
                                borderRadius: 6,
                                padding: "4px 8px",
                                display: "inline-block",
                                maxWidth: "80%",
                                wordWrap: "break-word"
                            }}>
                                <AIMessage message={msg.content} />
                            </div>
                        )}
                    </div>
                ))}

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
                        <AIMessage message={streamingMessage} />
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="relative mx-4">
                <form onSubmit={handleSubmit}>
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Envía un mensaje..."
                            className="w-full min-h-[40px] max-h-[300px] resize-none overflow-y-auto pr-8 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isLoading}
                            rows={1}
                            style={{
                                scrollbarWidth: "thin",
                                scrollbarColor: "#bdbdbd #f5f5f5"
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
