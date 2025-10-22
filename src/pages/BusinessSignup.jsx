import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@/api/entities';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { Store, ArrowRight, Building, CheckCircle, Users, Shield, Sparkles, Globe } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, highlight = false }) => (
  <div className={`p-8 rounded-2xl shadow-lg border text-center transform hover:-translate-y-2 transition-transform duration-300 ${
    highlight ? 'bg-gradient-to-br from-pink-900/50 to-fuchsia-900/50 border-pink-700' : 'bg-gray-800/80 border-gray-700'
  }`}>
    <div className={`inline-block p-4 rounded-2xl mb-6 ${
      highlight ? 'bg-gradient-to-r from-pink-600 to-fuchsia-600' : 'bg-gradient-to-r from-pink-900 to-fuchsia-900'
    }`}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

const PricingCard = ({ title, price, features, popular = false, ctaText, onAction }) => (
  <div className={`relative p-8 rounded-2xl shadow-xl border transition-all duration-300 hover:shadow-2xl ${
    popular 
      ? 'bg-gradient-to-br from-pink-900/50 to-fuchsia-900/50 border-pink-600 transform scale-105' 
      : 'bg-gray-900/80 border-gray-700'
  }`}>
    {popular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <Badge className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white px-4 py-1 font-semibold">
          Most Popular
        </Badge>
      </div>
    )}
    
    <div className="text-center mb-8">
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold text-white">{price}</span>
      </div>
    </div>
    
    <ul className="space-y-4 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-gray-300">{feature}</span>
        </li>
      ))}
    </ul>
    
    <Button
      onClick={onAction}
      className={`w-full h-12 rounded-xl font-semibold transition-all duration-300 ${
        popular
          ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 shadow-lg hover:shadow-xl'
          : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
      }`}
    >
      {ctaText}
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </div>
);

