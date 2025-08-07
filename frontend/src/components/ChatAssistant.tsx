'use client';
import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setStreamingMessage('');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch response');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            if (reader) {
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
                                const assistantMessage: Message = {
                                    id: (Date.now() + 1).toString(),
                                    role: 'assistant',
                                    content: assistantContent,
                                };
                                setMessages(prev => [...prev, assistantMessage]);
                                setStreamingMessage('');
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
        } catch (error) {
            console.error('Error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Lo siento, hubo un error al procesar tu mensaje. Asegúrate de que Ollama esté ejecutándose en tu sistema.',
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 16,
            height: 400,
            display: "flex",
            flexDirection: "column",
            background: "#fff"
        }}>
            <div style={{ flex: 1, overflowY: "auto", marginBottom: 8 }}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        textAlign: msg.role === "assistant" ? "left" : "right",
                        margin: "4px 0"
                    }}>
                        <span style={{
                            background: msg.role === "assistant" ? "#f0f0f0" : "#d1e7dd",
                            borderRadius: 6,
                            padding: "6px 12px",
                            display: "inline-block",
                            maxWidth: "80%",
                            wordWrap: "break-word"
                        }}>
                            {msg.content}
                        </span>
                    </div>
                ))}

                {/* Show streaming message */}
                {streamingMessage && (
                    <div style={{ textAlign: "left", margin: "4px 0" }}>
                        <span style={{
                            background: "#f0f0f0",
                            borderRadius: 6,
                            padding: "6px 12px",
                            display: "inline-block",
                            maxWidth: "80%",
                            wordWrap: "break-word"
                        }}>
                            {streamingMessage}
                            <span className="animate-pulse">|</span>
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="relative">
                <form onSubmit={handleSubmit}>
                    <Input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Envía un mensaje..."
                        className="pr-10"
                        disabled={isLoading}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ChatAssistant;
