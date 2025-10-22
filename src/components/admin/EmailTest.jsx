import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  TestTube,
  BarChart3,
  Clock
} from 'lucide-react'
import { sendTestEmailToUser, getEmailStatistics } from '@/api/email'

export default function EmailTest() {
  const [testEmail, setTestEmail] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [emailStats, setEmailStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const handleTestEmail = async () => {
    if (!testEmail) {
      setResult({ success: false, error: 'Please enter an email address' })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await sendTestEmailToUser(testEmail)
      setResult(response)
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadStats = async () => {
    setStatsLoading(true)
    try {
      const response = await getEmailStatistics()
      if (response.success) {
        setEmailStats(response.data)
      }
    } catch (error) {
      console.error('Error loading email stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleCustomEmail = async () => {
    if (!testEmail || !customSubject || !customMessage) {
      setResult({ success: false, error: 'Please fill in all fields' })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      // This would need to be implemented in the email service
      const response = await fetch('/api/send-custom-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: customSubject,
          html: customMessage,
          text: customMessage
        })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="card-gradient card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TestTube className="w-6 h-6 text-cyan-400" />
            Email System Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Email Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="testEmail" className="text-white">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleTestEmail}
                disabled={isLoading}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Test Email
              </Button>

              <Button
                onClick={handleLoadStats}
                disabled={statsLoading}
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                {statsLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="w-4 h-4 mr-2" />
                )}
                Load Statistics
              </Button>
            </div>
          </div>

          {/* Result Display */}
          {result && (
            <Alert className={result.success ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <AlertDescription className={result.success ? 'text-green-200' : 'text-red-200'}>
                {result.success ? 'Email sent successfully!' : result.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Email Statistics */}
          {emailStats && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Email Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-cyan-400">{emailStats.total}</div>
                  <div className="text-sm text-gray-400">Total Emails</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{emailStats.sent}</div>
                  <div className="text-sm text-gray-400">Sent</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-400">{emailStats.failed}</div>
                  <div className="text-sm text-gray-400">Failed</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">{emailStats.emails_today}</div>
                  <div className="text-sm text-gray-400">Today</div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Email Section */}
          <div className="space-y-4 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white">Custom Email Test</h3>
            
            <div>
              <Label htmlFor="customSubject" className="text-white">Subject</Label>
              <Input
                id="customSubject"
                placeholder="Custom email subject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="customMessage" className="text-white">Message</Label>
              <Textarea
                id="customMessage"
                placeholder="Enter your custom message here..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleCustomEmail}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Send Custom Email
            </Button>
          </div>

          {/* Email Templates Info */}
          <div className="space-y-4 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white">Available Email Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-white">Welcome Email</span>
                </div>
                <p className="text-sm text-gray-400">Sent to new users upon registration</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-green-400" />
                  <span className="font-semibold text-white">Payment Confirmation</span>
                </div>
                <p className="text-sm text-gray-400">Sent to sellers when payment is confirmed</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-white">Order Confirmation</span>
                </div>
                <p className="text-sm text-gray-400">Sent to buyers when order is placed</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-red-400" />
                  <span className="font-semibold text-white">Account Restriction</span>
                </div>
                <p className="text-sm text-gray-400">Sent when account is restricted</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
