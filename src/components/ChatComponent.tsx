"use client"
import React from 'react'
import { Input } from "@/components/ui/input"
import { Message, useChat } from 'ai/react';
import { Button } from './ui/button';
import { Send, Loader2 } from 'lucide-react';
import MessageList from './MessageList';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

type Props = {
    chatId: number
};

const ChatComponent = ({chatId}: Props) => {
    const {data,isLoading} = useQuery({
        queryKey: ["chat",chatId],
        queryFn: async() => {
            const response = await axios.post<Message[]>("/api/get-messages",{chatId});
            return response.data
        }
    });

    const { input,handleInputChange,handleSubmit,messages,isLoading: isStreaming, append } = useChat({
    api: '/api/chat',
    body: {
        chatId
    },
    initialMessages: data || [],
    streamProtocol: 'text'
   });
   
   // Debug: Log messages to console
   React.useEffect(() => {
       console.log('Messages updated:', messages);
   }, [messages]);

   React.useEffect(() => {
    const messageContainer = document.getElementById('message-container');
    if(messageContainer){
        // Smooth scroll to bottom
        messageContainer.scrollTo({
            top: messageContainer.scrollHeight,
            behavior: 'smooth'
        });
    }
   },[messages]);
   
   // Auto-scroll during streaming
   React.useEffect(() => {
       if(isStreaming) {
           const interval = setInterval(() => {
               const messageContainer = document.getElementById('message-container');
               if(messageContainer){
                   messageContainer.scrollTo({
                       top: messageContainer.scrollHeight,
                       behavior: 'smooth'
                   });
               }
           }, 100); // Check every 100ms during streaming
           
           return () => clearInterval(interval);
       }
   }, [isStreaming]);

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
        {/* Header */}
        <div className='flex-shrink-0 border-b border-gray-200 p-4 bg-white'>
            <h3 className='text-xl font-bold'>Chat with your PDF</h3>
        </div>

        {/* Message list container with scroll */}
        <div className='flex-1 overflow-y-auto' id='message-container'>
            <MessageList messages={messages} isLoading={isLoading} isStreaming={isStreaming}/>
        </div>

        {/* Input form - fixed at bottom */}
        <div className='flex-shrink-0 border-t border-gray-200 bg-white'>
            <form onSubmit={handleSubmit} className='p-4'>
                <div className='flex gap-2'>
                    <Input 
                        value={input} 
                        onChange={handleInputChange} 
                        placeholder='Ask any question about your PDF...' 
                        className='flex-1'
                        disabled={isStreaming}
                    />
                    <Button 
                        type="submit" 
                        className='bg-blue-600 hover:bg-blue-700' 
                        disabled={isStreaming || !input.trim()}
                    >
                        {isStreaming ? (
                            <Loader2 className='h-4 w-4 animate-spin'/>
                        ) : (
                            <Send className='h-4 w-4'/>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    </div>
  )
}

export default ChatComponent