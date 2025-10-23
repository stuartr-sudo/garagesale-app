import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function ResendConfigTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConfigTest = async () => {
    setIsLoading(true);
    try {
      console.log('Testing Resend configuration...');
      
      const { data, error } = await supabase.functions.invoke('test-resend-config', {
        body: { test: true }
      });

      if (error) {
        console.error('Resend config test error:', error);
        toast({
          title: "Resend Config Test Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Resend config test success:', data);
        toast({
          title: "Resend Config Test Passed!",
          description: `API Key: ${data.details?.apiKeyLength || 0} chars, From: ${data.details?.fromEmail || 'Not set'}`,
        });
      }
    } catch (err) {
      console.error("Resend config test failed:", err);
      toast({
        title: "Resend Config Test Failed",
        description: `Unexpected error: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-800 border-gray-700">
      <h3 className="text-lg font-semibold text-white">Resend Config Test</h3>
      <p className="text-sm text-gray-400">
        Tests if Resend API key is configured and valid.
      </p>
      <Button 
        onClick={handleConfigTest} 
        disabled={isLoading} 
        className="bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {isLoading ? 'Testing Config...' : 'Test Resend Config'}
      </Button>
    </div>
  );
}
