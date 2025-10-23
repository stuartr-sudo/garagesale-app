import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  CreditCard, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Banknote,
  Building2
} from 'lucide-react';

const PaymentTypeCard = ({ icon: Icon, title, description, isSelected, onSelect }) => (
  <Card 
    className={`cursor-pointer transition-all duration-300 ${
      isSelected 
        ? 'border-pink-500 bg-pink-900/20 shadow-lg' 
        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
    }`}
    onClick={onSelect}
  >
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          isSelected ? 'bg-pink-500' : 'bg-gray-700'
        }`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
        {isSelected && (
          <CheckCircle className="w-5 h-5 text-pink-400" />
        )}
      </div>
    </CardContent>
  </Card>
);

export default function PaymentOptionsWizard({ onComplete, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentType, setPaymentType] = useState('');
  const [formData, setFormData] = useState({
    // Cash payment data
    cashAmount: '',
    cashNotes: '',
    
    // Bank account data
    accountName: '',
    bsb: '',
    accountNumber: '',
    bankName: '',
    accountType: 'savings'
  });

  const handlePaymentTypeSelect = (type) => {
    setPaymentType(type);
    setCurrentStep(2);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setPaymentType('');
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handleNext = () => {
    if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const paymentData = {
      type: paymentType,
      ...formData
    };
    onComplete(paymentData);
  };

  const validateStep2 = () => {
    if (paymentType === 'cash') {
      return formData.cashAmount && formData.cashAmount > 0;
    } else if (paymentType === 'bank') {
      return formData.accountName && formData.bsb && formData.accountNumber && formData.bankName;
    }
    return false;
  };

  const validateStep3 = () => {
    // Additional validation for step 3 if needed
    return true;
  };

  const canProceed = () => {
    if (currentStep === 2) return validateStep2();
    if (currentStep === 3) return validateStep3();
    return false;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step <= currentStep 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-1 mx-2 ${
                  step < currentStep ? 'bg-pink-500' : 'bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            Step {currentStep} of 3: {
              currentStep === 1 ? 'Choose Payment Method' :
              currentStep === 2 ? 'Enter Payment Details' :
              'Review & Confirm'
            }
          </p>
        </div>
      </div>

      {/* Step 1: Payment Type Selection */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Choose Payment Method</h2>
            <p className="text-gray-400">How would you like to receive payment?</p>
          </div>

          <div className="space-y-4">
            <PaymentTypeCard
              icon={Banknote}
              title="Cash Payment"
              description="Receive payment in cash during pickup or delivery"
              isSelected={paymentType === 'cash'}
              onSelect={() => handlePaymentTypeSelect('cash')}
            />

            <PaymentTypeCard
              icon={Building2}
              title="Bank Transfer"
              description="Receive payment directly to your bank account"
              isSelected={paymentType === 'bank'}
              onSelect={() => handlePaymentTypeSelect('bank')}
            />
          </div>
        </div>
      )}

      {/* Step 2: Payment Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              {paymentType === 'cash' ? 'Cash Payment Details' : 'Bank Account Details'}
            </h2>
            <p className="text-gray-400">
              {paymentType === 'cash' 
                ? 'Enter the cash amount and any notes' 
                : 'Enter your bank account information'
              }
            </p>
          </div>

          {paymentType === 'cash' ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label htmlFor="cashAmount" className="text-white font-medium mb-2 block">
                    Cash Amount ($)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="cashAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cashAmount}
                      onChange={(e) => handleInputChange('cashAmount', e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cashNotes" className="text-white font-medium mb-2 block">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="cashNotes"
                    value={formData.cashNotes}
                    onChange={(e) => handleInputChange('cashNotes', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Any special instructions for cash payment..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="accountName" className="text-white font-medium mb-2 block">
                      Account Name
                    </Label>
                    <Input
                      id="accountName"
                      value={formData.accountName}
                      onChange={(e) => handleInputChange('accountName', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bankName" className="text-white font-medium mb-2 block">
                      Bank Name
                    </Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Commonwealth Bank"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="bsb" className="text-white font-medium mb-2 block">
                      BSB
                    </Label>
                    <Input
                      id="bsb"
                      value={formData.bsb}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        if (value.length > 3) {
                          value = value.slice(0, 3) + '-' + value.slice(3);
                        }
                        handleInputChange('bsb', value);
                      }}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="062-000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountNumber" className="text-white font-medium mb-2 block">
                      Account Number
                    </Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/\D/g, '').slice(0, 9))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="12345678"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accountType" className="text-white font-medium mb-2 block">
                    Account Type
                  </Label>
                  <select
                    id="accountType"
                    value={formData.accountType}
                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 3: Review & Confirm */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Review Payment Details</h2>
            <p className="text-gray-400">Please review your payment information before confirming</p>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {paymentType === 'cash' ? <Banknote className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                {paymentType === 'cash' ? 'Cash Payment' : 'Bank Transfer'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentType === 'cash' ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white font-semibold">${formData.cashAmount}</span>
                  </div>
                  {formData.cashNotes && (
                    <div>
                      <span className="text-gray-400">Notes:</span>
                      <p className="text-white mt-1">{formData.cashNotes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Name:</span>
                    <span className="text-white">{formData.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bank:</span>
                    <span className="text-white">{formData.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">BSB:</span>
                    <span className="text-white">{formData.bsb}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Number:</span>
                    <span className="text-white">{formData.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Type:</span>
                    <Badge variant="outline" className="text-white border-gray-600">
                      {formData.accountType}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          onClick={currentStep === 1 ? onCancel : handleBack}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>

        {currentStep < 3 && (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {currentStep === 3 && (
          <Button
            onClick={handleSubmit}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Payment Method
          </Button>
        )}
      </div>
    </div>
  );
}
