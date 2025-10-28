import { DrizzleChat } from '@/lib/db/schema'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { MessageCircle, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
    chats: DrizzleChat[],
    chatId: number,
}

const ChatSideBar = ({chats,chatId}: Props) => {
  return (
    <div className='h-full p-4 bg-gray-900 flex flex-col'>
        <Link href='/'>
            <Button className='w-full border-dashed border-white border bg-transparent hover:bg-gray-800'>
                <PlusCircle className='mr-2 w-4 h-4'/>
                New Chat / Upload PDF
            </Button>
        </Link>

        <div className='flex-1 flex flex-col gap-2 mt-4 overflow-y-auto'>
            {(!chats || chats.length === 0) ? (
                <div className='text-center mt-8'>
                    <p className='text-gray-500 text-sm'>No chats yet</p>
                    <p className='text-gray-600 text-xs mt-2'>Upload a PDF to start</p>
                </div>
            ) : (
                chats.map(chat => (
                    <Link key={chat.id} href={`/chat/${chat.id}`}>
                        <div className={
                            cn('rounded-lg p-3 text-slate-300 flex items-center cursor-pointer transition-colors',{
                                'bg-blue-600 text-white' : chat.id === chatId,
                                'hover:bg-gray-800 hover:text-white' : chat.id !== chatId
                            })
                        }>
                            <MessageCircle className='mr-2 flex-shrink-0'/>
                            <p className='w-full overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis'>{chat.pdfName}</p>
                        </div>
                    </Link>
                ))
            )}
        </div>

        <div className='mt-auto pt-4 border-t border-gray-700'>
            <div className='flex items-center gap-3 text-sm text-slate-500'>
                <Link href='/' className='hover:text-white transition-colors'>Home</Link>
                <span>|</span>
                <Link href='https://github.com' className='hover:text-white transition-colors'>Source</Link>
            </div>
        </div>
    </div>
  )
}

export default ChatSideBar