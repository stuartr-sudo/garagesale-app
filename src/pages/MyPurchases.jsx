import React, { useState, useEffect } from "react";
import { Transaction } from "@/api/entities";
import { Item } from "@/api/entities";
import { User } from "@/api/entities";
import { Rating } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Star, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import RatingModal from "../components/ratings/RatingModal";

export default function MyPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingTransaction, setRatingTransaction] = useState(null);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      const userTransactions = await Transaction.filter({ buyer_id: user.id, status: "completed" }, "-created_at");
      
      const purchaseDetails = await Promise.all(
        userTransactions.map(async (transaction) => {
          const item = await Item.get(transaction.item_id);
          const seller = await User.get(transaction.seller_id);
          const rating = await Rating.filter({ transaction_id: transaction.id, rated_by_user_id: user.id });
          return { transaction, item, seller, hasRated: rating.length > 0 };
        })
      );

      setPurchases(purchaseDetails);
    } catch (error) {
      console.error("Error loading purchases:", error);
    }
    setLoading(false);
  };
  
  if (loading) {
    return <div className="p-8">Loading your purchases...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-white">
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <ShoppingCart className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-4xl font-bold text-stone-900">My Purchases</h1>
              <p className="text-lg text-stone-600 mt-1">Track your orders and rate your sellers.</p>
            </div>
          </div>
          
          {purchases.length > 0 ? (
            <div className="space-y-6">
              {purchases.map(({ transaction, item, seller, hasRated }) => (
                <Card key={transaction.id} className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
                  <CardContent className="p-6 flex flex-col md:flex-row gap-6">
                    <img src={item.image_urls?.[0]} alt={item.title} className="w-full md:w-32 h-32 object-cover rounded-xl"/>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{item.title}</h3>
                      <p className="text-sm text-stone-600">Purchased on {format(new Date(transaction.created_at), 'PPP')}</p>
                      <p className="text-lg font-semibold text-emerald-600 mt-1">${transaction.amount.toFixed(2)}</p>
                       <p className="text-sm text-stone-500 mt-2">Sold by: {seller.full_name}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      {hasRated ? (
                         <div className="flex items-center gap-2 text-amber-500 bg-amber-50 px-3 py-2 rounded-lg">
                           <Star className="w-5 h-5"/>
                           <span>Rated</span>
                         </div>
                      ) : (
                        <Button onClick={() => setRatingTransaction(transaction)}>
                          <Star className="w-4 h-4 mr-2" />
                          Rate Seller
                        </Button>
                      )}
                      <Button variant="outline"><MessageSquare className="w-4 h-4 mr-2"/>Contact Seller</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold">No purchases yet!</h3>
              <p className="text-stone-600 mt-2 mb-4">Start exploring the marketplace to find great deals.</p>
              <Link to={createPageUrl("Marketplace")}>
                <Button>Browse Marketplace</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      {ratingTransaction && (
        <RatingModal
          transaction={ratingTransaction}
          role="buyer_rating_seller"
          onClose={() => setRatingTransaction(null)}
          onRatingSuccess={loadPurchases}
        />
      )}
    </div>
  );
}