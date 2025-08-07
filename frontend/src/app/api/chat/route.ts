import { ChatOllama } from "@langchain/ollama";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Get the latest message from the user
        const lastMessage = messages[messages.length - 1];
        const userPrompt = lastMessage?.content || '';

        // Initialize Ollama model
        const model = new ChatOllama({
            baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            model: process.env.OLLAMA_MODEL || "gemma3:4b",
            temperature: 0.7,
        });

        // Create a system message for context
        const systemMessage = {
            role: "system",
            content: "You are a helpful AI assistant for an AI-Scheduler application. You help users manage their calendar events, tasks, and schedules."
        };

        // Prepare messages for the model
        const chatMessages = [
            systemMessage,
            { role: "user", content: userPrompt }
        ];

        // Stream the response
        const stream = await model.stream(chatMessages, { signal: req.signal });

        // Create a readable stream for the response
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.content || '';
                        if (content) {
                            const data = `data: ${JSON.stringify({ content })}\n\n`;
                            controller.enqueue(encoder.encode(data));
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