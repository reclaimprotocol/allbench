'use client';

import { useState } from 'react';

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'broadcast' | 'individual'>('broadcast');
  const [targetUser, setTargetUser] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          message,
          type,
          targetUser: type === 'individual' ? targetUser : undefined,
          adminKey,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, data });
        // Reset form
        setTitle('');
        setMessage('');
        setTargetUser('');
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch (error) {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black py-8 font-light">
      <div className="max-w-2xl mx-auto bg-white dark:bg-black border border-black dark:border-white p-8">
        <h1 className="text-3xl font-light text-black dark:text-white mb-8">
          AllBench Admin - Send Notifications
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Admin Key */}
          <div>
            <label className="block text-sm font-light text-black dark:text-white mb-2">
              Admin Key
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-light focus:outline-none"
              required
              placeholder="Enter admin API key"
            />
          </div>

          {/* Notification Type */}
          <div>
            <label className="block text-sm font-light text-black dark:text-white mb-2">
              Notification Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'broadcast' | 'individual')}
              className="w-full px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-light focus:outline-none"
            >
              <option value="broadcast">Broadcast (All Users)</option>
              <option value="individual">Individual User</option>
            </select>
          </div>

          {/* Target User (only for individual notifications) */}
          {type === 'individual' && (
            <div>
              <label className="block text-sm font-light text-black dark:text-white mb-2">
                Target Username
              </label>
              <input
                type="text"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                className="w-full px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-light focus:outline-none"
                required
                placeholder="Enter username"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-light text-black dark:text-white mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-light focus:outline-none"
              required
              maxLength={100}
              placeholder="Notification title"
            />
            <p className="text-sm font-light text-black dark:text-white mt-1">{title.length}/100 characters</p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-light text-black dark:text-white mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-light focus:outline-none"
              required
              maxLength={500}
              rows={4}
              placeholder="Notification message"
            />
            <p className="text-sm font-light text-black dark:text-white mt-1">{message.length}/500 characters</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-2 px-4 font-light hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </form>

        {/* Result Display */}
        {result && (
          <div className={`mt-6 p-4 rounded-md ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {result.success ? (
              <div>
                <h3 className="text-green-800 font-medium mb-2">Notification Sent Successfully!</h3>
                <div className="text-sm text-green-700">
                  <p><strong>Title:</strong> {result.data.notification.title}</p>
                  <p><strong>Type:</strong> {result.data.notification.type}</p>
                  {result.data.notification.targetUser && (
                    <p><strong>Target:</strong> {result.data.notification.targetUser}</p>
                  )}
                  <p><strong>Target Users:</strong> {result.data.sendResults.targetUsers}</p>
                  <p><strong>Successful Sends:</strong> {result.data.sendResults.success}</p>
                  <p><strong>Failed Sends:</strong> {result.data.sendResults.failure}</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-red-800 font-medium mb-2">Error</h3>
                <p className="text-sm text-red-700">{result.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-white dark:bg-black border border-black dark:border-white">
          <h3 className="font-light text-black dark:text-white mb-2">Instructions:</h3>
          <ul className="text-sm font-light text-black dark:text-white space-y-1">
            <li>• Use the admin API key to authenticate</li>
            <li>• Broadcast notifications go to all users with notifications enabled</li>
            <li>• Individual notifications target specific usernames</li>
            <li>• Only users who have enabled notifications and have valid FCM tokens will receive push notifications</li>
            <li>• Failed tokens are automatically cleaned up</li>
          </ul>
        </div>
      </div>
    </div>
  );
}