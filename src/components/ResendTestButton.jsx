import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function ResendTestButton() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleResendTest = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Testing Resend email function...');
      
      const { data, error } = await supabase.functions.invoke('send-resend', {
        body: { 
          to: email,
          subject: 'GarageSale Test Email - Resend Success!',
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #28a745;">Hello from GarageSale!</h1>
              <p>This is a test email sent to <strong>${email}</strong> using Resend email service.</p>
              <p>If you received this, your Resend integration with Supabase Edge Functions is working perfectly!</p>
              <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">✅ Resend Integration Successful!</h3>
                <ul style="color: #6c757d;">
                  <li>Edge Function deployed correctly</li>
                  <li>Resend API key configured</li>
                  <li>Email delivery working</li>
                </ul>
              </div>
              <p style="color: #6c757d; font-size: 0.9em;">The GarageSale Team</p>
            </div>
          `,
          text: `Hello from GarageSale!\nThis is a test email sent to ${email} using Resend email service.\nIf you received this, your Resend integration with Supabase Edge Functions is working perfectly!\n✅ Resend Integration Successful!\n- Edge Function deployed correctly\n- Resend API key configured\n- Email delivery working\n\nThe GarageSale Team`
        }
      });

      if (error) {
        console.error('Resend test error:', error);
        toast({
          title: "Resend Test Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Resend test success:', data);
        toast({
          title: "Resend Test Successful!",
          description: `Email sent to ${email}. Check your inbox!`,
        });
      }
    } catch (err) {
      console.error("Resend test failed:", err);
      toast({
        title: "Resend Test Failed",
        description: `Unexpected error: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-800 border-gray-700">
      <h3 className="text-lg font-semibold text-white">Resend Email Test</h3>
      <p className="text-sm text-gray-400">
        Test email sending using Resend (much simpler than Gmail OAuth).
      </p>
      <Input
        type="email"
        placeholder="Enter recipient email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
      />
      <Button 
        onClick={handleResendTest} 
        disabled={isLoading} 
        className="bg-orange-600 hover:bg-orange-700 text-white"
      >
        {isLoading ? 'Sending via Resend...' : 'Test Resend Email'}
      </Button>
    </div>
  );
}
