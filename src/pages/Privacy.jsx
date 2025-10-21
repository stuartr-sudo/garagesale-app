import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Database, Users } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-white">
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-4xl font-bold text-stone-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-stone-600">
              Your privacy is important to us. Here's how we protect and use your information.
            </p>
            <p className="text-sm text-stone-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-orange-600" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-stone-700">
                <p><strong>Personal Information:</strong> When you create an account, we collect your name, email address, phone number, and location to help connect you with local buyers and sellers.</p>
                <p><strong>Listing Information:</strong> Photos, descriptions, and prices of items you list for sale.</p>
                <p><strong>Usage Data:</strong> How you interact with our platform to improve your experience.</p>
                <p><strong>Payment Information:</strong> Processed securely through Stripe - we never store your payment details.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-orange-600" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-stone-700">
                <p><strong>Marketplace Operations:</strong> To display your listings and connect you with potential buyers.</p>
                <p><strong>Communication:</strong> To send you updates about your listings and important platform notifications.</p>
                <p><strong>Local Connections:</strong> Your general location helps us show relevant local items and buyers.</p>
                <p><strong>Platform Improvement:</strong> Anonymous usage data helps us make GarageSale better for everyone.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-orange-600" />
                  Information Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-stone-700">
                <p><strong>With Other Users:</strong> Your name and general location are visible to facilitate local transactions.</p>
                <p><strong>With Service Providers:</strong> We use trusted third-party services like Stripe for payments and cloud storage for photos.</p>
                <p><strong>Legal Requirements:</strong> We may share information if required by law or to protect our users' safety.</p>
                <p><strong>We Never:</strong> Sell your personal information to advertisers or marketers.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle>Your Rights & Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-stone-700">
                <p><strong>Access & Download:</strong> You can view and download all your data from your account settings.</p>
                <p><strong>Edit & Update:</strong> Update your profile information anytime in the Settings page.</p>
                <p><strong>Delete Account:</strong> Contact us to permanently delete your account and all associated data.</p>
                <p><strong>Privacy Choices:</strong> Control who can see your contact information and listings.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle>Data Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-stone-700">
                <p>We use industry-standard encryption and security measures to protect your information. All payments are processed through Stripe's secure infrastructure, and we never store sensitive payment information on our servers.</p>
                <p>Your data is stored on secure, encrypted servers with regular backups and monitoring.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="text-stone-700">
                <p>If you have any questions about this Privacy Policy or how we handle your data, please contact us at:</p>
                <p className="mt-2">
                  <strong>Email:</strong> privacy@garagesale.app<br />
                  <strong>Phone:</strong> +1 (555) 123-4567
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}