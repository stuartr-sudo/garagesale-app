import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertTriangle, CheckCircle } from 'lucide-react';
import { submitSupportRequest } from '@/api/paymentConfirmations';
import { useToast } from '@/hooks/use-toast';

export default function SupportModal({ confirmation, onClose, onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!issueDescription.trim()) {
      toast({
        title: "Required Field",
        description: "Please describe the technical issue you're experiencing.",
        variant: "destructive"
      });
      return;
    }

    if (!userEmail.trim()) {
      toast({
        title: "Required Field", 
        description: "Please provide your email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await submitSupportRequest({
        orderId: confirmation?.order_id,
        itemName: confirmation?.item?.title,
        issueDescription: issueDescription.trim(),
        userEmail: userEmail.trim()
      });

      if (result.success) {
        toast({
          title: "Support Request Submitted",
          description: "We'll respond within 24 hours.",
        });
        
        if (onSubmit) {
          onSubmit({
            requestId: result.requestId,
            issueDescription,
            userEmail
          });
        }
        
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error submitting support request:', error);
      toast({
        title: "Error",
        description: "Failed to submit support request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            Contact Support
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Important Notice */}
          <Alert className="border-yellow-500 bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              <strong>Technical Support Only:</strong> This form is for technical issues with the platform. 
              For payment disputes between buyers and sellers, please resolve directly with the other party.
            </AlertDescription>
          </Alert>

          {/* Transaction Details */}
          {confirmation && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Transaction Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Transaction ID:</span>
                  <div className="text-white font-mono">
                    {confirmation.order_id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Item:</span>
                  <div className="text-white">{confirmation.item?.title}</div>
                </div>
                <div>
                  <span className="text-gray-400">Amount:</span>
                  <div className="text-white font-semibold">
                    ${confirmation.amount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Buyer:</span>
                  <div className="text-white">
                    {confirmation.buyer?.full_name || confirmation.buyer?.email}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Support Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="transactionId" className="text-gray-300">
                Transaction ID
              </Label>
              <Input
                id="transactionId"
                value={confirmation?.order_id.slice(0, 8).toUpperCase() || ''}
                readOnly
                className="bg-gray-700 border-gray-600 text-gray-300"
              />
            </div>

            <div>
              <Label htmlFor="itemName" className="text-gray-300">
                Item Name
              </Label>
              <Input
                id="itemName"
                value={confirmation?.item?.title || ''}
                readOnly
                className="bg-gray-700 border-gray-600 text-gray-300"
              />
            </div>

            <div>
              <Label htmlFor="userEmail" className="text-gray-300">
                Your Email Address *
              </Label>
              <Input
                id="userEmail"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="issueDescription" className="text-gray-300">
                Technical Issue Description *
              </Label>
              <Textarea
                id="issueDescription"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Please describe the technical issue you're experiencing with the payment confirmation system..."
                className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Please be specific about the technical problem. Include any error messages or unexpected behavior.
              </p>
            </div>

            {/* Common Issues */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Common Technical Issues:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• "Confirm Payment Received" button not working</li>
                <li>• Payment confirmation page not loading</li>
                <li>• Timer not updating correctly</li>
                <li>• Account restrictions applied incorrectly</li>
                <li>• Email notifications not received</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit to Support
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* Response Time Notice */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-200 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>
                <strong>Response Time:</strong> We'll respond to your support request within 24 hours.
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
