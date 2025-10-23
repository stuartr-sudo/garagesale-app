import React from 'react'
import EmailTestButton from '@/components/EmailTestButton'
import SimpleTestButton from '@/components/SimpleTestButton'
import GmailAuthTestButton from '@/components/GmailAuthTestButton'
import ResendTestButton from '@/components/ResendTestButton'

export default function EmailTestPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Email System Test</h1>
          <p className="text-gray-400 text-lg">
            Test your Gmail OAuth integration and Edge Function deployment
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ResendTestButton />
            <SimpleTestButton />
          </div>
          <div className="space-y-6">
            <EmailTestButton />
            <GmailAuthTestButton />
          </div>
        </div>
        
        <div className="mt-8 bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <div className="space-y-3 text-gray-300">
            <p>1. <strong>Enter your email address</strong> in the test field above</p>
            <p>2. <strong>Click "Test Email Function"</strong> to send a test email</p>
            <p>3. <strong>Check your email inbox</strong> for the test message</p>
            <p>4. <strong>Review the results</strong> shown in the alert box</p>
          </div>
          
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h3 className="text-blue-300 font-semibold mb-2">Expected Results:</h3>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>✅ <strong>Success:</strong> Email sent successfully, check your inbox</li>
              <li>❌ <strong>Gmail OAuth Error:</strong> Environment variables need configuration</li>
              <li>❌ <strong>Function Not Found:</strong> Edge Function not deployed</li>
              <li>❌ <strong>Other Errors:</strong> Check console for details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
