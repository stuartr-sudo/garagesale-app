import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  DollarSign,
  Grid3x3,
  Star,
  TrendingUp,
  Target
} from 'lucide-react';
import { User } from '@/api/entities';

export default function SearchFilters({ onFilterChange, itemCount }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [condition, setCondition] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState('date_desc');
  const [location, setLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [locationScope, setLocationScope] = useState('my_postcode'); // 'my_postcode', 'nationwide'
  const [userPostcode, setUserPostcode] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'books', label: 'Books' },
    { value: 'toys', label: 'Toys & Games' },
    { value: 'sports', label: 'Sports & Outdoors' },
    { value: 'home_garden', label: 'Home & Garden' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'other', label: 'Other' }
  ];

  const conditions = [
    { value: 'all', label: 'All Conditions' },
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'for_parts', label: 'For Parts' }
  ];

  const sortOptions = [
    { value: 'date_desc', label: 'Newest First' },
    { value: 'date_asc', label: 'Oldest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'views', label: 'Most Viewed' }
  ];

  // Load user's postcode on component mount
  useEffect(() => {
    loadUserPostcode();
  }, []);

  const loadUserPostcode = async () => {
    setIsLoadingUser(true);
    try {
      const user = await User.me();
      if (user && user.postcode) {
        setUserPostcode(user.postcode);
        // Automatically set location to user's postcode by default
        setLocation(user.postcode);
      }
    } catch (error) {
      console.log('User not logged in or postcode not set:', error);
      // If user is not logged in or has no postcode, default to nationwide
      setLocationScope('nationwide');
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, category, condition, priceRange, sortBy, location, locationScope]);

  const applyFilters = () => {
    // Determine the actual location filter value based on scope
    let locationFilter = null;
    if (locationScope === 'my_postcode' && userPostcode) {
      locationFilter = userPostcode;
    } else if (locationScope === 'custom' && location) {
      locationFilter = location;
    }
    // If 'nationwide', locationFilter stays null

    onFilterChange({
      searchTerm,
      category: category === 'all' ? null : category,
      condition: condition === 'all' ? null : condition,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sortBy,
      location: locationFilter
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategory('all');
    setCondition('all');
    setPriceRange([0, 10000]);
    setSortBy('date_desc');
    setLocation('');
    setLocationScope('my_postcode'); // Reset to default
  };

  const handleLocationScopeChange = (value) => {
    setLocationScope(value);
    if (value === 'my_postcode' && userPostcode) {
      setLocation(userPostcode);
    } else if (value === 'nationwide') {
      setLocation('');
    }
    // If 'custom', keep the current location value
  };

  const activeFiltersCount = [
    searchTerm,
    category !== 'all',
    condition !== 'all',
    priceRange[0] > 0 || priceRange[1] < 10000,
    locationScope === 'custom' && location, // Only count custom location as active filter
    locationScope === 'nationwide' // Count nationwide as active filter
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search Bar & Quick Actions */}
      <Card className="card-gradient card-glow">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items..."
                className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500 h-12"
              />
            </div>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-gray-900 border-gray-700 text-white h-12">
                <TrendingUp className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                {sortOptions.map(option => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-white hover:bg-cyan-600 hover:text-white focus:bg-cyan-600 focus:text-white cursor-pointer"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 h-12 relative"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-pink-500 text-white">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="card-gradient card-glow">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                Advanced Filters
              </h3>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-pink-400 hover:text-pink-300 hover:bg-pink-900/20"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4 text-cyan-400" />
                  Category
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    {categories.map(cat => (
                      <SelectItem 
                        key={cat.value} 
                        value={cat.value}
                        className="text-white hover:bg-cyan-600 hover:text-white focus:bg-cyan-600 focus:text-white cursor-pointer"
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Star className="w-4 h-4 text-cyan-400" />
                  Condition
                </label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    {conditions.map(cond => (
                      <SelectItem 
                        key={cond.value} 
                        value={cond.value}
                        className="text-white hover:bg-cyan-600 hover:text-white focus:bg-cyan-600 focus:text-white cursor-pointer"
                      >
                        {cond.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Scope Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  Location Scope
                </label>
                <Select 
                  value={locationScope} 
                  onValueChange={handleLocationScopeChange}
                  disabled={isLoadingUser}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    {userPostcode && (
                      <SelectItem 
                        value="my_postcode"
                        className="text-white hover:bg-cyan-600 hover:text-white focus:bg-cyan-600 focus:text-white cursor-pointer"
                      >
                        My Postcode ({userPostcode})
                      </SelectItem>
                    )}
                    <SelectItem 
                      value="nationwide"
                      className="text-white hover:bg-cyan-600 hover:text-white focus:bg-cyan-600 focus:text-white cursor-pointer"
                    >
                      Nationwide
                    </SelectItem>
                    <SelectItem 
                      value="custom"
                      className="text-white hover:bg-cyan-600 hover:text-white focus:bg-cyan-600 focus:text-white cursor-pointer"
                    >
                      Custom Location
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Location Input - Only show when 'custom' is selected */}
              {locationScope === 'custom' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    Custom Location
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, State, or Postcode"
                    className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                  />
                </div>
              )}
            </div>

            {/* Price Range Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                  Price Range
                </label>
                <div className="text-sm text-cyan-400 font-semibold">
                  ${priceRange[0]} - ${priceRange[1] === 10000 ? '10,000+' : priceRange[1]}
                </div>
              </div>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={10000}
                step={50}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>$0</span>
                <span>$10,000+</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-400 px-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span>
            Showing <span className="text-cyan-400 font-semibold">{itemCount}</span> items
            {activeFiltersCount > 0 && (
              <span className="ml-2">
                with <span className="text-pink-400 font-semibold">{activeFiltersCount}</span> {activeFiltersCount === 1 ? 'filter' : 'filters'} applied
              </span>
            )}
          </span>
          {locationScope === 'my_postcode' && userPostcode && (
            <Badge className="bg-cyan-900 text-cyan-300 border border-cyan-700 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Local to {userPostcode}
            </Badge>
          )}
          {locationScope === 'nationwide' && (
            <Badge className="bg-purple-900 text-purple-300 border border-purple-700 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              All Locations
            </Badge>
          )}
          {locationScope === 'custom' && location && (
            <Badge className="bg-pink-900 text-pink-300 border border-pink-700 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Near {location}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

