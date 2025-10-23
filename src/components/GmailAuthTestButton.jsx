import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function GmailAuthTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGmailAuthTest = async () => {
    setIsLoading(true);
    try {
      console.log('Testing Gmail OAuth credentials...');
      
      const { data, error } = await supabase.functions.invoke('test-gmail-auth', {
        body: { test: true }
      });

      if (error) {
        console.error('Gmail auth test error:', error);
        toast({
          title: "Gmail OAuth Test Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Gmail auth test success:', data);
        toast({
          title: "Gmail OAuth Test Passed!",
          description: `Email: ${data.details?.email || 'Unknown'}`,
        });
      }
    } catch (err) {
      console.error("Gmail auth test failed:", err);
      toast({
        title: "Gmail OAuth Test Failed",
        description: `Unexpected error: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-800 border-gray-700">
      <h3 className="text-lg font-semibold text-white">Gmail OAuth Test</h3>
      <p className="text-sm text-gray-400">
        Tests if Gmail OAuth credentials are valid and working.
      </p>
      <Button 
        onClick={handleGmailAuthTest} 
        disabled={isLoading} 
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        {isLoading ? 'Testing OAuth...' : 'Test Gmail OAuth'}
      </Button>
    </div>
  );
}
