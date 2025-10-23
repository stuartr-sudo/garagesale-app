import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  CreditCard, 
  Banknote, 
  Coins,
  Calendar,
  MapPin,
  Shield,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CollectionAcknowledgment from './CollectionAcknowledgment';
import PaymentMethodSelector from './PaymentMethodSelector';
import BankTransferDetails from './BankTransferDetails';
import StripePaymentForm from './StripePaymentForm';
import CryptoPaymentSelector from './CryptoPaymentSelector';
import CryptoPaymentDetails from './CryptoPaymentDetails';
import ConfirmationScreen from './ConfirmationScreen';

export default function PaymentWizard({ 
  item, 
  seller, 
  onComplete, 
  onClose 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [collectionAcknowledged, setCollectionAcknowledged] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [cryptoAmount, setCryptoAmount] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const totalSteps = 5;

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!collectionAcknowledged) {
          toast({
            title: "Collection Required",
            description: "You must acknowledge the collection details to proceed.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      
      case 2:
        if (!paymentMethod) {
          toast({
            title: "Payment Method Required",
            description: "Please select a payment method.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      
      case 3:
        if (paymentMethod === 'crypto' && !selectedCrypto) {
          toast({
            title: "Cryptocurrency Required",
            description: "Please select a cryptocurrency.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handlePaymentComplete = async (paymentData) => {
    setIsProcessing(true);
    try {
      // Create transaction record
      const transactionData = {
        itemId: item.id,
        buyerId: 'current-user-id', // Get from auth context
        sellerId: seller.id,
        paymentMethod,
        paymentStatus: 'pending',
        amount: item.price,
        collectionDate: item.collection_date,
        ...paymentData
      };

      // Call API to create transaction
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const transaction = await response.json();
      
      toast({
        title: "Payment Initiated",
        description: "Your payment has been processed. Check your email for confirmation.",
      });

      onComplete(transaction);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment processing.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CollectionAcknowledgment
            item={item}
            onAcknowledge={setCollectionAcknowledged}
            acknowledged={collectionAcknowledged}
          />
        );
      
      case 2:
        return (
          <PaymentMethodSelector
            onSelect={setPaymentMethod}
            selected={paymentMethod}
          />
        );
      
      case 3:
        if (paymentMethod === 'bank_transfer') {
          return (
            <BankTransferDetails
              seller={seller}
              amount={item.price}
              onComplete={handlePaymentComplete}
            />
          );
        }
        
        if (paymentMethod === 'stripe') {
          return (
            <StripePaymentForm
              item={item}
              onComplete={handlePaymentComplete}
              onPaymentIntent={setPaymentIntent}
            />
          );
        }
        
        if (paymentMethod === 'crypto') {
          return (
            <CryptoPaymentSelector
              onSelect={setSelectedCrypto}
              selected={selectedCrypto}
              onAmount={setCryptoAmount}
              amount={item.price}
            />
          );
        }
        break;
      
      case 4:
        if (paymentMethod === 'crypto' && selectedCrypto) {
          return (
            <CryptoPaymentDetails
              currency={selectedCrypto}
              walletAddress={seller.crypto_wallet_addresses?.[selectedCrypto.toLowerCase()]}
              amount={cryptoAmount}
              onComplete={handlePaymentComplete}
            />
          );
        }
        break;
      
      case 5:
        return (
          <ConfirmationScreen
            item={item}
            paymentMethod={paymentMethod}
            collectionDate={item.collection_date}
            onComplete={onComplete}
          />
        );
      
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return collectionAcknowledged;
      case 2:
        return paymentMethod !== null;
      case 3:
        if (paymentMethod === 'crypto') {
          return selectedCrypto !== null;
        }
        return true;
      case 4:
        return paymentMethod !== 'crypto' || selectedCrypto !== null;
      default:
        return true;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Collection Details";
      case 2:
        return "Payment Method";
      case 3:
        if (paymentMethod === 'bank_transfer') return "Bank Transfer";
        if (paymentMethod === 'stripe') return "Credit Card Payment";
        if (paymentMethod === 'crypto') return "Select Cryptocurrency";
        return "Payment Details";
      case 4:
        return "Crypto Payment";
      case 5:
        return "Confirmation";
      default:
        return "Payment Wizard";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900/95 backdrop-blur-sm shadow-2xl border border-gray-800 rounded-2xl w-full max-w-2xl h-[90vh] max-h-[600px] overflow-hidden flex flex-col">
        <CardHeader className="bg-gray-800/50 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl">
              {getStepTitle()}
            </CardTitle>
            <Button
              onClick={onClose}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-pink-500 to-fuchsia-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-6">
          <div className="h-full overflow-y-auto">
            {renderStep()}
          </div>
        </CardContent>
        
        <div className="flex-shrink-0 p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex justify-between">
            {currentStep > 1 && (
              <Button
                onClick={handleBack}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-700 rounded-xl"
                disabled={isProcessing}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            {currentStep < totalSteps && (
              <Button
                onClick={handleNext}
                className="ml-auto bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 rounded-xl"
                disabled={!canProceed() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
