import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="text-center bg-gray-900 border border-gray-800 p-8 rounded-lg shadow-lg max-w-md">
        <CheckCircle className="w-16 h-16 text-lime-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-400 mb-6">
          Thank you for your purchase. A confirmation has been sent to your email. The seller will be in touch shortly.
        </p>
        <Button asChild>
          <Link to={createPageUrl('Store')}>
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}