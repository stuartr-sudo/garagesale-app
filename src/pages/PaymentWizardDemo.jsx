import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, DollarSign, Building2 } from 'lucide-react';
import PaymentOptionsWizard from '@/components/payment/PaymentOptionsWizard';

export default function PaymentWizardDemo() {
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(null);

  const handlePaymentComplete = (paymentData) => {
    setCompletedPayment(paymentData);
    setShowWizard(false);
  };

  const handleCancel = () => {
    setShowWizard(false);
  };

  const resetDemo = () => {
    setCompletedPayment(null);
    setShowWizard(false);
  };

  if (showWizard) {
    return (
      <div className="min-h-screen bg-slate-950 text-gray-200 p-6">
        <PaymentOptionsWizard
          onComplete={handlePaymentComplete}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="mb-6 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-4xl font-bold text-white mb-4">Payment Options Wizard</h1>
          <p className="text-lg text-gray-400">
            A step-by-step wizard for setting up payment methods, asking first if it's cash or bank account.
          </p>
        </div>

        {/* Demo Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-pink-400" />
                Payment Wizard Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                This wizard guides users through setting up their payment preferences with a clear step-by-step process.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Step 1: Choose between Cash or Bank Transfer</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Step 2: Enter payment details</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Step 3: Review and confirm</span>
                </div>
              </div>

              <Button
                onClick={() => setShowWizard(true)}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white"
              >
                Try Payment Wizard
              </Button>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Payment Type Selection</h4>
                    <p className="text-gray-400 text-sm">Clear choice between cash and bank transfer</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Dynamic Forms</h4>
                    <p className="text-gray-400 text-sm">Forms adapt based on payment type selection</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Validation</h4>
                    <p className="text-gray-400 text-sm">Real-time validation for all input fields</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Review Step</h4>
                    <p className="text-gray-400 text-sm">Final confirmation before submission</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completed Payment Display */}
        {completedPayment && (
          <Card className="mt-8 bg-green-900/20 border-green-500">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Payment Method Configured
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {completedPayment.type === 'cash' ? (
                    <DollarSign className="w-5 h-5 text-green-400" />
                  ) : (
                    <Building2 className="w-5 h-5 text-green-400" />
                  )}
                  <div>
                    <h4 className="text-white font-semibold">
                      {completedPayment.type === 'cash' ? 'Cash Payment' : 'Bank Transfer'}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Payment method has been successfully configured
                    </p>
                  </div>
                </div>

                {completedPayment.type === 'cash' ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-semibold">${completedPayment.cashAmount}</span>
                    </div>
                    {completedPayment.cashNotes && (
                      <div>
                        <span className="text-gray-400">Notes:</span>
                        <p className="text-white mt-1">{completedPayment.cashNotes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account:</span>
                      <span className="text-white">{completedPayment.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bank:</span>
                      <span className="text-white">{completedPayment.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">BSB:</span>
                      <span className="text-white">{completedPayment.bsb}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Number:</span>
                      <span className="text-white">{completedPayment.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <Badge variant="outline" className="text-white border-gray-600">
                        {completedPayment.accountType}
                      </Badge>
                    </div>
                  </div>
                )}

                <Button
                  onClick={resetDemo}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
