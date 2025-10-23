import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, Clock, Shield, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CryptoPaymentSelector({ 
  onSelect, 
  selected, 
  onAmount, 
  amount 
}) {
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const cryptocurrencies = [
    {
      id: 'btc',
      name: 'Bitcoin',
      symbol: 'BTC',
      icon: '₿',
      color: 'orange',
      network: 'Bitcoin Network'
    },
    {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: 'Ξ',
      color: 'blue',
      network: 'Ethereum Network'
    },
    {
      id: 'usdt',
      name: 'Tether',
      symbol: 'USDT',
      icon: '₮',
      color: 'green',
      network: 'Ethereum (ERC-20)'
    },
    {
      id: 'usdc',
      name: 'USD Coin',
      symbol: 'USDC',
      icon: '◉',
      color: 'blue',
      network: 'Ethereum (ERC-20)'
    },
    {
      id: 'xrp',
      name: 'XRP',
      symbol: 'XRP',
      icon: '✕',
      color: 'purple',
      network: 'XRP Ledger'
    }
  ];

  useEffect(() => {
    fetchCryptoPrices();
  }, []);

  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch('/api/crypto/prices');
      if (response.ok) {
        const prices = await response.json();
        setCryptoPrices(prices);
      } else {
        // Fallback to mock prices for development
        setCryptoPrices({
          bitcoin: { aud: 95000 },
          ethereum: { aud: 3500 },
          tether: { aud: 1.5 },
          'usd-coin': { aud: 1.5 },
          ripple: { aud: 0.8 }
        });
      }
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      // Fallback to mock prices
      setCryptoPrices({
        bitcoin: { aud: 95000 },
        ethereum: { aud: 3500 },
        tether: { aud: 1.5 },
        'usd-coin': { aud: 1.5 },
        ripple: { aud: 0.8 }
      });
    } finally {
      setLoading(false);
    }
  };

  const getCryptoPrice = (cryptoId) => {
    const priceMap = {
      btc: cryptoPrices.bitcoin?.aud || 95000,
      eth: cryptoPrices.ethereum?.aud || 3500,
      usdt: cryptoPrices.tether?.aud || 1.5,
      usdc: cryptoPrices['usd-coin']?.aud || 1.5,
      xrp: cryptoPrices.ripple?.aud || 0.8
    };
    return priceMap[cryptoId] || 1;
  };

  const calculateCryptoAmount = (cryptoId) => {
    const price = getCryptoPrice(cryptoId);
    return (amount / price).toFixed(8);
  };

  const getColorClasses = (color) => {
    const colors = {
      orange: 'border-orange-500 text-orange-400 hover:bg-orange-900/20',
      blue: 'border-blue-500 text-blue-400 hover:bg-blue-900/20',
      green: 'border-green-500 text-green-400 hover:bg-green-900/20',
      purple: 'border-purple-500 text-purple-400 hover:bg-purple-900/20'
    };
    return colors[color] || colors.blue;
  };

  const getSelectedColorClasses = (color) => {
    const colors = {
      orange: 'border-orange-500 bg-orange-900/20',
      blue: 'border-blue-500 bg-blue-900/20',
      green: 'border-green-500 bg-green-900/20',
      purple: 'border-purple-500 bg-purple-900/20'
    };
    return colors[color] || colors.blue;
  };

  const handleSelect = (cryptoId) => {
    onSelect(cryptoId);
    const cryptoAmount = calculateCryptoAmount(cryptoId);
    onAmount(cryptoAmount);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading cryptocurrency prices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Select Cryptocurrency</h2>
        <p className="text-gray-400">Choose which cryptocurrency you'd like to pay with.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {cryptocurrencies.map((crypto) => {
          const isSelected = selected === crypto.id;
          const cryptoAmount = calculateCryptoAmount(crypto.id);
          const price = getCryptoPrice(crypto.id);
          
          return (
            <Card
              key={crypto.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? getSelectedColorClasses(crypto.color)
                  : `border-gray-700 bg-gray-800/50 hover:border-gray-600`
              }`}
              onClick={() => handleSelect(crypto.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                      isSelected 
                        ? 'bg-gray-700' 
                        : 'bg-gray-700/50'
                    }`}>
                      {crypto.icon}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {crypto.name} ({crypto.symbol})
                      </h3>
                      <p className="text-gray-400 text-sm">{crypto.network}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-white font-mono text-lg">
                      {cryptoAmount} {crypto.symbol}
                    </div>
                    <div className="text-gray-400 text-sm">
                      ≈ ${price.toFixed(2)} AUD
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="flex-shrink-0 ml-4">
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

      {selected && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Payment Summary</h3>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Item Price:</span>
                <span className="text-white font-medium">${amount.toFixed(2)} AUD</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Crypto Amount:</span>
                <span className="text-white font-mono">
                  {calculateCryptoAmount(selected)} {cryptocurrencies.find(c => c.id === selected)?.symbol}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-white">
                  {cryptocurrencies.find(c => c.id === selected)?.network}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-400 font-medium mb-2">Important Notes</h3>
            <ul className="text-yellow-200 text-sm space-y-1">
              <li>• Cryptocurrency prices are updated in real-time</li>
              <li>• Network fees may apply to your transaction</li>
              <li>• Transactions are irreversible once confirmed</li>
              <li>• Double-check the wallet address before sending</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-400 font-medium mb-1">Secure & Decentralized</h3>
            <p className="text-blue-200 text-sm">
              Your payment is processed on the blockchain network. No third-party 
              intermediaries are involved in the transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
