import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function EmailTestButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [testEmail, setTestEmail] = useState('')

  const testEmailFunction = async () => {
    if (!testEmail) {
      setResult({ success: false, error: 'Please enter an email address' })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      console.log('🧪 Testing send-gmail Edge Function...')
      
      const { data, error } = await supabase.functions.invoke('send-gmail', {
        body: {
          to: testEmail,
          subject: 'Test Email from GarageSale',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #06b6d4;">🎉 Test Email from GarageSale!</h1>
              <p>Your Gmail OAuth integration is working correctly!</p>
              <p><strong>Test Details:</strong></p>
              <ul>
                <li>Sent at: ${new Date().toLocaleString()}</li>
                <li>Function: send-gmail</li>
                <li>Status: ✅ Working</li>
              </ul>
              <p>If you received this email, your email system is fully configured!</p>
            </div>
          `,
          text: `Test Email from GarageSale!\n\nYour Gmail OAuth integration is working correctly!\n\nTest Details:\n- Sent at: ${new Date().toLocaleString()}\n- Function: send-gmail\n- Status: ✅ Working\n\nIf you received this email, your email system is fully configured!`
        }
      })

      if (error) {
        console.log('❌ Error:', error.message)
        setResult({ success: false, error: error.message })
      } else {
        console.log('✅ SUCCESS! Email sent successfully!')
        console.log('📧 Response:', data)
        setResult({ success: true, data })
      }
    } catch (error) {
      console.log('❌ Test failed:', error.message)
      setResult({ success: false, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="card-gradient card-glow max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Mail className="w-6 h-6 text-cyan-400" />
          Email Function Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Test Email Address
          </label>
          <input
            type="email"
            placeholder="your-email@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <Button
          onClick={testEmailFunction}
          disabled={isLoading}
          className="w-full bg-cyan-600 hover:bg-cyan-700"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Mail className="w-4 h-4 mr-2" />
          )}
          {isLoading ? 'Testing...' : 'Test Email Function'}
        </Button>

        {result && (
          <Alert className={result.success ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <AlertDescription className={result.success ? 'text-green-200' : 'text-red-200'}>
              {result.success ? (
                <div>
                  <p className="font-semibold">✅ SUCCESS! Email sent successfully!</p>
                  <p className="text-sm mt-1">Check your email inbox for the test message.</p>
                  {result.data && (
                    <p className="text-xs mt-2 opacity-75">
                      Response: {JSON.stringify(result.data)}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-semibold">❌ Error: {result.error}</p>
                  {result.error.includes('Gmail OAuth credentials not configured') && (
                    <p className="text-sm mt-1">
                      The function is deployed but Gmail OAuth credentials need to be configured in Supabase Dashboard.
                    </p>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-400">
          <p><strong>What this test does:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Calls the send-gmail Edge Function</li>
            <li>Sends a test email to the address you provide</li>
            <li>Shows success/error messages</li>
            <li>Helps diagnose configuration issues</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
