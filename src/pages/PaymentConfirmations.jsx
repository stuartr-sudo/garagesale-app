import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import PaymentConfirmationDashboard from '@/components/payment/PaymentConfirmationDashboard';
import AccountRestrictionBanner from '@/components/payment/AccountRestrictionBanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PaymentConfirmations() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
      navigate(createPageUrl('SignIn'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Please sign in to view payment confirmations.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Account Restriction Banner */}
        <AccountRestrictionBanner userId={currentUser.id} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => navigate(createPageUrl('MyItems'))}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Items
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Payment Confirmations</h1>
              <p className="text-gray-400">Confirm receipt of payments from buyers</p>
            </div>
          </div>
        </div>

        {/* Information Card */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">i</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">How Payment Confirmations Work</h3>
                <div className="space-y-2 text-gray-300 text-sm">
                  <p>
                    <strong>1. Buyer Payment:</strong> When a buyer completes payment, you'll receive a notification.
                  </p>
                  <p>
                    <strong>2. Confirmation Required:</strong> You must confirm receipt within the deadline:
                  </p>
                  <ul className="ml-4 space-y-1">
                    <li>• <strong>Business Hours (8 AM - 10 PM):</strong> 12 hours to confirm</li>
                    <li>• <strong>Outside Business Hours:</strong> 24 hours to confirm</li>
                  </ul>
                  <p>
                    <strong>3. Consequences:</strong> Missing the deadline will restrict your account until all payments are confirmed.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Confirmation Dashboard */}
        <PaymentConfirmationDashboard sellerId={currentUser.id} />
      </div>
    </div>
  );
}
