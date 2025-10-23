import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, RotateCcw, Save, Eye, Package, ShoppingBag } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

// Simplified theme presets
const THEME_PRESETS = {
  'Navy to Purple': {
    cardFrom: '#1e3a8a',
    cardTo: '#581c87',
    buttonFrom: '#a855f7',
    buttonTo: '#db2777',
    accentColor: '#22d3ee',
    bundleCardFrom: '#059669',
    bundleCardTo: '#047857',
    bundleButtonFrom: '#10b981',
    bundleButtonTo: '#059669',
    bundleAccentColor: '#6ee7b7'
  },
  'Ocean Blue': {
    cardFrom: '#1e40af',
    cardTo: '#164e63',
    buttonFrom: '#3b82f6',
    buttonTo: '#0891b2',
    accentColor: '#93c5fd',
    bundleCardFrom: '#0d9488',
    bundleCardTo: '#0f766e',
    bundleButtonFrom: '#14b8a6',
    bundleButtonTo: '#0d9488',
    bundleAccentColor: '#5eead4'
  },
  'Sunset': {
    cardFrom: '#9a3412',
    cardTo: '#831843',
    buttonFrom: '#f97316',
    buttonTo: '#db2777',
    accentColor: '#fdba74',
    bundleCardFrom: '#dc2626',
    bundleCardTo: '#b91c1c',
    bundleButtonFrom: '#ef4444',
    bundleButtonTo: '#dc2626',
    bundleAccentColor: '#fca5a5'
  },
  'Forest': {
    cardFrom: '#14532d',
    cardTo: '#064e3b',
    buttonFrom: '#22c55e',
    buttonTo: '#10b981',
    accentColor: '#86efac',
    bundleCardFrom: '#059669',
    bundleCardTo: '#047857',
    bundleButtonFrom: '#10b981',
    bundleButtonTo: '#059669',
    bundleAccentColor: '#6ee7b7'
  }
};

