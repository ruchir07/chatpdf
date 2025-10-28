import ChatComponent from '@/components/ChatComponent';
import ChatSideBar from '@/components/ChatSideBar';
import PDFViewer from '@/components/PDFViewer';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { getS3Url } from '@/lib/s3';
import { auth } from '@clerk/nextjs/server';
import { chat } from '@pinecone-database/pinecone/dist/assistant/data/chat';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  params: { chatId: string };
};

export default async function ChatPage({ params }: Props) {
  const { chatId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }
  
  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
  
  // Allow access even if no chats exist, just show empty state
  if (!_chats || _chats.length === 0) {
    // Show welcome page with upload option
    return (
      <div className="flex w-full h-screen overflow-hidden bg-gray-50">
        <div className="w-64 flex-shrink-0 border-r border-gray-300">
          <ChatSideBar chats={[]} chatId={0} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome to ChatPDF</h2>
            <p className="text-gray-600 mb-8">Upload a PDF to start chatting</p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Upload PDF
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!_chats.find((chat) => chat.id === parseInt(chatId))) {
    return redirect("/");
  }

  const currentChat = _chats.find((chat) => chat.id === parseInt(chatId));

  return (
      <div className="flex w-full h-screen overflow-hidden">
        {/* chat sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-gray-300">
          <ChatSideBar chats={_chats} chatId={parseInt(chatId)} />
        </div>
        {/* pdf viewer */}
        <div className="flex-1 overflow-auto p-4 border-r border-gray-300">
          <PDFViewer pdf_url={currentChat?.pdfUrl || ""} />
        </div>
        {/* chat component */}
        <div className="w-96 flex-shrink-0 border-l border-gray-300">
          <ChatComponent chatId={parseInt(chatId)}/>
        </div>
      </div>
  );
}