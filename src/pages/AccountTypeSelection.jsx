import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserEntity } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Building, ArrowRight } from 'lucide-react';

const SelectionCard = ({ icon: Icon, title, description, onSelect }) => (
  <Card 
    className="bg-gray-900/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-800 rounded-2xl text-center p-8 flex flex-col items-center hover:border-pink-500 cursor-pointer group"
    onClick={onSelect}
  >
    <div className="w-20 h-20 bg-gradient-to-br from-pink-900/50 to-fuchsia-900/50 rounded-2xl flex items-center justify-center mb-6 border border-gray-700 group-hover:border-pink-700 transition-colors">
      <Icon className="w-10 h-10 text-pink-400" />
    </div>
    <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400 mb-6 flex-grow">{description}</p>
    <Button variant="outline" className="w-full bg-gray-800 border-gray-700 group-hover:bg-pink-600 group-hover:text-white group-hover:border-pink-600 transition-all">
      Continue as {title}
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </Card>
);

export default function AccountTypeSelection() {
  const navigate = useNavigate();

  const handleSelect = async (accountType) => {
    try {
      console.log('Setting account type:', accountType);
      const result = await UserEntity.updateMyUserData({ account_type: accountType });
      console.log('Account type set successfully:', result);
      
      if (accountType === 'individual') {
        navigate(createPageUrl('Onboarding'));
      } else {
        navigate(createPageUrl('BusinessOnboarding'));
      }
    } catch (error) {
      console.error("Error setting account type:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      alert(`Could not set account type. Please try again.\n\nError: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to GarageSale!</h1>
          <p className="text-lg text-gray-400">To get started, please tell us what kind of account you'd like to create.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <SelectionCard 
            icon={User}
            title="An Individual"
            description="Perfect for selling personal items from around your home, finding great local deals, and connecting with your community."
            onSelect={() => handleSelect('individual')}
          />
          <SelectionCard 
            icon={Building}
            title="A Business"
            description="For professional sellers, local shops, and service providers who need advanced tools to manage listings and reach more customers."
            onSelect={() => handleSelect('business')}
          />
        </div>

        <div className="text-center mt-12">
            <p className="text-gray-500 text-sm">You can change this later in your account settings.</p>
        </div>
      </div>
    </div>
  );
}