export default function ThemeSettingsNew() {
  const [theme, setTheme] = useState({
    cardFrom: '#1e3a8a',
    cardTo: '#581c87',
    buttonFrom: '#a855f7',
    buttonTo: '#db2777',
    accentColor: '#22d3ee',
    bundleCardFrom: '#059669',
    bundleCardTo: '#047857',
    bundleButtonFrom: '#10b981',
    bundleButtonTo: '#059669',
    bundleAccentColor: '#6ee7b7'
  });

  const [activeTab, setActiveTab] = useState('item-cards');
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('marketplace-theme');
    if (saved) {
      const parsedTheme = JSON.parse(saved);
      setTheme(prev => ({
        ...prev,
        ...parsedTheme,
        // Ensure bundle colors exist
        bundleCardFrom: parsedTheme.bundleCardFrom || '#059669',
        bundleCardTo: parsedTheme.bundleCardTo || '#047857',
        bundleButtonFrom: parsedTheme.bundleButtonFrom || '#10b981',
        bundleButtonTo: parsedTheme.bundleButtonTo || '#059669',
        bundleAccentColor: parsedTheme.bundleAccentColor || '#6ee7b7'
      }));
    }
  }, []);

  const updateThemeField = (field, value) => {
    setTheme(prev => ({ ...prev, [field]: value }));
  };

  const applyPreset = (presetName) => {
    const preset = THEME_PRESETS[presetName];
    setTheme(prev => ({ ...prev, ...preset }));
    toast({
      title: "Theme Applied",
      description: `${presetName} theme has been applied.`,
    });
  };

  const saveTheme = () => {
    localStorage.setItem('marketplace-theme', JSON.stringify(theme));
    toast({
      title: "Theme Saved",
      description: "Your theme has been saved successfully.",
    });
  };

  const resetTheme = () => {
    const defaultTheme = THEME_PRESETS['Navy to Purple'];
    setTheme(defaultTheme);
    localStorage.setItem('marketplace-theme', JSON.stringify(defaultTheme));
    toast({
      title: "Theme Reset",
      description: "Theme has been reset to default.",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Theme Settings</h1>
          <p className="text-gray-400">Customize the appearance of your marketplace</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Presets */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Quick Presets
                </CardTitle>
                <CardDescription>Choose from pre-designed themes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.keys(THEME_PRESETS).map((presetName) => (
                    <Button
                      key={presetName}
                      variant="outline"
                      onClick={() => applyPreset(presetName)}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                    >
                      {presetName}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Theme Controls */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="item-cards" className="data-[state=active]:bg-gray-700">
                  <Package className="w-4 h-4 mr-2" />
                  Item Cards
                </TabsTrigger>
                <TabsTrigger value="bundle-cards" className="data-[state=active]:bg-gray-700">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Bundle Cards
                </TabsTrigger>
              </TabsList>

              {/* Item Cards Tab */}
              <TabsContent value="item-cards" className="space-y-6">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Item Card Colors</CardTitle>
                    <CardDescription>Customize regular item cards</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Card Background */}
                    <div>
                      <Label className="text-sm font-medium text-gray-300 mb-3 block">Card Background</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-400">From Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={theme.cardFrom}
                              onChange={(e) => updateThemeField('cardFrom', e.target.value)}
                              className="h-10 w-16 cursor-pointer"
                            />
                            <Input
                              value={theme.cardFrom}
                              onChange={(e) => updateThemeField('cardFrom', e.target.value)}
                              placeholder="#1e3a8a"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">To Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={theme.cardTo}
                              onChange={(e) => updateThemeField('cardTo', e.target.value)}
                              className="h-10 w-16 cursor-pointer"
                            />
                            <Input
                              value={theme.cardTo}
                              onChange={(e) => updateThemeField('cardTo', e.target.value)}
                              placeholder="#581c87"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Button Colors */}
                    <div>
                      <Label className="text-sm font-medium text-gray-300 mb-3 block">Button Colors</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-400">From Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={theme.buttonFrom}
                              onChange={(e) => updateThemeField('buttonFrom', e.target.value)}
                              className="h-10 w-16 cursor-pointer"
                            />
                            <Input
                              value={theme.buttonFrom}
                              onChange={(e) => updateThemeField('buttonFrom', e.target.value)}
                              placeholder="#a855f7"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">To Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={theme.buttonTo}
                              onChange={(e) => updateThemeField('buttonTo', e.target.value)}
                              className="h-10 w-16 cursor-pointer"
                            />
                            <Input
                              value={theme.buttonTo}
                              onChange={(e) => updateThemeField('buttonTo', e.target.value)}
                              placeholder="#db2777"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div>
                      <Label className="text-sm font-medium text-gray-300 mb-3 block">Price Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={theme.accentColor}
                          onChange={(e) => updateThemeField('accentColor', e.target.value)}
                          className="h-10 w-16 cursor-pointer"
                        />
                        <Input
                          value={theme.accentColor}
                          onChange={(e) => updateThemeField('accentColor', e.target.value)}
                          placeholder="#22d3ee"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bundle Cards Tab */}
              <TabsContent value="bundle-cards" className="space-y-6">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Bundle Card Colors</CardTitle>
                    <CardDescription>Customize bundle cards separately from regular items</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Bundle Card Background */}
                    <div>
                      <Label className="text-sm font-medium text-gray-300 mb-3 block">Bundle Card Background</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-400">From Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={theme.bundleCardFrom}
                              onChange={(e) => updateThemeField('bundleCardFrom', e.target.value)}
                              className="h-10 w-16 cursor-pointer"
                            />
                            <Input
                              value={theme.bundleCardFrom}
                              onChange={(e) => updateThemeField('bundleCardFrom', e.target.value)}
                              placeholder="#059669"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">To Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={theme.bundleCardTo}
                              onChange={(e) => updateThemeField('bundleCardTo', e.target.value)}
                              className="h-10 w-16 cursor-pointer"
                            />
                            <Input
                              value={theme.bundleCardTo}
                              onChange={(e) => updateThemeField('bundleCardTo', e.target.value)}
                              placeholder="#047857"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bundle Button Colors */}
                    <div>
                      <Label className="text-sm font-medium text-gray-300 mb-3 block">Bundle Button Colors</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-400">From Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={theme.bundleButtonFrom}
                              onChange={(e) => updateThemeField('bundleButtonFrom', e.target.value)}
                              className="h-10 w-16 cursor-pointer"
                            />
                            <Input
                              value={theme.bundleButtonFrom}
                              onChange={(e) => updateThemeField('bundleButtonFrom', e.target.value)}
                              placeholder="#10b981"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">To Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={theme.bundleButtonTo}
                              onChange={(e) => updateThemeField('bundleButtonTo', e.target.value)}
                              className="h-10 w-16 cursor-pointer"
                            />
                            <Input
                              value={theme.bundleButtonTo}
                              onChange={(e) => updateThemeField('bundleButtonTo', e.target.value)}
                              placeholder="#059669"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bundle Accent Color */}
                    <div>
                      <Label className="text-sm font-medium text-gray-300 mb-3 block">Bundle Price Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={theme.bundleAccentColor}
                          onChange={(e) => updateThemeField('bundleAccentColor', e.target.value)}
                          className="h-10 w-16 cursor-pointer"
                        />
                        <Input
                          value={theme.bundleAccentColor}
                          onChange={(e) => updateThemeField('bundleAccentColor', e.target.value)}
                          placeholder="#6ee7b7"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={saveTheme}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Theme
                  </Button>
                  <Button
                    onClick={resetTheme}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Default
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>See how your theme will look</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Item Card Preview */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Item Card</h4>
                  <div 
                    className="rounded-2xl shadow-2xl p-4 border-2 border-cyan-500/30 max-w-xs"
                    style={{
                      background: `linear-gradient(to bottom right, ${theme.cardFrom}, ${theme.cardTo})`
                    }}
                  >
                    <div className="bg-gray-800 rounded-lg h-32 mb-3 flex items-center justify-center text-gray-500">
                      <span className="text-xs">Item Image</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Sample Item</h3>
                    <div 
                      className="text-2xl font-bold mb-3"
                      style={{ color: theme.accentColor }}
                    >
                      $99.99
                    </div>
                    <Button 
                      className="w-full h-8 text-sm hover:opacity-90"
                      style={{
                        background: `linear-gradient(to right, ${theme.buttonFrom}, ${theme.buttonTo})`
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>

                {/* Bundle Card Preview */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Bundle Card</h4>
                  <div 
                    className="rounded-2xl shadow-2xl p-4 border-2 border-green-500/30 max-w-xs"
                    style={{
                      background: `linear-gradient(to bottom right, ${theme.bundleCardFrom}, ${theme.bundleCardTo})`
                    }}
                  >
                    <div className="bg-gray-800 rounded-lg h-32 mb-3 flex items-center justify-center text-gray-500">
                      <span className="text-xs">Bundle Image</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Sample Bundle</h3>
                    <div 
                      className="text-2xl font-bold mb-3"
                      style={{ color: theme.bundleAccentColor }}
                    >
                      $199.99
                    </div>
                    <Button 
                      className="w-full h-8 text-sm hover:opacity-90"
                      style={{
                        background: `linear-gradient(to right, ${theme.bundleButtonFrom}, ${theme.bundleButtonTo})`
                      }}
                    >
                      Buy Bundle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
