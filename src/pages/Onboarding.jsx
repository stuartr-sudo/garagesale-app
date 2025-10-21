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
import { User as UserIcon, MapPin, Globe, Store, ArrowRight, CheckCircle } from "lucide-react";

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
  { id: 2, title: "Location", description: "Where are you located?" },
  { id: 3, title: "Contact", description: "How can others reach you?" }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    country: "",
    state_region: "",
    city: "",
    postcode: "",
    phone: ""
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
      
      // If user already has complete profile, redirect to marketplace
      if (user.country && user.postcode && user.full_name) {
        navigate(createPageUrl('Marketplace'));
        return;
      }
      
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        country: user.country || "",
        state_region: user.state_region || "",
        city: user.city || "",
        postcode: user.postcode || "",
        phone: user.phone || ""
      });

      if (user.country) {
        const country = countries.find(c => c.code === user.country);
        setSelectedCountry(country);
      }
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
        return formData.full_name.trim() !== "";
      case 2:
        return formData.country !== "" && formData.postcode.trim() !== "";
      case 3:
        return true; // Phone is optional
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      alert("Please fill in the required fields before continuing.");
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep(2)) {
      alert("Please complete your location information.");
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
        phone: formData.phone
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
      <div className="flex h-screen w-full items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 p-6">
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
            Step {currentStep} of 3
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
                      'bg-gray-800 border-gray-600'
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
          <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-pink-900/50 to-fuchsia-900/50 border-b border-gray-700">
              <CardTitle className="flex items-center gap-3 text-white text-2xl">
                {currentStep === 1 && <><UserIcon className="w-7 h-7 text-pink-400" /> Personal Information</>}
                {currentStep === 2 && <><MapPin className="w-7 h-7 text-pink-400" /> Location Details</>}
                {currentStep === 3 && <><Globe className="w-7 h-7 text-pink-400" /> Contact Information</>}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-8">
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white mb-2">Let's get to know you!</h3>
                    <p className="text-gray-400">This helps other community members connect with you</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-gray-300 font-medium">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="h-14 rounded-xl bg-gray-800 border-gray-700 text-white text-lg placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
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
                        className="h-14 rounded-xl bg-gray-800 border-gray-700 text-gray-400 text-lg"
                      />
                      <p className="text-xs text-gray-500">Your email is used for login and cannot be changed.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white mb-2">Where are you located?</h3>
                    <p className="text-gray-400">This helps us connect you with local buyers and sellers</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-gray-300 font-medium">Country *</Label>
                      <Select
                        value={formData.country}
                        onValueChange={handleCountryChange}
                      >
                        <SelectTrigger className="h-14 rounded-xl bg-gray-800 border-gray-700 text-white text-lg">
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {countries.map(country => (
                            <SelectItem key={country.code} value={country.code} className="text-white hover:bg-gray-700 text-lg py-3">
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
                      <Label htmlFor="state_region" className="text-gray-300 font-medium">
                        {selectedCountry?.code === 'US' ? 'State' : 
                         selectedCountry?.code === 'CA' ? 'Province' : 
                         selectedCountry?.code === 'GB' ? 'Country' :
                         selectedCountry?.code === 'AU' ? 'State/Territory' :
                         'State/Region'}
                      </Label>
                      {selectedCountry && selectedCountry.states.length > 0 ? (
                        <Select
                          value={formData.state_region}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, state_region: value }))}
                        >
                          <SelectTrigger className="h-14 rounded-xl bg-gray-800 border-gray-700 text-white text-lg">
                            <SelectValue placeholder={`Select ${selectedCountry.code === 'US' ? 'state' : 'region'}`} />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
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
                          placeholder="Enter your state/region"
                          className="h-14 rounded-xl bg-gray-800 border-gray-700 text-white text-lg placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-gray-300 font-medium">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Enter your city"
                        className="h-14 rounded-xl bg-gray-800 border-gray-700 text-white text-lg placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postcode" className="text-gray-300 font-medium">
                        {selectedCountry?.code === 'US' ? 'ZIP Code *' : 
                         selectedCountry?.code === 'CA' ? 'Postal Code *' : 
                         selectedCountry?.code === 'GB' ? 'Postcode *' :
                         'Postal Code *'}
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
                        className="h-14 rounded-xl bg-gray-800 border-gray-700 text-white text-lg placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Contact */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white mb-2">How can others reach you?</h3>
                    <p className="text-gray-400">This information helps buyers and sellers connect with you</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300 font-medium">Mobile Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g., (555) 123-4567"
                        className="h-14 rounded-xl bg-gray-800 border-gray-700 text-white text-lg placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                      />
                    </div>

                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6">
                      <h4 className="font-semibold text-blue-300 mb-2">Privacy Note</h4>
                      <p className="text-sm text-blue-200">
                        Your contact information is only shared with other users when you're actively buying or selling items. 
                        We never share your information with third parties.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="h-12 px-6 rounded-xl bg-gray-800 border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Step {currentStep} of 3</span>
                </div>

                {currentStep < 3 ? (
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
                        Complete Setup
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