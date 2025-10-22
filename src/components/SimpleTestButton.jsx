import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function SimpleTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSimpleTest = async () => {
    setIsLoading(true);
    try {
      console.log('Testing simple Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('test-simple', {
        body: { test: true }
      });

      if (error) {
        console.error('Simple test error:', error);
        toast({
          title: "Error",
          description: `Simple test failed: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Simple test success:', data);
        toast({
          title: "Success",
          description: `Simple test passed! Environment check: ${JSON.stringify(data.environment)}`,
        });
      }
    } catch (err) {
      console.error("Simple test failed:", err);
      toast({
        title: "Error",
        description: `Unexpected error: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-800 border-gray-700">
      <h3 className="text-lg font-semibold text-white">Simple Edge Function Test</h3>
      <p className="text-sm text-gray-400">
        This tests if Edge Functions are working and checks environment variables.
      </p>
      <Button 
        onClick={handleSimpleTest} 
        disabled={isLoading} 
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {isLoading ? 'Testing...' : 'Test Simple Function'}
      </Button>
    </div>
  );
}
