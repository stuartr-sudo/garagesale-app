
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User as UserIcon, Save, MapPin, Globe, Bot, CreditCard, DollarSign, TrendingUp, Calendar, RefreshCw, Coins, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

const countries = [
  { code: "US", name: "United States", states: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"] },
  { code: "CA", name: "Canada", states: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"] },
  { code: "GB", name: "United Kingdom", states: ["England", "Scotland", "Wales", "Northern Ireland"] },
  { code: "AU", name: "Australia", states: ["Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"] },
  { code: "DE", name: "Germany", states: ["Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"] },
  { code: "FR", name: "France", states: ["Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany", "Centre-Val de Loire", "Corsica", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandy", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur"] },
  { code: "OTHER", name: "Other", states: [] }
];

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    country: "",
    state_region: "",
    city: "",
    postcode: "",
    phone: "",
    collection_address: "",
    negotiation_aggressiveness: "balanced",
    accepted_payment_methods: ["bank_transfer", "stripe", "crypto"],
    open_to_trades: false,
    enable_ai_upsell: false,
    upsell_commission_rate: 15.00,
    // Payment details
    bank_details: {
      account_name: "",
      bsb: "",
      account_number: ""
    },
    crypto_wallet_addresses: {
      btc: "",
      eth: "",
      usdt: "",
      usdc: "",
      xrp: ""
    }
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [sellerBalance, setSellerBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser?.account_type === 'seller') {
      loadSellerBalance();
    }
  }, [currentUser]);

  const loadCurrentUser = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const needsOnboarding = !user.country || !user.postcode;
      setIsOnboarding(needsOnboarding);
      
      // Ensure all fields have default values
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        country: user.country || "",
        state_region: user.state_region || "",
        city: user.city || "",
        postcode: user.postcode || "",
        phone: user.phone || "",
        collection_address: user.collection_address || "",
        negotiation_aggressiveness: user.negotiation_aggressiveness || "balanced",
        accepted_payment_methods: user.accepted_payment_methods || ["bank_transfer", "stripe", "crypto"],
        open_to_trades: user.open_to_trades || false,
        enable_ai_upsell: user.enable_ai_upsell || false,
        upsell_commission_rate: user.upsell_commission_rate || 15.00,
        // Payment details
        bank_details: user.bank_details || {
          account_name: "",
          bsb: "",
          account_number: ""
        },
        crypto_wallet_addresses: user.crypto_wallet_addresses || {
          btc: "",
          eth: "",
          usdt: "",
          usdc: "",
          xrp: ""
        }
      });

      if (user.country) {
        const country = countries.find(c => c.code === user.country);
        setSelectedCountry(country);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      // Set default form data if user loading fails
      setFormData({
        full_name: "",
        email: "",
        country: "",
        state_region: "",
        city: "",
        postcode: "",
        phone: "",
        collection_address: "",
        negotiation_aggressiveness: "balanced"
      });
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCountryChange = (countryCode) => {
    const country = countries.find(c => c.code === countryCode);
    setSelectedCountry(country);
    setFormData(prev => ({ 
      ...prev, 
      country: countryCode,
      state_region: ""
    }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    
    if (!formData.country || !formData.postcode) {
      alert("Please fill in your country and postcode - these are required fields.");
      return;
    }

    setIsSaving(true);
    try {
      await User.updateMyUserData({
        full_name: formData.full_name,
        country: formData.country,
        state_region: formData.state_region,
        city: formData.city,
        postcode: formData.postcode,
        phone: formData.phone,
        collection_address: formData.collection_address,
        negotiation_aggressiveness: formData.negotiation_aggressiveness,
        accepted_payment_methods: formData.accepted_payment_methods,
        open_to_trades: formData.open_to_trades,
        enable_ai_upsell: formData.enable_ai_upsell,
        upsell_commission_rate: formData.upsell_commission_rate,
        bank_details: formData.bank_details,
        crypto_wallet_addresses: formData.crypto_wallet_addresses
      });
      
      setShowSuccess(true);
      setIsOnboarding(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating user data:", error);
      alert("There was an error saving your changes. Please try again.");
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-48 mb-6"></div>
            <div className="h-64 bg-gray-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      <div className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              {isOnboarding ? "Welcome! Complete Your Profile" : "Settings"}
            </h1>
            <p className="text-lg text-gray-400">
              {isOnboarding 
                ? "Tell us where you're located to connect with local buyers and sellers" 
                : "Manage your personal information and preferences"
              }
            </p>
          </div>

          {isOnboarding && (
            <div className="bg-yellow-900/50 border-l-4 border-yellow-700 p-4 rounded-r-lg mb-8">
              <div className="flex">
                <div className="py-1">
                  <p className="font-bold text-yellow-300">Just One More Step!</p>
                  <p className="text-sm text-yellow-400">
                    Your location helps us show you items near you and connect you with local buyers.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-400">
                <UserIcon className="w-6 h-6" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-gray-400">
                This information helps others in the marketplace connect with you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveChanges} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    Personal Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-gray-300">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white focus:border-pink-500 focus:ring-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g., (555) 123-4567"
                        className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white focus:border-pink-500 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="h-12 rounded-xl bg-gray-800 border-gray-700 text-gray-400"
                    />
                    <p className="text-xs text-gray-500">Your email is used for login and cannot be changed.</p>
                  </div>
                </div>

                {/* Location Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location Details {isOnboarding && <span className="text-red-500">*</span>}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-gray-300">Country *</Label>
                      <Select
                        value={formData.country || ""}
                        onValueChange={handleCountryChange}
                      >
                        <SelectTrigger className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {countries.map(country => (
                            <SelectItem key={country.code} value={country.code} className="text-white hover:bg-gray-700">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                {country.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state_region" className="text-gray-300">
                        {selectedCountry?.code === 'US' ? 'State' : 
                         selectedCountry?.code === 'CA' ? 'Province' : 
                         selectedCountry?.code === 'GB' ? 'Country' :
                         selectedCountry?.code === 'AU' ? 'State/Territory' :
                         'State/Region'}
                      </Label>
                      {selectedCountry && selectedCountry.states.length > 0 ? (
                        <Select
                          value={formData.state_region || ""}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, state_region: value }))}
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder={`Select ${selectedCountry.code === 'US' ? 'state' : 'region'}`} />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {selectedCountry.states.map(state => (
                              <SelectItem key={state} value={state} className="text-white hover:bg-gray-700">
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="state_region"
                          value={formData.state_region}
                          onChange={handleInputChange}
                          placeholder="Enter your state/region"
                          className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white focus:border-pink-500 focus:ring-pink-500"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-gray-300">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Enter your city"
                        className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white focus:border-pink-500 focus:ring-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postcode" className="text-gray-300">
                        {selectedCountry?.code === 'US' ? 'ZIP Code' : 
                         selectedCountry?.code === 'CA' ? 'Postal Code' : 
                         selectedCountry?.code === 'GB' ? 'Postcode' :
                         'Postal Code'} *
                      </Label>
                      <Input
                        id="postcode"
                        value={formData.postcode}
                        onChange={handleInputChange}
                        placeholder={
                          selectedCountry?.code === 'US' ? 'e.g., 90210' :
                          selectedCountry?.code === 'CA' ? 'e.g., K1A 0A6' :
                          selectedCountry?.code === 'GB' ? 'e.g., SW1A 1AA' :
                          'Enter postal code'
                        }
                        required
                        className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white focus:border-pink-500 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Collection Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Collection Details
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="collection_address" className="text-gray-300">Default Collection Address</Label>
                    <Textarea
                      id="collection_address"
                      value={formData.collection_address}
                      onChange={handleInputChange}
                      placeholder="Enter your default collection address (street, suburb, postcode)"
                      rows={3}
                      className="rounded-xl bg-gray-800 border-gray-700 text-white focus:border-pink-500 focus:ring-pink-500"
                    />
                    <p className="text-xs text-gray-500">
                      This address will be pre-filled when you create new listings. You can still change it for individual items.
                    </p>
                  </div>
                </div>

                {/* AI Agent Negotiation Settings - Only for sellers */}
                {currentUser?.account_type === 'seller' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Bot className="w-5 h-5" />
                      AI Agent Negotiation Settings
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="negotiation_aggressiveness" className="text-gray-300">Negotiation Style</Label>
                      <Select
                        value={formData.negotiation_aggressiveness || "balanced"}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, negotiation_aggressiveness: value }))}
                      >
                        <SelectTrigger className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select negotiation style" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="passive" className="text-white hover:bg-gray-700">
                            <div className="flex flex-col">
                              <span className="font-medium">Passive - Quick to Accept</span>
                              <span className="text-xs text-gray-400">Accepts offers close to minimum price</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="balanced" className="text-white hover:bg-gray-700">
                            <div className="flex flex-col">
                              <span className="font-medium">Balanced - Standard Negotiation</span>
                              <span className="text-xs text-gray-400">Moderate counter-offers, good for most sellers</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="aggressive" className="text-white hover:bg-gray-700">
                            <div className="flex flex-col">
                              <span className="font-medium">Aggressive - Firm Negotiator</span>
                              <span className="text-xs text-gray-400">Higher counter-offers, maximizes value</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="very_aggressive" className="text-white hover:bg-gray-700">
                            <div className="flex flex-col">
                              <span className="font-medium">Very Aggressive - Maximum Value</span>
                              <span className="text-xs text-gray-400">Highest counter-offers, only accepts near asking price</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Choose how your AI agent negotiates with buyers. You can change this anytime.
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Upsell Settings - Only for sellers */}
                {currentUser?.account_type === 'seller' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      AI-Powered Cross-Selling & Upselling
                    </h3>
                    
                    <div className="flex items-start space-x-3 p-4 rounded-xl bg-gray-800 border border-gray-700">
                      <input
                        type="checkbox"
                        id="enable_ai_upsell"
                        checked={formData.enable_ai_upsell || false}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            enable_ai_upsell: e.target.checked
                          }));
                        }}
                        className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500 mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="enable_ai_upsell" className="text-white font-medium">Enable AI Upselling</Label>
                        <p className="text-xs text-gray-400 mt-1">
                          Let our AI suggest your items to buyers in their cart with a discount you set. 
                          <strong className="text-white">You absorb the discount cost, platform takes nothing.</strong> More exposure = more sales!
                        </p>
                      </div>
                    </div>

                    {formData.enable_ai_upsell && (
                      <div className="space-y-4 p-4 rounded-xl bg-green-900/20 border border-green-800">
                        <div className="space-y-2">
                          <Label htmlFor="upsell_commission_rate" className="text-white font-medium">
                            Your Discount Rate (What Buyers Save)
                          </Label>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              id="upsell_commission_rate"
                              min="10"
                              max="20"
                              step="1"
                              value={formData.upsell_commission_rate}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  upsell_commission_rate: parseFloat(e.target.value)
                                }));
                              }}
                              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-600"
                            />
                            <div className="text-2xl font-bold text-pink-500 min-w-[60px] text-right">
                              {formData.upsell_commission_rate}%
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">
                            Buyers see your items with a <span className="text-green-400 font-semibold">{formData.upsell_commission_rate}% discount</span> when suggested by our AI.
                            <strong className="text-white"> You absorb this discount cost</strong> to boost sales volume.
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                          <h4 className="text-sm font-semibold text-white mb-2">Example Scenario:</h4>
                          <div className="space-y-1 text-xs text-gray-300">
                            <div className="flex justify-between">
                              <span>Your Item Price:</span>
                              <span className="font-mono">$100.00</span>
                            </div>
                            <div className="flex justify-between text-green-400">
                              <span>Buyer Pays (with {formData.upsell_commission_rate}% discount):</span>
                              <span className="font-mono">${(100 * (1 - formData.upsell_commission_rate / 100)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-yellow-400">
                              <span>Your Discount Cost:</span>
                              <span className="font-mono">-${(100 * (formData.upsell_commission_rate / 100)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-700 pt-1 mt-1 font-semibold">
                              <span>You Receive:</span>
                              <span className="font-mono">${(100 * (1 - formData.upsell_commission_rate / 100)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-blue-400">
                              <span>Platform Fee:</span>
                              <span className="font-mono">$0.00 (No platform fee!)</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-900/20 border border-blue-800">
                          <Bot className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-blue-300">
                            <strong>Smart Upselling:</strong> Our AI suggests your items to buyers based on their cart contents, 
                            browsing history, and preferences. This increases your sales volume while offering buyers great deals!
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Trading Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Trading Preferences
                  </h3>
                  
                  <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-800 border border-gray-700">
                    <input
                      type="checkbox"
                      id="open_to_trades"
                      checked={formData.open_to_trades || false}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          open_to_trades: e.target.checked
                        }));
                      }}
                      className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
                    />
                    <div className="flex-1">
                      <Label htmlFor="open_to_trades" className="text-white font-medium">Enable Item Trading</Label>
                      <p className="text-xs text-gray-400">Allow other users to propose trading their items for yours</p>
                    </div>
                  </div>

                  {formData.open_to_trades && (
                    <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-800">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-blue-400 mt-0.5">ℹ️</div>
                        <div>
                          <h4 className="text-blue-200 font-semibold mb-2">How Trading Works</h4>
                          <ul className="text-sm text-blue-100 space-y-1">
                            <li>• Users can propose trading one or more of their items for yours</li>
                            <li>• Cash adjustments up to $500 can be included</li>
                            <li>• Trade offers expire after 7 days</li>
                            <li>• You can accept, reject, or message about any offer</li>
                            <li>• Once accepted, arrange collection with the other party</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method Preferences - Only for sellers */}
                {currentUser?.account_type === 'seller' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Method Preferences
                    </h3>
                    
                    <div className="space-y-4">
                      <Label className="text-gray-300">Accepted Payment Methods</Label>
                      <p className="text-sm text-gray-400">
                        Choose which payment methods you want to accept from buyers. You can change this anytime.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Bank Transfer */}
                        <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-800 border border-gray-700">
                          <input
                            type="checkbox"
                            id="bank_transfer"
                            checked={formData.accepted_payment_methods.includes('bank_transfer')}
                            onChange={(e) => {
                              const methods = formData.accepted_payment_methods;
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  accepted_payment_methods: [...methods, 'bank_transfer']
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  accepted_payment_methods: methods.filter(m => m !== 'bank_transfer')
                                }));
                              }
                            }}
                            className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
                          />
                          <div className="flex-1">
                            <Label htmlFor="bank_transfer" className="text-white font-medium">Bank Transfer</Label>
                            <p className="text-xs text-gray-400">Direct bank transfer, no fees</p>
                          </div>
                        </div>

                        {/* Credit Card */}
                        <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-800 border border-gray-700">
                          <input
                            type="checkbox"
                            id="stripe"
                            checked={formData.accepted_payment_methods.includes('stripe')}
                            onChange={(e) => {
                              const methods = formData.accepted_payment_methods;
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  accepted_payment_methods: [...methods, 'stripe']
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  accepted_payment_methods: methods.filter(m => m !== 'stripe')
                                }));
                              }
                            }}
                            className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
                          />
                          <div className="flex-1">
                            <Label htmlFor="stripe" className="text-white font-medium">Credit Card</Label>
                            <p className="text-xs text-gray-400">5% fee, 14-day hold</p>
                          </div>
                        </div>

                        {/* Crypto */}
                        <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-800 border border-gray-700">
                          <input
                            type="checkbox"
                            id="crypto"
                            checked={formData.accepted_payment_methods.includes('crypto')}
                            onChange={(e) => {
                              const methods = formData.accepted_payment_methods;
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  accepted_payment_methods: [...methods, 'crypto']
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  accepted_payment_methods: methods.filter(m => m !== 'crypto')
                                }));
                              }
                            }}
                            className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
                          />
                          <div className="flex-1">
                            <Label htmlFor="crypto" className="text-white font-medium">Cryptocurrency</Label>
                            <p className="text-xs text-gray-400">USDT/USDC, instant</p>
                          </div>
                        </div>
                      </div>

                      {/* Credit Card Warning */}
                      {formData.accepted_payment_methods.includes('stripe') && (
                        <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-800">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 text-yellow-400 mt-0.5">⚠️</div>
                            <div>
                              <h4 className="text-yellow-400 font-semibold mb-2">Credit Card Payment Terms</h4>
                              <ul className="text-sm text-yellow-200 space-y-1">
                                <li>• Payments are held for 14 days to prevent chargebacks</li>
                                <li>• Any chargebacks will be charged directly to your account</li>
                                <li>• 5% processing fee is deducted from your payout</li>
                                <li>• Funds are released after the 14-day hold period</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Minimum Selection Warning */}
                      {formData.accepted_payment_methods.length === 0 && (
                        <div className="p-4 rounded-xl bg-red-900/20 border border-red-800">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 text-red-400">❌</div>
                            <p className="text-red-200 text-sm">
                              You must select at least one payment method to accept payments from buyers.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Bank Details Configuration */}
                      {formData.accepted_payment_methods.includes('bank_transfer') && (
                        <div className="mt-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Bank Account Details
                          </h4>
                          <p className="text-sm text-gray-400 mb-4">
                            Enter your bank account details to receive bank transfer payments. These details will be shared with buyers.
                          </p>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="bank_account_name" className="text-gray-300 mb-2 block">
                                Account Name *
                              </Label>
                              <Input
                                id="bank_account_name"
                                value={formData.bank_details.account_name}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  bank_details: { ...prev.bank_details, account_name: e.target.value }
                                }))}
                                placeholder="Your full name as it appears on the account"
                                className="bg-gray-900 border-gray-700 text-white"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="bank_bsb" className="text-gray-300 mb-2 block">
                                  BSB *
                                </Label>
                                <Input
                                  id="bank_bsb"
                                  value={formData.bank_details.bsb}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    bank_details: { ...prev.bank_details, bsb: e.target.value }
                                  }))}
                                  placeholder="123-456"
                                  className="bg-gray-900 border-gray-700 text-white"
                                  maxLength={7}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="bank_account_number" className="text-gray-300 mb-2 block">
                                  Account Number *
                                </Label>
                                <Input
                                  id="bank_account_number"
                                  value={formData.bank_details.account_number}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    bank_details: { ...prev.bank_details, account_number: e.target.value }
                                  }))}
                                  placeholder="12345678"
                                  className="bg-gray-900 border-gray-700 text-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cryptocurrency Wallet Configuration */}
                      {formData.accepted_payment_methods.includes('crypto') && (
                        <div className="mt-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Coins className="w-5 h-5" />
                            Cryptocurrency Wallet Addresses
                          </h4>
                          <p className="text-sm text-gray-400 mb-4">
                            Enter your wallet addresses for the cryptocurrencies you want to accept. Only addresses you provide will be shown to buyers.
                          </p>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="crypto_btc" className="text-gray-300 mb-2 block">
                                Bitcoin (BTC) Address
                              </Label>
                              <Input
                                id="crypto_btc"
                                value={formData.crypto_wallet_addresses.btc}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  crypto_wallet_addresses: { ...prev.crypto_wallet_addresses, btc: e.target.value }
                                }))}
                                placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                                className="bg-gray-900 border-gray-700 text-white"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="crypto_eth" className="text-gray-300 mb-2 block">
                                Ethereum (ETH) Address
                              </Label>
                              <Input
                                id="crypto_eth"
                                value={formData.crypto_wallet_addresses.eth}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  crypto_wallet_addresses: { ...prev.crypto_wallet_addresses, eth: e.target.value }
                                }))}
                                placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                                className="bg-gray-900 border-gray-700 text-white"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="crypto_usdt" className="text-gray-300 mb-2 block">
                                Tether (USDT) Address
                              </Label>
                              <Input
                                id="crypto_usdt"
                                value={formData.crypto_wallet_addresses.usdt}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  crypto_wallet_addresses: { ...prev.crypto_wallet_addresses, usdt: e.target.value }
                                }))}
                                placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                                className="bg-gray-900 border-gray-700 text-white"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="crypto_usdc" className="text-gray-300 mb-2 block">
                                USD Coin (USDC) Address
                              </Label>
                              <Input
                                id="crypto_usdc"
                                value={formData.crypto_wallet_addresses.usdc}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  crypto_wallet_addresses: { ...prev.crypto_wallet_addresses, usdc: e.target.value }
                                }))}
                                placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                                className="bg-gray-900 border-gray-700 text-white"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="crypto_xrp" className="text-gray-300 mb-2 block">
                                XRP Address
                              </Label>
                              <Input
                                id="crypto_xrp"
                                value={formData.crypto_wallet_addresses.xrp}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  crypto_wallet_addresses: { ...prev.crypto_wallet_addresses, xrp: e.target.value }
                                }))}
                                placeholder="rN7n7otQDd6FczFgLdlqtyMVrn3Q7sPCHGH"
                                className="bg-gray-900 border-gray-700 text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-4 pt-4">
                  {showSuccess && <p className="text-sm text-green-400">Profile updated successfully!</p>}
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="h-12 px-8 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {isOnboarding ? 'Complete Setup' : 'Save Changes'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
