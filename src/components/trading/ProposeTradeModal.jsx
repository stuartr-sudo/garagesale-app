import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, DollarSign, Plus, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProposeTradeModal({ targetItem, currentUserId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [myItems, setMyItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [cashAdjustment, setCashAdjustment] = useState(0);
  const [message, setMessage] = useState("");
  const [loadingItems, setLoadingItems] = useState(true);
  const { toast } = useToast();

  const MAX_CASH_ADJUSTMENT = 500;

  useEffect(() => {
    loadMyItems();
  }, [currentUserId]);

  const loadMyItems = async () => {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('seller_id', currentUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out the target item
      setMyItems((data || []).filter(item => item.id !== targetItem.id));
    } catch (error) {
      console.error("Error loading items:", error);
      toast({
        title: "Error",
        description: "Failed to load your items",
        variant: "destructive"
      });
    } finally {
      setLoadingItems(false);
    }
  };

  const handleToggleItem = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      const newSelection = exists 
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item];
      
      console.log('Toggle item:', item.title, 'New selection count:', newSelection.length);
      return newSelection;
    });
  };

  const calculateTotalValue = (items) => {
    return items.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const myTotalValue = calculateTotalValue(selectedItems) + parseFloat(cashAdjustment || 0);
  const targetValue = targetItem.price || 0;
  const valueDifference = myTotalValue - targetValue;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item to trade",
        variant: "destructive"
      });
      return;
    }

    if (cashAdjustment > MAX_CASH_ADJUSTMENT) {
      toast({
        title: "Error",
        description: `Cash adjustment cannot exceed $${MAX_CASH_ADJUSTMENT}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/trading/propose-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_item_id: targetItem.id,
          target_seller_id: targetItem.seller_id,
          offered_item_ids: selectedItems.map(i => i.id),
          offeror_id: currentUserId,
          cash_adjustment: parseFloat(cashAdjustment || 0),
          message: message.trim() || null
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success!",
          description: "Your trade offer has been sent",
        });
        onSuccess?.();
        onClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error proposing trade:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send trade offer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <RefreshCw className="w-5 h-5 text-blue-500" />
            Propose Trade
          </DialogTitle>
          <p className="text-gray-400 text-xs">
            Offer your items in exchange for "{targetItem.title || 'this item'}"
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Target Item */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">They're Offering:</h3>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {targetItem.image_urls?.[0] && (
                    <img
                      src={targetItem.image_urls[0]}
                      alt={targetItem.title || 'Item'}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{targetItem.title || 'Untitled Item'}</h4>
                    <p className="text-green-400 font-bold mt-1">
                      Value: ${(targetItem.price != null ? Number(targetItem.price).toFixed(2) : '0.00')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Select Your Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Select Your Items to Trade:
            </h3>

            {loadingItems ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : myItems.length === 0 ? (
              <div className="p-8 text-center bg-gray-800 rounded-lg border border-gray-700">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">
                  You don't have any available items to trade
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-700 rounded-lg">
                {myItems.map((item) => {
                  const isSelected = !!selectedItems.find(i => i.id === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item)}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <Card className={`bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors ${
                        isSelected ? 'border-blue-500' : ''
                      }`}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleItem(item)}
                              onClick={(e) => e.stopPropagation()}
                              className="border-gray-600"
                            />
                            {item.image_urls?.[0] && (
                              <img
                                src={item.image_urls[0]}
                                alt={item.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white text-sm truncate">
                                {item.title || 'Untitled Item'}
                              </h4>
                              <p className="text-green-400 font-bold text-sm">
                                ${(item.price != null ? Number(item.price).toFixed(2) : '0.00')}
                              </p>
                              {item.condition && typeof item.condition === 'string' && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {item.condition}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Items Summary */}
          {selectedItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                Your Offer ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}):
              </h3>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{item.title || 'Untitled Item'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-semibold text-sm">
                        ${(item.price != null ? Number(item.price).toFixed(2) : '0.00')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleItem(item)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cash Adjustment */}
          <div className="space-y-2">
            <Label htmlFor="cash" className="text-gray-300">
              Cash Adjustment (Optional, max ${MAX_CASH_ADJUSTMENT})
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="cash"
                type="number"
                min="0"
                max={MAX_CASH_ADJUSTMENT}
                step="0.01"
                value={cashAdjustment}
                onChange={(e) => setCashAdjustment(e.target.value)}
                placeholder="0.00"
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <p className="text-xs text-gray-500">
              Add cash to balance the trade (you pay the difference)
            </p>
          </div>

          {/* Trade Value Summary */}
          {selectedItems.length > 0 && (
            <Card className={`${
              Math.abs(valueDifference) < 1 
                ? 'bg-green-900/20 border-green-800' 
                : valueDifference > 0 
                ? 'bg-blue-900/20 border-blue-800'
                : 'bg-orange-900/20 border-orange-800'
            }`}>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Your items value:</span>
                    <span className="text-white font-semibold">
                      ${calculateTotalValue(selectedItems).toFixed(2)}
                    </span>
                  </div>
                  {cashAdjustment > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Your cash:</span>
                      <span className="text-white font-semibold">
                        +${parseFloat(cashAdjustment).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-700 pt-2">
                    <span className="text-gray-300">Your total offer:</span>
                    <span className="text-white font-bold">${myTotalValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Their item value:</span>
                    <span className="text-white font-bold">${targetValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-2">
                    <span className={`font-semibold ${
                      Math.abs(valueDifference) < 1 ? 'text-green-400' :
                      valueDifference > 0 ? 'text-blue-400' : 'text-orange-400'
                    }`}>
                      {Math.abs(valueDifference) < 1 ? 'Even trade!' :
                       valueDifference > 0 ? 'You\'re offering more' : 'They\'re offering more'}
                    </span>
                    <span className={`font-bold ${
                      Math.abs(valueDifference) < 1 ? 'text-green-400' :
                      valueDifference > 0 ? 'text-blue-400' : 'text-orange-400'
                    }`}>
                      {Math.abs(valueDifference) < 1 ? '✓' :
                       `$${Math.abs(valueDifference).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-gray-300">
              Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell them why this is a great trade..."
              className="bg-gray-800 border-gray-700 text-white h-20 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">{message.length}/500 characters</p>
          </div>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="flex-shrink-0 space-y-3 pt-4 border-t border-gray-800">
            {/* Selection Status */}
            <div className="text-center text-sm">
              {selectedItems.length === 0 ? (
                <p className="text-orange-400">⚠️ Select at least one item to trade</p>
              ) : (
                <p className="text-green-400">✓ {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</p>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || selectedItems.length === 0}
                className={`flex-1 ${
                  selectedItems.length === 0 
                    ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : selectedItems.length === 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Select Items First
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Propose Trade
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

