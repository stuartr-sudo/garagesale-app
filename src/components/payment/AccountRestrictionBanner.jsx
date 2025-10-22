import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, Mail } from 'lucide-react';
import { checkAccountRestrictions, getPendingConfirmations } from '@/api/paymentConfirmations';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SupportModal from './SupportModal';

export default function AccountRestrictionBanner({ userId }) {
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      checkRestrictionStatus();
    }
  }, [userId]);

  const checkRestrictionStatus = async () => {
    try {
      // Check account restrictions
      const restrictionsResult = await checkAccountRestrictions(userId);
      if (restrictionsResult.success) {
        setIsRestricted(restrictionsResult.isRestricted);
        setRestrictionReason(restrictionsResult.restrictionReason);
      }

      // Get pending confirmations count
      const confirmationsResult = await getPendingConfirmations(userId);
      if (confirmationsResult.success) {
        setPendingCount(confirmationsResult.confirmations.length);
      }
    } catch (error) {
      console.error('Error checking restriction status:', error);
    }
  };

  const handleViewConfirmations = () => {
    navigate(createPageUrl('MyItems'));
  };

  const handleContactSupport = () => {
    setShowSupportModal(true);
  };

  if (!isRestricted) {
    return null;
  }

  return (
    <>
      <Alert className="border-red-500 bg-red-900/20 mb-4">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <strong>Account Restricted:</strong> {restrictionReason}
              <br />
              <span className="text-sm">
                You have {pendingCount} pending payment confirmation{pendingCount > 1 ? 's' : ''} that need your attention.
                Please confirm all pending payments or contact support to restore your account.
              </span>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                onClick={handleViewConfirmations}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Confirmations
              </Button>
              <Button
                onClick={handleContactSupport}
                size="sm"
                variant="outline"
                className="border-red-400 text-red-200 hover:bg-red-800"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Support Modal */}
      {showSupportModal && (
        <SupportModal
          confirmation={null}
          onClose={() => setShowSupportModal(false)}
          onSubmit={async (supportData) => {
            setShowSupportModal(false);
          }}
        />
      )}
    </>
  );
}
