import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Business } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building, User as UserIcon, MapPin, Globe, Store, ArrowRight, CheckCircle, Upload, Briefcase, Clock, Shield } from "lucide-react";

const countries = [
  { code: "US", name: "United States", states: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"] },
  { code: "CA", name: "Canada", states: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"] },
  { code: "GB", name: "United Kingdom", states: ["England", "Scotland", "Wales", "Northern Ireland"] },
  { code: "AU", name: "Australia", states: ["Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"] },
  { code: "DE", name: "Germany", states: ["Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"] },
  { code: "FR", name: "France", states: ["Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany", "Centre-Val de Loire", "Corsica", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandy", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur"] },
  { code: "OTHER", name: "Other", states: [] }
];

const businessTypes = [
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "llc", label: "LLC" },
  { value: "corporation", label: "Corporation" },
  { value: "non_profit", label: "Non-Profit" },
  { value: "other", label: "Other" }
];

const industries = [
  { value: "retail", label: "Retail" },
  { value: "food_service", label: "Food & Restaurant" },
  { value: "professional_services", label: "Professional Services" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "technology", label: "Technology" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "real_estate", label: "Real Estate" },
  { value: "automotive", label: "Automotive" },
  { value: "beauty_wellness", label: "Beauty & Wellness" },
  { value: "home_services", label: "Home Services" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" }
];

const onboardingSteps = [
  { id: 1, title: "Personal Info", description: "Your contact details" },
  { id: 2, title: "Business Info", description: "About your business" },
  { id: 3, title: "Location & Hours", description: "Where and when you operate" },
  { id: 4, title: "Verification", description: "Verify your business" }
];

export default function BusinessOnboarding() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal
    full_name: "",
    email: "",
    country: "",
    state_region: "",
    city: "",
    postcode: "",
    phone: "",
    // Business
    business_name: "",
    business_type: "sole_proprietorship",
    industry: "retail",
    business_description: "",
    website_url: "",
    business_phone: "",
    business_email: "",
    business_address: "",
    tax_id: "",
    logo_url: "",
    operating_hours: {
      monday: "9:00 AM - 5:00 PM",
      tuesday: "9:00 AM - 5:00 PM",
      wednesday: "9:00 AM - 5:00 PM",
      thursday: "9:00 AM - 5:00 PM",
      friday: "9:00 AM - 5:00 PM",
      saturday: "Closed",
      sunday: "Closed"
    }
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
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
      
      // If user already has complete profile and business, redirect to marketplace
      if (user.country && user.postcode && user.full_name && user.account_type === 'business') {
        const businesses = await Business.filter({ owner_user_id: user.id });
        if (businesses.length > 0) {
          navigate(createPageUrl('Marketplace'));
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || "",
        email: user.email || "",
        country: user.country || "",
        state_region: user.state_region || "",
        city: user.city || "",
        postcode: user.postcode || "",
        phone: user.phone || ""
      }));

      if (user.country) {
        const country = countries.find(c => c.code === user.country);
        setSelectedCountry(country);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, logo_url: file_url }));
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Error uploading logo. Please try again.");
    }
    setUploadingLogo(false);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.full_name.trim() !== "";
      case 2:
        return formData.business_name.trim() !== "" && formData.business_type && formData.industry;
      case 3:
        return formData.country !== "" && formData.postcode.trim() !== "" && formData.business_address.trim() !== "";
      case 4:
        return true; // Verification is optional
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
      if (currentStep < 4) {
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
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      alert("Please complete all required information.");
      return;
    }

    setIsSaving(true);
    try {
      // Update user data and set account type to business
      await User.updateMyUserData({
        full_name: formData.full_name,
        country: formData.country,
        state_region: formData.state_region,
        city: formData.city,
        postcode: formData.postcode,
        phone: formData.phone,
        account_type: "business"
      });

      // Create business profile
      await Business.create({
        business_name: formData.business_name,
        business_type: formData.business_type,
        industry: formData.industry,
        business_description: formData.business_description,
        website_url: formData.website_url,
        business_phone: formData.business_phone,
        business_email: formData.business_email,
        business_address: formData.business_address,
        tax_id: formData.tax_id,
        logo_url: formData.logo_url,
        operating_hours: formData.operating_hours,
        owner_user_id: currentUser.id,
        verification_status: "pending"
      });

      // Send welcome email after successful business onboarding
      try {
        const { sendUserWelcomeEmail } = await import('@/api/email');
        await sendUserWelcomeEmail(currentUser.id, currentUser.email, formData.full_name);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the onboarding if email fails
      }
      
      // Redirect to marketplace after successful completion
      navigate(createPageUrl('Marketplace'));
    } catch (error) {
      console.error("Error completing business onboarding:", error);
      alert("There was an error saving your information. Please try again.");
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">BlockSwap Seller</h1>
              <p className="text-sm text-gray-400">Set up your business account</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-pink-900/50 text-pink-300 border-pink-700">
            Step {currentStep} of 4
          </Badge>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex justify-center items-center space-x-4 md:space-x-8 overflow-x-auto">
              {onboardingSteps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      completedSteps.includes(step.id) ? 'bg-green-600 border-green-600' :
                      currentStep === step.id ? 'bg-pink-600 border-pink-600' :
                      'bg-gray-800 border-gray-700'
                    }`}>
                      {completedSteps.includes(step.id) ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-white font-semibold">{step.id}</span>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p className={`font-semibold text-sm ${currentStep === step.id ? 'text-pink-400' : 'text-gray-400'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {index < onboardingSteps.length - 1 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-2 md:mx-4 ${
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
                {currentStep === 2 && <><Briefcase className="w-7 h-7 text-pink-400" /> Business Details</>}
                {currentStep === 3 && <><MapPin className="w-7 h-7 text-pink-400" /> Location & Hours</>}
                {currentStep === 4 && <><Shield className="w-7 h-7 text-pink-400" /> Business Verification</>}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-8">
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white mb-2">Tell us about yourself</h3>
                    <p className="text-gray-400">As the business owner, we need your personal details</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-gray-300 font-medium">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Enter your full name"
                        className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300 font-medium">Personal Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="e.g., (555) 123-4567"
                        className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300 font-medium">Email Address</Label>
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
              )}

              {/* Step 2: Business Info */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white mb-2">About your business</h3>
                    <p className="text-gray-400">Help customers learn about what you offer</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="business_name" className="text-gray-300 font-medium">Business Name *</Label>
                      <Input
                        id="business_name"
                        value={formData.business_name}
                        onChange={(e) => handleInputChange('business_name', e.target.value)}
                        placeholder="Enter your business name"
                        className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-gray-300 font-medium">Business Type *</Label>
                        <Select
                          value={formData.business_type}
                          onValueChange={(value) => handleInputChange('business_type', value)}
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {businessTypes.map(type => (
                              <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700">
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300 font-medium">Industry *</Label>
                        <Select
                          value={formData.industry}
                          onValueChange={(value) => handleInputChange('industry', value)}
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {industries.map(industry => (
                              <SelectItem key={industry.value} value={industry.value} className="text-white hover:bg-gray-700">
                                {industry.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_description" className="text-gray-300 font-medium">Business Description</Label>
                      <Textarea
                        id="business_description"
                        value={formData.business_description}
                        onChange={(e) => handleInputChange('business_description', e.target.value)}
                        placeholder="Describe what your business does..."
                        className="min-h-20 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="business_email" className="text-gray-300 font-medium">Business Email</Label>
                        <Input
                          id="business_email"
                          type="email"
                          value={formData.business_email}
                          onChange={(e) => handleInputChange('business_email', e.target.value)}
                          placeholder="business@example.com"
                          className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="business_phone" className="text-gray-300 font-medium">Business Phone</Label>
                        <Input
                          id="business_phone"
                          type="tel"
                          value={formData.business_phone}
                          onChange={(e) => handleInputChange('business_phone', e.target.value)}
                          placeholder="(555) 987-6543"
                          className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website_url" className="text-gray-300 font-medium">Website</Label>
                      <Input
                        id="website_url"
                        type="url"
                        value={formData.website_url}
                        onChange={(e) => handleInputChange('website_url', e.target.value)}
                        placeholder="https://www.yourbusiness.com"
                        className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Location & Hours */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white mb-2">Where do you operate?</h3>
                    <p className="text-gray-400">Your business location and operating hours</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-gray-300 font-medium">Country *</Label>
                        <Select
                          value={formData.country}
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
                        <Label className="text-gray-300 font-medium">
                          {selectedCountry?.code === 'US' ? 'State' : 
                           selectedCountry?.code === 'CA' ? 'Province' : 
                           selectedCountry?.code === 'GB' ? 'Country' :
                           selectedCountry?.code === 'AU' ? 'State/Territory' :
                           'State/Region'}
                        </Label>
                        {selectedCountry && selectedCountry.states.length > 0 ? (
                          <Select
                            value={formData.state_region}
                            onValueChange={(value) => handleInputChange('state_region', value)}
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
                            value={formData.state_region}
                            onChange={(e) => handleInputChange('state_region', e.target.value)}
                            placeholder="Enter your state/region"
                            className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
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
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Enter your city"
                          className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
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
                          onChange={(e) => handleInputChange('postcode', e.target.value)}
                          placeholder={
                            selectedCountry?.code === 'US' ? 'e.g., 90210' :
                            selectedCountry?.code === 'CA' ? 'e.g., K1A 0A6' :
                            selectedCountry?.code === 'GB' ? 'e.g., SW1A 1AA' :
                            'Enter postal code'
                          }
                          required
                          className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_address" className="text-gray-300 font-medium">Business Address *</Label>
                      <Textarea
                        id="business_address"
                        value={formData.business_address}
                        onChange={(e) => handleInputChange('business_address', e.target.value)}
                        placeholder="123 Main Street, Suite 100"
                        className="min-h-16 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                        required
                      />
                    </div>

                    <div className="bg-gray-800/50 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-pink-400" />
                        <h4 className="font-semibold text-white">Operating Hours</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(formData.operating_hours).map(([day, hours]) => (
                          <div key={day} className="flex items-center gap-3">
                            <Label className="text-gray-300 font-medium w-20 capitalize">{day}:</Label>
                            <Input
                              value={hours}
                              onChange={(e) => handleInputChange('operating_hours', {
                                ...formData.operating_hours,
                                [day]: e.target.value
                              })}
                              placeholder="9:00 AM - 5:00 PM"
                              className="h-10 rounded-lg bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Verification */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white mb-2">Verify your business</h3>
                    <p className="text-gray-400">Optional verification helps build trust with customers</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="tax_id" className="text-gray-300 font-medium">Tax ID / EIN (Optional)</Label>
                      <Input
                        id="tax_id"
                        value={formData.tax_id}
                        onChange={(e) => handleInputChange('tax_id', e.target.value)}
                        placeholder="12-3456789"
                        className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-gray-300 font-medium">Business Logo (Optional)</Label>
                      {formData.logo_url ? (
                        <div className="flex items-center gap-4">
                          <img src={formData.logo_url} alt="Business Logo" className="w-16 h-16 rounded-xl object-cover bg-gray-800" />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleInputChange('logo_url', '')}
                            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                          >
                            Remove Logo
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                          <input
                            type="file"
                            id="logo_upload"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('logo_upload').click()}
                            disabled={uploadingLogo}
                            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                          >
                            {uploadingLogo ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Logo
                              </>
                            )}
                          </Button>
                          <p className="text-sm text-gray-400 mt-2">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6">
                      <h4 className="font-semibold text-blue-300 mb-2">Business Verification</h4>
                      <p className="text-sm text-blue-200">
                        Your business information will be reviewed by our team. Verified businesses get a badge 
                        and appear higher in search results. This process typically takes 1-2 business days.
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
                  <span>Step {currentStep} of 4</span>
                </div>

                {currentStep < 4 ? (
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
                    disabled={isSaving || !validateStep(1) || !validateStep(2) || !validateStep(3)}
                    className="h-12 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Setting up business...
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