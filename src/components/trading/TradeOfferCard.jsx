import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, X, Clock, DollarSign, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function TradeOfferCard({ trade, onAccept, onReject, onMessage, isReceived }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-600';
      case 'rejected': return 'bg-red-600';
      case 'expired': return 'bg-gray-600';
      case 'completed': return 'bg-blue-600';
      default: return 'bg-yellow-600';
    }
  };

  const isExpired = trade.expires_at && new Date(trade.expires_at) < new Date();
  const isPending = trade.status === 'pending' && !isExpired;

  const offeredItems = trade.offered_items || [];
  const requestedItem = trade.requested_item || trade.item_requested;
  const totalOfferedValue = offeredItems.reduce((sum, item) => sum + (item.price || 0), 0) + (trade.cash_adjustment || 0);
  const requestedValue = requestedItem?.price || 0;

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-blue-500 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-lg text-white">
                {isReceived ? 'Trade Offer Received' : 'Trade Offer Sent'}
              </CardTitle>
            </div>
            <p className="text-gray-400 text-sm">
              {isReceived 
                ? `From: ${trade.offeror?.full_name || 'Unknown'}`
                : `To: ${trade.requestee?.full_name || 'Unknown'}`
              }
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(isExpired ? 'expired' : trade.status)}>
              {isExpired ? 'Expired' : trade.status}
            </Badge>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(trade.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* They're Offering */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">
            {isReceived ? "They're Offering:" : "You're Offering:"}
          </h4>
          <div className="space-y-2">
            {offeredItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
                {item.image_urls?.[0] && (
                  <img
                    src={item.image_urls[0]}
                    alt={item.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  <p className="text-gray-400 text-xs">{item.condition}</p>
                </div>
                <p className="text-green-400 font-semibold text-sm">
                  ${item.price?.toFixed(2)}
                </p>
              </div>
            ))}
            {trade.cash_adjustment > 0 && (
              <div className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
                <div className="w-12 h-12 bg-green-500/20 rounded flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Cash Payment</p>
                  <p className="text-gray-400 text-xs">Additional cash to balance trade</p>
                </div>
                <p className="text-green-400 font-semibold text-sm">
                  ${trade.cash_adjustment.toFixed(2)}
                </p>
              </div>
            )}
          </div>
          <div className="mt-2 p-2 bg-green-900/20 border border-green-800 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Total Offer Value:</span>
              <span className="text-green-400 font-bold">${totalOfferedValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* They Want */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">
            {isReceived ? "For Your Item:" : "For Their Item:"}
          </h4>
          {requestedItem && (
            <div className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
              {requestedItem.image_urls?.[0] && (
                <img
                  src={requestedItem.image_urls[0]}
                  alt={requestedItem.title}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{requestedItem.title}</p>
                <p className="text-gray-400 text-xs">{requestedItem.condition}</p>
              </div>
              <p className="text-blue-400 font-semibold text-sm">
                ${requestedItem.price?.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Trade Balance */}
        <div className={`p-3 rounded-lg ${
          Math.abs(totalOfferedValue - requestedValue) < 1 
            ? 'bg-green-900/20 border border-green-800'
            : totalOfferedValue > requestedValue
            ? 'bg-blue-900/20 border border-blue-800'
            : 'bg-orange-900/20 border border-orange-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Trade Balance:</span>
            <span className={`font-bold text-sm ${
              Math.abs(totalOfferedValue - requestedValue) < 1 ? 'text-green-400' :
              totalOfferedValue > requestedValue ? 'text-blue-400' : 'text-orange-400'
            }`}>
              {Math.abs(totalOfferedValue - requestedValue) < 1 ? 'Even Trade ✓' :
               totalOfferedValue > requestedValue 
                 ? `${isReceived ? 'They' : 'You'} offer $${(totalOfferedValue - requestedValue).toFixed(2)} more`
                 : `${isReceived ? 'You' : 'They'} offer $${(requestedValue - totalOfferedValue).toFixed(2)} more`
              }
            </span>
          </div>
        </div>

        {/* Message */}
        {trade.message && (
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Message:</p>
            <p className="text-sm text-gray-200">{trade.message}</p>
          </div>
        )}

        {/* Expiry Warning */}
        {isPending && trade.expires_at && (
          <div className="flex items-center gap-2 p-2 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <Clock className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-yellow-200">
              Expires {formatDistanceToNow(new Date(trade.expires_at), { addSuffix: true })}
            </p>
          </div>
        )}

        {/* Actions */}
        {isPending && isReceived && (
          <div className="flex gap-2">
            <Button
              onClick={() => onMessage?.(trade)}
              variant="outline"
              size="sm"
              className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button
              onClick={() => onReject?.(trade)}
              variant="outline"
              size="sm"
              className="bg-red-900/30 border-red-800 text-red-200 hover:bg-red-900/50"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => onAccept?.(trade)}
              size="sm"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>
          </div>
        )}

        {!isPending && (
          <div className="flex items-center justify-center p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">
              {isExpired ? 'This trade offer has expired' :
               trade.status === 'accepted' ? 'Trade accepted! Arrange collection with the other party.' :
               trade.status === 'rejected' ? 'Trade offer was rejected' :
               trade.status === 'completed' ? 'Trade completed successfully!' :
               'Trade is no longer active'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

