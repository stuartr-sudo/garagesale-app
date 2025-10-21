import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User } from "lucide-react";
import { format } from "date-fns";

const urgencyColors = {
  low: "bg-cyan-900/50 text-cyan-300 border-cyan-700",
  medium: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  high: "bg-orange-900/50 text-orange-300 border-orange-700",
  urgent: "bg-pink-900/50 text-pink-300 border-pink-700"
};

const categoryIcons = {
  home_repair: "🔨",
  cleaning: "🧽",
  gardening: "🌱",
  moving: "📦",
  handyman: "🔧",
  tutoring: "📚",
  pet_care: "🐕",
  delivery: "🚚",
  tech_support: "💻",
  creative: "🎨",
  other: "📋"
};

export default function RequestCard({ request, requester, onContact }) {
  const primaryImage = request.image_urls?.[0];
  
  return (
    <Card className="group bg-gray-900 shadow-lg shadow-pink-950/20 hover:shadow-pink-500/20 transition-all duration-500 border border-gray-800 rounded-2xl overflow-hidden hover:scale-[1.02] flex flex-col h-full">
      {primaryImage && (
        <div className="relative aspect-video overflow-hidden">
          <img
            src={primaryImage}
            alt={request.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}
      
      <CardContent className="p-5 flex flex-col flex-grow">
        <div className="flex-grow space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{categoryIcons[request.category]}</span>
                <Badge className={urgencyColors[request.urgency]}>
                  {request.urgency} priority
                </Badge>
              </div>
              <h3 className="font-bold text-lg text-white line-clamp-2 leading-tight">
                {request.title}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-cyan-400">
                ${request.budget}
              </div>
              <div className="text-xs text-gray-500">budget</div>
            </div>
          </div>

          <p className="text-gray-400 text-sm line-clamp-3">
            {request.description}
          </p>

          <div className="space-y-2 text-sm text-gray-400">
            {request.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{request.location}</span>
              </div>
            )}
            
            {request.timeline && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{request.timeline}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Posted {format(new Date(request.created_date), 'MMM d')}</span>
            </div>
          </div>

          {requester && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {requester.full_name?.[0] || 'U'}
                </div>
                <span className="text-gray-300 truncate">{requester.full_name}</span>
              </div>
            </div>
          )}

          {request.tags && request.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-3">
              {request.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-gray-800 text-gray-300 border-gray-700">
                  #{tag}
                </Badge>
              ))}
              {request.tags.length > 3 && (
                <Badge variant="outline" className="text-xs bg-gray-800 text-gray-300 border-gray-700">
                  +{request.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>

        <Button 
          onClick={onContact}
          className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-pink-500/20 transition-all duration-300 transform hover:-translate-y-0.5 mt-4"
        >
          <User className="w-4 h-4 mr-2" />
          Contact for Work
        </Button>
      </CardContent>
    </Card>
  );
}