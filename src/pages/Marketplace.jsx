
import React, { useState, useEffect } from "react";
import { Item } from "@/api/entities";
import { User } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, ShoppingCart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import ItemCard from "../components/marketplace/ItemCard";
import PurchaseModal from "../components/marketplace/PurchaseModal";
import AdBanner from "../components/marketplace/AdBanner";
import AdModal from "../components/marketplace/AdModal"; // Added import
import OnboardingTour from "../components/onboarding/OnboardingTour";
import SearchFilters from "../components/marketplace/SearchFilters";
import { supabase } from '@/lib/supabase';

// Define a set of demo items to display if no real items are available
const DEMO_ITEMS = [
{
  id: "demo_item_1",
  title: "Vintage Leather Chair",
  description: "A beautifully aged leather armchair, perfect for your reading nook. Minor wear and tear.",
  price: 150,
  category: "furniture",
  status: "active",
  seller_id: "demo_seller_1",
  image_url: "https://images.unsplash.com/photo-1592078619227-da1917f7b3e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  tags: ["vintage", "leather", "chair", "furniture"]
},
{
  id: "demo_item_2",
  title: "Smartwatch X200",
  description: "Stay connected and track your fitness with this sleek smartwatch. Brand new, in original packaging.",
  price: 85,
  category: "electronics",
  status: "active",
  seller_id: "demo_seller_2",
  image_url: "https://images.unsplash.com/photo-1546868871-70417937397b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  created_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  tags: ["smartwatch", "fitness", "electronics", "wearable"]
},
{
  id: "demo_item_3",
  title: "Botanical Print Set (4)",
  description: "Set of four framed botanical prints, ideal for adding a touch of nature to any room. High quality frames included.",
  price: 40,
  category: "home_garden",
  status: "active",
  seller_id: "demo_seller_3",
  image_url: "https://images.unsplash.com/photo-1563299292-0b3a3b0b5e2a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  created_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  tags: ["art", "decor", "prints", "home"]
},
{
  id: "demo_item_4",
  title: "Classic Acoustic Guitar",
  description: "Well-maintained acoustic guitar, perfect for beginners or casual play. Comes with soft case. FREE!",
  price: 0,
  category: "other",
  status: "active",
  seller_id: "demo_seller_1",
  image_url: "https://images.unsplash.com/photo-1560707765-b1a9e70198f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  created_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  tags: ["music", "instrument", "guitar", "free"]
},
{
  id: "demo_item_5",
  title: "Children's Story Books Bundle",
  description: "A collection of 10 popular children's story books. Great for young readers, various titles.",
  price: 25,
  category: "books",
  status: "active",
  seller_id: "demo_seller_2",
  image_url: "https://images.unsplash.com/photo-1532012195217-5735ae15a317?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  created_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  tags: ["kids", "books", "reading", "education"]
},
{
  id: "demo_item_6",
  title: "High-Performance Running Shoes",
  description: "Lightly used running shoes, size 9, excellent condition. Ideal for jogging or track.",
  price: 60,
  category: "sports",
  status: "active",
  seller_id: "demo_seller_3",
  image_url: "https://images.unsplash.com/photo-1552346152-47535b91b5c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  created_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
  tags: ["shoes", "running", "sports", "athletic"]
},
{
  id: "demo_item_7",
  title: "Collectable Vintage Stamps",
  description: "Rare collection of stamps from various countries, 1950s-1970s. Includes historical events.",
  price: 120,
  category: "collectibles",
  status: "active",
  seller_id: "demo_seller_1",
  image_url: "https://images.unsplash.com/photo-1627962137976-79b8a5d3f2d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  created_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
  tags: ["stamps", "vintage", "collectibles", "hobby"]
},
{
  id: "demo_item_8",
  title: "Durable Outdoor Backpack",
  description: "Spacious and weather-resistant backpack, perfect for hiking and camping. Multiple compartments.",
  price: 75,
  category: "sports",
  status: "active",
  seller_id: "demo_seller_2",
  image_url: "https://images.unsplash.com/photo-1542152814-1e25776d5e18?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  created_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
  tags: ["backpack", "hiking", "outdoor", "camping"]
},
{
  id: "demo_item_9",
  title: "Antique Wall Clock",
  description: "Beautifully preserved antique wall clock, still in working condition. Hand-carved details.",
  price: 200,
  category: "home_garden",
  status: "active",
  seller_id: "demo_seller_3",
  image_url: "https://images.unsplash.com/photo-1598463162818-f29e9d6d8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  created_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
  tags: ["antique", "clock", "decor", "vintage"]
},
{
  id: "demo_item_10",
  title: "Beginner's Chess Set",
  description: "Full wooden chess set with instructional booklet, great for learning. All pieces intact.",
  price: 30,
  category: "toys",
  status: "active",
  seller_id: "demo_seller_1",
  image_url: "https://images.unsplash.com/photo-1529699211952-73604f23b275?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  created_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  tags: ["chess", "game", "toy", "boardgame"]
}];



