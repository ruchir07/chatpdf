import { cn } from '@/lib/utils'
import { Message } from 'ai/react'
import { Loader2 } from 'lucide-react'
import React from 'react'
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
    isLoading: Boolean,
    messages: Message[],
    isStreaming?: Boolean
}

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex justify-start mb-4 px-4">
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
    </div>
  </div>
)

const MessageList = ({messages,isLoading,isStreaming}: Props) => {
  if(isLoading){
    return (
        <div className='absolute top-1/2 left-1/2 translate-x-1/2 translate-y-1/2'>
            <Loader2 className='w-6 h-6 animate-spin'/>
        </div>
    )
  }
  if(!messages || messages.length === 0){
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-gray-500 text-lg font-semibold">No messages yet</p>
        <p className="text-gray-400 text-sm mt-2">Ask a question about your PDF to get started</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4 p-4'>
        {messages.map((message, index) => {
            const isUser = message.role === 'user';
            const isAssistant = message.role === 'assistant' || message.role === 'system';
            const isLastMessage = index === messages.length - 1;
            const isStreamingMessage = isLastMessage && isStreaming;
            
            return (
                <div key={message.id || `msg-${index}`}
                className={cn('flex animate-in fade-in slide-in-from-bottom-2 duration-300',{
                    'justify-end': isUser,
                    'justify-start': isAssistant
                })}
                >
                    <div className={
                        cn('max-w-[85%] rounded-lg px-4 py-2 text-sm shadow-sm transition-all',{
                            'bg-blue-600 text-white': isUser,
                            'bg-white text-gray-800 border border-gray-200': isAssistant,
                            'opacity-100': !isStreamingMessage,
                            'opacity-80': isStreamingMessage
                        })
                    }>
                        <div className={cn('prose-sm md:prose-base', {
                          'typing-animation': isStreamingMessage && isAssistant
                        })}>
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                              h2: ({node, ...props}: any) => <h2 className="text-xl font-bold mt-4 mb-2" {...props} />,
                              h3: ({node, ...props}: any) => <h3 className="text-lg font-semibold mt-3 mb-2" {...props} />,
                              p: ({node, ...props}: any) => <p className="mb-3 leading-relaxed last:mb-0" {...props} />,
                              ul: ({node, ...props}: any) => <ul className="list-disc pl-6 mb-3 space-y-2" {...props} />,
                              ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 mb-3 space-y-2" {...props} />,
                              li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
                              strong: ({node, ...props}: any) => <strong className="font-bold" {...props} />,
                              em: ({node, ...props}: any) => <em className="italic opacity-90" {...props} />,
                              blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-current pl-4 py-1 italic opacity-80 my-2" {...props} />,
                              code: ({node, className, children, ...props}: any) => {
                                const match = /language-(\w+)/.exec(className || '')
                                return match ? (
                                  <pre className="bg-gray-800 text-gray-100 rounded-md p-3 my-3 overflow-x-auto text-sm font-mono">
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  </pre>
                                ) : (
                                  <code className="bg-black/10 rounded px-1.5 py-0.5 text-sm font-mono" {...props}>
                                    {children}
                                  </code>
                                )
                              }
                            }}
                          >
                              {message.content}
                          </ReactMarkdown>
                        </div>
                    </div>
                </div>
            );
        })}
        {isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
          <TypingIndicator />
        )}
    </div>
  );
}

export default MessageList