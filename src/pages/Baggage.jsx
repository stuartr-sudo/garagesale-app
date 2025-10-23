import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import VoiceInputField from "@/components/additem/VoiceInputField";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Luggage,
  Weight,
  Palette,
  FileText,
  Mic,
  Eye
} from "lucide-react";
import { format } from "date-fns";

export default function BaggagePage() {
  const [baggageItems, setBaggageItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({});
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showInlineVoiceInput, setShowInlineVoiceInput] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
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

  const handleInlineEdit = (item) => {
    setInlineEditingId(item.id);
    setInlineEditData({
      color: item.color,
      weight: item.weight.toString(),
      contents: item.contents
    });
  };

  const handleInlineEditChange = (field, value) => {
    setInlineEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInlineSave = async (itemId) => {
    try {
      const { error } = await supabase
        .from('baggage')
        .update({
          color: inlineEditData.color.trim(),
          weight: parseFloat(inlineEditData.weight),
          contents: inlineEditData.contents.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      setBaggageItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, ...inlineEditData, weight: parseFloat(inlineEditData.weight) }
            : item
        )
      );
      setInlineEditingId(null);
      setInlineEditData({});
    } catch (error) {
      console.error('Error updating baggage item:', error);
      alert('Error updating baggage item. Please try again.');
    }
  };

  const handleInlineCancel = () => {
    setInlineEditingId(null);
    setInlineEditData({});
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

  const handleVoiceTranscript = (transcript) => {
    setFormData(prev => ({
      ...prev,
      contents: prev.contents ? `${prev.contents}\n\n${transcript}` : transcript
    }));
    setShowVoiceInput(false);
  };

  const handleInlineVoiceTranscript = (transcript) => {
    setInlineEditData(prev => ({
      ...prev,
      contents: prev.contents ? `${prev.contents}\n\n${transcript}` : transcript
    }));
    setShowInlineVoiceInput(false);
  };

  const handleViewItem = (item) => {
    setViewingItem(item);
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
                    <div className="space-y-3">
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
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => setShowVoiceInput(true)}
                          variant="outline"
                          className="border-pink-500 text-pink-400 hover:bg-pink-900/20 rounded-lg"
                        >
                          <Mic className="w-4 h-4 mr-2" />
                          Add Voice Description
                        </Button>
                      </div>
                    </div>
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

          {/* Voice Input Modal */}
          {showVoiceInput && (
            <VoiceInputField
              onTranscript={handleVoiceTranscript}
              onClose={() => setShowVoiceInput(false)}
              targetField="contents"
              placeholder="Describe the contents of your baggage item..."
            />
          )}

          {/* Inline Voice Input Modal */}
          {showInlineVoiceInput && (
            <VoiceInputField
              onTranscript={handleInlineVoiceTranscript}
              onClose={() => setShowInlineVoiceInput(false)}
              targetField="contents"
              placeholder="Describe the contents of your baggage item..."
            />
          )}

          {/* View Item Modal */}
          {viewingItem && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <Card className="bg-gray-900/95 backdrop-blur-sm shadow-2xl border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                <CardHeader className="bg-gray-800/50 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Luggage className="w-6 h-6 text-pink-500" />
                      Baggage Item Details
                    </CardTitle>
                    <Button
                      onClick={() => setViewingItem(null)}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-pink-400" />
                        <Label className="text-sm font-medium text-gray-300">Color</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                        <span className="text-white font-medium">{viewingItem.color}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Weight className="w-4 h-4 text-blue-400" />
                        <Label className="text-sm font-medium text-gray-300">Weight</Label>
                      </div>
                      <span className="text-white font-medium">{viewingItem.weight} kg</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-400" />
                      <Label className="text-sm font-medium text-gray-300">Contents</Label>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {viewingItem.contents}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Added {format(new Date(viewingItem.created_at), 'MMM d, yyyy \'at\' h:mm a')}</span>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setViewingItem(null);
                            handleInlineEdit(viewingItem);
                          }}
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-300 hover:bg-blue-900/20 rounded-lg"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => {
                            setViewingItem(null);
                            handleDelete(viewingItem.id);
                          }}
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-300 hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Baggage Items Table */}
          <div className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Color</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Weight</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Contents</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date Added</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {baggageItems.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-800/50 transition-colors ${
                      inlineEditingId === item.id ? 'bg-pink-900/10' : ''
                    }`}>
                      <td className="px-6 py-4">
                        {inlineEditingId === item.id ? (
                          <Input
                            value={inlineEditData.color}
                            onChange={(e) => handleInlineEditChange('color', e.target.value)}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="Enter color"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                            <span className="text-white font-medium">{item.color}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {inlineEditingId === item.id ? (
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={inlineEditData.weight}
                            onChange={(e) => handleInlineEditChange('weight', e.target.value)}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="Enter weight"
                          />
                        ) : (
                          <span className="text-white font-medium">{item.weight} kg</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {inlineEditingId === item.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={inlineEditData.contents}
                              onChange={(e) => handleInlineEditChange('contents', e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="Describe contents..."
                              rows={2}
                            />
                            <Button
                              type="button"
                              onClick={() => setShowInlineVoiceInput(true)}
                              size="sm"
                              variant="outline"
                              className="border-pink-500 text-pink-400 hover:bg-pink-900/20 rounded-lg"
                            >
                              <Mic className="w-3 h-3 mr-1" />
                              Voice
                            </Button>
                          </div>
                        ) : (
                          <div className="max-w-xs">
                            <p className="text-gray-300 text-sm leading-relaxed truncate" title={item.contents}>
                              {item.contents}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 text-sm">
                          {format(new Date(item.created_at), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {inlineEditingId === item.id ? (
                            <>
                              <Button
                                onClick={() => handleInlineSave(item.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={handleInlineCancel}
                                size="sm"
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleViewItem(item)}
                                size="sm"
                                variant="outline"
                                className="border-green-600 text-green-300 hover:bg-green-900/20 rounded-lg"
                                title="View details"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={() => handleInlineEdit(item)}
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-300 hover:bg-blue-900/20 rounded-lg"
                                title="Edit item"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(item.id)}
                                size="sm"
                                variant="outline"
                                className="border-red-600 text-red-300 hover:bg-red-900/20 rounded-lg"
                                title="Delete item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
