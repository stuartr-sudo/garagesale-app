
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User as UserIcon, Save, MapPin, Globe } from "lucide-react";

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
    collection_address: ""
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const needsOnboarding = !user.country || !user.postcode;
      setIsOnboarding(needsOnboarding);
      
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        country: user.country || "",
        state_region: user.state_region || "",
        city: user.city || "",
        postcode: user.postcode || "",
        phone: user.phone || "",
        collection_address: user.collection_address || ""
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
        collection_address: formData.collection_address
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
                      <Label htmlFor="state_region" className="text-gray-300">
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
