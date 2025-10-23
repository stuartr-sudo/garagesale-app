import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Luggage,
  Weight,
  Palette,
  FileText
} from "lucide-react";
import { format } from "date-fns";

export default function BaggagePage() {
  const [baggageItems, setBaggageItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    color: "",
    weight: "",
    contents: ""
  });

  useEffect(() => {
    loadBaggageItems();
  }, []);

  const loadBaggageItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('baggage')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading baggage items:', error);
        return;
      }

      setBaggageItems(data || []);
    } catch (error) {
      console.error('Error loading baggage items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.color.trim() || !formData.weight.trim() || !formData.contents.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (editingId) {
        // Update existing item
        const { error } = await supabase
          .from('baggage')
          .update({
            color: formData.color.trim(),
            weight: parseFloat(formData.weight),
            contents: formData.contents.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;

        setBaggageItems(prev => 
          prev.map(item => 
            item.id === editingId 
              ? { ...item, ...formData, weight: parseFloat(formData.weight) }
              : item
          )
        );
        setEditingId(null);
      } else {
        // Create new item
        const { data, error } = await supabase
          .from('baggage')
          .insert({
            color: formData.color.trim(),
            weight: parseFloat(formData.weight),
            contents: formData.contents.trim()
          })
          .select()
          .single();

        if (error) throw error;

        setBaggageItems(prev => [data, ...prev]);
      }

      // Reset form
      setFormData({ color: "", weight: "", contents: "" });
      setIsAdding(false);
    } catch (error) {
      console.error('Error saving baggage item:', error);
      alert('Error saving baggage item. Please try again.');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      color: item.color,
      weight: item.weight.toString(),
      contents: item.contents
    });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this baggage item?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('baggage')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBaggageItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting baggage item:', error);
      alert('Error deleting baggage item. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({ color: "", weight: "", contents: "" });
    setIsAdding(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-gray-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Baggage Management</h1>
              <p className="text-lg text-gray-400">Manage baggage items with color, weight, and contents</p>
            </div>
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 rounded-xl"
              disabled={isAdding}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Baggage Item
            </Button>
          </div>

          {/* Add/Edit Form */}
          {isAdding && (
            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Luggage className="w-6 h-6 text-pink-500" />
                  {editingId ? 'Edit Baggage Item' : 'Add New Baggage Item'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="color" className="text-sm font-medium text-gray-300 mb-2 block">
                        <Palette className="w-4 h-4 inline mr-2" />
                        Color
                      </Label>
                      <Input
                        id="color"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        placeholder="e.g., Black, Red, Blue"
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500 rounded-xl"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="weight" className="text-sm font-medium text-gray-300 mb-2 block">
                        <Weight className="w-4 h-4 inline mr-2" />
                        Weight (kg)
                      </Label>
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.weight}
                        onChange={handleInputChange}
                        placeholder="e.g., 15.5"
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="contents" className="text-sm font-medium text-gray-300 mb-2 block">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Contents
                    </Label>
                    <Textarea
                      id="contents"
                      name="contents"
                      value={formData.contents}
                      onChange={handleInputChange}
                      placeholder="Describe the contents of the baggage item..."
                      rows={4}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500 rounded-xl resize-none"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 rounded-xl"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingId ? 'Update Item' : 'Add Item'}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCancel}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-700 rounded-xl"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Baggage Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {baggageItems.map((item) => (
              <Card key={item.id} className="bg-gray-900/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-800 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gray-800/50 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Luggage className="w-5 h-5 text-pink-500" />
                      Baggage Item
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(item)}
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(item.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-300 hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Palette className="w-4 h-4 text-pink-400" />
                      <div>
                        <p className="text-sm text-gray-400">Color</p>
                        <p className="font-semibold text-white">{item.color}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Weight className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Weight</p>
                        <p className="font-semibold text-white">{item.weight} kg</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Contents</p>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-300 text-sm leading-relaxed">{item.contents}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-500">
                        Added {format(new Date(item.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {baggageItems.length === 0 && (
            <div className="text-center py-16">
              <Luggage className="w-24 h-24 text-gray-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-white mb-2">No baggage items yet</h3>
              <p className="text-gray-400 mb-4">Start by adding your first baggage item</p>
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
