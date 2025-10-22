import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@/api/entities';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { Store, ArrowRight, Camera, DollarSign, Users, Sparkles, ShoppingCart, Search, MapPin, Shield, Zap, Clock, Star, CheckCircle, Phone, MessageSquare } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, highlight = false, benefits = [] }) => (
  <div className={`p-8 rounded-2xl shadow-lg border text-left transform hover:-translate-y-2 transition-transform duration-300 ${
    highlight ? 'bg-gradient-to-br from-pink-900/50 to-fuchsia-900/50 border-pink-700' : 'bg-slate-600/80 border-slate-500'
  }`}>
    <div className={`inline-block p-4 rounded-2xl mb-6 ${
      highlight ? 'bg-gradient-to-r from-pink-600 to-fuchsia-600' : 'bg-gradient-to-r from-pink-900 to-fuchsia-900'
    }`}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
    <p className="text-gray-400 mb-4 leading-relaxed">{description}</p>
    {benefits.length > 0 && (
      <ul className="space-y-2">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const StepCard = ({ number, icon: Icon, title, description, details }) => (
  <div className="relative">
    <div className="bg-slate-600/80 border border-slate-500 rounded-2xl p-8 text-center hover:border-pink-700 transition-colors duration-300">
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {number}
        </div>
      </div>
      <div className="bg-gradient-to-r from-pink-900/50 to-fuchsia-900/50 p-4 rounded-2xl mb-6 inline-block">
        <Icon className="w-10 h-10 text-pink-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-400 mb-4 leading-relaxed">{description}</p>
      <div className="space-y-2">
        {details.map((detail, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-gray-300 justify-center">
            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
            <span>{detail}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TestimonialCard = ({ name, role, content, rating = 5 }) => (
  <div className="bg-slate-600/80 border border-slate-500 rounded-2xl p-6">
    <div className="flex items-center gap-1 mb-4">
      {[...Array(rating)].map((_, i) => (
        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
      ))}
    </div>
    <p className="text-gray-300 mb-4 italic">"{content}"</p>
    <div>
      <div className="font-semibold text-white">{name}</div>
      <div className="text-sm text-gray-400">{role}</div>
    </div>
  </div>
);

export default function HomePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
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
    fetchUser();
  }, []);

  const handleAuthAction = (destinationPage) => {
    navigate(createPageUrl(destinationPage));
  };

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
          <div className="flex items-center gap-2 md:gap-4">
            {loading ? (
              <div className="animate-pulse flex gap-2">
                <div className="h-10 w-20 bg-gray-700 rounded"></div>
                <div className="h-10 w-32 bg-gray-700 rounded"></div>
              </div>
            ) : currentUser ? (
              // User is logged in - show Dashboard button
              <Button
                onClick={() => handleAuthAction('Marketplace')}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2 hidden md:inline" />
              </Button>
            ) : (
              // User is not logged in - show Login and Get Started buttons
              <>
                <Button
                  variant="ghost"
                  onClick={() => handleAuthAction('SignIn')}
                  className="text-gray-400 hover:bg-slate-600 hover:text-white"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => handleAuthAction('SignIn')}
                  className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2 hidden md:inline" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 md:pt-48 pb-24 md:pb-32 text-center">
        <div className="absolute inset-0 bg-grid-gray-800 [mask-image:linear-gradient(to_bottom,black,transparent)]"></div>
        <div className="max-w-5xl mx-auto px-4 md:px-6 relative">
            <Badge className="bg-cyan-900/50 text-cyan-300 border-cyan-700 mb-6 px-6 py-2 text-lg">
                🎯 The #1 Local Marketplace Platform
            </Badge>
          <h2 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
            Sell Anything, <span className="bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent">Anywhere</span>, Instantly
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed">
            The smartest way to turn your unwanted items into cash. Just snap a photo, and our AI handles the rest - from writing compelling descriptions to connecting you with eager local buyers.
          </p>
          
          {/* Key Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-10 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Average sale in 3.2 days</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">$0 listing fees forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">Secure Stripe payments</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => handleAuthAction('AccountTypeSelection')}
              className="h-16 px-10 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl text-xl font-semibold transform hover:scale-105"
            >
              Start Selling Now - 100% Free
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleAuthAction('Marketplace')}
              className="h-16 px-10 bg-slate-600/50 border-slate-500 hover:bg-gray-700 text-white rounded-2xl text-xl"
            >
              Browse Marketplace
              <Search className="w-6 h-6 ml-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-gray-900/70 to-gray-950/70 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-900/10 via-fuchsia-900/10 to-gray-900/10"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
          <div className="text-center mb-20">
            <h3 className="text-4xl md:text-6xl font-bold text-white mb-6">How It Actually Works</h3>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
              We've made selling so simple, you'll wonder why other platforms make it so complicated.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <StepCard 
              number="1"
              icon={Camera} 
              title="Snap & Upload"
              description="Take a photo with your phone and set your asking price. That's literally it."
              details={[
                "AI auto-generates compelling titles",
                "Smart category suggestions", 
                "Optimized descriptions for faster sales",
                "Multiple photos supported"
              ]}
            />
            <StepCard 
              number="2"
              icon={Users} 
              title="Get Discovered"
              description="Your item appears instantly on our local marketplace where motivated buyers are actively searching."
              details={[
                "Location-based visibility",
                "Smart search algorithms",
                "Push notifications to interested buyers",
                "Social sharing tools"
              ]}
            />
            <StepCard 
              number="3"
              icon={DollarSign} 
              title="Get Paid"
              description="Buyers pay securely online through Stripe. You coordinate pickup and keep 100% of the sale price."
              details={[
                "Secure payment processing",
                "No hidden fees or commissions",
                "Instant buyer contact details",
                "Built-in messaging system"
              ]}
            />
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Why GarageSale Beats Everything Else</h3>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              We've taken everything that's broken about online selling and fixed it.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
                icon={Sparkles} 
                title="AI That Actually Helps" 
                description="Forget writing listings from scratch. Our AI creates compelling titles, detailed descriptions, and strategic tags that get your items sold faster."
                benefits={[
                  "Professional-quality descriptions in seconds",
                  "SEO-optimized for maximum visibility",
                  "Price suggestions based on market data",
                  "Category auto-detection"
                ]}
            />
            <FeatureCard 
                icon={MapPin} 
                title="Hyper-Local Focus" 
                description="No shipping headaches. No packaging. No waiting for payments to clear. Everything happens locally, in person, with immediate gratification."
                highlight={true}
                benefits={[
                  "Find buyers within walking distance",
                  "Meet at safe public locations",
                  "Instant cash transactions",
                  "Build local community connections"
                ]}
            />
            <FeatureCard 
                icon={Shield} 
                title="Actually Secure" 
                description="Stripe processes all payments before meetup. Buyers and sellers are verified. Every transaction is protected and tracked."
                benefits={[
                  "Payment guaranteed before pickup",
                  "Identity verification for all users",
                  "Transaction dispute protection",
                  "Secure messaging system"
                ]}
            />
            <FeatureCard 
                icon={Zap} 
                title="Ridiculously Fast" 
                description="Most items sell within 72 hours. Our smart algorithms show your items to the right buyers at the right time."
                benefits={[
                  "Instant listing publication",
                  "Real-time buyer notifications",
                  "Smart pricing recommendations",
                  "Automatic item promotion"
                ]}
            />
            <FeatureCard 
                icon={Phone} 
                title="Mobile-First Design" 
                description="Built for smartphones because that's how people actually sell and buy. Take photos, list items, and communicate - all from your phone."
                benefits={[
                  "One-tap photo listing",
                  "Push notification alerts",
                  "GPS-based local discovery",
                  "Integrated camera tools"
                ]}
            />
            <FeatureCard 
                icon={DollarSign} 
                title="Keep Every Penny" 
                description="Zero listing fees. Zero selling fees. Zero hidden costs. We make money by helping businesses advertise - you keep 100% of your sales."
                benefits={[
                  "No upfront costs to list",
                  "No commissions on sales",
                  "No payment processing fees",
                  "Completely free forever"
                ]}
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-24 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">What People Are Saying</h3>
            <p className="text-xl text-gray-400">Real sellers, real results, real fast.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              name="Sarah Chen"
              role="Busy Mom, Seattle"
              content="I sold my kids' outgrown toys in 2 days and made $340! The AI wrote better descriptions than I ever could. This is the future of selling stuff."
              rating={5}
            />
            <TestimonialCard 
              name="Mike Rodriguez"
              role="College Student, Austin"
              content="Cleaned out my dorm room and made $800 before moving home. Way easier than dealing with shipping stuff on other apps. Local pickup is genius."
              rating={5}
            />
            <TestimonialCard 
              name="Jennifer Park"
              role="Home Declutterer, Denver"
              content="Made over $2,000 decluttering my house. The buyers come to me, payments are instant, and there's zero hassle. I'm never using anything else."
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* Business CTA */}
      <section className="py-20 bg-gradient-to-r from-pink-900/20 via-fuchsia-900/20 to-pink-900/20">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-6">
          <div className="bg-slate-600/50 rounded-3xl p-8 md:p-12 border border-slate-500">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Are You a Local Business?</h3>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              Join hundreds of local businesses using GarageSale to reach more customers. 
              Get verified business listings, priority placement, and powerful advertising tools 
              that actually work in your community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="h-14 px-8 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl text-lg font-semibold"
              >
                <Link to={createPageUrl("BusinessSignup")}>
                  <Store className="w-5 h-5 mr-3" />
                  Get Business Account
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-14 px-8 bg-slate-600/50 border-slate-500 hover:bg-gray-700 text-white rounded-2xl text-lg"
              >
                <Link to={createPageUrl("Contact")}>
                  Learn More About Business Features
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-gray-950 to-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-6">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Start Selling?</h3>
          <p className="text-xl text-gray-400 mb-10">
            Join thousands of smart sellers who've already discovered the easiest way to make money from their stuff.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              onClick={() => handleAuthAction('AccountTypeSelection')}
              className="h-16 px-10 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl text-xl font-semibold transform hover:scale-105"
            >
              Get Started - It's Free!
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>✓ No credit card required</span>
            <span>✓ List items in under 30 seconds</span>
            <span>✓ Keep 100% of your money</span>
            <span>✓ Cancel anytime (but you won't want to)</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black text-white border-t border-slate-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-xl flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-xl">GarageSale</h3>
              </div>
              <p className="text-sm text-gray-400">The smartest local marketplace platform.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Sellers</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <a href="#" className="block hover:text-white transition-colors">How to Sell</a>
                <a href="#" className="block hover:text-white transition-colors">Pricing Guide</a>
                <a href="#" className="block hover:text-white transition-colors">Safety Tips</a>
                <a href="#" className="block hover:text-white transition-colors">Success Stories</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Businesses</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <Link to={createPageUrl("BusinessSignup")} className="block hover:text-white transition-colors">Business Signup</Link>
                <a href="#" className="block hover:text-white transition-colors">Advertising</a>
                <a href="#" className="block hover:text-white transition-colors">Verification</a>
                <a href="#" className="block hover:text-white transition-colors">API Access</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <Link to={createPageUrl("Contact")} className="block hover:text-white transition-colors">Contact Us</Link>
                <Link to={createPageUrl("Privacy")} className="block hover:text-white transition-colors">Privacy Policy</Link>
                <Link to={createPageUrl("Terms")} className="block hover:text-white transition-colors">Terms of Service</Link>
                <a href="#" className="block hover:text-white transition-colors">Help Center</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-600 pt-8 text-center">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} GarageSale. All rights reserved. Made with ❤️ for local communities.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}