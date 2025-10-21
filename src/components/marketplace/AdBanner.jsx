
import React, { useState, useEffect } from "react";
import { Advertisement } from "@/api/entities";
import { ArrowRight, Zap, Star, Clock } from "lucide-react";

export default function AdBanner({ placement = "top_banner", className = "", onAdClick }) {
  const [ads, setAds] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    loadAds();
  }, [placement]);

  const loadAds = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const allAds = await Advertisement.filter({ 
        placement, 
        status: "active" 
      }, "-priority");
      
      const activeAds = allAds.filter(ad => {
        const startValid = !ad.start_date || ad.start_date <= today;
        const endValid = !ad.end_date || ad.end_date >= today;
        return startValid && endValid;
      });
      
      setAds(activeAds);
    } catch (error) {
      console.error("Error loading ads:", error);
    }
    setLoading(false);
  };

  const handleAdClick = async (ad) => {
    try {
      await Advertisement.update(ad.id, {
        click_count: (ad.click_count || 0) + 1
      });
      
      if (onAdClick) {
        onAdClick(ad);
      } else if (ad.link_url) {
        window.open(ad.link_url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error("Error tracking ad click:", error);
    }
  };

  const trackImpression = async (adId) => {
    try {
      const ad = await Advertisement.get(adId);
      await Advertisement.update(adId, {
        impression_count: (ad.impression_count || 0) + 1
      });
    } catch (error) {
      console.error("Error tracking impression:", error);
    }
  };

  useEffect(() => {
    if (ads.length > 0) {
      ads.forEach(ad => {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              trackImpression(ad.id);
              observer.disconnect();
            }
          },
          { threshold: 0.5 }
        );
        const element = document.getElementById(`ad-${ad.id}`);
        if (element) {
          observer.observe(element);
        }
        return () => observer.disconnect();
      });
    }
  }, [ads]);

  const currentAd = ads[0];

  if (loading || !currentAd) {
    return null;
  }

  const AdContainer = ({ children, ad }) => (
    <div id={`ad-${ad.id}`} className={className} onClick={() => handleAdClick(ad)}>
      {children}
    </div>
  );

  if (placement === "top_banner") {
    return (
      <AdContainer ad={currentAd}>
        <div className="bg-gradient-to-r from-gray-900 via-fuchsia-950 to-gray-900 rounded-2xl p-6 shadow-lg border border-fuchsia-800 cursor-pointer group hover:shadow-2xl hover:border-fuchsia-700 transition-all duration-300 relative">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-fuchsia-400 mb-2 group-hover:text-fuchsia-300">
                {currentAd.title}
              </h3>
              {currentAd.description && (
                <p className="text-gray-400 text-sm leading-relaxed">
                  {currentAd.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3 text-fuchsia-500 group-hover:text-fuchsia-400">
                <ArrowRight className="w-4 h-4" />
                <span className="text-sm font-medium">Learn More</span>
              </div>
            </div>
            <div className="ml-6 flex-shrink-0">
              <img
                src={currentAd.image_url}
                alt={currentAd.title}
                className="w-32 h-20 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=120&fit=crop"; }}
              />
            </div>
          </div>
          <div className="absolute top-3 right-3">
            <span className="bg-black/70 text-fuchsia-400 text-xs px-2 py-1 rounded-full font-medium shadow-sm backdrop-blur-sm">
              Sponsored
            </span>
          </div>
        </div>
      </AdContainer>
    );
  }

  if (placement === "sidebar") {
    return (
      <AdContainer ad={currentAd}>
        <div className="bg-gray-900 rounded-2xl p-4 shadow-lg border border-gray-800 cursor-pointer group hover:shadow-xl transition-all duration-300 relative">
          <img src={currentAd.image_url} alt={currentAd.title} className="w-full h-32 object-cover rounded-xl mb-4" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop"; }} />
          <h4 className="font-bold text-white group-hover:text-pink-400 transition-colors">{currentAd.title}</h4>
          {currentAd.description && <p className="text-gray-400 text-sm line-clamp-2">{currentAd.description}</p>}
          <span className="absolute top-2 right-2 text-xs text-fuchsia-400 bg-black/70 px-2 py-1 rounded-full">Sponsored</span>
        </div>
      </AdContainer>
    );
  }

  if (placement === "between_items") {
    return (
      <AdContainer ad={currentAd}>
        <div className="bg-gradient-to-r from-cyan-950 to-gray-900 rounded-2xl p-6 shadow-lg border border-cyan-800 cursor-pointer group hover:shadow-xl transition-all duration-300 relative">
          <div className="flex items-center gap-4">
            <img src={currentAd.image_url} alt={currentAd.title} className="w-16 h-16 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop"; }} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-white group-hover:text-cyan-300">{currentAd.title}</h4>
                <span className="bg-cyan-400/10 text-cyan-400 text-xs px-2 py-1 rounded-full font-medium">Sponsored</span>
              </div>
              {currentAd.description && <p className="text-gray-400 text-sm line-clamp-1">{currentAd.description}</p>}
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-300 flex-shrink-0" />
          </div>
        </div>
      </AdContainer>
    );
  }

  if (placement === "bottom_banner" || placement === "local_deals") {
    const isLocalDeal = placement === 'local_deals';
    return (
      <AdContainer ad={currentAd}>
        <div className={`bg-gray-900 rounded-2xl shadow-lg transition-all duration-300 border border-gray-800 overflow-hidden cursor-pointer group hover:scale-[1.02] flex flex-col h-full relative ${
          isLocalDeal 
            ? 'shadow-orange-950/20 hover:shadow-orange-500/20' 
            : 'shadow-cyan-950/20 hover:shadow-cyan-500/20'
        }`}>
          <div className="relative aspect-square overflow-hidden">
            <img src={currentAd.image_url} alt={currentAd.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop"; }} />
            <div className="absolute top-3 right-3">
              <span className={`bg-black/70 text-xs px-2 py-1 rounded-full font-medium shadow-sm backdrop-blur-sm ${
                isLocalDeal ? 'text-orange-300' : 'text-cyan-300'
              }`}>
                Sponsored
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="p-5 flex flex-col flex-grow">
            <div className="flex-grow">
              <h3 className="font-bold text-lg text-white line-clamp-2 leading-tight">{currentAd.title}</h3>
              {currentAd.description && <p className="text-gray-400 text-sm line-clamp-2 mt-1">{currentAd.description}</p>}
              <div className="flex items-center justify-between mt-3">
                <div className={`text-2xl font-bold ${
                  isLocalDeal ? 'text-orange-400' : 'text-cyan-400'
                }`}>
                  {isLocalDeal ? "Local Deal" : "Featured"}
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs"><span className="truncate">Sponsored Content</span></div>
              </div>
            </div>
            <div className={`w-full h-11 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-4 ${
              isLocalDeal 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-500/20' 
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 hover:shadow-cyan-500/20'
            }`}>
              <ArrowRight className="w-4 h-4" />
              Learn More
            </div>
          </div>
        </div>
      </AdContainer>
    );
  }

  return null;
}