export default function BusinessSignup() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogin = async () => {
    // TEMPORARILY: Skip OAuth and go directly to marketplace
    navigate(createPageUrl('Marketplace'));
  };

  const handleStartBusinessOnboarding = () => {
    // TEMPORARILY: Skip onboarding and go directly to marketplace
    navigate(createPageUrl('Marketplace'));
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200 overflow-x-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to={createPageUrl("Home")} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-xl md:text-2xl text-white">GarageSale</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Home")} className="text-gray-400 hover:text-white transition-colors">
              Personal Account
            </Link>
            {currentUser ? (
              <Button asChild className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                <Link to={createPageUrl('Marketplace')}>
                  Go to Marketplace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={handleLogin}
                  className="text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  Log In
                </Button>
                <Button
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                >
                  Sign Up
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 md:pt-48 pb-24 md:pb-32 text-center">
        <div className="absolute inset-0 bg-grid-gray-800 [mask-image:linear-gradient(to_bottom,black,transparent)]"></div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 relative">
          <Badge className="bg-orange-900/50 text-orange-300 border-orange-700 mb-4 px-4 py-1">
            <Building className="w-4 h-4 mr-2" />
            For Businesses
          </Badge>
          <h2 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
            Grow Your Business with{' '}
            <span className="bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
              GarageSale
            </span>
          </h2>
          <p className="mt-6 text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
            Join thousands of local businesses using GarageSale to reach customers, 
            manage inventory, and grow their community presence. Professional tools designed for success.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              onClick={currentUser ? handleStartBusinessOnboarding : handleLogin}
              className="h-14 px-8 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl text-lg font-semibold transform hover:scale-105"
            >
              {currentUser ? 'Set Up Business Account' : 'Start Free Business Account'}
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features for Businesses */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-gray-900 to-gray-950/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <Badge className="bg-pink-900/50 text-pink-300 border-pink-700 mb-4 px-4 py-1">
              Business Features
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">Everything Your Business Needs</h3>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              Professional tools and features designed specifically for business success on the local marketplace
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Shield}
              title="Business Verification"
              description="Get verified business badge and appear higher in search results. Build trust with customers through official verification."
              highlight={true}
            />
            <FeatureCard
              icon={Sparkles}
              title="Professional Listings"
              description="Enhanced listing tools with bulk upload, inventory management, and professional business profile page."
            />
            <FeatureCard
              icon={Users}
              title="Customer Management"
              description="Track customer interactions, manage orders, and build lasting relationships with your local community."
            />
            <FeatureCard
              icon={Globe}
              title="Multi-Location Support"
              description="Manage multiple business locations, set different operating hours, and serve customers across your area."
            />
            <FeatureCard
              icon={Building}
              title="Business Analytics"
              description="Detailed insights into your sales, customer behavior, and market trends to grow your business smarter."
            />
            <FeatureCard
              icon={Store}
              title="Storefront Customization"
              description="Create a professional business storefront with your branding, logo, and custom business information."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-gray-950/50 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">Simple, Transparent Pricing</h3>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your business needs. All plans include our core marketplace features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              title="Starter"
              price="Free"
              features={[
                "Up to 25 active listings",
                "Basic business profile",
                "Community marketplace access",
                "Standard customer support",
                "Basic analytics"
              ]}
              ctaText="Get Started Free"
              onAction={currentUser ? handleStartBusinessOnboarding : handleLogin}
            />
            
            <PricingCard
              title="Professional"
              price="$29/mo"
              popular={true}
              features={[
                "Unlimited listings",
                "Verified business badge",
                "Priority placement in search",
                "Advanced analytics & insights",
                "Priority customer support",
                "Custom business storefront",
                "Bulk listing tools"
              ]}
              ctaText="Start 14-Day Free Trial"
              onAction={currentUser ? handleStartBusinessOnboarding : handleLogin}
            />
            
            <PricingCard
              title="Enterprise"
              price="$99/mo"
              features={[
                "Everything in Professional",
                "Multi-location management",
                "API access",
                "Custom integrations",
                "Dedicated account manager",
                "White-label options",
                "Advanced reporting"
              ]}
              ctaText="Contact Sales"
              onAction={() => window.location.href = createPageUrl('Contact')}
            />
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-400">
              All plans include secure payments, mobile optimization, and access to our growing local community.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24 bg-gradient-to-r from-pink-900/20 via-fuchsia-900/20 to-gray-900/20">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-6">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Grow Your Business?</h3>
          <p className="text-lg text-gray-400 mb-10">
            Join the local marketplace revolution. Set up your business account in minutes and start reaching more customers today.
          </p>
          <Button
            size="lg"
            onClick={currentUser ? handleStartBusinessOnboarding : handleLogin}
            className="h-14 px-8 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl text-lg font-semibold transform hover:scale-105"
          >
            {currentUser ? 'Complete Business Setup' : 'Create Business Account'}
            <ArrowRight className="w-5 h-5 ml-3" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-xl flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-xl">GarageSale</h3>
              </div>
              <p className="text-sm text-gray-400">Empowering local businesses to thrive.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Businesses</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <Link to={createPageUrl("BusinessSignup")} className="block hover:text-white transition-colors">Business Signup</Link>
                <Link to={createPageUrl("Pricing")} className="block hover:text-white transition-colors">Pricing</Link>
                <Link to={createPageUrl("Features")} className="block hover:text-white transition-colors">Features</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <Link to={createPageUrl("Contact")} className="block hover:text-white transition-colors">Contact Us</Link>
                <a href="mailto:business@garagesale.app" className="block hover:text-white transition-colors">Business Support</a>
                <a href="tel:+15551234567" className="block hover:text-white transition-colors">Phone Support</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <Link to={createPageUrl("Privacy")} className="block hover:text-white transition-colors">Privacy Policy</Link>
                <Link to={createPageUrl("Terms")} className="block hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} GarageSale Business. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}