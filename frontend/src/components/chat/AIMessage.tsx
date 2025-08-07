import ReactMarkdown from 'react-markdown';

const AIMessage = ({ message }: { message: string }) => {
    return <div className="text-sm"><ReactMarkdown
        components={{
            p: ({ children }) => <p style={{ margin: '0.3em 0', lineHeight: '1.3' }}>{children}</p>,
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
        }}
    >
        {message}
    </ReactMarkdown>
    </div>
}

export default AIMessage;