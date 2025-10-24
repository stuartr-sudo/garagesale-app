import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SellerBalanceWidget({ userId }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    loadBalance();
  }, [userId]);

  const loadBalance = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('seller_balance')
        .eq('id', userId)
        .single();

      setBalance(profile?.seller_balance || 0);
    } catch (error) {
      console.error("Error loading balance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-800">
        <CardContent className="p-3">
          <div className="h-16 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link to={createPageUrl("Settings")}>
      <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-800 hover:border-green-600 transition-colors cursor-pointer group">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Seller Balance</p>
                <p className="text-lg font-bold text-green-400 group-hover:text-green-300 transition-colors">
                  {showBalance ? `$${balance.toFixed(2)}` : '••••'}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowBalance(!showBalance);
              }}
              className="p-1 hover:bg-green-800/30 rounded transition-colors"
            >
              {showBalance ? (
                <Eye className="w-4 h-4 text-gray-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {balance > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span>Click to view earnings</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

