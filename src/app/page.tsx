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
    <div className="w-screen min-h-screen bg-linear-to-br from-indigo-200 via-red-200 to-yellow-100">
      {/* API Access Banner for Authenticated Users */}
      {isAuth && (
        <div className="absolute top-4 right-4 flex gap-2">
          <Link href="/api-keys">
            <Button variant="outline" size="sm" className="bg-white">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </Button>
          </Link>
          <Link href="/api-docs">
            <Button variant="outline" size="sm" className="bg-white">
              <Book className="w-4 h-4 mr-2" />
              API Docs
            </Button>
          </Link>
        </div>
      )}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold">Chat with any PDF</h1>
            <UserButton afterSignOutUrl=""/>
          </div>

          <div className="flex mt-2 gap-2">
            {isAuth && firstChat && (
              <>
                <Link href={`/chat/${firstChat.id}`}>
                  <Button>
                    Go to Chats <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <p className="max-w-xl mt-1 text-lg text-slate-600">
            Joins millions of Students, researchers and professionals to instantly answer questions and understand research with AI
          </p>

          {/* Feature Highlights */}
          {isAuth && (
            <div className="mt-6 flex gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <span>✓</span>
                <span>Upload PDFs</span>
              </div>
              <div className="flex items-center gap-1">
                <span>✓</span>
                <span>Ask Questions</span>
              </div>
              <div className="flex items-center gap-1">
                <span>✓</span>
                <span>API Access</span>
              </div>
            </div>
          )}

          <div className="w-full mt-4">
            {isAuth ? (
              <FileUpload />
            ) : (
                <Link href='/sign-in'>
                  <Button>
                    Login to get Started
                    <LogIn className="w-4 h-4 ml-2"/>
                  </Button>
                </Link>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}