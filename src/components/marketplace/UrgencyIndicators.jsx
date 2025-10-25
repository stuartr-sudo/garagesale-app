import React, { useState, useEffect } from 'react';
import { Eye, TrendingUp, MessageSquare, Flame, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

/**
 * UrgencyIndicators - Shows real-time activity indicators to create FOMO
 * Displays: view count, active viewers, and active negotiations
 */
export default function UrgencyIndicators({ itemId, viewCount = 0 }) {
  const [activeViewers, setActiveViewers] = useState(0);
  const [activeNegotiations, setActiveNegotiations] = useState(0);
  const [sessionId] = useState(() => {
    // Get or create session ID
    let sid = sessionStorage.getItem('viewer_session_id');
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('viewer_session_id', sid);
    }
    return sid;
  });

  useEffect(() => {
    if (!itemId) return;

    // Track this viewer
    trackViewer();

    // Poll for active stats every 10 seconds
    const interval = setInterval(() => {
      fetchActiveStats();
    }, 10000);

    // Initial fetch
    fetchActiveStats();

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
    };
  }, [itemId]);

  const trackViewer = async () => {
    try {
      await supabase.rpc('upsert_active_viewer', {
        p_item_id: itemId,
        p_session_id: sessionId
      });
    } catch (error) {
      console.error('Error tracking viewer:', error);
    }
  };

  const fetchActiveStats = async () => {
    try {
      // Get active viewer count (excluding current session)
      const { data: viewerData, error: viewerError } = await supabase.rpc(
        'get_active_viewer_count',
        {
          p_item_id: itemId,
          p_session_id: sessionId
        }
      );

      if (!viewerError && viewerData !== null) {
        setActiveViewers(viewerData);
      }

      // Get active negotiations count
      const { data: negotiationData, error: negotiationError } = await supabase.rpc(
        'get_active_negotiations_count',
        {
          p_item_id: itemId
        }
      );

      if (!negotiationError && negotiationData !== null) {
        setActiveNegotiations(negotiationData);
      }

      // Update viewer heartbeat
      trackViewer();
    } catch (error) {
      console.error('Error fetching active stats:', error);
    }
  };

  // Determine urgency level based on activity
  const getUrgencyLevel = () => {
    const totalActivity = activeViewers + activeNegotiations;
    if (totalActivity >= 5) return 'high';
    if (totalActivity >= 2) return 'medium';
    if (totalActivity >= 1) return 'low';
    return 'none';
  };

  const urgencyLevel = getUrgencyLevel();

  // Don't show if no activity
  if (urgencyLevel === 'none' && viewCount < 10) {
    return null;
  }

  const urgencyColors = {
    high: 'bg-red-500/10 border-red-500 text-red-500',
    medium: 'bg-orange-500/10 border-orange-500 text-orange-500',
    low: 'bg-yellow-500/10 border-yellow-500 text-yellow-500',
    none: 'bg-gray-500/10 border-gray-500 text-gray-400'
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in-50 duration-300">
      {/* Urgency Badge */}
      {urgencyLevel !== 'none' && (
        <Badge
          variant="outline"
          className={`${urgencyColors[urgencyLevel]} border font-semibold px-3 py-1.5 flex items-center gap-1.5`}
        >
          <Flame className="w-4 h-4 animate-pulse" />
          <span>High Interest</span>
        </Badge>
      )}

      {/* Total Views */}
      {viewCount > 0 && (
        <Badge
          variant="outline"
          className="bg-blue-500/10 border-blue-500 text-blue-400 px-3 py-1.5 flex items-center gap-1.5"
        >
          <Eye className="w-4 h-4" />
          <span>{viewCount.toLocaleString()} {viewCount === 1 ? 'view' : 'views'}</span>
        </Badge>
      )}

      {/* Active Viewers */}
      {activeViewers > 0 && (
        <Badge
          variant="outline"
          className="bg-green-500/10 border-green-500 text-green-400 px-3 py-1.5 flex items-center gap-1.5 animate-pulse"
        >
          <Users className="w-4 h-4" />
          <span>
            {activeViewers} {activeViewers === 1 ? 'person' : 'people'} looking now
          </span>
        </Badge>
      )}

      {/* Active Negotiations */}
      {activeNegotiations > 0 && (
        <Badge
          variant="outline"
          className="bg-purple-500/10 border-purple-500 text-purple-400 px-3 py-1.5 flex items-center gap-1.5"
        >
          <MessageSquare className="w-4 h-4" />
          <span>
            {activeNegotiations} active {activeNegotiations === 1 ? 'negotiation' : 'negotiations'}
          </span>
        </Badge>
      )}

      {/* Trending Indicator - show if high activity */}
      {urgencyLevel === 'high' && (
        <Badge
          variant="outline"
          className="bg-gradient-to-r from-pink-500/10 to-fuchsia-500/10 border-pink-500 text-pink-400 px-3 py-1.5 flex items-center gap-1.5"
        >
          <TrendingUp className="w-4 h-4 animate-bounce" />
          <span>Trending</span>
        </Badge>
      )}
    </div>
  );
}

