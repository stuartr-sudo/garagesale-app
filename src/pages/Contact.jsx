import React, { useState } from 'react';
import { Mail, MessageSquare, Phone, MapPin, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: 'buyer'
  });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);

    try {
      // In production, this would send via your email service (Resend)
      // For now, we'll show a success message
      
      // TODO: Implement actual email sending via Resend
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      toast({
        title: "Message Sent! ✅",
        description: "We'll get back to you within 24 hours at support@blockswap.club",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        userType: 'buyer'
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please email us directly at support@blockswap.club",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <MessageSquare className="w-10 h-10 text-pink-500" />
            Contact Support
          </h1>
          <p className="text-xl text-gray-400">
            We're here to help! Get in touch with the BlockSwap team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Email */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-pink-600/20 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Email</h3>
                  <p className="text-sm text-gray-400">We reply within 24 hours</p>
                </div>
              </div>
              <a 
                href="mailto:support@blockswap.club" 
                className="text-pink-400 hover:text-pink-300 transition-colors"
              >
                support@blockswap.club
              </a>
            </div>

            {/* Response Time */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Quick Response</h3>
                  <p className="text-sm text-gray-400">Average reply time</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">2-4 hours</p>
              <p className="text-sm text-gray-400 mt-2">
                During business hours (9am-6pm AEST)
              </p>
            </div>

            {/* Support Hours */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Support Hours</h3>
                  <p className="text-sm text-gray-400">We're here to help</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  <span className="font-semibold text-white">Monday - Friday:</span> 9am - 6pm AEST
                </p>
                <p className="text-gray-300">
                  <span className="font-semibold text-white">Saturday:</span> 10am - 4pm AEST
                </p>
                <p className="text-gray-300">
                  <span className="font-semibold text-white">Sunday:</span> Closed
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Location</h3>
                  <p className="text-sm text-gray-400">Serving Australia-wide</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                Based in Sydney, NSW<br />
                Supporting the entire Australian marketplace community
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-6">Send us a message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Type */}
                <div className="space-y-2">
                  <Label className="text-gray-300">I am a:</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="userType"
                        value="buyer"
                        checked={formData.userType === 'buyer'}
                        onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value }))}
                        className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 focus:ring-pink-500"
                      />
                      <span className="text-white">Buyer</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="userType"
                        value="seller"
                        checked={formData.userType === 'seller'}
                        onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value }))}
                        className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 focus:ring-pink-500"
                      />
                      <span className="text-white">Seller</span>
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Your Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="John Smith"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Your Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-gray-300">Subject *</Label>
                  <Input
                    id="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="How can we help?"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-gray-300">Message *</Label>
                  <Textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
                >
                  {isSending ? (
                    <>
                      <span className="animate-pulse">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>

                <p className="text-sm text-gray-400 text-center">
                  We typically respond within 2-4 hours during business hours.
                </p>
              </form>
            </div>

            {/* FAQ Section */}
            <div className="mt-8 bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h3 className="text-xl font-bold text-white mb-4">Before you reach out...</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-semibold mb-2">📦 For Order Issues:</h4>
                  <p className="text-gray-400 text-sm">
                    Check "My Orders" or "My Purchases" pages for transaction details and status updates.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">💰 For Payment Questions:</h4>
                  <p className="text-gray-400 text-sm">
                    Visit the "Payment Confirmations" page to confirm or track payment status.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">🤖 For Technical Issues:</h4>
                  <p className="text-gray-400 text-sm">
                    Try clearing your browser cache and cookies first. Include your browser and device info in your message.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
