import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Coins, Clock, AlertCircle, QrCode, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function CryptoPaymentDetails({ 
  currency, 
  walletAddress, 
  amount, 
  onComplete 
}) {
  const [copied, setCopied] = useState({});
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  const handleSubmit = async () => {
    if (!txHash.trim()) {
      toast({
        title: "Transaction Hash Required",
        description: "Please enter the transaction hash to verify your payment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would typically verify the transaction on the blockchain
      // For now, we'll just proceed with the payment
      onComplete({
        paymentMethod: 'crypto',
        paymentStatus: 'pending',
        cryptoCurrency: currency,
        cryptoTxHash: txHash,
        amount: parseFloat(amount)
      });
    } catch (error) {
      console.error('Payment submission error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to submit payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getExplorerUrl = (currency, txHash) => {
    const explorers = {
      btc: `https://blockstream.info/tx/${txHash}`,
      eth: `https://etherscan.io/tx/${txHash}`,
      usdt: `https://etherscan.io/tx/${txHash}`,
      usdc: `https://etherscan.io/tx/${txHash}`,
      xrp: `https://xrpscan.com/tx/${txHash}`
    };
    return explorers[currency.toLowerCase()] || '#';
  };

  const getCurrencyInfo = (currency) => {
    const info = {
      btc: { name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
      eth: { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
      usdt: { name: 'Tether', symbol: 'USDT', icon: '₮' },
      usdc: { name: 'USD Coin', symbol: 'USDC', icon: '◉' },
      xrp: { name: 'XRP', symbol: 'XRP', icon: '✕' }
    };
    return info[currency.toLowerCase()] || { name: currency, symbol: currency, icon: '₿' };
  };

  const currencyInfo = getCurrencyInfo(currency);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Crypto Payment</h2>
        <p className="text-gray-400">Send the exact amount to the wallet address below.</p>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 space-y-6">
          {/* Payment Amount */}
          <div className="text-center p-6 bg-gray-700/50 rounded-lg">
            <div className="text-3xl font-bold text-white mb-2">
              {amount} {currencyInfo.symbol}
            </div>
            <p className="text-gray-400">Send exactly this amount</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg">
              <QRCodeSVG 
                value={walletAddress}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Wallet Address */}
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">
              Wallet Address
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={walletAddress}
                readOnly
                className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(walletAddress, 'address')}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {copied.address ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Transaction Hash Input */}
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">
              Transaction Hash
            </Label>
            <Textarea
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Enter the transaction hash from your wallet..."
              className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
              rows={3}
            />
            <p className="text-gray-400 text-xs mt-1">
              You can find this in your wallet after sending the transaction.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-400 font-medium mb-2">Important Instructions</h3>
            <ul className="text-yellow-200 text-sm space-y-1">
              <li>• Send exactly <strong>{amount} {currencyInfo.symbol}</strong> to the address above</li>
              <li>• Use the QR code for easy scanning with your mobile wallet</li>
              <li>• Copy the transaction hash after sending</li>
              <li>• Double-check the address before sending</li>
              <li>• Network fees may apply to your transaction</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-400 font-medium mb-1">Transaction Time</h3>
            <p className="text-blue-200 text-sm">
              {currencyInfo.symbol} transactions typically take 10-30 minutes to confirm. 
              You'll receive an email once the payment is verified.
            </p>
          </div>
        </div>
      </div>

      {txHash && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-green-400" />
              <div>
                <h3 className="text-green-400 font-medium">Transaction Submitted</h3>
                <p className="text-green-200 text-sm">
                  Your transaction has been submitted for verification.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(getExplorerUrl(currency, txHash), '_blank')}
              className="border-green-600 text-green-300 hover:bg-green-900/20"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View on Explorer
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!txHash.trim() || isSubmitting}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-xl"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verifying Payment...
            </>
          ) : (
            <>
              <Coins className="w-4 h-4 mr-2" />
              Submit Payment
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
