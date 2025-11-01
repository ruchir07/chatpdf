// src/components/APIDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Copy, Trash2, Plus, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import toast from 'react-hot-toast';

interface APIKey {
  id: number;
  keyName: string;
  apiKey: string;
  isActive: boolean;
  rateLimit: number;
  createdAt: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
}

export default function APIDashboard() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{
    apiKey?: string;
    apiSecret?: string;
  } | null>(null);

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      const response = await fetch('/api/keys');
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.keys);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async (keyName: string, rateLimit: number, expiresInDays?: number) => {
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyName, rateLimit, expiresInDays }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewKeyData({
          apiKey: data.apiKey,
          apiSecret: data.apiSecret,
        });
        toast.success('API key created successfully!');
        fetchAPIKeys();
      } else {
        toast.error(data.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error('Failed to create API key');
    }
  };

  const deleteAPIKey = async (keyId: number) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await fetch(`/api/keys?keyId=${keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('API key deleted');
        fetchAPIKeys();
      } else {
        toast.error('Failed to delete API key');
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const maskKey = (key: string) => {
    if (key.length < 12) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading API keys...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Keys</h1>
          <p className="text-gray-600">
            Manage your API keys for external integrations
          </p>
        </div>
        <Button
          onClick={() => setShowNewKeyModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={20} />
          Create API Key
        </Button>
      </div>

      {/* New Key Created Modal */}
      {newKeyData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-green-600">
              ✓ API Key Created Successfully!
            </h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-yellow-800 font-semibold">
                ⚠️ Save these credentials securely. The secret will not be shown again.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newKeyData.apiKey}
                    readOnly
                    className="flex-1 font-mono text-sm bg-gray-50"
                  />
                  <Button
                    onClick={() => copyToClipboard(newKeyData.apiKey!, 'API Key')}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300"
                  >
                    <Copy size={20} />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Secret</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newKeyData.apiSecret}
                    readOnly
                    className="flex-1 font-mono text-sm bg-gray-50"
                  />
                  <Button
                    onClick={() => copyToClipboard(newKeyData.apiSecret!, 'API Secret')}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300"
                  >
                    <Copy size={20} />
                  </Button>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setNewKeyData(null)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700"
            >
              I've Saved My Credentials
            </Button>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {showNewKeyModal && !newKeyData && (
        <CreateKeyModal
          onClose={() => setShowNewKeyModal(false)}
          onCreate={createAPIKey}
        />
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No API keys yet</p>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="text-blue-600 hover:underline"
            >
              Create your first API key
            </button>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div
              key={key.id}
              className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{key.keyName}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                    {key.lastUsedAt && (
                      <span>
                        Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      key.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {key.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Button
                    onClick={() => deleteAPIKey(key.id)}
                    className="p-2 text-red-600 hover:bg-red-50"
                    variant="ghost"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-24">API Key:</span>
                  <code className="flex-1 bg-gray-50 px-3 py-2 rounded text-sm font-mono">
                    {maskKey(key.apiKey)}
                  </code>
                  <Button
                    onClick={() => copyToClipboard(key.apiKey, 'API Key')}
                    className="p-2 hover:bg-gray-100"
                    variant="ghost"
                  >
                    <Copy size={16} />
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-24">Rate Limit:</span>
                  <span>{key.rateLimit} requests/hour</span>
                </div>

                {key.expiresAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-24">Expires:</span>
                    <span>{new Date(key.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CreateKeyModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, rateLimit: number, expiresInDays?: number) => void;
}) {
  const [keyName, setKeyName] = useState('');
  const [rateLimit, setRateLimit] = useState(100);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyName.trim()) {
      onCreate(keyName.trim(), rateLimit, expiresInDays);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6">Create API Key</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Key Name *
            </label>
            <Input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g., Production App, Testing"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Rate Limit (requests/hour)
            </label>
            <Input
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(parseInt(e.target.value))}
              min="10"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Expires In (days, optional)
            </label>
            <Input
              type="number"
              value={expiresInDays || ''}
              onChange={(e) =>
                setExpiresInDays(e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="Never expires"
              min="1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Create Key
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}