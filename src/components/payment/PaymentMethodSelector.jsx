import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Banknote, Coins, Shield, Clock } from 'lucide-react';

export default function PaymentMethodSelector({ onSelect, selected }) {
  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Credit Card',
      description: 'Pay securely with your credit or debit card',
      icon: CreditCard,
      color: 'blue',
      features: ['Instant payment', 'Secure processing', '3D Secure protection'],
      processingTime: 'Instant'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer to seller\'s account',
      icon: Banknote,
      color: 'green',
      features: ['Direct to seller', 'No fees', 'Bank-level security'],
      processingTime: '1-2 business days'
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Pay with Bitcoin, Ethereum, or other cryptocurrencies',
      icon: Coins,
      color: 'purple',
      features: ['Decentralized', 'Low fees', 'Global access'],
      processingTime: '10-30 minutes'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'border-blue-500 text-blue-400 hover:bg-blue-900/20',
      green: 'border-green-500 text-green-400 hover:bg-green-900/20',
      purple: 'border-purple-500 text-purple-400 hover:bg-purple-900/20'
    };
    return colors[color] || colors.blue;
  };

  const getSelectedColorClasses = (color) => {
    const colors = {
      blue: 'border-blue-500 bg-blue-900/20',
      green: 'border-green-500 bg-green-900/20',
      purple: 'border-purple-500 bg-purple-900/20'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Payment Method</h2>
        <p className="text-gray-400">Select how you would like to pay for this item.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.id;
          
          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? getSelectedColorClasses(method.color)
                  : `border-gray-700 bg-gray-800/50 hover:border-gray-600`
              }`}
              onClick={() => onSelect(method.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected 
                      ? 'bg-gray-700' 
                      : 'bg-gray-700/50'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isSelected 
                        ? getColorClasses(method.color).split(' ')[1]
                        : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {method.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        {method.processingTime}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 mb-3">
                      {method.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {method.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-md"
                        >
                          <Shield className="w-3 h-3" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-green-400 font-medium mb-1">Secure Payment</h3>
            <p className="text-gray-300 text-sm">
              All payment methods are secure and protected. Your payment information 
              is encrypted and processed safely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
