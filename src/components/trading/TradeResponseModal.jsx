import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TradeProposal } from "@/api/entities";
import { Check, X, RefreshCw } from "lucide-react";

export default function TradeResponseModal({ offer, onClose, onUpdate }) {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await TradeProposal.update(offer.id, {
        status: 'accepted',
        response_message: response || 'Trade accepted!'
      });
      
      alert('Trade accepted! You can now coordinate with the other person to exchange items.');
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error accepting trade:", error);
      alert("Error accepting trade. Please try again.");
    }
    setIsSubmitting(false);
  };

  const handleDecline = async () => {
    if (!response.trim()) {
      alert("Please provide a reason for declining the trade.");
      return;
    }

    setIsSubmitting(true);
    try {
      await TradeProposal.update(offer.id, {
        status: 'declined',
        response_message: response
      });
      
      alert('Trade declined.');
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error declining trade:", error);
      alert("Error declining trade. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="modal-glow card-gradient max-w-2xl bg-gray-900/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Respond to Trade Offer</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trade Summary */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-2">Trade Summary:</h3>
            <p className="text-gray-300">
              <strong>{offer.proposer?.full_name}</strong> wants your <strong>{offer.targetItem?.title}</strong> 
              {' '}for {offer.offered_items?.length} item(s)
              {offer.cash_amount > 0 && ` + $${offer.cash_amount} cash`}
            </p>
            <p className="text-purple-400 font-semibold mt-1">
              Total offer value: ${offer.total_offered_value}
            </p>
          </div>

          {/* Response Message */}
          <div className="space-y-2">
            <Label htmlFor="response" className="text-gray-300">
              Message (optional for acceptance, required for decline)
            </Label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Add a message to your response..."
              className="bg-gray-800 border-gray-700 text-white"
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDecline}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Declining...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Decline Trade
                </>
              )}
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Accepting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Accept Trade
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Once you accept, both parties should coordinate to exchange items safely in person.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}