import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { createConnectedAccount } from '@/api/functions';
import { createAccountLink } from '@/api/functions';
import { getAccountStatus } from '@/api/functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link, DollarSign, CheckCircle, Clock, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Connect() {
  const [user, setUser] = useState(null);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (currentUser.stripe_account_id) {
        const { data: status } = await getAccountStatus();
        setStripeStatus(status);
        
        // If they completed onboarding but the status isn't active yet, update it
        if (status.details_submitted && currentUser.stripe_account_status !== 'active') {
          await User.updateMyUserData({ stripe_account_status: 'active' });
        }
      }
    } catch (error) {
      console.error("Error fetching user/status:", error);
    }
    setLoading(false);
  };

  const handleCreateAccount = async () => {
    setIsProcessing(true);
    try {
      // Step 1: Create a connected account
      const { data: accountData } = await createConnectedAccount();
      if (!accountData.accountId) {
        throw new Error("Failed to create Stripe account.");
      }
      
      // Update user locally to reflect the new account ID for the next step
      const updatedUser = { ...user, stripe_account_id: accountData.accountId };
      setUser(updatedUser);

      // Step 2: Create an account link for onboarding
      const { data: linkData } = await createAccountLink();
      if (linkData.url) {
        window.location.href = linkData.url;
      } else {
        throw new Error("Failed to create onboarding link.");
      }
    } catch (error) {
      console.error("Error creating Stripe account:", error);
      alert(error.message);
      setIsProcessing(false);
    }
  };

  const handleContinueOnboarding = async () => {
    setIsProcessing(true);
    try {
      const { data: linkData } = await createAccountLink();
      if (linkData.url) {
        window.location.href = linkData.url;
      } else {
        throw new Error("Failed to create onboarding link.");
      }
    } catch (error) {
      console.error("Error continuing onboarding:", error);
      alert(error.message);
      setIsProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const renderContent = () => {
    // State 1: User has a fully active Stripe account
    if (user?.stripe_account_id && stripeStatus?.charges_enabled) {
      return (
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mb-4 border-2 border-green-500">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white">You're All Set!</CardTitle>
            <CardDescription className="text-gray-400">
              Your Stripe account is connected and active. You can now receive payments for your sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
                onClick={() => window.open('https://dashboard.stripe.com/', '_blank')}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Stripe Dashboard
            </Button>
            <p className="text-xs text-gray-500 mt-4">You will be redirected to Stripe's website.</p>
          </CardContent>
        </Card>
      );
    }
    
    // State 2: User has a Stripe account but hasn't completed onboarding
    if (user?.stripe_account_id) {
      return (
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mb-4 border-2 border-yellow-500">
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
            <CardTitle className="text-2xl text-white">Almost there!</CardTitle>
            <CardDescription className="text-gray-400">
              You've started the process, but you need to complete your Stripe account setup to start receiving payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleContinueOnboarding}
              disabled={isProcessing}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white font-semibold shadow-lg"
            >
              {isProcessing ? 'Redirecting...' : 'Continue Setup on Stripe'}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-gray-500 mt-4">You will be securely redirected to Stripe.</p>
          </CardContent>
        </Card>
      );
    }

    // State 3: User has not started the process
    return (
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-fuchsia-600/20 rounded-full flex items-center justify-center mb-4 border-2 border-fuchsia-500">
            <DollarSign className="w-8 h-8 text-fuchsia-400" />
          </div>
          <CardTitle className="text-2xl text-white">Start Selling on GarageSale</CardTitle>
          <CardDescription className="text-gray-400">
            Connect with Stripe to securely accept payments and manage your earnings. It's fast, secure, and free to set up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleCreateAccount}
            disabled={isProcessing}
            className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white font-semibold shadow-lg h-12 px-8"
          >
            {isProcessing ? 'Setting up...' : 'Connect with Stripe'}
            <Link className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-gray-500 mt-4">You will be securely redirected to Stripe to create an account.</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Seller Hub</h1>
            <p className="text-base md:text-lg text-gray-400">Manage your payments and seller profile</p>
          </div>
          
          <div className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl p-8">
            {renderContent()}
          </div>

          <div className="mt-8 p-4 bg-gray-900 rounded-2xl border border-gray-800 flex items-center gap-4">
            <div className="p-2 bg-blue-900/50 rounded-lg">
              <img src="https://b.stripecdn.com/docs-statics-srv/assets/f7ede9ce93ea3fb91999a223380d3063.svg" alt="Powered by Stripe" className="h-6"/>
            </div>
            <p className="text-sm text-gray-400">
              GarageSale partners with Stripe for secure financial services. Your sensitive data is encrypted and sent directly to Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}