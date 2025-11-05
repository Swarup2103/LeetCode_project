import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

// Helper component for loading dots (Unchanged)
const LoadingBubble = () => (
    <div className="chat chat-start">
        <div className="chat-image avatar">
            <div className="w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </div>
        </div>
        <div className="chat-bubble bg-base-200">
            <span className="loading loading-dots loading-sm"></span>
        </div>
    </div>
);

// --- CodeBlock Component (Unchanged) ---
const CodeBlock = ({ code, language }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(textarea);
    };

    const lines = code.split('\n').length;
    const height = Math.min(Math.max(lines * 21, 80), 400);

    return (
        <div className="w-full relative my-2 rounded-lg overflow-hidden bg-base-300 border border-base-content/10">
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 z-10 btn btn-ghost btn-xs bg-base-100/50 hover:bg-base-100"
            >
                {isCopied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 4h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                    </svg>
                )}
                <span className="ml-1">{isCopied ? 'Copied!' : 'Copy'}</span>
            </button>
            <Editor
                height={`${height}px`}
                language={language || 'plaintext'}
                value={code}
                theme="vs-dark"
                options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                }}
            />
        </div>
    );
};

// --- ChatMessage Component (Unchanged) ---
const ChatMessage = ({ message }) => {
    const isAi = message.sender === 'ai';

    // Function to parse AI text content
    const renderAiContent = (parts) => {
        const elements = [];
        const codeRegex = /```(\w+)?\s*([\s\S]*?)```/g; 

        if (!parts || !Array.isArray(parts)) {
            if (typeof message.text === 'string') {
                 parts = [{ type: 'text', content: message.text }];
            } else {
                return null; 
            }
        }

        parts.forEach((part, partIndex) => {
            if (part.type === 'code') {
                elements.push(<CodeBlock key={`part-${partIndex}`} code={part.content.trim()} language={part.language || 'plaintext'} />);
                return;
            }

            let lastIndex = 0;
            let match;
            const content = part.content;

            while ((match = codeRegex.exec(content)) !== null) {
                if (match.index > lastIndex) {
                    const textBefore = content.substring(lastIndex, match.index);
                    if (textBefore.trim()) {
                        elements.push(
                            <pre key={`part-${partIndex}-text-${lastIndex}`} className="text-sm" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0, color: 'inherit' }}>
                                {textBefore}
                            </pre>
                        );
                    }
                }
                
                const language = match[1] || 'plaintext'; 
                const code = match[2];
                elements.push(<CodeBlock key={`part-${partIndex}-code-${match.index}`} code={code.trim()} language={language} />);
                
                lastIndex = match.index + match[0].length;
            }

            if (lastIndex < content.length) {
                const textAfter = content.substring(lastIndex);
                 if (textAfter.trim()) {
                    elements.push(
                        <pre key={`part-${partIndex}-text-${lastIndex}-end`} className="text-sm" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0, color: 'inherit' }}>
                            {textAfter}
                        </pre>
                    );
                }
            }
        });

        return elements;
    };


    return (
        <div className={`chat ${isAi ? 'chat-start' : 'chat-end'}`}>
            <div className="chat-image avatar">
                 <div className={`w-10 rounded-full flex items-center justify-center ${isAi ? 'bg-primary/20' : 'bg-accent/20'}`}>
                    {isAi ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    )}
                </div>
            </div>
            <div className={`chat-bubble min-w-0 ${isAi ? 'bg-base-200' : 'bg-primary text-primary-content'}`}>
                {isAi && message.parts ? (
                    <div className="text-base-content" style={{ color: 'inherit' }}>
                        {renderAiContent(message.parts)}
                    </div>
                ) : (
                    <pre className="text-sm" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', wordBreak: 'break-word' }}>
                        {message.text}
                    </pre>
                )}
            </div>
        </div>
    );
};

// --- Main ChatWithAI component (SIMPLIFIED FOR REDUX) ---
export default function ChatWithAI({ 
    messages,         // <-- Prop from ProblemPage
    isLoading,        // <-- Prop from ProblemPage
    currentMessage,   // <-- Prop from ProblemPage
    onMessageChange,  // <-- Prop from ProblemPage
    onSubmit          // <-- Prop from ProblemPage
}) {
    const messagesEndRef = useRef(null);

    // useEffect for scrolling
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- All state logic (useState, handleSubmit, axiosClient) is REMOVED ---
    // --- It is now managed by ProblemPage.jsx ---

    return (
        <div className="w-full h-full flex flex-col bg-base-100">
            {/* Header (Simplified) */}
            <div className="p-4 border-b border-base-300 bg-base-200">
                <h3 className="font-bold text-lg">Chat with CodeCraft Helper</h3>
                {/* The problem title is no longer needed as a prop */}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <ChatMessage key={index} message={msg} />
                ))}
                {isLoading && <LoadingBubble />}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form (Now uses props for value, onChange, and onSubmit) */}
            <form onSubmit={onSubmit} className="p-4 border-t border-base-300 bg-base-200">
                <div className="form-control">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Ask about your code, the problem, or for a hint..."
                            className="input input-bordered w-full"
                            value={currentMessage}
                            onChange={(e) => onMessageChange(e.target.value)}
                            disabled={isLoading}
                        />
                        <button type="submit" className={`btn btn-primary ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                            {!isLoading && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </form>
            
        </div>
    );
}