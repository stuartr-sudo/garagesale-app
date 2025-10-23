import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-white">
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-stone-900 mb-4">Contact Us</h1>
            <p className="text-lg text-stone-600">
              We're here to help! Get in touch with any questions about GarageSale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-orange-600">Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">Email</h3>
                    <p className="text-stone-600">support@blockswap.club</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">Phone</h3>
                    <p className="text-stone-600">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">Address</h3>
                    <p className="text-stone-600">
                      123 Community Street<br />
                      Local Town, ST 12345
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">Support Hours</h3>
                    <p className="text-stone-600">
                      Monday - Friday: 9AM - 6PM<br />
                      Weekend: 10AM - 4PM
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-orange-600">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-stone-900 mb-2">How do I list an item?</h3>
                  <p className="text-stone-600 text-sm">
                    Simply click "Add Item" in your dashboard, upload a photo, and set your price. Our AI will help create the perfect listing!
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-stone-900 mb-2">Is it free to use GarageSale?</h3>
                  <p className="text-stone-600 text-sm">
                    Yes! It's completely free to list and sell items on GarageSale. We only make money when you do.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-stone-900 mb-2">How do payments work?</h3>
                  <p className="text-stone-600 text-sm">
                    We use Stripe for secure payments. Buyers pay online, and you receive the money directly to your account.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-stone-900 mb-2">Can I edit my listings?</h3>
                  <p className="text-stone-600 text-sm">
                    Absolutely! Go to "My Items" to edit, deactivate, or mark items as sold at any time.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}