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
                        <div className={cn({
                          'typing-animation': isStreamingMessage && isAssistant
                        })}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
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