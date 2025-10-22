import React from 'react';
import { AlertCircle, Ban, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Banner component to display suspension or ban status to users
 */
export default function SuspensionBanner({ userStatus, onLogout }) {
  const { isSuspended, isBanned, suspensionEndDate, banReason } = userStatus;

  // Calculate time remaining for suspension
  const getTimeRemaining = () => {
    if (!suspensionEndDate) return null;
    const end = new Date(suspensionEndDate);
    const now = new Date();
    const diffMs = end - now;
    
    if (diffMs <= 0) return 'Suspension has expired. Please refresh the page.';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  if (isBanned) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full bg-red-950/30 border-red-800">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                <Ban className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-red-400">Account Permanently Banned</h1>
                <p className="text-red-300 mt-1">You can no longer access this platform</p>
              </div>
            </div>

            <div className="bg-red-900/30 border border-red-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-red-300 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Reason for Ban
              </h2>
              <p className="text-red-200">
                {banReason || 'Multiple incomplete transactions. You accepted offers but failed to complete payment, violating our community policies.'}
              </p>
            </div>

            <div className="bg-slate-600/50 border border-slate-500 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-white mb-3">What happened?</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>You accepted offers to purchase items but did not complete the payment within the required timeframe.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>After your first incomplete transaction, you received a 24-hour suspension as a warning.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Your second incomplete transaction resulted in a permanent ban from the platform.</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-yellow-300 mb-2">Impact on Sellers</h3>
              <p className="text-yellow-200 text-sm">
                When you accept an offer but don't complete the transaction, you prevent legitimate buyers from purchasing the item and waste the seller's time. This behavior is unfair to our community and is not tolerated.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={onLogout}
                variant="outline"
                className="bg-slate-600 border-slate-500 text-white hover:bg-gray-700"
              >
                Log Out
              </Button>
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              If you believe this ban was issued in error, please contact support at support@garagesale.com
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isSuspended) {
    const timeRemaining = getTimeRemaining();

    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full bg-orange-950/30 border-orange-800">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-orange-400">Account Temporarily Suspended</h1>
                <p className="text-orange-300 mt-1">Your access has been restricted for 24 hours</p>
              </div>
            </div>

            <div className="bg-orange-900/30 border border-orange-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-orange-300 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Reason for Suspension
              </h2>
              <p className="text-orange-200 mb-4">
                You accepted an offer to purchase an item but did not complete the payment within the required timeframe.
              </p>
              <div className="bg-orange-800/30 rounded-lg p-4">
                <p className="text-white font-semibold">Time Remaining:</p>
                <p className="text-2xl font-bold text-orange-300 mt-1">{timeRemaining}</p>
              </div>
            </div>

            <div className="bg-slate-600/50 border border-slate-500 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-white mb-3">What does this mean?</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">•</span>
                  <span>You cannot access the marketplace or make any transactions during this suspension period.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">•</span>
                  <span>After 24 hours, your suspension will automatically be lifted and you can resume using the platform.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">•</span>
                  <span>This is your first and only warning.</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-red-300 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Important Warning
              </h3>
              <p className="text-red-200 text-sm">
                If you fail to complete payment for another accepted offer in the future, <strong>your account will be permanently banned</strong> from the platform with no further warnings.
              </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-blue-300 mb-2">Moving Forward</h3>
              <p className="text-blue-200 text-sm">
                Please only accept offers when you are ready and able to complete the payment immediately. Remember that sellers rely on serious buyers, and incomplete transactions harm our community.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={onLogout}
                variant="outline"
                className="bg-slate-600 border-slate-500 text-white hover:bg-gray-700"
              >
                Log Out
              </Button>
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              If you believe this suspension was issued in error, please contact support at support@garagesale.com
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

