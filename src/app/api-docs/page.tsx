// src/app/api-docs/page.tsx
'use client';

import { useState } from 'react';
import { Copy, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function APIDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={20} className="mr-2" />
                Back to Home
              </Button>
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/api-keys">
              <Button variant="ghost" size="sm">
                Manage API Keys
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-12 px-6">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
          <p className="text-xl text-gray-600">
            Integrate your ChatPDF knowledge base into external applications
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-12 bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
          <ol className="space-y-4 list-decimal list-inside text-gray-700">
            <li>
              <Link href="/api-keys" className="text-blue-600 hover:underline">
                Create an API key
              </Link>{' '}
              from your dashboard
            </li>
            <li>Save your API key and secret securely</li>
            <li>Include them in your request headers</li>
            <li>Start making API calls!</li>
          </ol>
        </section>

        {/* Authentication */}
        <section className="mb-12 bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Authentication</h2>
          <p className="text-gray-700 mb-4">
            All API requests require authentication using your API key and secret in the request headers:
          </p>
          
          <CodeBlock
            id="auth"
            code={`X-API-Key: kg_your_api_key_here
X-API-Secret: your_api_secret_here`}
            onCopy={copyCode}
            copied={copiedCode === 'auth'}
          />

          <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="text-yellow-800">
              <strong>Security Notice:</strong> Never expose your API secret in client-side code or public repositories.
            </p>
          </div>
        </section>

        {/* Base URL */}
        <section className="mb-12 bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Base URL</h2>
          <code className="block bg-gray-100 p-4 rounded text-sm">
            {baseUrl}/api/v1
          </code>
        </section>

        {/* Query Endpoint */}
        <section className="mb-12 bg-white rounded-lg p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded text-sm font-semibold bg-blue-100 text-blue-800">
              POST
            </span>
            <code className="text-lg font-mono">/query</code>
          </div>
          
          <h3 className="text-xl font-bold mb-2">Query Knowledge Base</h3>
          <p className="text-gray-700 mb-6">
            Ask questions in natural language and get AI-generated answers from your uploaded documents.
          </p>

          <h4 className="font-semibold mb-3">Request Example</h4>
          <CodeBlock
            id="query-request"
            code={`curl -X POST ${baseUrl}/api/v1/query \\
  -H "X-API-Key: kg_your_api_key" \\
  -H "X-API-Secret: your_secret" \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "What is the main topic of the document?",
    "chatId": 1
  }'`}
            onCopy={copyCode}
            copied={copiedCode === 'query-request'}
          />

          <h4 className="font-semibold mt-6 mb-3">Response Example</h4>
          <CodeBlock
            id="query-response"
            code={`{
  "success": true,
  "data": {
    "question": "What is the main topic of the document?",
    "answer": "The main topic of the document is...",
    "documentName": "Research_Paper.pdf",
    "chatId": 1,
    "processingTimeMs": 1250
  },
  "timestamp": "2025-11-01T10:30:00Z"
}`}
            onCopy={copyCode}
            copied={copiedCode === 'query-response'}
          />

          <h4 className="font-semibold mt-6 mb-3">Parameters</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Required</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-mono">question</td>
                <td className="py-2 text-gray-600">string</td>
                <td className="py-2 text-red-600">Yes</td>
                <td className="py-2 text-gray-700">Natural language question</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono">chatId</td>
                <td className="py-2 text-gray-600">number</td>
                <td className="py-2 text-gray-400">No</td>
                <td className="py-2 text-gray-700">Specific document ID (uses most recent if omitted)</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* List Documents */}
        <section className="mb-12 bg-white rounded-lg p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded text-sm font-semibold bg-green-100 text-green-800">
              GET
            </span>
            <code className="text-lg font-mono">/documents</code>
          </div>
          
          <h3 className="text-xl font-bold mb-2">List Documents</h3>
          <p className="text-gray-700 mb-6">
            Retrieve a list of all your uploaded documents with pagination.
          </p>

          <h4 className="font-semibold mb-3">Request Example</h4>
          <CodeBlock
            id="docs-request"
            code={`curl -X GET "${baseUrl}/api/v1/documents?page=1&limit=10" \\
  -H "X-API-Key: kg_your_api_key" \\
  -H "X-API-Secret: your_secret"`}
            onCopy={copyCode}
            copied={copiedCode === 'docs-request'}
          />

          <h4 className="font-semibold mt-6 mb-3">Response Example</h4>
          <CodeBlock
            id="docs-response"
            code={`{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 1,
        "name": "Research_Paper.pdf",
        "url": "https://...",
        "fileKey": "uploads/...",
        "createdAt": "2025-11-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  },
  "timestamp": "2025-11-01T10:30:00Z"
}`}
            onCopy={copyCode}
            copied={copiedCode === 'docs-response'}
          />
        </section>

        {/* Delete Document */}
        <section className="mb-12 bg-white rounded-lg p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded text-sm font-semibold bg-red-100 text-red-800">
              DELETE
            </span>
            <code className="text-lg font-mono">/documents?id=&#123;id&#125;</code>
          </div>
          
          <h3 className="text-xl font-bold mb-2">Delete Document</h3>
          <p className="text-gray-700 mb-6">
            Remove a document from your knowledge base.
          </p>

          <h4 className="font-semibold mb-3">Request Example</h4>
          <CodeBlock
            id="delete-request"
            code={`curl -X DELETE "${baseUrl}/api/v1/documents?id=1" \\
  -H "X-API-Key: kg_your_api_key" \\
  -H "X-API-Secret: your_secret"`}
            onCopy={copyCode}
            copied={copiedCode === 'delete-request'}
          />
        </section>

        {/* Error Codes */}
        <section className="mb-12 bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Error Codes</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Code</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b">
                <td className="py-2">400</td>
                <td>Bad Request - Invalid parameters</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">401</td>
                <td>Unauthorized - Invalid or missing credentials</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">404</td>
                <td>Not Found - Resource doesn't exist</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">429</td>
                <td>Too Many Requests - Rate limit exceeded</td>
              </tr>
              <tr>
                <td className="py-2">500</td>
                <td>Internal Server Error</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* SDK Examples */}
        <section className="mb-12 bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">SDK Examples</h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">JavaScript/Node.js</h3>
          <CodeBlock
            id="js-sdk"
            code={`const axios = require('axios');

const api = axios.create({
  baseURL: '${baseUrl}/api/v1',
  headers: {
    'X-API-Key': 'kg_your_api_key',
    'X-API-Secret': 'your_secret',
  },
});

// Query knowledge base
async function query(question, chatId) {
  const response = await api.post('/query', {
    question,
    chatId,
  });
  return response.data;
}

// List documents
async function listDocuments() {
  const response = await api.get('/documents');
  return response.data;
}

// Usage
const result = await query('What is this document about?', 1);
console.log(result.data.answer);`}
            onCopy={copyCode}
            copied={copiedCode === 'js-sdk'}
          />

          <h3 className="text-lg font-semibold mt-6 mb-3">Python</h3>
          <CodeBlock
            id="python-sdk"
            code={`import requests

class ChatPDFAPI:
    def __init__(self, api_key, api_secret):
        self.base_url = '${baseUrl}/api/v1'
        self.headers = {
            'X-API-Key': api_key,
            'X-API-Secret': api_secret,
        }
    
    def query(self, question, chat_id=None):
        response = requests.post(
            f'{self.base_url}/query',
            headers=self.headers,
            json={'question': question, 'chatId': chat_id}
        )
        return response.json()
    
    def list_documents(self, page=1, limit=10):
        response = requests.get(
            f'{self.base_url}/documents',
            headers=self.headers,
            params={'page': page, 'limit': limit}
        )
        return response.json()

# Usage
api = ChatPDFAPI('kg_your_key', 'your_secret')
result = api.query('What is the main topic?', chat_id=1)
print(result['data']['answer'])`}
            onCopy={copyCode}
            copied={copiedCode === 'python-sdk'}
          />
        </section>
      </div>
    </div>
  );
}

function CodeBlock({ id, code, onCopy, copied }: any) {
  return (
    <div className="relative bg-gray-900 rounded-lg p-4 overflow-x-auto">
      <pre className="text-sm text-gray-100">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => onCopy(code, id)}
        className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}