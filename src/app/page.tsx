// src/app/page.tsx
import { Button } from "@/components/ui/button"
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {ArrowRight, LogIn, Key, Book} from "lucide-react"
import FileUpload from "@/components/FileUpload";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;
  let firstChat;
  if(userId){
    firstChat = await db.select().from(chats).where(eq(chats.userId,userId));
    if (firstChat) {
      firstChat = firstChat[0];
    }
  }
  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header with API Access */}
      {isAuth && (
        <div className="absolute top-4 right-4 z-10 flex gap-3">
          <Link href="/api-keys">
            <Button variant="ghost" size="sm" className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </Button>
          </Link>
          <Link href="/api-docs">
            <Button variant="ghost" size="sm" className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm">
              <Book className="w-4 h-4 mr-2" />
              API Docs
            </Button>
          </Link>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-4xl w-full">
          <div className="flex flex-col items-center text-center space-y-8">
            
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Chat with any PDF
                </h1>
                <div className="flex-shrink-0">
                  <UserButton afterSignOutUrl=""/>
                </div>
              </div>

              <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Join millions of students, researchers and professionals to instantly answer questions and understand research with AI
              </p>
            </div>

            {/* Feature Highlights */}
            {isAuth && (
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm">
                  <span className="text-green-500 font-semibold">✓</span>
                  <span className="text-slate-700 font-medium">Upload PDFs</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm">
                  <span className="text-green-500 font-semibold">✓</span>
                  <span className="text-slate-700 font-medium">Ask Questions</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm">
                  <span className="text-green-500 font-semibold">✓</span>
                  <span className="text-slate-700 font-medium">API Access</span>
                </div>
              </div>
            )}

            {/* CTA Section */}
            <div className="w-full max-w-2xl space-y-4">
              {isAuth && firstChat && (
                <Link href={`/chat/${firstChat.id}`} className="block">
                  <Button size="lg" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                    Go to Chats 
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              )}

              {/* File Upload or Sign In */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                {isAuth ? (
                  <FileUpload />
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-slate-800">Get Started Today</h3>
                    <p className="text-slate-600">Sign in to start chatting with your PDFs</p>
                    <Link href='/sign-in'>
                      <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg shadow-md hover:shadow-lg transition-all">
                        Login to get Started
                        <LogIn className="w-5 h-5 ml-2"/>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}