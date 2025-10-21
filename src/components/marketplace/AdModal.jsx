import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, Eye, MousePointer } from "lucide-react";
import { format } from "date-fns";

export default function AdModal({ ad, onClose }) {
  const handleVisitSite = () => {
    if (ad.link_url) {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto bg-gray-950 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-white">
            <span className="bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Sponsored Content
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Image */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-800">
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop";
              }}
            />
            <div className="absolute top-4 right-4">
              <Badge className="bg-fuchsia-900/80 text-fuchsia-300 border-fuchsia-700">
                Sponsored
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{ad.title}</h2>
              {ad.description && (
                <p className="text-lg text-gray-300 leading-relaxed">{ad.description}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 p-4 bg-gray-900 rounded-xl">
              <div className="flex items-center gap-2 text-gray-400">
                <Eye className="w-4 h-4" />
                <span className="text-sm">
                  {ad.impression_count || 0} impressions
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MousePointer className="w-4 h-4" />
                <span className="text-sm">
                  {ad.click_count || 0} clicks
                </span>
              </div>
              {ad.start_date && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Since {format(new Date(ad.start_date), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>

            {/* Placement Info */}
            <div className="p-4 bg-gradient-to-r from-pink-900/20 to-fuchsia-900/20 rounded-xl border border-pink-800/30">
              <h4 className="font-semibold text-pink-300 mb-2">Advertisement Placement</h4>
              <p className="text-gray-300 text-sm">
                This is a promoted listing appearing in the{" "}
                <span className="font-semibold">
                  {ad.placement === 'top_banner' ? 'Top Banner' :
                   ad.placement === 'sidebar' ? 'Sidebar' :
                   ad.placement === 'between_items' ? 'Between Items' :
                   ad.placement === 'bottom_banner' ? 'Featured Card' : 'Special'} 
                </span>{" "}
                section of our marketplace.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              Close
            </Button>
            {ad.link_url && (
              <Button
                onClick={handleVisitSite}
                className="flex-1 h-12 bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Website
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center">
            This is sponsored content managed through our advertising platform.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}