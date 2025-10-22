import React, { useState, useEffect } from "react";
import { Item } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Frown } from "lucide-react";
import { createStripeCheckoutSession } from "@/api/functions";
import StoreItemCard from "../components/store/StoreItemCard";

// This page displays all available products for purchase.
export default function StorePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(null); // Track which item is redirecting

  useEffect(() => {
    // Fetch all 'active' items from the database that have a stripe_price_id
    const loadItems = async () => {
      try {
        const allItems = await Item.filter({ status: "active" });
        // Filter for items that are integrated with Stripe
        const stripeItems = allItems.filter(item => item.stripe_price_id);
        setItems(stripeItems);
      } catch (error) {
        console.error("Failed to load items:", error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  // Function to handle the purchase of an item.
  const handlePurchase = async (priceId) => {
    setIsRedirecting(priceId);
    try {
      // Call the backend function to create a Stripe Checkout session.
      const { data } = await createStripeCheckoutSession({ price_id: priceId });
      // Redirect the customer to the Stripe-hosted checkout page.
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      setIsRedirecting(null);
      alert("Error: Could not initiate purchase.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-slate-700 rounded-2xl shadow-sm border border-slate-600 overflow-hidden">
                  <div className="aspect-square bg-slate-600"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                    <div className="h-8 bg-slate-600 rounded"></div>
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
    <div className="min-h-screen bg-slate-800 text-white">
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Storefront</h1>
            <p className="text-lg text-gray-400">Exclusive products, ready for purchase</p>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Frown className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">The Store is Empty</h3>
              <p className="text-gray-400">No products available at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <StoreItemCard
                  key={item.id}
                  item={item}
                  onPurchase={handlePurchase}
                  isRedirecting={isRedirecting === item.stripe_price_id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}