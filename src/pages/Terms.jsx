import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, DollarSign, Shield } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-white">
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-4xl font-bold text-stone-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-stone-600">
              Please read these terms carefully before using GarageSale.
            </p>
            <p className="text-sm text-stone-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle>Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="text-stone-700">
                <p>By using GarageSale, you agree to these Terms of Service. If you don't agree with any part of these terms, please don't use our platform.</p>
                <p className="mt-4">These terms may be updated from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-orange-600" />
                  User Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-stone-700">
                <p><strong>Accurate Information:</strong> Provide truthful and accurate descriptions of items you list for sale.</p>
                <p><strong>Legal Items Only:</strong> Only list items that are legal to sell in your jurisdiction.</p>
                <p><strong>Respectful Behavior:</strong> Treat other users with respect and courtesy.</p>
                <p><strong>Account Security:</strong> Keep your login credentials secure and don't share your account.</p>
                <p><strong>Local Laws:</strong> Comply with all applicable local, state, and federal laws when buying or selling.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Prohibited Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-stone-700">
                <p>The following items are prohibited on GarageSale:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Weapons, firearms, or ammunition</li>
                  <li>Illegal drugs or controlled substances</li>
                  <li>Stolen goods or items of questionable origin</li>
                  <li>Adult content or services</li>
                  <li>Live animals (except through licensed dealers)</li>
                  <li>Hazardous materials or chemicals</li>
                  <li>Counterfeit or pirated goods</li>
                  <li>Items that violate intellectual property rights</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                  Transactions & Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-stone-700">
                <p><strong>Payment Processing:</strong> All payments are processed through Stripe. We don't handle money directly.</p>
                <p><strong>Transaction Disputes:</strong> Buyers and sellers are responsible for resolving disputes directly. We provide a platform but are not party to transactions.</p>
                <p><strong>Fees:</strong> Basic listing is free. We may introduce optional premium features in the future.</p>
                <p><strong>Refunds:</strong> Refund policies are between buyers and sellers. We encourage clear communication about return policies.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle>Platform Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-stone-700">
                <p><strong>Content Ownership:</strong> You retain ownership of photos and descriptions you upload, but grant us license to display them on the platform.</p>
                <p><strong>Platform Availability:</strong> We strive for 99%+ uptime but cannot guarantee uninterrupted service.</p>
                <p><strong>Account Suspension:</strong> We reserve the right to suspend accounts that violate these terms or engage in fraudulent activity.</p>
                <p><strong>Content Moderation:</strong> We may remove listings that violate our policies or applicable laws.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle>Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-stone-700">
                <p>GarageSale provides a platform for local buying and selling. We are not responsible for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>The quality, safety, or legality of items listed</li>
                  <li>The accuracy of user-provided information</li>
                  <li>Disputes between buyers and sellers</li>
                  <li>Delivery, pickup, or payment issues between users</li>
                  <li>Any damages resulting from use of our platform</li>
                </ul>
                <p className="mt-4">Users engage in transactions at their own risk and should exercise appropriate caution.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="text-stone-700">
                <p>Questions about these Terms of Service? Contact us:</p>
                <p className="mt-2">
                  <strong>Email:</strong> legal@garagesale.app<br />
                  <strong>Phone:</strong> +1 (555) 123-4567<br />
                  <strong>Address:</strong> 123 Community Street, Local Town, ST 12345
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}