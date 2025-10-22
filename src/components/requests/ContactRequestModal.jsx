
import React, { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, DollarSign, Clock, Send } from "lucide-react";

export default function ContactRequestModal({ request, requester, onClose }) {
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!contactInfo.email || !contactInfo.message) {
      alert("Please provide your email and a message");
      return;
    }

    setIsSending(true);
    // Here you would typically send the message via an API or email service
    // For now, we'll just simulate the action
    setTimeout(() => {
      alert("Your message has been sent! The requester will contact you soon.");
      onClose();
      setIsSending(false);
    }, 1500);
  };

  const urgencyColors = {
    low: "bg-cyan-900/50 text-cyan-300",
    medium: "bg-yellow-900/50 text-yellow-300",
    high: "bg-orange-900/50 text-orange-300",
    urgent: "bg-pink-900/50 text-pink-300"
  };

  const primaryImage = request.image_urls?.[0];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="modal-glow card-gradient max-w-2xl max-h-[90vh] overflow-auto bg-slate-700/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10 text-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-white">
            <User className="w-6 h-6 text-pink-500" />
            Contact for Work
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Summary */}
          <div className="bg-slate-600/50 rounded-2xl p-6">
            <div className="flex gap-4">
              {primaryImage && (
                <img
                  src={primaryImage}
                  alt={request.title}
                  className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop";
                  }}
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-xl text-white mb-2">{request.title}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-3">{request.description}</p>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={urgencyColors[request.urgency]}>
                    {request.urgency} priority
                  </Badge>
                  <Badge variant="outline" className="bg-lime-900/50 text-lime-300 border-lime-700">
                    ${request.budget} budget
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  {request.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{request.location}</span>
                    </div>
                  )}
                  {request.timeline && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{request.timeline}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Requester Info */}
          {requester && (
            <div className="bg-slate-600/50 rounded-2xl p-6">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-pink-500" />
                Posted By
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {requester.full_name?.[0] || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-white">{requester.full_name}</p>
                  <p className="text-gray-400 text-sm">{requester.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Form */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-white">Your Information</h4>
            <p className="text-sm text-gray-400">
              Provide your contact details and introduce yourself to the requester.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-400">Your Name *</Label>
                <Input
                  id="name"
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                  className="h-12 rounded-xl bg-slate-600 border-slate-500 text-white placeholder-gray-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-400">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  className="h-12 rounded-xl bg-slate-600 border-slate-500 text-white placeholder-gray-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-400">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
                className="h-12 rounded-xl bg-slate-600 border-slate-500 text-white placeholder-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-400">Message *</Label>
              <Textarea
                id="message"
                value={contactInfo.message}
                onChange={(e) => setContactInfo(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Introduce yourself and explain how you can help with this request..."
                className="min-h-32 rounded-xl bg-slate-600 border-slate-500 text-white placeholder-gray-500"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-gray-300 border-slate-500 hover:bg-slate-600 hover:text-white"
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !contactInfo.email || !contactInfo.message || !contactInfo.name}
              className="flex-1 h-12 bg-pink-600 hover:bg-pink-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-white"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your contact information will be shared with the requester so they can get back to you.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
