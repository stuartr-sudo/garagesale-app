import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User as UserIcon, MapPin, Globe, Store, ArrowRight, CheckCircle, Shield, FileText, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const countries = [
  { code: "US", name: "United States", states: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"] },
  { code: "CA", name: "Canada", states: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"] },
  { code: "GB", name: "United Kingdom", states: ["England", "Scotland", "Wales", "Northern Ireland"] },
  { code: "AU", name: "Australia", states: ["Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"] },
  { code: "DE", name: "Germany", states: ["Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"] },
  { code: "FR", name: "France", states: ["Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany", "Centre-Val de Loire", "Corsica", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandy", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur"] },
  { code: "OTHER", name: "Other", states: [] }
];

const onboardingSteps = [
  { id: 1, title: "Personal Info", description: "Tell us about yourself" },
  { id: 2, title: "Terms & Agreement", description: "Review and accept our policies" }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    country: "AU", // Default to Australia
    state_region: "",
    postcode: ""
  });
  const [termsAcceptance, setTermsAcceptance] = useState({
    terms_of_service: false,
    privacy_policy: false,
    acceptable_use: false
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // If user already has complete profile and accepted terms, redirect to marketplace
      if (user.country && user.postcode && user.full_name && user.terms_accepted) {
        navigate(createPageUrl('Marketplace'));
        return;
      }
      
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        country: user.country || "AU", // Default to Australia
        state_region: user.state_region || "",
        postcode: user.postcode || ""
      });

      // Set Australia as default selected country
      const defaultCountry = countries.find(c => c.code === (user.country || "AU"));
      setSelectedCountry(defaultCountry);
    } catch (error) {
      console.error("Error loading user:", error);
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

  const validateStep = (step) => {
    switch (step) {
      case 1:
        // Validate personal info: name, country, state, postcode
        return (
          formData.full_name.trim() !== "" &&
          formData.country !== "" &&
          formData.state_region !== "" &&
          formData.postcode.trim() !== ""
        );
      case 2:
        // Validate that all terms are accepted
        return (
          termsAcceptance.terms_of_service &&
          termsAcceptance.privacy_policy &&
          termsAcceptance.acceptable_use
        );
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
      if (currentStep < 2) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      if (currentStep === 1) {
        alert("Please fill in all required fields: Name, Country, State, and Postcode.");
      } else if (currentStep === 2) {
        alert("Please accept all terms and policies to continue.");
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep(1)) {
      alert("Please complete your personal information.");
      setCurrentStep(1);
      return;
    }

    if (!validateStep(2)) {
      alert("Please accept all terms and policies to complete setup.");
      return;
    }

    setIsSaving(true);
    try {
      await User.updateMyUserData({
        full_name: formData.full_name,
        country: formData.country,
        state_region: formData.state_region,
        postcode: formData.postcode,
        terms_accepted: true, // Mark that user has accepted terms
        terms_accepted_date: new Date().toISOString()
      });
      
      // Redirect to marketplace after successful completion
      navigate(createPageUrl('Marketplace'));
    } catch (error) {
      console.error("Error completing onboarding:", error);
      alert("There was an error saving your information. Please try again.");
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-800">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800 text-gray-200">
      {/* Header */}
      <div className="bg-slate-700/80 backdrop-blur-sm border-b border-slate-600 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">GarageSale</h1>
              <p className="text-sm text-gray-400">Welcome to the community!</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-pink-900/50 text-pink-300 border-pink-700">
            Step {currentStep} of 2
          </Badge>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex justify-center items-center space-x-8">
              {onboardingSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      completedSteps.includes(step.id) ? 'bg-green-600 border-green-600' :
                      currentStep === step.id ? 'bg-pink-600 border-pink-600' :
                      'bg-slate-600 border-slate-500'
                    }`}>
                      {completedSteps.includes(step.id) ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-white font-semibold">{step.id}</span>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p className={`font-semibold ${currentStep === step.id ? 'text-pink-400' : 'text-gray-400'}`}>
                        {step.title}
                      </p>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {index < onboardingSteps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      completedSteps.includes(step.id) ? 'bg-green-600' : 'bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <Card className="bg-slate-700/80 backdrop-blur-sm shadow-xl border border-slate-600 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-pink-900/50 to-fuchsia-900/50 border-b border-slate-500">
              <CardTitle className="flex items-center gap-3 text-white text-2xl">
                {currentStep === 1 && <><UserIcon className="w-7 h-7 text-pink-400" /> Personal & Location Information</>}
                {currentStep === 2 && <><Shield className="w-7 h-7 text-pink-400" /> Terms & Policies</>}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-8">
              {/* Step 1: Personal Info & Location */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white mb-2">Let's get to know you!</h3>
                    <p className="text-gray-400">Tell us about yourself and where you're located</p>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Personal Info Section */}
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-gray-300 font-medium">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="h-14 rounded-xl bg-slate-600 border-slate-500 text-white text-lg placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300 font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="h-14 rounded-xl bg-slate-600 border-slate-500 text-gray-400 text-lg"
                      />
                      <p className="text-xs text-gray-500">Your email is used for login and cannot be changed.</p>
                    </div>

                    {/* Location Section */}
                    <div className="pt-6 border-t border-slate-500">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-pink-400" />
                        Location Details
                      </h4>
                      <p className="text-sm text-gray-400 mb-6">This helps us connect you with local buyers and sellers. Your full address will only be required when you list an item for sale.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-gray-300 font-medium">Country *</Label>
                          <Select
                            value={formData.country}
                            onValueChange={handleCountryChange}
                          >
                            <SelectTrigger className="h-14 rounded-xl bg-slate-600 border-slate-500 text-white text-lg">
                              <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-600 border-slate-500">
                              <SelectItem value="AU" className="text-white hover:bg-gray-700 text-lg py-3">
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4" />
                                  Australia
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">Currently only available in Australia</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="state_region" className="text-gray-300 font-medium">State/Territory *</Label>
                          {selectedCountry && selectedCountry.states.length > 0 ? (
                            <Select
                              value={formData.state_region}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, state_region: value }))}
                            >
                              <SelectTrigger className="h-14 rounded-xl bg-slate-600 border-slate-500 text-white text-lg">
                                <SelectValue placeholder="Select state/territory" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-600 border-slate-500">
                                {selectedCountry.states.map(state => (
                                  <SelectItem key={state} value={state} className="text-white hover:bg-gray-700 text-lg py-3">
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
                              placeholder="Enter your state/territory"
                              className="h-14 rounded-xl bg-slate-600 border-slate-500 text-white text-lg placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                              required
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <div className="space-y-2">
                          <Label htmlFor="postcode" className="text-gray-300 font-medium">Postcode *</Label>
                          <Input
                            id="postcode"
                            value={formData.postcode}
                            onChange={handleInputChange}
                            placeholder="e.g., 2000"
                            required
                            className="h-14 rounded-xl bg-slate-600 border-slate-500 text-white text-lg placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                          />
                          <p className="text-xs text-gray-500">Your postcode helps connect you with nearby users</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Terms & Agreement */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white mb-2">Terms & Policies</h3>
                    <p className="text-gray-400">Please review and accept our policies to continue</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Terms of Service */}
                    <div className="bg-slate-600/50 border border-slate-500 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          id="terms_of_service"
                          checked={termsAcceptance.terms_of_service}
                          onCheckedChange={(checked) => 
                            setTermsAcceptance(prev => ({ ...prev, terms_of_service: checked }))
                          }
                          className="mt-1 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                        />
                        <div className="flex-1">
                          <Label htmlFor="terms_of_service" className="text-white font-semibold text-base cursor-pointer flex items-center gap-2">
                            <FileText className="w-5 h-5 text-pink-400" />
                            Terms of Service
                          </Label>
                          <p className="text-sm text-gray-400 mt-2">
                            I agree to follow the GarageSale Terms of Service, which govern my use of the platform, including buying, selling, and trading items.
                          </p>
                          <a href={createPageUrl('Terms')} target="_blank" className="text-sm text-pink-400 hover:text-pink-300 underline mt-2 inline-block">
                            Read Full Terms of Service →
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Privacy Policy */}
                    <div className="bg-slate-600/50 border border-slate-500 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          id="privacy_policy"
                          checked={termsAcceptance.privacy_policy}
                          onCheckedChange={(checked) => 
                            setTermsAcceptance(prev => ({ ...prev, privacy_policy: checked }))
                          }
                          className="mt-1 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                        />
                        <div className="flex-1">
                          <Label htmlFor="privacy_policy" className="text-white font-semibold text-base cursor-pointer flex items-center gap-2">
                            <Shield className="w-5 h-5 text-pink-400" />
                            Privacy Policy
                          </Label>
                          <p className="text-sm text-gray-400 mt-2">
                            I understand how GarageSale collects, uses, and protects my personal information as described in the Privacy Policy.
                          </p>
                          <a href={createPageUrl('Privacy')} target="_blank" className="text-sm text-pink-400 hover:text-pink-300 underline mt-2 inline-block">
                            Read Privacy Policy →
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Acceptable Use Policy */}
                    <div className="bg-slate-600/50 border border-slate-500 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          id="acceptable_use"
                          checked={termsAcceptance.acceptable_use}
                          onCheckedChange={(checked) => 
                            setTermsAcceptance(prev => ({ ...prev, acceptable_use: checked }))
                          }
                          className="mt-1 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                        />
                        <div className="flex-1">
                          <Label htmlFor="acceptable_use" className="text-white font-semibold text-base cursor-pointer flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-pink-400" />
                            Acceptable Use Agreement
                          </Label>
                          <p className="text-sm text-gray-400 mt-2 mb-3">
                            I agree to use GarageSale responsibly and will not:
                          </p>
                          <ul className="text-sm text-gray-400 space-y-1.5 ml-4 list-disc">
                            <li>Post illegal, illicit, or prohibited items</li>
                            <li>Spam or flood the platform with excessive listings</li>
                            <li>Harass, abuse, or mislead other users</li>
                            <li>Violate intellectual property rights</li>
                            <li>Engage in fraudulent or deceptive practices</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Warning Notice */}
                    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-300 mb-2">Important Notice</h4>
                          <p className="text-sm text-yellow-200">
                            By accepting these terms, you acknowledge that violation of any of these policies may result in suspension or permanent removal from the platform. GarageSale reserves the right to moderate content and take appropriate action against policy violations.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-500">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="h-12 px-6 rounded-xl bg-slate-600 border-slate-500 text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Step {currentStep} of 2</span>
                </div>

                {currentStep < 2 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!validateStep(currentStep)}
                    className="h-12 px-8 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleComplete}
                    disabled={isSaving || !validateStep(2)}
                    className="h-12 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Completing...
                      </>
                    ) : (
                      <>
                        Accept & Complete Setup
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}