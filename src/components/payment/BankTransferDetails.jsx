import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Banknote, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BankTransferDetails({ seller, amount, onComplete }) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [copied, setCopied] = useState({});
  const { toast } = useToast();

  // Generate a unique reference number
  React.useEffect(() => {
    const ref = `GS${Date.now().toString().slice(-8)}`;
    setReferenceNumber(ref);
  }, []);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(prev => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [field]: false }));
      }, 2000);
      toast({
        title: "Copied to clipboard",
        description: `${field} has been copied to your clipboard.`,
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleComplete = () => {
    onComplete({
      referenceNumber,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'pending'
    });
  };

  if (!seller.bank_details) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Bank Details Not Available</h3>
        <p className="text-gray-400 mb-4">
          The seller has not provided bank account details for this payment method.
        </p>
        <p className="text-sm text-gray-500">
          Please contact the seller directly or choose a different payment method.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Bank Transfer Details</h2>
        <p className="text-gray-400">Transfer the exact amount to the seller's bank account.</p>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300">Account Name</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={seller.bank_details.account_name || 'Not provided'}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(seller.bank_details.account_name, 'account_name')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {copied.account_name ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">BSB</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={seller.bank_details.bsb || 'Not provided'}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(seller.bank_details.bsb, 'bsb')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {copied.bsb ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-300">Account Number</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={seller.bank_details.account_number || 'Not provided'}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(seller.bank_details.account_number, 'account_number')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {copied.account_number ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Amount</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={`$${amount.toFixed(2)}`}
                    readOnly
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(amount.toFixed(2), 'amount')}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {copied.amount ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Reference Number</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={referenceNumber}
                    readOnly
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(referenceNumber, 'reference')}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {copied.reference ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-400 font-medium mb-2">Important Instructions</h3>
            <ul className="text-yellow-200 text-sm space-y-1">
              <li>• Transfer the exact amount: <strong>${amount.toFixed(2)}</strong></li>
              <li>• Use the reference number: <strong>{referenceNumber}</strong></li>
              <li>• Keep your transfer receipt as proof of payment</li>
              <li>• Payment may take 1-2 business days to process</li>
              <li>• Contact the seller if you have any questions</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-400 font-medium mb-1">What happens next?</h3>
            <p className="text-blue-200 text-sm">
              After you complete the bank transfer, the seller will verify the payment 
              and confirm your order. You'll receive an email confirmation once the 
              payment is verified.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 rounded-xl"
        >
          <Banknote className="w-4 h-4 mr-2" />
          I've Completed the Transfer
        </Button>
      </div>
    </div>
  );
}
