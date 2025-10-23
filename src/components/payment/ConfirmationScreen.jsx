import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, MapPin, Mail, Clock, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function ConfirmationScreen({ 
  item, 
  paymentMethod, 
  collectionDate, 
  onComplete 
}) {
  const getPaymentMethodInfo = (method) => {
    const methods = {
      stripe: {
        name: 'Credit Card',
        icon: '💳',
        status: 'Completed',
        color: 'green'
      },
      bank_transfer: {
        name: 'Bank Transfer',
        icon: '🏦',
        status: 'Pending',
        color: 'yellow'
      },
      crypto: {
        name: 'Cryptocurrency',
        icon: '₿',
        status: 'Pending',
        color: 'blue'
      }
    };
    return methods[method] || methods.bank_transfer;
  };

  const paymentInfo = getPaymentMethodInfo(paymentMethod);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Payment Confirmed!</h2>
        <p className="text-gray-400">Your payment has been processed successfully.</p>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="text-gray-400">${item.price}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{paymentInfo.icon}</span>
                <div>
                  <p className="text-white font-medium">{paymentInfo.name}</p>
                  <p className={`text-sm ${
                    paymentInfo.color === 'green' ? 'text-green-400' :
                    paymentInfo.color === 'yellow' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`}>
                    {paymentInfo.status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Collection Details</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-400">Collection Date</p>
                <p className="text-white font-medium">
                  {collectionDate 
                    ? format(new Date(collectionDate), 'EEEE, MMMM d, yyyy \'at\' h:mm a')
                    : 'To be arranged with seller'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-400">Collection Address</p>
                <p className="text-white">
                  {item.collection_address || 'Address to be provided by seller'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-400">Confirmation Email</p>
                <p className="text-white">Sent to your registered email address</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-green-400 font-medium mb-2">What happens next?</h3>
            <ul className="text-green-200 text-sm space-y-1">
              <li>• You'll receive a confirmation email with all details</li>
              <li>• The seller will be notified of your payment</li>
              <li>• You'll get a reminder email 24 hours before collection</li>
              <li>• Bring a valid ID when collecting the item</li>
            </ul>
          </div>
        </div>
      </div>

      {paymentMethod === 'bank_transfer' && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-yellow-400 font-medium mb-2">Bank Transfer Processing</h3>
              <p className="text-yellow-200 text-sm">
                Your bank transfer may take 1-2 business days to process. 
                The seller will confirm receipt once the funds are received.
              </p>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === 'crypto' && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-blue-400 font-medium mb-2">Cryptocurrency Verification</h3>
              <p className="text-blue-200 text-sm">
                Your cryptocurrency transaction is being verified on the blockchain. 
                This typically takes 10-30 minutes. You'll be notified once confirmed.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button
          onClick={onComplete}
          className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 rounded-xl px-8"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Purchase
        </Button>
      </div>
    </div>
  );
}
