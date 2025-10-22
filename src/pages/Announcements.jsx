import React, { useState, useEffect } from "react";
import { Announcement } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Plus, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categoryColors = {
  community_event: "bg-blue-900/50 text-blue-300 border-blue-700",
  market_day: "bg-green-900/50 text-green-300 border-green-700",
  charity_drive: "bg-purple-900/50 text-purple-300 border-purple-700",
  workshop: "bg-orange-900/50 text-orange-300 border-orange-700",
  festival: "bg-pink-900/50 text-pink-300 border-pink-700",
  meeting: "bg-slate-700/50 text-gray-300 border-slate-500",
  other: "bg-amber-900/50 text-amber-300 border-amber-700"
};

const categoryIcons = {
  community_event: "🎉",
  market_day: "🛍️",
  charity_drive: "❤️",
  workshop: "🔧",
  festival: "🎪",
  meeting: "👥",
  other: "📢"
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadAnnouncements();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      // Get active announcements, sorted by event date
      const allAnnouncements = await Announcement.filter(
        { status: "active" },
        "event_date",
        50
      );
      
      // Filter out expired announcements
      const now = new Date();
      const activeAnnouncements = allAnnouncements.filter(announcement => {
        if (!announcement.expires_at) return true;
        return new Date(announcement.expires_at) > now;
      });
      
      setAnnouncements(activeAnnouncements);
    } catch (error) {
      console.error("Error loading announcements:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-600 rounded w-64"></div>
            <div className="grid gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-48 bg-slate-600 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800 text-gray-200">
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Community Announcements</h1>
              <p className="text-lg text-gray-400">Stay connected with local events and happenings</p>
            </div>
            {currentUser?.role === 'admin' && (
              <Link to={createPageUrl("AnnouncementEditor")}>
                <Button className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Announcement
                </Button>
              </Link>
            )}
          </div>

          {/* Announcements Grid */}
          {announcements.length > 0 ? (
            <div className="space-y-6">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="bg-slate-700/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-600 rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Image Section */}
                      {announcement.image_url && (
                        <div className="md:w-1/3">
                          <img
                            src={announcement.image_url}
                            alt={announcement.title}
                            className="w-full h-48 md:h-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop";
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Content Section */}
                      <div className={`${announcement.image_url ? 'md:w-2/3' : 'w-full'} p-6`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {categoryIcons[announcement.category]}
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-1">
                                {announcement.title}
                              </h3>
                              <Badge className={categoryColors[announcement.category]}>
                                {announcement.category.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-400 mb-4 text-lg leading-relaxed">
                          {announcement.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          {announcement.event_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(announcement.event_date), 'PPP p')}</span>
                            </div>
                          )}
                          
                          {announcement.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{announcement.location}</span>
                            </div>
                          )}
                          
                          {announcement.contact_info && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{announcement.contact_info}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Megaphone className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Active Announcements</h3>
              <p className="text-gray-400 mb-6">Check back later for community events and local happenings.</p>
              {currentUser?.role === 'admin' && (
                <Link to={createPageUrl("AnnouncementEditor")}>
                  <Button className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Announcement
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}