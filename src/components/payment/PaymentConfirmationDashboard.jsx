import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  User, 
  Package,
  Mail,
  ExternalLink
} from 'lucide-react';
import { 
  getPendingConfirmations, 
  confirmPaymentReceived, 
  checkAccountRestrictions,
  getPendingConfirmationsCount 
} from '@/api/paymentConfirmations';
import { 
  formatTimeRemaining, 
  isDeadlineApproaching, 
  isDeadlineCritical,
  formatDateInTimezone,
  getUserTimezone 
} from '@/utils/timezone';
import { useToast } from '@/hooks/use-toast';
import SupportModal from './SupportModal';

export default function PaymentConfirmationDashboard({ sellerId }) {
  const [confirmations, setConfirmations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedConfirmation, setSelectedConfirmation] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    // Refresh every minute to update countdown timers
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [sellerId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load pending confirmations
      const confirmationsResult = await getPendingConfirmations(sellerId);
      if (confirmationsResult.success) {
        setConfirmations(confirmationsResult.confirmations);
      }

      // Check account restrictions
      const restrictionsResult = await checkAccountRestrictions(sellerId);
      if (restrictionsResult.success) {
        setIsRestricted(restrictionsResult.isRestricted);
        setRestrictionReason(restrictionsResult.restrictionReason);
      }

      // Get pending count
      const countResult = await getPendingConfirmationsCount(sellerId);
      if (countResult.success) {
        setPendingCount(countResult.count);
      }
    } catch (error) {
      console.error('Error loading payment confirmation data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment confirmations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async (confirmationId) => {
    try {
      const result = await confirmPaymentReceived(confirmationId, sellerId);
      
      if (result.success) {
        toast({
          title: "Payment Confirmed",
          description: "Payment confirmation recorded successfully",
        });
        
        // Reload data to update the list
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive"
      });
    }
  };

  const handleContactSupport = (confirmation) => {
    setSelectedConfirmation(confirmation);
    setShowSupportModal(true);
  };

  const getConfirmationStatus = (confirmation) => {
    const now = new Date();
    const deadline = new Date(confirmation.confirmation_deadline);
    
    if (now > deadline) {
      return { status: 'expired', color: 'destructive' };
    } else if (isDeadlineCritical(deadline)) {
      return { status: 'critical', color: 'destructive' };
    } else if (isDeadlineApproaching(deadline)) {
      return { status: 'approaching', color: 'warning' };
    } else {
      return { status: 'pending', color: 'default' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading payment confirmations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Restriction Banner */}
      {isRestricted && (
        <Alert className="border-red-500 bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">
            <strong>Account Restricted:</strong> {restrictionReason}
            <br />
            Please confirm all pending payments or contact support to restore your account.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Confirmation Required Banner */}
      {pendingCount > 0 && !isRestricted && (
        <Alert className="border-yellow-500 bg-yellow-900/20">
          <Clock className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-200">
            <strong>Payment Confirmation Required:</strong> You have {pendingCount} pending payment confirmation{pendingCount > 1 ? 's' : ''} that need your attention.
          </AlertDescription>
        </Alert>
      )}

      {/* No Pending Confirmations */}
      {confirmations.length === 0 && !isRestricted && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
            <p className="text-gray-400">No pending payment confirmations at this time.</p>
          </CardContent>
        </Card>
      )}

      {/* Pending Confirmations List */}
      {confirmations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-400" />
            Pending Payment Confirmations
          </h2>
          
          {confirmations.map((confirmation) => {
            const status = getConfirmationStatus(confirmation);
            const timeRemaining = formatTimeRemaining(confirmation.confirmation_deadline);
            
            return (
              <Card key={confirmation.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Payment Confirmation Required
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Order #{confirmation.order_id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant={status.color}>
                      {status.status === 'expired' ? 'Expired' : 
                       status.status === 'critical' ? 'Critical' :
                       status.status === 'approaching' ? 'Approaching' : 'Pending'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Item Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Package className="w-4 h-4" />
                        <span className="font-medium">Item:</span>
                        <span className="text-white">{confirmation.item?.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-300">
                        <User className="w-4 h-4" />
                        <span className="font-medium">Buyer:</span>
                        <span className="text-white">
                          {confirmation.buyer?.full_name || confirmation.buyer?.email}
                        </span>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-300">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">Amount:</span>
                        <span className="text-white font-semibold">
                          ${confirmation.amount.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Paid:</span>
                        <span className="text-white">
                          {formatDateInTimezone(confirmation.payment_confirmed_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Time Remaining */}
                  <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-medium">Time Remaining:</span>
                      <span className={`font-semibold ${
                        status.status === 'expired' ? 'text-red-400' :
                        status.status === 'critical' ? 'text-red-400' :
                        status.status === 'approaching' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {timeRemaining}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Deadline: {formatDateInTimezone(confirmation.confirmation_deadline)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleConfirmPayment(confirmation.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={status.status === 'expired'}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Payment Received
                    </Button>
                    
                    <Button
                      onClick={() => handleContactSupport(confirmation)}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <SupportModal
          confirmation={selectedConfirmation}
          onClose={() => setShowSupportModal(false)}
          onSubmit={async (supportData) => {
            // Handle support request submission
            setShowSupportModal(false);
            toast({
              title: "Support Request Submitted",
              description: "We'll respond within 24 hours.",
            });
          }}
        />
      )}
    </div>
  );
}
