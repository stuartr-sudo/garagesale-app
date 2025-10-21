import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, DollarSign, Users, Gift } from "lucide-react";
import { createDonationSession } from "@/api/functions";

const donationAmounts = [10, 25, 50, 100, 250, 500];

export default function Donations() {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [donorInfo, setDonorInfo] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDonation = async () => {
    const amount = selectedAmount === 'custom' ? parseFloat(customAmount) : selectedAmount;
    
    if (!amount || amount < 5) {
      alert("Minimum donation amount is $5");
      return;
    }

    if (!donorInfo.email) {
      alert("Please provide your email address");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await createDonationSession({
        amount: amount,
        donor_info: donorInfo
      });

      if (error) {
        throw new Error(error.message || 'An unknown error occurred');
      }

      if (data && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error) {
      console.error("Donation error:", error);
      alert(`There was an error processing your donation: ${error.message}. Please try again.`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Support GarageSale</h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Help us keep the community marketplace thriving! Your donations support platform development, 
              community events, and keeping GarageSale free for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Impact Section */}
            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-pink-400">
                  <Users className="w-6 h-6" />
                  Your Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                  <div className="text-2xl">💻</div>
                  <div>
                    <h3 className="font-semibold text-white">Platform Development</h3>
                    <p className="text-sm text-gray-400">Keep adding new features and improvements</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                  <div className="text-2xl">🎉</div>
                  <div>
                    <h3 className="font-semibold text-white">Community Events</h3>
                    <p className="text-sm text-gray-400">Support local meetups and market days</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                  <div className="text-2xl">🆓</div>
                  <div>
                    <h3 className="font-semibold text-white">Keep It Free</h3>
                    <p className="text-sm text-gray-400">No fees for listing or selling your items</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                  <div className="text-2xl">📱</div>
                  <div>
                    <h3 className="font-semibold text-white">Mobile App</h3>
                    <p className="text-sm text-gray-400">Help us build a dedicated mobile app</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Donation Form */}
            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-pink-400">
                  <Gift className="w-6 h-6" />
                  Make a Donation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount Selection */}
                <div className="space-y-3">
                  <Label className="text-gray-300">Donation Amount</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {donationAmounts.map(amount => (
                      <Button
                        key={amount}
                        variant={selectedAmount === amount ? "default" : "outline"}
                        onClick={() => setSelectedAmount(amount)}
                        className={selectedAmount === amount ? 
                          "bg-pink-600 hover:bg-pink-700" : 
                          "hover:bg-gray-700 border-gray-700 text-gray-300"
                        }
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={selectedAmount === 'custom' ? "default" : "outline"}
                      onClick={() => setSelectedAmount('custom')}
                      className={selectedAmount === 'custom' ? 
                        "bg-pink-600 hover:bg-pink-700" : 
                        "hover:bg-gray-700 border-gray-700 text-gray-300"
                      }
                    >
                      Custom
                    </Button>
                    {selectedAmount === 'custom' && (
                      <div className="flex-1 relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                          min="5"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Donor Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="donor-name" className="text-gray-300">Name (Optional)</Label>
                      <Input
                        id="donor-name"
                        value={donorInfo.name}
                        onChange={(e) => setDonorInfo(prev => ({...prev, name: e.target.value}))}
                        placeholder="Your name"
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donor-email" className="text-gray-300">Email *</Label>
                      <Input
                        id="donor-email"
                        type="email"
                        value={donorInfo.email}
                        onChange={(e) => setDonorInfo(prev => ({...prev, email: e.target.value}))}
                        placeholder="your.email@example.com"
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="donor-message" className="text-gray-300">Message (Optional)</Label>
                    <Textarea
                      id="donor-message"
                      value={donorInfo.message}
                      onChange={(e) => setDonorInfo(prev => ({...prev, message: e.target.value}))}
                      placeholder="Leave a message of support..."
                      rows={3}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                </div>

                {/* Donation Button */}
                <Button
                  onClick={handleDonation}
                  disabled={isProcessing || !donorInfo.email}
                  className="w-full h-12 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 mr-2" />
                      Donate ${selectedAmount === 'custom' ? customAmount || '0' : selectedAmount}
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  Secure payments processed by Stripe. You'll receive an email receipt.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}