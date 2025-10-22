import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Package,
  Percent,
  Gift
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User as UserEntity } from '@/api/entities';
import { useToast } from '@/hooks/use-toast';

export default function SpecialOffers() {
  const [offers, setOffers] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    offer_type: 'bogo',
    title: '',
    description: '',
    item_ids: [],
    config: {},
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await UserEntity.me();
      setCurrentUser(user);

      // Load user's items
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id, title, price, image_urls, status')
        .eq('seller_id', user.id)
        .eq('status', 'active');

      if (itemsError) throw itemsError;
      setMyItems(items || []);

      // Load user's offers
      const { data: userOffers, error: offersError } = await supabase
        .from('special_offers')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;
      setOffers(userOffers || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.item_ids.length) {
      toast({
        title: "Select Items",
        description: "Please select at least one item for this offer",
        variant: "destructive"
      });
      return;
    }

    try {
      const offerData = {
        seller_id: currentUser.id,
        offer_type: formData.offer_type,
        title: formData.title,
        description: formData.description,
        item_ids: formData.item_ids,
        config: formData.config,
        starts_at: formData.starts_at || new Date().toISOString(),
        ends_at: formData.ends_at || null,
        is_active: formData.is_active
      };

      if (editingOffer) {
        const { error } = await supabase
          .from('special_offers')
          .update(offerData)
          .eq('id', editingOffer.id);

        if (error) throw error;

        toast({
          title: "Offer Updated!",
          description: "Your special offer has been updated"
        });
      } else {
        const { error } = await supabase
          .from('special_offers')
          .insert(offerData);

        if (error) throw error;

        toast({
          title: "Offer Created!",
          description: "Your special offer is now live"
        });
      }

      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast({
        title: "Error",
        description: "Failed to save offer",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (offerId) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const { error } = await supabase
        .from('special_offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: "Offer Deleted",
        description: "Special offer has been removed"
      });

      loadData();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (offerId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('special_offers')
        .update({ is_active: !currentStatus })
        .eq('id', offerId);

      if (error) throw error;

      loadData();
    } catch (error) {
      console.error('Error toggling offer:', error);
      toast({
        title: "Error",
        description: "Failed to update offer status",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      offer_type: offer.offer_type,
      title: offer.title,
      description: offer.description || '',
      item_ids: offer.item_ids,
      config: offer.config || {},
      starts_at: offer.starts_at?.slice(0, 16) || new Date().toISOString().slice(0, 16),
      ends_at: offer.ends_at?.slice(0, 16) || '',
      is_active: offer.is_active
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingOffer(null);
    setFormData({
      offer_type: 'bogo',
      title: '',
      description: '',
      item_ids: [],
      config: {},
      starts_at: new Date().toISOString().slice(0, 16),
      ends_at: '',
      is_active: true
    });
  };

  const getOfferIcon = (type) => {
    switch (type) {
      case 'bogo': return Gift;
      case 'percentage_off': return Percent;
      case 'bulk_discount': return Package;
      default: return Tag;
    }
  };

  const getOfferColor = (type) => {
    switch (type) {
      case 'bogo': return 'bg-pink-900/50 text-pink-300 border-pink-700';
      case 'percentage_off': return 'bg-purple-900/50 text-purple-300 border-purple-700';
      case 'bulk_discount': return 'bg-blue-900/50 text-blue-300 border-blue-700';
      default: return 'bg-cyan-900/50 text-cyan-300 border-cyan-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading offers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-yellow-400" />
              Special Offers
            </h1>
            <p className="text-gray-400">Create promotions to boost your sales</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto modal-glow card-gradient">
              <DialogHeader>
                <DialogTitle className="text-2xl text-white">
                  {editingOffer ? 'Edit Offer' : 'Create Special Offer'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Offer Type */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Offer Type *</Label>
                  <Select value={formData.offer_type} onValueChange={(value) => setFormData(prev => ({ ...prev, offer_type: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-500 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-500 text-white">
                      <SelectItem value="bogo" className="text-white hover:bg-cyan-600 hover:text-white focus:bg-cyan-600 focus:text-white cursor-pointer">Buy One Get One Free (BOGO)</SelectItem>
                      <SelectItem value="percentage_off" className="text-white hover:bg-cyan-600 hover:text-white focus:bg-cyan-600 focus:text-white cursor-pointer">Percentage Off</SelectItem>
                      <SelectItem value="bulk_discount" className="text-white hover:bg-cyan-600 hover:text-white focus:bg-cyan-600 focus:text-white cursor-pointer">Bulk Discount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Buy One Get One Free!"
                    className="bg-slate-700 border-slate-500 text-white"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your offer..."
                    className="bg-slate-700 border-slate-500 text-white"
                    rows={3}
                  />
                </div>

                {/* Offer Config */}
                {formData.offer_type === 'percentage_off' && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Discount Percentage *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.config.percentage || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config, percentage: parseInt(e.target.value) }
                      }))}
                      placeholder="e.g., 20"
                      className="bg-slate-700 border-slate-500 text-white"
                      required
                    />
                  </div>
                )}

                {formData.offer_type === 'bulk_discount' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Minimum Quantity *</Label>
                      <Input
                        type="number"
                        min="2"
                        value={formData.config.min_quantity || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          config: { ...prev.config, min_quantity: parseInt(e.target.value) }
                        }))}
                        placeholder="e.g., 3"
                        className="bg-slate-700 border-slate-500 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Discount Amount ($) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.config.discount_amount || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          config: { ...prev.config, discount_amount: parseFloat(e.target.value) }
                        }))}
                        placeholder="e.g., 10.00"
                        className="bg-slate-700 border-slate-500 text-white"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Select Items */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Select Items *</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-700 border border-slate-500 rounded-lg">
                    {myItems.map(item => (
                      <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-slate-600 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.item_ids.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                item_ids: [...prev.item_ids, item.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                item_ids: prev.item_ids.filter(id => id !== item.id)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-white text-sm truncate flex-1">{item.title}</span>
                        <span className="text-cyan-400 text-sm">${item.price}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">{formData.item_ids.length} items selected</p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Starts At</Label>
                    <Input
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                      className="bg-slate-700 border-slate-500 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Ends At (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={formData.ends_at}
                      onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                      className="bg-slate-700 border-slate-500 text-white"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-600 border-slate-500 text-white hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    {editingOffer ? 'Update Offer' : 'Create Offer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Offers List */}
        {offers.length === 0 ? (
          <Card className="card-gradient card-glow p-12 text-center">
            <Sparkles className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">No offers yet</h3>
            <p className="text-gray-400 mb-6">Create special offers to attract more buyers</p>
            <Button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Offer
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map(offer => {
              const Icon = getOfferIcon(offer.offer_type);
              const colorClass = getOfferColor(offer.offer_type);
              const itemsInOffer = myItems.filter(item => offer.item_ids.includes(item.id));

              return (
                <Card key={offer.id} className="card-gradient card-glow rounded-xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${colorClass}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white">{offer.title}</h3>
                          <Badge className={colorClass}>
                            {offer.offer_type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(offer)}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(offer.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {offer.description && (
                      <p className="text-gray-300 text-sm mb-4">{offer.description}</p>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Items:</span>
                        <span className="text-white">{itemsInOffer.length}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Status:</span>
                        <Badge className={offer.is_active ? 'bg-green-900/50 text-green-300' : 'bg-gray-700 text-gray-300'}>
                          {offer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {offer.ends_at && (
                        <div className="flex justify-between text-gray-400">
                          <span>Ends:</span>
                          <span className="text-white">{new Date(offer.ends_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleToggleActive(offer.id, offer.is_active)}
                      className="w-full mt-4"
                      variant="outline"
                    >
                      {offer.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

