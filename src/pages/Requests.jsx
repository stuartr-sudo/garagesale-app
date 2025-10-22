
import React, { useState, useEffect } from "react";
import { Request } from "@/api/entities";
import { User } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Corrected: Removed 's' from Button's
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, DollarSign, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import RequestCard from "../components/requests/RequestCard";
import ContactRequestModal from "../components/requests/ContactRequestModal";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requesters, setRequesters] = useState({});

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const requestsData = await Request.filter({ status: "active" }, "-created_date");
      setRequests(requestsData);
      
      // Load requester information
      const requesterIds = [...new Set(requestsData.map(req => req.requester_id))];
      const requestersData = {};
      
      for (const requesterId of requesterIds) {
        try {
          if (requesterId && !requesterId.startsWith('demo_requester_')) {
            const requester = await User.get(requesterId);
            requestersData[requesterId] = requester;
          } else {
            // Create fake requester data for demo
            requestersData[requesterId] = {
              id: requesterId,
              full_name: `Demo User ${requesterId.split('_')[2] || '1'}`,
              email: `${requesterId}@demo.com`
            };
          }
        } catch (error) {
          console.warn(`Could not load requester ${requesterId}:`, error);
          requestersData[requesterId] = {
            id: requesterId,
            full_name: 'Anonymous User',
            email: 'anonymous@marketplace.com'
          };
        }
      }
      setRequesters(requestersData);
    } catch (error) {
      console.error("Error loading requests:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, selectedCategory, urgencyFilter]);

  const filterRequests = () => {
    let filtered = requests;

    if (searchQuery) {
      filtered = filtered.filter(request => 
        request.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(request => request.category === selectedCategory);
    }

    if (urgencyFilter !== "all") {
      filtered = filtered.filter(request => request.urgency === urgencyFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleContactRequest = (request) => {
    setSelectedRequest(request);
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "home_repair", label: "Home Repair" },
    { value: "cleaning", label: "Cleaning" },
    { value: "gardening", label: "Gardening" },
    { value: "moving", label: "Moving" },
    { value: "handyman", label: "Handyman" },
    { value: "tutoring", label: "Tutoring" },
    { value: "pet_care", label: "Pet Care" },
    { value: "delivery", label: "Delivery" },
    { value: "tech_support", label: "Tech Support" },
    { value: "creative", label: "Creative" },
    { value: "other", label: "Other" }
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden">
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Work Requests</h1>
              <p className="text-lg text-gray-400">Find local jobs and tasks in your community</p>
            </div>
            <Link to={createPageUrl("AddRequest")}>
              <Button className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg hover:shadow-pink-500/20 transition-all duration-300 h-12 px-6 rounded-xl">
                <Plus className="w-5 h-5 mr-2" />
                Post a Request
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-800 p-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Search Input */}
              <div className="relative lg:col-span-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <Input
                  placeholder="Search requests, skills needed, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 w-full h-12 bg-gray-800 border-gray-700 focus:border-pink-500 focus:ring-pink-500 rounded-xl text-lg text-white placeholder-gray-400"
                />
              </div>
              
              {/* Category Filter */}
              <div className="lg:col-span-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full h-12 bg-gray-800 border-gray-700 rounded-xl text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="hover:bg-gray-700">{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Urgency Filter */}
              <div className="lg:col-span-3">
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="w-full h-12 bg-gray-800 border-gray-700 rounded-xl text-white">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="all" className="hover:bg-gray-700">All</SelectItem>
                    <SelectItem value="low" className="hover:bg-gray-700">Low</SelectItem>
                    <SelectItem value="medium" className="hover:bg-gray-700">Medium</SelectItem>
                    <SelectItem value="high" className="hover:bg-gray-700">High</SelectItem>
                    <SelectItem value="urgent" className="hover:bg-gray-700">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400 font-medium">
              {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} available
            </p>
            <Badge variant="outline" className="bg-cyan-900/50 text-cyan-400 border-cyan-800">
              {requests.length} total requests
            </Badge>
          </div>

          {/* Requests Grid */}
          {filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  requester={requesters[request.requester_id]}
                  onContact={() => handleContactRequest(request)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No requests found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setUrgencyFilter("all");
                }}
                variant="outline"
                className="bg-gray-800 hover:bg-gray-700 border-gray-700 text-white"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      {selectedRequest && (
        <ContactRequestModal
          request={selectedRequest}
          requester={requesters[selectedRequest.requester_id]}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
