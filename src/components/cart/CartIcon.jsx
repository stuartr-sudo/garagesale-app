import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { User as UserEntity } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CartIcon() {
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadCartCount();
    
    // Subscribe to cart changes
    const channel = supabase
      .channel('cart_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_items'
      }, () => {
        loadCartCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCartCount = async () => {
    try {
      const user = await UserEntity.me();
      
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('buyer_id', user.id);

      if (!error && data) {
        const total = data.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(total);
      }
    } catch (error) {
      // User not logged in or error - show 0
      setCartCount(0);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={() => navigate(createPageUrl('Cart'))}
      className="relative w-16 h-16 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-2xl hover:shadow-pink-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center"
    >
      <ShoppingCart className="w-8 h-8 text-white" />
      {cartCount > 0 && (
        <Badge className="absolute -top-2 -right-2 h-7 w-7 flex items-center justify-center p-0 bg-red-500 text-white text-sm font-bold border-2 border-white shadow-lg">
          {cartCount > 99 ? '99+' : cartCount}
        </Badge>
      )}
    </Button>
  );
}