export default function Marketplace() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [sellers, setSellers] = useState({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    category: null,
    condition: null,
    minPrice: 0,
    maxPrice: 10000,
    sortBy: 'date_desc',
    location: null
  });

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    // Check if user has completed the tour
    const tourCompleted = localStorage.getItem('garagesale-tour-completed');
    if (!tourCompleted) {
      // Delay showing tour slightly to let the page load
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      let itemsData = await Item.filter({ status: "active" }, "-created_date");

      // If no real items are found, populate with demo items
      if (itemsData.length === 0) {
        itemsData = DEMO_ITEMS;
      }

      setItems(itemsData);

      // Load seller information for real users only
      const sellerIds = [...new Set(itemsData.map((item) => item.seller_id))];
      const sellersData = {};

      for (const sellerId of sellerIds) {
        try {
          // Skip fake demo seller IDs
          if (sellerId && !sellerId.startsWith('demo_seller_')) {
            const seller = await User.get(sellerId);
            sellersData[sellerId] = seller;
          } else {
            // Create fake seller data for demo items
            sellersData[sellerId] = {
              id: sellerId,
              full_name: `Demo Seller ${sellerId.split('_')[2] || '1'}`,
              email: `${sellerId}@demo.com`
            };
          }
        } catch (error) {
          console.warn(`Could not load seller ${sellerId}:`, error);
          // Create fallback seller data
          sellersData[sellerId] = {
            id: sellerId,
            full_name: 'Anonymous Seller',
            email: 'anonymous@marketplace.com'
          };
        }
      }
      setSellers(sellersData);
      // Apply initial filters to items
      applyFilters(itemsData, filters);
    } catch (error) {
      console.error("Error loading items:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Check for payment success/failure in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      // Show success message
      alert('Payment successful! The seller will contact you soon.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Reload items to reflect the sold item
      loadItems();
    } else if (paymentStatus === 'cancelled') {
      // Show cancelled message
      alert('Payment was cancelled. You can try again anytime.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    applyFilters(items, newFilters);
  };

  const applyFilters = (itemsList, filterOptions) => {
    let filtered = [...itemsList];

    // Search term filter
    if (filterOptions.searchTerm) {
      const searchLower = filterOptions.searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.title?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (filterOptions.category) {
      filtered = filtered.filter((item) => item.category === filterOptions.category);
    }

    // Condition filter
    if (filterOptions.condition) {
      filtered = filtered.filter((item) => item.condition === filterOptions.condition);
    }

    // Price range filter
    filtered = filtered.filter((item) => {
      const price = parseFloat(item.price) || 0;
      return price >= filterOptions.minPrice && price <= filterOptions.maxPrice;
    });

    // Location filter (basic substring match)
    if (filterOptions.location) {
      const locationLower = filterOptions.location.toLowerCase();
      filtered = filtered.filter((item) =>
        item.location?.toLowerCase().includes(locationLower) ||
        item.postcode?.toLowerCase().includes(locationLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filterOptions.sortBy) {
        case 'date_desc':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'date_asc':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'price_asc':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price_desc':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'popular':
          return (b.view_count || 0) - (a.view_count || 0);
        case 'views':
          return (b.view_count || 0) - (a.view_count || 0);
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
  };

  const handlePurchase = (item) => {
    setSelectedItem(item);
  };

  const handleAdClick = (ad) => {
    setSelectedAd(ad);
  };

  const categories = [
  { value: "all", label: "All Categories" },
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "furniture", label: "Furniture" },
  { value: "books", label: "Books" },
  { value: "toys", label: "Toys" },
  { value: "sports", label: "Sports" },
  { value: "home_garden", label: "Home & Garden" },
  { value: "automotive", label: "Automotive" },
  { value: "collectibles", label: "Collectibles" },
  { value: "other", label: "Other" }];


  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-900 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) =>
              <div key={i} className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden">
                  <div className="aspect-square bg-gray-800"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-800 rounded"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Local Marketplace</h1>
            <p className="text-lg text-gray-400">Discover unique items from your community</p>
          </div>

          {/* Top Banner Ad */}
          <AdBanner placement="top_banner" onAdClick={handleAdClick} className="mb-8" />

          {/* Search and Filters - New Component */}
          <div className="mb-8" data-tour="filters">
            <SearchFilters 
              onFilterChange={handleFilterChange}
              itemCount={filteredItems.length}
            />
          </div>

          {/* Items Grid with Ads */}
          {filteredItems.length > 0 ?
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item, index) =>
            <React.Fragment key={item.id}>
                  <div data-tour={index === 0 ? "item-card" : undefined}>
                    <ItemCard
                      item={item}
                      seller={sellers[item.seller_id]} />
                  </div>

                  
                  {/* Insert local deal ad as regular card at position 3 */}
                  {index === 2 &&
              <AdBanner placement="local_deals" onAdClick={handleAdClick} />
              }

                  {/* Insert ad after every 6 items */}
                  {(index + 1) % 6 === 0 &&
              <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                      <AdBanner placement="between_items" onAdClick={handleAdClick} />
                    </div>
              }
                  
                  {/* Insert featured ad as regular card at position 8 */}
                  {index === 7 &&
              <AdBanner placement="bottom_banner" onAdClick={handleAdClick} />
              }
                </React.Fragment>
            )}
            </div> :

          <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No items found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
              <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setPriceRange("all");
                setShowFreeOnly(false);
              }}
              variant="outline"
              className="bg-gray-800 hover:bg-gray-700 border-gray-700 text-white">

                Clear all filters
              </Button>
            </div>
          }
        </div>
      </div>

      {selectedItem &&
      <PurchaseModal
        item={selectedItem}
        seller={sellers[selectedItem.seller_id]}
        onClose={() => setSelectedItem(null)}
        onSuccess={() => {
          setSelectedItem(null);
          loadItems();
        }} />

      }

      {selectedAd &&
      <AdModal
        ad={selectedAd}
        onClose={() => setSelectedAd(null)} />

      }

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>);

}
