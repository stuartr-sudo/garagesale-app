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
      size="icon"
      onClick={() => navigate(createPageUrl('Cart'))}
      className="relative text-gray-300 hover:text-white hover:bg-gray-800"
    >
      <ShoppingCart className="w-6 h-6" />
      {cartCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold border-2 border-gray-900">
          {cartCount > 99 ? '99+' : cartCount}
        </Badge>
      )}
    </Button>
  );
}

