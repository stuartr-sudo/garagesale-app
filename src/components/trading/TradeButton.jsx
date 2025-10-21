
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import TradeModal from './TradeModal';
import ExplosionEffect from '../ui/ExplosionEffect';

export default function TradeButton({ targetItem, targetSeller, className = "" }) {
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  const handleTradeClick = () => {
    if (isExploding) return;
    setIsExploding(true);
    setTimeout(() => setShowTradeModal(true), 400); // Delay for fireworks
    setTimeout(() => setIsExploding(false), 2000); // Longer reset
  };

  return (
    <>
      <div className="relative overflow-visible">
        <Button
          onClick={handleTradeClick}
          variant="outline"
          className={`w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-orange-400 text-white font-semibold shadow-lg hover:shadow-orange-500/20 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-1.5 ${className}`}
        >
          <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Make Offer</span>
        </Button>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <ExplosionEffect isExploding={isExploding} particleCount={70} intensity="high" />
        </div>
      </div>

      {showTradeModal && (
        <TradeModal
          targetItem={targetItem}
          targetSeller={targetSeller}
          onClose={() => setShowTradeModal(false)}
        />
      )}
    </>
  );
}
