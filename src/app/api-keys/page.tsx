// src/app/api-keys/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import APIDashboard from '@/components/APIDashboard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function APIKeysPage() {
  const { userId } = await auth();

  if (!userId) {
    return redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={20} className="mr-2" />
                Back to Home
              </Button>
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/api-docs">
              <Button variant="ghost" size="sm">
                API Documentation
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <APIDashboard />
    </div>
  );
}