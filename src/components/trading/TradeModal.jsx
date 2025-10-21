
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "@/api/entities";
import { Item } from "@/api/entities";
import { TradeProposal } from "@/api/entities";
import { RefreshCw, Plus, X, DollarSign, ArrowRight } from "lucide-react";

export default function TradeModal({ targetItem, targetSeller, onClose }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userItems, setUserItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [cashAmount, setCashAmount] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // Load user's active items
      const items = await Item.filter({ 
        seller_id: user.id, 
        status: "active" 
      }, "-created_date");
      
      setUserItems(items);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
    setLoading(false);
  };

  const handleSelectItem = (item) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    
    if (isSelected) {
      setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems(prev => [...prev, item]);
    }
  };

  const calculateTotalValue = () => {
    const itemsValue = selectedItems.reduce((sum, item) => sum + (item.price || 0), 0);
    return itemsValue + (cashAmount || 0);
  };

  const handleSubmitTrade = async () => {
    if (selectedItems.length === 0 && Number(cashAmount) <= 0) {
      alert("Please select at least one item or add cash to your offer");
      return;
    }

    setIsSubmitting(true);
    try {
      const offeredItemsData = selectedItems.map(item => ({
        item_id: item.id,
        item_title: item.title,
        item_price: item.price,
        item_image_url: item.image_urls?.[0] || ''
      }));

      const totalOfferedValue = selectedItems.reduce((sum, item) => sum + item.price, 0) + Number(cashAmount);
      
      // Set expiration to 60 minutes from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await TradeProposal.create({
        target_item_id: targetItem.id,
        proposer_user_id: currentUser.id,
        target_user_id: targetSeller.id,
        offered_items: offeredItemsData,
        cash_amount: Number(cashAmount),
        message: message,
        total_offered_value: totalOfferedValue,
        expires_at: expiresAt,
      });

      alert('Trade offer sent successfully! It will expire in 60 minutes.');
      onClose();
    } catch (error) {
      console.error("Error submitting trade proposal:", error);
      alert("Error sending trade proposal. Please try again.");
    }
    setIsSubmitting(false);
  };

  const primaryImage = targetItem.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-gray-900/95 border-gray-700 shadow-xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-gray-900/95 border-gray-700 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-white">
            <RefreshCw className="w-6 h-6 text-purple-400" />
            Propose a Trade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Target Item */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">You want:</h3>
            <div className="flex gap-4 items-center">
              <img
                src={primaryImage}
                alt={targetItem.title}
                className="w-20 h-20 object-cover rounded-xl"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                }}
              />
              <div className="flex-1">
                <h4 className="font-bold text-white text-lg">{targetItem.title}</h4>
                <p className="text-gray-400 text-sm">by {targetSeller?.full_name}</p>
                <p className="text-2xl font-bold text-green-400">${targetItem.price}</p>
              </div>
            </div>
          </div>

          {/* Your Offer */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Your offer:</h3>
            
            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-300 mb-3">Selected Items:</h4>
                <div className="flex flex-wrap gap-3">
                  {selectedItems.map((item) => (
                    <Card key={item.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-3 flex items-center gap-3">
                        <img
                          src={item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop"}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{item.title}</p>
                          <p className="text-green-400 font-bold">${item.price}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSelectItem(item)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Cash Amount */}
            <div className="mb-6">
              <Label htmlFor="cash" className="text-gray-300">Additional Cash (optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="cash"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Trade Value Summary */}
            <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Offer Value:</span>
                <span className="text-2xl font-bold text-purple-400">${calculateTotalValue().toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-center mt-2 text-sm text-gray-400">
                <ArrowRight className="w-4 h-4 mx-2" />
                {calculateTotalValue() > targetItem.price ? (
                  <span className="text-green-400">You're offering ${(calculateTotalValue() - targetItem.price).toFixed(2)} more</span>
                ) : calculateTotalValue() < targetItem.price ? (
                  <span className="text-red-400">You're offering ${(targetItem.price - calculateTotalValue()).toFixed(2)} less</span>
                ) : (
                  <span className="text-blue-400">Even trade!</span>
                )}
              </div>
            </div>
          </div>

          {/* Your Items to Select From */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Select from your items:</h3>
            {userItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                {userItems.map((item) => {
                  const isSelected = selectedItems.some(selected => selected.id === item.id);
                  return (
                    <Card
                      key={item.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'bg-purple-900/50 border-purple-500' 
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <img
                            src={item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop"}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-sm line-clamp-2">{item.title}</h4>
                            <p className="text-green-400 font-bold">${item.price}</p>
                            {isSelected && (
                              <Badge className="bg-purple-500 text-white text-xs mt-1">Selected</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                You don't have any active items to trade. <br />
                <span className="text-sm">List some items first to make trade offers!</span>
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-gray-300">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to explain why this trade makes sense..."
              className="bg-gray-800 border-gray-700 text-white"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTrade}
              disabled={isSubmitting || (selectedItems.length === 0 && cashAmount === 0)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Send Trade Proposal
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Trade proposals expire after 60 minutes. Both parties must agree before items are exchanged.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
