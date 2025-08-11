import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import { LoaderCircle } from 'lucide-react';

interface AIMessageProps {
    message: string;
    toolsInProgress?: Set<string>;
}

const LoadingSpinner = () => (
    <LoaderCircle className="animate-spin h-4 w-4 bg-blue" />
);

const AIUIMessage = ({ message }: AIMessageProps) => {
    const renderMessage = (msg: string) => {
        // Limpiar usando los patrones exactos que recibes
        msg = msg.replace(/analysis\S+[\s\S]*?(assistantfinal|$)/gi, '');
        msg = msg.replace(/<think>[\s\S]*?<\/think>/gi, '');

        if (!msg) {
            return <div className="text-gray-500 flex align-center gap-1 text-xs"><LoadingSpinner /> Thinking</div>;
        }

        // Remover cualquier prefijo hasta "assistantfinal"
        msg = msg.replace(/^[\s\S]*?assistantfinal/gi, '');
        const parts = msg.split(/(<tool id="[^"]+">[\s\S]*?(?:<\/tool id="[^"]+">|$))/);

        return parts.map((part, index) => {

            const toolStartMatch = part.match(/<tool id="([^"]+)">([\s\S]*?)(?:<\/tool id="[^"]+">|$)/);

            if (toolStartMatch) {
                const toolId = toolStartMatch[1];
                const toolContent = toolStartMatch[2];
                const isCompleted = part.includes(`</tool id="${toolId}">`);

                return (
                    <div key={index} style={{
                        backgroundColor: isCompleted ? (toolContent.includes("Error: ") ? '#f9efefff' : '#f0f8ff') : '#fff8dc',
                        border: `1px solid ${isCompleted ? (toolContent.includes("Error: ") ? '#ff0000' : '#0066cc') : '#ffa500'}`,
                        padding: '8px',
                        borderRadius: '4px',
                        margin: '0.5em 0'
                    }}>
                        <div style={{
                            fontSize: '0.8em',
                            color: isCompleted ? (toolContent.includes("Error: ") ? '#ff0000' : '#0066cc') : '#ff8c00',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {!isCompleted && <LoadingSpinner />}
                            {isCompleted && <>{toolContent.includes("Error: ") ? <span className="text-red-600 text-xs">✗</span> : <span className="text-green-600 text-xs">✓</span>}</>}
                            <span>{toolContent}</span>
                        </div>
                    </div>
                );
            }

            return (
                <ReactMarkdown
                    key={index}
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p: ({ children }) => <p style={{ margin: '0.3em 0', lineHeight: '1.3', textAlign: 'left' }}>{children}</p>,
                        code: ({ children }) => (
                            <code style={{
                                backgroundColor: '#e5e5e5',
                                padding: '1px 3px',
                                borderRadius: '2px',
                            }}>
                                {children}
                            </code>
                        ),
                        pre: ({ children }) => (
                            <pre style={{
                                backgroundColor: '#f5f5f5',
                                padding: '6px',
                                borderRadius: '3px',
                                overflow: 'auto',
                                lineHeight: '1.2'
                            }}>
                                {children}
                            </pre>
                        ),
                        ul: ({ children }) => <ul style={{ margin: '0.3em 0', paddingLeft: '1.2em', listStyleType: 'disc', listStylePosition: 'inside' }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ margin: '0.3em 0', paddingLeft: '1.2em', }}>{children}</ol>,
                        li: ({ children }) => <li style={{ margin: '0.15em 0', lineHeight: '1.3' }}>{children}</li>,
                        h1: ({ children }) => <h1 style={{ fontWeight: 'bold', margin: '0.4em 0', lineHeight: '1.2' }}>{children}</h1>,
                        h2: ({ children }) => <h2 style={{ fontWeight: 'bold', margin: '0.3em 0', lineHeight: '1.2' }}>{children}</h2>,
                        h3: ({ children }) => <h3 style={{ fontWeight: 'bold', margin: '0.3em 0', lineHeight: '1.2' }}>{children}</h3>,
                        strong: ({ children }) => <strong style={{ fontWeight: 'bold', }}>{children}</strong>,
                        em: ({ children }) => <em style={{ fontStyle: 'italic', }}>{children}</em>,
                        table: ({ children }) => (
                            <table style={{
                                borderCollapse: 'collapse',
                                margin: '0.5em 0',
                                width: '100%',
                                border: '1px solid #ddd'
                            }}>
                                {children}
                            </table>
                        ),
                        thead: ({ children }) => <thead style={{ backgroundColor: '#f9f9f9' }}>{children}</thead>,
                        tbody: ({ children }) => <tbody>{children}</tbody>,
                        tr: ({ children }) => <tr style={{ borderBottom: '1px solid #ddd' }}>{children}</tr>,
                        th: ({ children }) => (
                            <th style={{
                                padding: '8px 12px',
                                textAlign: 'left',
                                fontWeight: 'bold',
                                border: '1px solid #ddd'
                            }}>
                                {children}
                            </th>
                        ),
                        td: ({ children }) => (
                            <td style={{
                                padding: '8px 12px',
                                border: '1px solid #ddd'
                            }}>
                                {children}
                            </td>
                        ),
                    }}
                >
                    {part}
                </ReactMarkdown>
            );
        });
    };

    return <div className="text-sm">{renderMessage(message)}</div>;
}

export default AIUIMessage;