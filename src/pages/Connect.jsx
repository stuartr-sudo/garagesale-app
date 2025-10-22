import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, CheckCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Connect() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [bankDetails, setBankDetails] = useState({
    account_name: '',
    bsb: '',
    account_number: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Load existing bank details if available
      if (currentUser.bank_account_name) {
        setBankDetails({
          account_name: currentUser.bank_account_name || '',
          bsb: currentUser.bank_bsb || '',
          account_number: currentUser.bank_account_number || '',
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast({
        title: "Error",
        description: "Failed to load your details. Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    // Format BSB as XXX-XXX
    if (field === 'bsb') {
      value = value.replace(/\D/g, '').slice(0, 6);
      if (value.length > 3) {
        value = value.slice(0, 3) + '-' + value.slice(3);
      }
    }
    
    // Remove non-digits from account number
    if (field === 'account_number') {
      value = value.replace(/\D/g, '').slice(0, 9);
    }
    
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validation
    if (!bankDetails.account_name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the account name.",
        variant: "destructive"
      });
      return;
    }
    
    const bsbClean = bankDetails.bsb.replace(/\D/g, '');
    if (bsbClean.length !== 6) {
      toast({
        title: "Invalid BSB",
        description: "BSB must be 6 digits (e.g., 062-000).",
        variant: "destructive"
      });
      return;
    }
    
    if (bankDetails.account_number.length < 6 || bankDetails.account_number.length > 9) {
      toast({
        title: "Invalid Account Number",
        description: "Account number must be between 6-9 digits.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await User.updateMyUserData({
        bank_account_name: bankDetails.account_name,
        bank_bsb: bankDetails.bsb,
        bank_account_number: bankDetails.account_number,
      });
      
      toast({
        title: "Success!",
        description: "Your bank account details have been saved.",
      });
      
      // Reload user data
      await fetchData();
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast({
        title: "Error",
        description: "Failed to save your bank details. Please try again.",
        variant: "destructive"
      });
    }
    setSaving(false);
  };
  
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center bg-slate-800">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const hasCompleteBankDetails = user?.bank_account_name && user?.bank_bsb && user?.bank_account_number;

  return (
    <div className="min-h-screen bg-slate-800 text-gray-200">
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Seller Hub</h1>
            <p className="text-base md:text-lg text-gray-400">Manage your payments and seller profile</p>
          </div>
          
          <div className="bg-slate-700/80 backdrop-blur-sm shadow-xl border border-slate-600 rounded-2xl p-8">
            {hasCompleteBankDetails ? (
              <Card className="bg-slate-600 border-slate-500">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mb-4 border-2 border-green-500">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <CardTitle className="text-2xl text-white text-center">Bank Account Connected</CardTitle>
                  <CardDescription className="text-gray-400 text-center">
                    Your Australian bank account is set up and ready to receive payments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-700/50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Account Name:</span>
                      <span className="text-white font-medium">{user.bank_account_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">BSB:</span>
                      <span className="text-white font-medium">{user.bank_bsb}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Account Number:</span>
                      <span className="text-white font-medium">***{user.bank_account_number.slice(-3)}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white border-slate-500"
                  >
                    Update Details
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-600 border-slate-500">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-fuchsia-600/20 rounded-full flex items-center justify-center mb-4 border-2 border-fuchsia-500">
                    <Building2 className="w-8 h-8 text-fuchsia-400" />
                  </div>
                  <CardTitle className="text-2xl text-white text-center">Add Australian Bank Account</CardTitle>
                  <CardDescription className="text-gray-400 text-center">
                    Enter your Australian bank details to receive payments from buyers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="account_name" className="text-gray-300">
                      Account Name *
                    </Label>
                    <Input
                      id="account_name"
                      value={bankDetails.account_name}
                      onChange={(e) => handleInputChange('account_name', e.target.value)}
                      placeholder="John Smith"
                      className="bg-gray-700 border-slate-500 text-white placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500">The name on your bank account</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bsb" className="text-gray-300">
                      BSB *
                    </Label>
                    <Input
                      id="bsb"
                      value={bankDetails.bsb}
                      onChange={(e) => handleInputChange('bsb', e.target.value)}
                      placeholder="062-000"
                      className="bg-gray-700 border-slate-500 text-white placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500">6-digit Bank-State-Branch number (e.g., 062-000)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number" className="text-gray-300">
                      Account Number *
                    </Label>
                    <Input
                      id="account_number"
                      value={bankDetails.account_number}
                      onChange={(e) => handleInputChange('account_number', e.target.value)}
                      placeholder="12345678"
                      className="bg-gray-700 border-slate-500 text-white placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500">6-9 digit account number</p>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white font-semibold shadow-lg h-12"
                  >
                    {saving ? 'Saving...' : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Bank Details
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="mt-8 p-4 bg-slate-700 rounded-2xl border border-slate-600">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-900/50 rounded-lg flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-white font-semibold">Secure & Private</p>
                <p className="text-xs text-gray-400">
                  Your bank details are encrypted and stored securely. They will only be shared with buyers who have confirmed a purchase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
