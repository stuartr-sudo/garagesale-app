
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Item } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // New Import
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // New Import
import { Search, Users, Package, DollarSign, Mail, Calendar, Eye, UserCheck, Code, Copy, Check, Globe, MapPin, Star } from "lucide-react"; // Star is new
import { format } from "date-fns";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [postcodeFilter, setPostcodeFilter] = useState(""); // New state
  const [countryFilter, setCountryFilter] = useState("all"); // New state
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAPIInfo, setShowAPIInfo] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState("");

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log("Loading users from Supabase profiles table... [v1.0.1 - " + new Date().toISOString() + "]");
      
      // Use direct Supabase query to bypass any entity issues
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_date', { ascending: false });
      
      if (error) {
        console.error("🚨 SUPABASE QUERY FAILED:", error);
        console.error("Error details:", error.message, error.code, error.details);
        throw error;
      }
      
      const allUsers = data || [];
      console.log("Successfully loaded users:", allUsers.length, allUsers);
      setUsers(allUsers);

      // Load statistics for each user
      const stats = {};
      for (const user of allUsers) {
        try {
          // Get user items
          const { data: userItems, error: itemsError } = await supabase
            .from('items')
            .select('*')
            .eq('seller_id', user.id);
          
          if (itemsError) {
            console.warn(`Could not load items for user ${user.id}:`, itemsError);
          }
          
          // Get user transactions
          const { data: userTransactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('seller_id', user.id);
          
          if (transactionsError) {
            console.warn(`Could not load transactions for user ${user.id}:`, transactionsError);
          }
          
          const items = userItems || [];
          const transactions = userTransactions || [];
          
          stats[user.id] = {
            totalItems: items.length,
            activeItems: items.filter(item => item.status === 'active').length,
            soldItems: items.filter(item => item.status === 'sold').length,
            totalRevenue: transactions
              .filter(t => t.status === 'completed')
              .reduce((sum, t) => sum + (t.amount || 0), 0),
            totalListingValue: items
              .filter(item => item.status === 'active')
              .reduce((sum, item) => sum + (item.price || 0), 0)
          };
        } catch (error) {
          console.warn(`Could not load stats for user ${user.id}:`, error);
          stats[user.id] = {
            totalItems: 0,
            activeItems: 0,
            soldItems: 0,
            totalRevenue: 0,
            totalListingValue: 0
          };
        }
      }
      setUserStats(stats);
      console.log("User statistics loaded:", stats);
    } catch (error) {
      console.error("Error loading users:", error);
      // Set empty arrays to prevent crashes
      setUsers([]);
      setUserStats({});
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(user => {
    // Text search filter
    const textMatch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Postcode filter
    const postcodeMatch = !postcodeFilter || 
      user.postcode?.toLowerCase().includes(postcodeFilter.toLowerCase());
    
    // Country filter
    const countryMatch = countryFilter === "all" || user.country === countryFilter;
    
    return textMatch && postcodeMatch && countryMatch;
  });

  // Get unique countries and postcodes for filter dropdowns
  const uniqueCountries = [...new Set(users.map(user => user.country).filter(Boolean))].sort();
  const uniquePostcodes = [...new Set(users.map(user => user.postcode).filter(Boolean))].sort();

  const viewUserDetails = async (user) => {
    try {
      console.log("Loading details for user:", user.id);
      
      // Get user items directly from Supabase
      const { data: userItems, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_date', { ascending: false });
      
      if (itemsError) {
        console.error("Error loading user items:", itemsError);
      }
      
      // Get user transactions directly from Supabase
      const { data: userTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_date', { ascending: false });
      
      if (transactionsError) {
        console.error("Error loading user transactions:", transactionsError);
      }
      
      setSelectedUser({
        ...user,
        items: userItems || [],
        transactions: userTransactions || []
      });
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  };

  const copyToClipboard = (text, endpoint) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedEndpoint(endpoint);
      setTimeout(() => setCopiedEndpoint(""), 2000);
    });
  };

  const apiEndpoints = [
    {
      name: "Process Item Submission",
      endpoint: "/functions/processItemSubmission",
      method: "POST",
      description: "Submit item with images and description for AI processing",
      payload: {
        user_identifier: "user_email@example.com or phone",
        images: ["base64_image_data or image_urls"],
        text_description: "Item description",
        metadata: {
          source: "whatsapp",
          email: "user@example.com",
          phone: "+1234567890"
        }
      }
    },
    {
      name: "Get User Items",
      endpoint: "/functions/getUserItems",
      method: "GET",
      description: "Get all items for a specific user",
      params: "?email=user@example.com or ?phone=+1234567890"
    },
    {
      name: "Update Item Status",
      endpoint: "/functions/updateItemStatus", 
      method: "POST",
      description: "Update item status (active, sold, inactive)",
      payload: {
        item_id: "item_uuid",
        status: "active|sold|inactive|pending",
        user_identifier: "user_email"
      }
    }
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-gray-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-gray-200">
        <div className="p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="rounded-xl bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
              >
                ← Back to Users
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-white">User Details</h1>
                <p className="text-lg text-gray-400">Complete user profile and activity</p>
              </div>
            </div>

            {/* User Profile */}
            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl mb-8">
              <CardHeader className="bg-gradient-to-r from-pink-900/50 to-fuchsia-900/50 border-b border-gray-700">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedUser.full_name?.[0] || 'U'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedUser.full_name}</h2>
                    <p className="text-gray-300">{selectedUser.email}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-400">User ID</label>
                    <p className="font-mono text-sm bg-gray-800 px-2 py-1 rounded text-gray-300">{selectedUser.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Role</label>
                    <Badge variant="secondary" className="bg-emerald-900/50 text-emerald-300 border-emerald-700">
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Member Since</label>
                    <p className="text-sm text-gray-300">{format(new Date(selectedUser.created_date), 'PPP')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Total Revenue</label>
                    <p className="text-lg font-bold text-green-400">
                      ${userStats[selectedUser.id]?.totalRevenue?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Items */}
            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Package className="w-6 h-6 text-emerald-400" />
                  Items ({selectedUser.items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedUser.items?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedUser.items.map((item) => (
                      <div key={item.id} className="bg-gray-800 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold line-clamp-1 text-white">{item.title}</h4>
                          <Badge className={
                            item.status === 'active' ? 'bg-green-900/50 text-green-300 border-green-700' :
                            item.status === 'sold' ? 'bg-blue-900/50 text-blue-300 border-blue-700' :
                            'bg-gray-900/50 text-gray-300 border-gray-700'
                          }>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">${item.price}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {format(new Date(item.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No items listed yet</p>
                )}
              </CardContent>
            </Card>

            {/* User Transactions */}
            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <DollarSign className="w-6 h-6 text-green-400" />
                  Transactions ({selectedUser.transactions?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedUser.transactions?.length > 0 ? (
                  <div className="space-y-4">
                    {selectedUser.transactions.map((transaction) => (
                      <div key={transaction.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">Transaction #{transaction.id.slice(-8)}</p>
                          <p className="text-sm text-gray-400">
                            {format(new Date(transaction.created_date), 'PPP')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-400">${transaction.amount}</p>
                          <Badge className={
                            transaction.status === 'completed' ? 'bg-green-900/50 text-green-300 border-green-700' :
                            transaction.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300 border-yellow-700' :
                            'bg-red-900/50 text-red-300 border-red-700'
                          }>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No transactions yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
              <p className="text-lg text-gray-400">Manage users and track their marketplace activity</p>
            </div>
            {currentUser?.role === 'admin' && (
              <Button
                onClick={() => setShowAPIInfo(!showAPIInfo)}
                variant="outline"
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Code className="w-4 h-4 mr-2" />
                {showAPIInfo ? 'Hide' : 'Show'} API Endpoints
              </Button>
            )}
          </div>

          {/* API Information Panel */}
          {showAPIInfo && currentUser?.role === 'admin' && (
            <Card className="bg-gradient-to-r from-pink-900/30 to-fuchsia-900/30 border-pink-800 mb-8 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-300">
                  <Globe className="w-6 h-6" />
                  API Endpoints for External Integration
                </CardTitle>
                <p className="text-pink-200 text-sm">Use these endpoints to integrate with external services like WhatsApp, messaging bots, or mobile apps.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {apiEndpoints.map((api, index) => (
                  <div key={index} className="bg-gray-900/80 rounded-xl p-4 border border-gray-800">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white mb-1">{api.name}</h4>
                        <p className="text-sm text-gray-400 mb-2">{api.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-pink-900/50 text-pink-300 border-pink-700">
                            {api.method}
                          </Badge>
                          <code className="bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-300">
                            {typeof window !== 'undefined' ? window.location.origin : ''}{api.endpoint}{api.params || ''}
                          </code>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}${api.endpoint}`, api.endpoint)}
                        className="ml-4 bg-gray-800 border-gray-700 hover:bg-gray-700"
                      >
                        {copiedEndpoint === api.endpoint ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {api.payload && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-400 mb-2">Example Payload:</p>
                        <pre className="bg-gray-800 p-3 rounded-lg text-xs overflow-x-auto text-gray-300">
                          {JSON.stringify(api.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="bg-blue-900/30 border border-blue-800 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-300 mb-2">Authentication Notes:</h4>
                  <ul className="text-sm text-blue-200 space-y-1 list-disc list-inside">
                    <li>External APIs don't require authentication headers</li>
                    <li>User identification is done via email or phone in the payload</li>
                    <li>Users must exist in the system before submitting items</li>
                    <li>Images can be sent as base64 data or URLs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-800 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Users</p>
                    <p className="text-3xl font-bold text-white">{users.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-800 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Active Sellers</p>
                    <p className="text-3xl font-bold text-white">
                      {Object.values(userStats).filter(stat => stat.activeItems > 0).length}
                    </p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-800 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Items</p>
                    <p className="text-3xl font-bold text-white">
                      {Object.values(userStats).reduce((sum, stat) => sum + stat.totalItems, 0)}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-cyan-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-800 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                    <p className="text-3xl font-bold text-white">
                      ${Object.values(userStats).reduce((sum, stat) => sum + stat.totalRevenue, 0).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-fuchsia-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-800 rounded-2xl mb-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Main Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search users by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-gray-800 border-gray-700 focus:border-pink-500 focus:ring-pink-500 rounded-xl text-lg text-white placeholder-gray-400"
                  />
                </div>
                
                {/* Filter Row */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="postcode-filter" className="text-sm font-medium text-gray-400 mb-2 block">Filter by Postcode</Label>
                    <Input
                      id="postcode-filter"
                      placeholder="Enter postcode..."
                      value={postcodeFilter}
                      onChange={(e) => setPostcodeFilter(e.target.value)}
                      className="h-10 rounded-xl border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <Label htmlFor="country-filter" className="text-sm font-medium text-gray-400 mb-2 block">Filter by Country</Label>
                    <Select value={countryFilter} onValueChange={setCountryFilter}>
                      <SelectTrigger id="country-filter" className="h-10 rounded-xl border-gray-700 bg-gray-800 text-white">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all" className="text-white hover:bg-gray-700">All Countries</SelectItem>
                        {uniqueCountries.map(country => (
                          <SelectItem key={country} value={country} className="text-white hover:bg-gray-700">
                            {country === 'US' ? 'United States' :
                             country === 'CA' ? 'Canada' :
                             country === 'GB' ? 'United Kingdom' :
                             country === 'AU' ? 'Australia' :
                             country === 'DE' ? 'Germany' :
                             country === 'FR' ? 'France' :
                             country || 'Unknown'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setPostcodeFilter("");
                        setCountryFilter("all");
                      }}
                      className="h-10 px-4 rounded-xl bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
                
                {/* Quick Postcode Buttons */}
                {uniquePostcodes.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-400">Quick Postcode Filters:</Label>
                    <div className="flex flex-wrap gap-2">
                      {uniquePostcodes.slice(0, 10).map(postcode => (
                        <Button
                          key={postcode}
                          variant="outline"
                          size="sm"
                          onClick={() => setPostcodeFilter(postcode)}
                          className={`text-xs rounded-full ${
                            postcodeFilter === postcode 
                              ? 'bg-pink-900/50 text-pink-300 border-pink-700' 
                              : 'hover:bg-gray-700 bg-gray-800 border-gray-700 text-gray-300'
                          }`}
                        >
                          {postcode}
                        </Button>
                      ))}
                      {uniquePostcodes.length > 10 && (
                        <span className="text-xs text-gray-400 flex items-center px-2">
                          +{uniquePostcodes.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <p className="text-gray-300 font-medium">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
                {(postcodeFilter || countryFilter !== "all") && (
                  <span className="text-gray-400 ml-2">
                    (filtered from {users.length} total)
                  </span>
                )}
              </p>
              
              {/* Active Filters Display */}
              <div className="flex gap-2">
                {postcodeFilter && (
                  <Badge variant="secondary" className="bg-pink-900/50 text-pink-300 border-pink-700">
                    Postcode: {postcodeFilter}
                    <button 
                      onClick={() => setPostcodeFilter("")}
                      className="ml-1 text-pink-300 hover:text-pink-200"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {countryFilter !== "all" && (
                  <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-700">
                    Country: {countryFilter === 'US' ? 'United States' :
                             countryFilter === 'CA' ? 'Canada' :
                             countryFilter === 'GB' ? 'United Kingdom' :
                             countryFilter === 'AU' ? 'Australia' :
                             countryFilter === 'DE' ? 'Germany' :
                             countryFilter === 'FR' ? 'France' :
                             countryFilter}
                    <button 
                      onClick={() => setCountryFilter("all")}
                      className="ml-1 text-blue-300 hover:text-blue-200"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => {
              const stats = userStats[user.id] || {};
              return (
                <Card key={user.id} className="bg-gray-900/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-800 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-800/50 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.full_name?.[0] || 'U'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-white line-clamp-1">
                            {user.full_name || 'Anonymous User'}
                          </h3>
                          <p className="text-sm text-gray-300 line-clamp-1">{user.email}</p>
                        </div>
                      </div>
                      {user.rating_count > 0 && (
                        <Badge variant="secondary" className="bg-amber-900/50 text-amber-300 border-amber-700 flex items-center gap-1">
                           <Star className="w-3 h-3 text-amber-400" />
                           <span>{user.average_rating?.toFixed(1)} ({user.rating_count})</span>
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Location Info */}
                    {(user.postcode || user.country || user.city) && (
                      <div className="bg-gray-800 rounded-xl p-3 mb-4">
                        <div className="flex items-start gap-2 text-sm text-gray-300">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-white">
                              {user.city && <span>{user.city}</span>}
                              {user.city && user.postcode && <span>, </span>}
                              {user.postcode && (
                                <span className="font-mono">{user.postcode}</span>
                              )}
                            </div>
                            {user.country && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                {user.country === 'US' ? 'United States' :
                                 user.country === 'CA' ? 'Canada' :
                                 user.country === 'GB' ? 'United Kingdom' :
                                 user.country === 'AU' ? 'Australia' :
                                 user.country === 'DE' ? 'Germany' :
                                 user.country === 'FR' ? 'France' :
                                 user.country}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Items Listed</p>
                        <p className="text-2xl font-bold text-white">{stats.totalItems || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Items Sold</p>
                        <p className="text-2xl font-bold text-green-400">{stats.soldItems || 0}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-fuchsia-400">
                        ${stats.totalRevenue?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {format(new Date(user.created_date), 'MMM yyyy')}</span>
                    </div>

                    <Button
                      onClick={() => viewUserDetails(user)}
                      className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 rounded-xl"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-24 h-24 text-gray-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
              <p className="text-gray-400 mb-4">
                {postcodeFilter || countryFilter !== "all" 
                  ? "Try adjusting your filters or search query"
                  : "Try adjusting your search query"
                }
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setPostcodeFilter("");
                  setCountryFilter("all");
                }}
                className="bg-gray-800 hover:bg-gray-700 border-gray-700 text-white"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
