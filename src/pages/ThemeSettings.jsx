import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Palette, RotateCcw, Save, Eye } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

// Default theme presets with hex colors
const THEME_PRESETS = {
  'Navy to Purple': {
    cardFrom: '#1e3a8a',  // blue-900
    cardTo: '#581c87',    // purple-900
    buttonFrom: '#a855f7', // purple-500
    buttonTo: '#db2777',  // pink-600
    accentColor: '#22d3ee', // cyan-400
    descriptionColor: '#9ca3af', // gray-400
    // Action Button Colors
    addToCartFrom: '#a855f7', // purple-500
    addToCartTo: '#db2777',   // pink-600
    buyNowFrom: '#10b981',    // emerald-500
    buyNowTo: '#059669',      // emerald-600
    // AI Agent Colors
    agentBackgroundFrom: '#581c87', // purple-900
    agentBackgroundTo: '#be185d',   // pink-700
    agentHeaderFrom: '#7c3aed',    // violet-600
    agentHeaderTo: '#ec4899',      // pink-500
    agentIconFrom: '#a855f7',      // purple-500
    agentIconTo: '#ec4899',        // pink-500
    // Bundle Card Colors
    bundleCardFrom: '#059669', // emerald-600
    bundleCardTo: '#047857',   // emerald-700
    bundleButtonFrom: '#10b981', // emerald-500
    bundleButtonTo: '#059669',   // emerald-600
    bundleAccentColor: '#6ee7b7', // emerald-300
    bundleDescriptionColor: '#9ca3af', // gray-400
    // Advertisement colors - Top Banner
    adBannerFrom: '#701a75', // fuchsia-900
    adBannerTo: '#1f2937',   // gray-800
    adBorderColor: '#a21caf', // fuchsia-700
    adButtonFrom: '#22d3ee',  // cyan-400
    adButtonTo: '#3b82f6',   // blue-500
    // Local Deals Cards
    localDealsFrom: '#059669', // emerald-600
    localDealsTo: '#047857',   // emerald-700
    localDealsBorder: '#10b981', // emerald-500
    localDealsButtonFrom: '#22c55e', // green-500
    localDealsButtonTo: '#16a34a',  // green-600
    // Bottom Banner Ads
    bottomBannerFrom: '#7c2d12', // orange-900
    bottomBannerTo: '#9a3412',  // orange-800
    bottomBannerBorder: '#ea580c', // orange-600
    bottomBannerButtonFrom: '#f97316', // orange-500
    bottomBannerButtonTo: '#ea580c',  // orange-600
    // Special Offers Cards
    specialOffersFrom: '#be185d', // pink-700
    specialOffersTo: '#9d174d',   // pink-800
    specialOffersBorder: '#ec4899', // pink-500
    specialOffersButtonFrom: '#f472b6', // pink-400
    specialOffersButtonTo: '#ec4899',  // pink-500
    // Featured Item Cards
    featuredFrom: '#7c3aed', // violet-600
    featuredTo: '#6d28d9',   // violet-700
    featuredBorder: '#8b5cf6', // violet-500
    featuredButtonFrom: '#a855f7', // purple-500
    featuredButtonTo: '#9333ea',  // violet-600
    // Promoted Item Cards
    promotedFrom: '#0891b2', // cyan-600
    promotedTo: '#0e7490',   // cyan-700
    promotedBorder: '#06b6d4', // cyan-500
    promotedButtonFrom: '#22d3ee', // cyan-400
    promotedButtonTo: '#06b6d4'    // cyan-500
  },
  'Dark Slate': {
    cardFrom: '#334155',  // slate-700
    cardTo: '#475569',    // slate-600
    buttonFrom: '#a855f7', // purple-500
    buttonTo: '#db2777',  // pink-600
    accentColor: '#22d3ee', // cyan-400
    descriptionColor: '#9ca3af', // gray-400
    // Bundle Card Colors
    bundleCardFrom: '#059669', // emerald-600
    bundleCardTo: '#047857',   // emerald-700
    bundleButtonFrom: '#10b981', // emerald-500
    bundleButtonTo: '#059669',   // emerald-600
    bundleAccentColor: '#6ee7b7', // emerald-300
    bundleDescriptionColor: '#9ca3af', // gray-400
    // Advertisement colors - Top Banner
    adBannerFrom: '#701a75',
    adBannerTo: '#1f2937',
    adBorderColor: '#a21caf',
    adButtonFrom: '#22d3ee',
    adButtonTo: '#3b82f6',
    // Local Deals Cards
    localDealsFrom: '#059669',
    localDealsTo: '#047857',
    localDealsBorder: '#10b981',
    localDealsButtonFrom: '#22c55e',
    localDealsButtonTo: '#16a34a',
    // Bottom Banner Ads
    bottomBannerFrom: '#7c2d12',
    bottomBannerTo: '#9a3412',
    bottomBannerBorder: '#ea580c',
    bottomBannerButtonFrom: '#f97316',
    bottomBannerButtonTo: '#ea580c',
    // Special Offers Cards
    specialOffersFrom: '#be185d',
    specialOffersTo: '#9d174d',
    specialOffersBorder: '#ec4899',
    specialOffersButtonFrom: '#f472b6',
    specialOffersButtonTo: '#ec4899',
    // Featured Item Cards
    featuredFrom: '#7c3aed',
    featuredTo: '#6d28d9',
    featuredBorder: '#8b5cf6',
    featuredButtonFrom: '#a855f7',
    featuredButtonTo: '#9333ea',
    // Promoted Item Cards
    promotedFrom: '#0891b2',
    promotedTo: '#0e7490',
    promotedBorder: '#06b6d4',
    promotedButtonFrom: '#22d3ee',
    promotedButtonTo: '#06b6d4'
  },
  'Ocean Blue': {
    cardFrom: '#1e40af',  // blue-800
    cardTo: '#164e63',    // cyan-900
    buttonFrom: '#3b82f6', // blue-500
    buttonTo: '#0891b2',  // cyan-600
    accentColor: '#93c5fd', // blue-300
    descriptionColor: '#9ca3af', // gray-400
    // Bundle Card Colors
    bundleCardFrom: '#0d9488', // teal-600
    bundleCardTo: '#0f766e',   // teal-700
    bundleButtonFrom: '#14b8a6', // teal-500
    bundleButtonTo: '#0d9488',   // teal-600
    bundleAccentColor: '#5eead4', // teal-300
    bundleDescriptionColor: '#9ca3af', // gray-400
    // Advertisement colors - Top Banner
    adBannerFrom: '#164e63', // cyan-900
    adBannerTo: '#1e3a8a',   // blue-900
    adBorderColor: '#0891b2', // cyan-600
    adButtonFrom: '#06b6d4',  // cyan-500
    adButtonTo: '#3b82f6',   // blue-500
    // Local Deals Cards
    localDealsFrom: '#059669',
    localDealsTo: '#047857',
    localDealsBorder: '#10b981',
    localDealsButtonFrom: '#22c55e',
    localDealsButtonTo: '#16a34a',
    // Bottom Banner Ads
    bottomBannerFrom: '#7c2d12',
    bottomBannerTo: '#9a3412',
    bottomBannerBorder: '#ea580c',
    bottomBannerButtonFrom: '#f97316',
    bottomBannerButtonTo: '#ea580c',
    // Special Offers Cards
    specialOffersFrom: '#be185d',
    specialOffersTo: '#9d174d',
    specialOffersBorder: '#ec4899',
    specialOffersButtonFrom: '#f472b6',
    specialOffersButtonTo: '#ec4899',
    // Featured Item Cards
    featuredFrom: '#7c3aed',
    featuredTo: '#6d28d9',
    featuredBorder: '#8b5cf6',
    featuredButtonFrom: '#a855f7',
    featuredButtonTo: '#9333ea',
    // Promoted Item Cards
    promotedFrom: '#0891b2',
    promotedTo: '#0e7490',
    promotedBorder: '#06b6d4',
    promotedButtonFrom: '#22d3ee',
    promotedButtonTo: '#06b6d4'
  },
  'Sunset': {
    cardFrom: '#9a3412',  // orange-800
    cardTo: '#831843',    // pink-900
    buttonFrom: '#f97316', // orange-500
    buttonTo: '#db2777',  // pink-600
    accentColor: '#fdba74', // orange-300
    descriptionColor: '#9ca3af', // gray-400
    // Bundle Card Colors
    bundleCardFrom: '#dc2626', // red-600
    bundleCardTo: '#b91c1c',   // red-700
    bundleButtonFrom: '#ef4444', // red-500
    bundleButtonTo: '#dc2626',   // red-600
    bundleAccentColor: '#fca5a5', // red-300
    bundleDescriptionColor: '#9ca3af', // gray-400
    // Advertisement colors - Top Banner
    adBannerFrom: '#9a3412', // orange-800
    adBannerTo: '#7c2d12',   // orange-900
    adBorderColor: '#ea580c', // orange-600
    adButtonFrom: '#f97316',  // orange-500
    adButtonTo: '#fb923c',   // orange-400
    // Local Deals Cards
    localDealsFrom: '#059669',
    localDealsTo: '#047857',
    localDealsBorder: '#10b981',
    localDealsButtonFrom: '#22c55e',
    localDealsButtonTo: '#16a34a',
    // Bottom Banner Ads
    bottomBannerFrom: '#7c2d12',
    bottomBannerTo: '#9a3412',
    bottomBannerBorder: '#ea580c',
    bottomBannerButtonFrom: '#f97316',
    bottomBannerButtonTo: '#ea580c',
    // Special Offers Cards
    specialOffersFrom: '#be185d',
    specialOffersTo: '#9d174d',
    specialOffersBorder: '#ec4899',
    specialOffersButtonFrom: '#f472b6',
    specialOffersButtonTo: '#ec4899',
    // Featured Item Cards
    featuredFrom: '#7c3aed',
    featuredTo: '#6d28d9',
    featuredBorder: '#8b5cf6',
    featuredButtonFrom: '#a855f7',
    featuredButtonTo: '#9333ea',
    // Promoted Item Cards
    promotedFrom: '#0891b2',
    promotedTo: '#0e7490',
    promotedBorder: '#06b6d4',
    promotedButtonFrom: '#22d3ee',
    promotedButtonTo: '#06b6d4'
  },
  'Forest': {
    cardFrom: '#14532d',  // green-900
    cardTo: '#064e3b',    // emerald-900
    buttonFrom: '#22c55e', // green-500
    buttonTo: '#10b981',  // emerald-600
    accentColor: '#86efac', // green-300
    descriptionColor: '#9ca3af', // gray-400
    // Bundle Card Colors
    bundleCardFrom: '#059669', // emerald-600
    bundleCardTo: '#047857',   // emerald-700
    bundleButtonFrom: '#10b981', // emerald-500
    bundleButtonTo: '#059669',   // emerald-600
    bundleAccentColor: '#6ee7b7', // emerald-300
    bundleDescriptionColor: '#9ca3af', // gray-400
    // Advertisement colors - Top Banner
    adBannerFrom: '#064e3b', // emerald-900
    adBannerTo: '#14532d',   // green-900
    adBorderColor: '#059669', // emerald-600
    adButtonFrom: '#10b981',  // emerald-500
    adButtonTo: '#22c55e',   // green-500
    // Local Deals Cards
    localDealsFrom: '#059669',
    localDealsTo: '#047857',
    localDealsBorder: '#10b981',
    localDealsButtonFrom: '#22c55e',
    localDealsButtonTo: '#16a34a',
    // Bottom Banner Ads
    bottomBannerFrom: '#7c2d12',
    bottomBannerTo: '#9a3412',
    bottomBannerBorder: '#ea580c',
    bottomBannerButtonFrom: '#f97316',
    bottomBannerButtonTo: '#ea580c',
    // Special Offers Cards
    specialOffersFrom: '#be185d',
    specialOffersTo: '#9d174d',
    specialOffersBorder: '#ec4899',
    specialOffersButtonFrom: '#f472b6',
    specialOffersButtonTo: '#ec4899',
    // Featured Item Cards
    featuredFrom: '#7c3aed',
    featuredTo: '#6d28d9',
    featuredBorder: '#8b5cf6',
    featuredButtonFrom: '#a855f7',
    featuredButtonTo: '#9333ea',
    // Promoted Item Cards
    promotedFrom: '#0891b2',
    promotedTo: '#0e7490',
    promotedBorder: '#06b6d4',
    promotedButtonFrom: '#22d3ee',
    promotedButtonTo: '#06b6d4'
  },
  'Royal': {
    cardFrom: '#581c87',  // purple-900
    cardTo: '#312e81',    // indigo-900
    buttonFrom: '#a855f7', // purple-500
    buttonTo: '#6366f1',  // indigo-600
    accentColor: '#c4b5fd', // purple-300
    descriptionColor: '#9ca3af', // gray-400
    // Bundle Card Colors
    bundleCardFrom: '#059669', // emerald-600
    bundleCardTo: '#047857',   // emerald-700
    bundleButtonFrom: '#10b981', // emerald-500
    bundleButtonTo: '#059669',   // emerald-600
    bundleAccentColor: '#6ee7b7', // emerald-300
    bundleDescriptionColor: '#9ca3af', // gray-400
    // Advertisement colors - Top Banner
    adBannerFrom: '#581c87', // purple-900
    adBannerTo: '#312e81',   // indigo-900
    adBorderColor: '#7c3aed', // violet-600
    adButtonFrom: '#a855f7',  // purple-500
    adButtonTo: '#8b5cf6',   // violet-500
    // Local Deals Cards
    localDealsFrom: '#059669',
    localDealsTo: '#047857',
    localDealsBorder: '#10b981',
    localDealsButtonFrom: '#22c55e',
    localDealsButtonTo: '#16a34a',
    // Bottom Banner Ads
    bottomBannerFrom: '#7c2d12',
    bottomBannerTo: '#9a3412',
    bottomBannerBorder: '#ea580c',
    bottomBannerButtonFrom: '#f97316',
    bottomBannerButtonTo: '#ea580c',
    // Special Offers Cards
    specialOffersFrom: '#be185d',
    specialOffersTo: '#9d174d',
    specialOffersBorder: '#ec4899',
    specialOffersButtonFrom: '#f472b6',
    specialOffersButtonTo: '#ec4899',
    // Featured Item Cards
    featuredFrom: '#7c3aed',
    featuredTo: '#6d28d9',
    featuredBorder: '#8b5cf6',
    featuredButtonFrom: '#a855f7',
    featuredButtonTo: '#9333ea',
    // Promoted Item Cards
    promotedFrom: '#0891b2',
    promotedTo: '#0e7490',
    promotedBorder: '#06b6d4',
    promotedButtonFrom: '#22d3ee',
    promotedButtonTo: '#06b6d4'
  }
};

// Tailwind color options
const TAILWIND_COLORS = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan',
  'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

const TAILWIND_SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

export default function ThemeSettings() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('marketplace-theme');
    return saved ? JSON.parse(saved) : THEME_PRESETS['Navy to Purple'];
  });
  const { toast } = useToast();

  const saveTheme = () => {
    localStorage.setItem('marketplace-theme', JSON.stringify(theme));
    toast({
      title: "Theme Saved!",
      description: "Your theme settings have been saved. Refresh the page to see changes on marketplace cards."
    });
  };

  const resetTheme = () => {
    const defaultTheme = THEME_PRESETS['Navy to Purple'];
    setTheme(defaultTheme);
    localStorage.setItem('marketplace-theme', JSON.stringify(defaultTheme));
    toast({
      title: "Theme Reset",
      description: "Theme has been reset to default. Refresh the page to see changes."
    });
  };

  const applyPreset = (presetName) => {
    setTheme(THEME_PRESETS[presetName]);
    toast({
      title: "Preset Applied",
      description: `"${presetName}" preset has been applied. Click Save to keep it.`
    });
  };

  const updateThemeField = (field, value) => {
    setTheme(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Palette className="w-10 h-10 text-pink-500" />
            Theme Customization
          </h1>
          <p className="text-gray-400">Customize the appearance of marketplace cards and buttons</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Color Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Custom Colors</CardTitle>
              <CardDescription>Define your own color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Card Gradient */}
              <div className="space-y-3">
                <Label className="text-white text-lg">Card Background Gradient</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-gray-400">From Color</Label>
                    <Input
                      type="color"
                      value={theme.cardFrom}
                      onChange={(e) => updateThemeField('cardFrom', e.target.value)}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      value={theme.cardFrom}
                      onChange={(e) => updateThemeField('cardFrom', e.target.value)}
                      placeholder="e.g., #1e3a8a"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">To Color</Label>
                    <Input
                      type="color"
                      value={theme.cardTo}
                      onChange={(e) => updateThemeField('cardTo', e.target.value)}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      value={theme.cardTo}
                      onChange={(e) => updateThemeField('cardTo', e.target.value)}
                      placeholder="e.g., #581c87"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Format: hex color (e.g., #1e3a8a, #581c87) or use color picker above
                </p>
              </div>

              {/* Button Gradient */}
              <div className="space-y-3">
                <Label className="text-white text-lg">Button Gradient</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-gray-400">From Color</Label>
                    <Input
                      type="color"
                      value={theme.buttonFrom}
                      onChange={(e) => updateThemeField('buttonFrom', e.target.value)}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      value={theme.buttonFrom}
                      onChange={(e) => updateThemeField('buttonFrom', e.target.value)}
                      placeholder="e.g., #a855f7"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">To Color</Label>
                    <Input
                      type="color"
                      value={theme.buttonTo}
                      onChange={(e) => updateThemeField('buttonTo', e.target.value)}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      value={theme.buttonTo}
                      onChange={(e) => updateThemeField('buttonTo', e.target.value)}
                      placeholder="e.g., #db2777"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-3">
                <Label className="text-white text-lg">Accent Color</Label>
                <Input
                  type="color"
                  value={theme.accentColor}
                  onChange={(e) => updateThemeField('accentColor', e.target.value)}
                  className="h-10 w-full cursor-pointer"
                />
                <Input
                  value={theme.accentColor}
                  onChange={(e) => updateThemeField('accentColor', e.target.value)}
                  placeholder="e.g., #22d3ee"
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500">
                  Used for price text and highlights
                </p>
              </div>

              {/* Description Text Color */}
              <div className="space-y-3">
                <Label className="text-white text-lg">Description Text Color</Label>
                <Input
                  type="color"
                  value={theme.descriptionColor || '#9ca3af'}
                  onChange={(e) => updateThemeField('descriptionColor', e.target.value)}
                  className="h-10 w-full cursor-pointer"
                />
                <Input
                  value={theme.descriptionColor || '#9ca3af'}
                  onChange={(e) => updateThemeField('descriptionColor', e.target.value)}
                  placeholder="e.g., #9ca3af"
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500">
                  Used for item descriptions and secondary text
                </p>
              </div>

              {/* Action Button Colors */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">Action Button Colors</h3>
                
                {/* Add to Cart Button */}
                <div className="space-y-3">
                  <Label className="text-white text-lg">Add to Cart Button</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 text-sm">From Color</Label>
                      <Input
                        type="color"
                        value={theme.addToCartFrom || '#a855f7'}
                        onChange={(e) => updateThemeField('addToCartFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.addToCartFrom || '#a855f7'}
                        onChange={(e) => updateThemeField('addToCartFrom', e.target.value)}
                        placeholder="e.g., #a855f7"
                        className="bg-gray-800 border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">To Color</Label>
                      <Input
                        type="color"
                        value={theme.addToCartTo || '#db2777'}
                        onChange={(e) => updateThemeField('addToCartTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.addToCartTo || '#db2777'}
                        onChange={(e) => updateThemeField('addToCartTo', e.target.value)}
                        placeholder="e.g., #db2777"
                        className="bg-gray-800 border-gray-700 text-white mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Buy Now Button */}
                <div className="space-y-3">
                  <Label className="text-white text-lg">Buy Now Button</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 text-sm">From Color</Label>
                      <Input
                        type="color"
                        value={theme.buyNowFrom || '#10b981'}
                        onChange={(e) => updateThemeField('buyNowFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.buyNowFrom || '#10b981'}
                        onChange={(e) => updateThemeField('buyNowFrom', e.target.value)}
                        placeholder="e.g., #10b981"
                        className="bg-gray-800 border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">To Color</Label>
                      <Input
                        type="color"
                        value={theme.buyNowTo || '#059669'}
                        onChange={(e) => updateThemeField('buyNowTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.buyNowTo || '#059669'}
                        onChange={(e) => updateThemeField('buyNowTo', e.target.value)}
                        placeholder="e.g., #059669"
                        className="bg-gray-800 border-gray-700 text-white mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Agent Colors */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">AI Agent Colors</h3>
                
                {/* Agent Background */}
                <div className="space-y-3">
                  <Label className="text-white text-lg">Agent Background</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 text-sm">From Color</Label>
                      <Input
                        type="color"
                        value={theme.agentBackgroundFrom || '#581c87'}
                        onChange={(e) => updateThemeField('agentBackgroundFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.agentBackgroundFrom || '#581c87'}
                        onChange={(e) => updateThemeField('agentBackgroundFrom', e.target.value)}
                        placeholder="e.g., #581c87"
                        className="bg-gray-800 border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">To Color</Label>
                      <Input
                        type="color"
                        value={theme.agentBackgroundTo || '#be185d'}
                        onChange={(e) => updateThemeField('agentBackgroundTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.agentBackgroundTo || '#be185d'}
                        onChange={(e) => updateThemeField('agentBackgroundTo', e.target.value)}
                        placeholder="e.g., #be185d"
                        className="bg-gray-800 border-gray-700 text-white mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Agent Header */}
                <div className="space-y-3">
                  <Label className="text-white text-lg">Agent Header</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 text-sm">From Color</Label>
                      <Input
                        type="color"
                        value={theme.agentHeaderFrom || '#7c3aed'}
                        onChange={(e) => updateThemeField('agentHeaderFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.agentHeaderFrom || '#7c3aed'}
                        onChange={(e) => updateThemeField('agentHeaderFrom', e.target.value)}
                        placeholder="e.g., #7c3aed"
                        className="bg-gray-800 border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">To Color</Label>
                      <Input
                        type="color"
                        value={theme.agentHeaderTo || '#ec4899'}
                        onChange={(e) => updateThemeField('agentHeaderTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.agentHeaderTo || '#ec4899'}
                        onChange={(e) => updateThemeField('agentHeaderTo', e.target.value)}
                        placeholder="e.g., #ec4899"
                        className="bg-gray-800 border-gray-700 text-white mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Agent Icon */}
                <div className="space-y-3">
                  <Label className="text-white text-lg">Agent Icon Background</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 text-sm">From Color</Label>
                      <Input
                        type="color"
                        value={theme.agentIconFrom || '#a855f7'}
                        onChange={(e) => updateThemeField('agentIconFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.agentIconFrom || '#a855f7'}
                        onChange={(e) => updateThemeField('agentIconFrom', e.target.value)}
                        placeholder="e.g., #a855f7"
                        className="bg-gray-800 border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">To Color</Label>
                      <Input
                        type="color"
                        value={theme.agentIconTo || '#ec4899'}
                        onChange={(e) => updateThemeField('agentIconTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.agentIconTo || '#ec4899'}
                        onChange={(e) => updateThemeField('agentIconTo', e.target.value)}
                        placeholder="e.g., #ec4899"
                        className="bg-gray-800 border-gray-700 text-white mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6 bg-gray-700" />

              {/* Bundle Cards */}
              <div className="space-y-6 bg-emerald-900/10 border border-emerald-700/30 rounded-lg p-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛍️</span>
                  <h3 className="text-xl font-bold text-white">Bundle Cards</h3>
                </div>
                <p className="text-sm text-gray-400">Customize colors for bundle deal cards separately from regular items</p>

                {/* Bundle Card Background */}
                <div className="space-y-3">
                  <Label className="text-white text-lg">Bundle Card Background Gradient</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">From Color</Label>
                      <Input
                        type="color"
                        value={theme.bundleCardFrom || '#059669'}
                        onChange={(e) => updateThemeField('bundleCardFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.bundleCardFrom || '#059669'}
                        onChange={(e) => updateThemeField('bundleCardFrom', e.target.value)}
                        placeholder="e.g., #059669"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">To Color</Label>
                      <Input
                        type="color"
                        value={theme.bundleCardTo || '#047857'}
                        onChange={(e) => updateThemeField('bundleCardTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.bundleCardTo || '#047857'}
                        onChange={(e) => updateThemeField('bundleCardTo', e.target.value)}
                        placeholder="e.g., #047857"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Bundle Button Gradient */}
                <div className="space-y-3">
                  <Label className="text-white text-lg">Bundle Button Gradient</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">From Color</Label>
                      <Input
                        type="color"
                        value={theme.bundleButtonFrom || '#10b981'}
                        onChange={(e) => updateThemeField('bundleButtonFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.bundleButtonFrom || '#10b981'}
                        onChange={(e) => updateThemeField('bundleButtonFrom', e.target.value)}
                        placeholder="e.g., #10b981"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">To Color</Label>
                      <Input
                        type="color"
                        value={theme.bundleButtonTo || '#059669'}
                        onChange={(e) => updateThemeField('bundleButtonTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.bundleButtonTo || '#059669'}
                        onChange={(e) => updateThemeField('bundleButtonTo', e.target.value)}
                        placeholder="e.g., #059669"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Bundle Accent Color */}
                <div className="space-y-3">
                  <Label className="text-white text-lg">Bundle Price Color</Label>
                  <Input
                    type="color"
                    value={theme.bundleAccentColor || '#6ee7b7'}
                    onChange={(e) => updateThemeField('bundleAccentColor', e.target.value)}
                    className="h-10 w-full cursor-pointer"
                  />
                  <Input
                    value={theme.bundleAccentColor || '#6ee7b7'}
                    onChange={(e) => updateThemeField('bundleAccentColor', e.target.value)}
                    placeholder="e.g., #6ee7b7"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Used for bundle price text and highlights
                  </p>
                </div>

                {/* Bundle Description Text Color */}
                <div className="space-y-3">
                  <Label className="text-white text-lg">Bundle Description Text Color</Label>
                  <Input
                    type="color"
                    value={theme.bundleDescriptionColor || '#9ca3af'}
                    onChange={(e) => updateThemeField('bundleDescriptionColor', e.target.value)}
                    className="h-10 w-full cursor-pointer"
                  />
                  <Input
                    value={theme.bundleDescriptionColor || '#9ca3af'}
                    onChange={(e) => updateThemeField('bundleDescriptionColor', e.target.value)}
                    placeholder="e.g., #9ca3af"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Used for bundle descriptions and secondary text
                  </p>
                </div>
              </div>

              <Separator className="my-6 bg-gray-700" />

              {/* Advertisement & Promoted Items - Multiple Card Types */}
              <div className="space-y-6 bg-amber-900/10 border border-amber-700/30 rounded-lg p-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📢</span>
                  <h3 className="text-xl font-bold text-white">Advertisement & Promoted Items</h3>
                </div>
                <p className="text-sm text-gray-400">Customize colors for different types of advertisements and promoted content cards</p>

                {/* Top Banner Ads */}
                <div className="space-y-4 bg-blue-900/10 border border-blue-700/30 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-300">Top Banner Ads</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">Background From</Label>
                      <Input
                        type="color"
                        value={theme.adBannerFrom || '#701a75'}
                        onChange={(e) => updateThemeField('adBannerFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.adBannerFrom || '#701a75'}
                        onChange={(e) => updateThemeField('adBannerFrom', e.target.value)}
                        placeholder="e.g., #701a75"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Background To</Label>
                      <Input
                        type="color"
                        value={theme.adBannerTo || '#1f2937'}
                        onChange={(e) => updateThemeField('adBannerTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.adBannerTo || '#1f2937'}
                        onChange={(e) => updateThemeField('adBannerTo', e.target.value)}
                        placeholder="e.g., #1f2937"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">Border Color</Label>
                  <Input
                    type="color"
                    value={theme.adBorderColor || '#a21caf'}
                    onChange={(e) => updateThemeField('adBorderColor', e.target.value)}
                    className="h-10 w-full cursor-pointer"
                  />
                  <Input
                    value={theme.adBorderColor || '#a21caf'}
                    onChange={(e) => updateThemeField('adBorderColor', e.target.value)}
                    placeholder="e.g., #a21caf"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                  />
                </div>
                    <div>
                      <Label className="text-sm text-gray-400">Button From</Label>
                      <Input
                        type="color"
                        value={theme.adButtonFrom || '#22d3ee'}
                        onChange={(e) => updateThemeField('adButtonFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.adButtonFrom || '#22d3ee'}
                        onChange={(e) => updateThemeField('adButtonFrom', e.target.value)}
                        placeholder="e.g., #22d3ee"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    </div>
                    <div>
                    <Label className="text-sm text-gray-400">Button To</Label>
                      <Input
                        type="color"
                        value={theme.adButtonTo || '#3b82f6'}
                        onChange={(e) => updateThemeField('adButtonTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.adButtonTo || '#3b82f6'}
                        onChange={(e) => updateThemeField('adButtonTo', e.target.value)}
                        placeholder="e.g., #3b82f6"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>

                {/* Local Deals Cards */}
                <div className="space-y-4 bg-green-900/10 border border-green-700/30 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-green-300">Local Deals Cards</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">Background From</Label>
                      <Input
                        type="color"
                        value={theme.localDealsFrom || '#059669'}
                        onChange={(e) => updateThemeField('localDealsFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.localDealsFrom || '#059669'}
                        onChange={(e) => updateThemeField('localDealsFrom', e.target.value)}
                        placeholder="e.g., #059669"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Background To</Label>
                      <Input
                        type="color"
                        value={theme.localDealsTo || '#047857'}
                        onChange={(e) => updateThemeField('localDealsTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.localDealsTo || '#047857'}
                        onChange={(e) => updateThemeField('localDealsTo', e.target.value)}
                        placeholder="e.g., #047857"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">Border Color</Label>
                      <Input
                        type="color"
                        value={theme.localDealsBorder || '#10b981'}
                        onChange={(e) => updateThemeField('localDealsBorder', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.localDealsBorder || '#10b981'}
                        onChange={(e) => updateThemeField('localDealsBorder', e.target.value)}
                        placeholder="e.g., #10b981"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Button From</Label>
                      <Input
                        type="color"
                        value={theme.localDealsButtonFrom || '#22c55e'}
                        onChange={(e) => updateThemeField('localDealsButtonFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.localDealsButtonFrom || '#22c55e'}
                        onChange={(e) => updateThemeField('localDealsButtonFrom', e.target.value)}
                        placeholder="e.g., #22c55e"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Button To</Label>
                    <Input
                      type="color"
                      value={theme.localDealsButtonTo || '#16a34a'}
                      onChange={(e) => updateThemeField('localDealsButtonTo', e.target.value)}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      value={theme.localDealsButtonTo || '#16a34a'}
                      onChange={(e) => updateThemeField('localDealsButtonTo', e.target.value)}
                      placeholder="e.g., #16a34a"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                </div>

                {/* Bottom Banner Ads */}
                <div className="space-y-4 bg-orange-900/10 border border-orange-700/30 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-orange-300">Bottom Banner Ads</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">Background From</Label>
                      <Input
                        type="color"
                        value={theme.bottomBannerFrom || '#7c2d12'}
                        onChange={(e) => updateThemeField('bottomBannerFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.bottomBannerFrom || '#7c2d12'}
                        onChange={(e) => updateThemeField('bottomBannerFrom', e.target.value)}
                        placeholder="e.g., #7c2d12"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Background To</Label>
                      <Input
                        type="color"
                        value={theme.bottomBannerTo || '#9a3412'}
                        onChange={(e) => updateThemeField('bottomBannerTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.bottomBannerTo || '#9a3412'}
                        onChange={(e) => updateThemeField('bottomBannerTo', e.target.value)}
                        placeholder="e.g., #9a3412"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">Border Color</Label>
                      <Input
                        type="color"
                        value={theme.bottomBannerBorder || '#ea580c'}
                        onChange={(e) => updateThemeField('bottomBannerBorder', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.bottomBannerBorder || '#ea580c'}
                        onChange={(e) => updateThemeField('bottomBannerBorder', e.target.value)}
                        placeholder="e.g., #ea580c"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Button From</Label>
                      <Input
                        type="color"
                        value={theme.bottomBannerButtonFrom || '#f97316'}
                        onChange={(e) => updateThemeField('bottomBannerButtonFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.bottomBannerButtonFrom || '#f97316'}
                        onChange={(e) => updateThemeField('bottomBannerButtonFrom', e.target.value)}
                        placeholder="e.g., #f97316"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Button To</Label>
                    <Input
                      type="color"
                      value={theme.bottomBannerButtonTo || '#ea580c'}
                      onChange={(e) => updateThemeField('bottomBannerButtonTo', e.target.value)}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      value={theme.bottomBannerButtonTo || '#ea580c'}
                      onChange={(e) => updateThemeField('bottomBannerButtonTo', e.target.value)}
                      placeholder="e.g., #ea580c"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                </div>

                {/* Special Offers Cards */}
                <div className="space-y-4 bg-pink-900/10 border border-pink-700/30 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-pink-300">Special Offers Cards</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">Background From</Label>
                      <Input
                        type="color"
                        value={theme.specialOffersFrom || '#be185d'}
                        onChange={(e) => updateThemeField('specialOffersFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.specialOffersFrom || '#be185d'}
                        onChange={(e) => updateThemeField('specialOffersFrom', e.target.value)}
                        placeholder="e.g., #be185d"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Background To</Label>
                      <Input
                        type="color"
                        value={theme.specialOffersTo || '#9d174d'}
                        onChange={(e) => updateThemeField('specialOffersTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.specialOffersTo || '#9d174d'}
                        onChange={(e) => updateThemeField('specialOffersTo', e.target.value)}
                        placeholder="e.g., #9d174d"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">Border Color</Label>
                      <Input
                        type="color"
                        value={theme.specialOffersBorder || '#ec4899'}
                        onChange={(e) => updateThemeField('specialOffersBorder', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.specialOffersBorder || '#ec4899'}
                        onChange={(e) => updateThemeField('specialOffersBorder', e.target.value)}
                        placeholder="e.g., #ec4899"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Button From</Label>
                      <Input
                        type="color"
                        value={theme.specialOffersButtonFrom || '#f472b6'}
                        onChange={(e) => updateThemeField('specialOffersButtonFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.specialOffersButtonFrom || '#f472b6'}
                        onChange={(e) => updateThemeField('specialOffersButtonFrom', e.target.value)}
                        placeholder="e.g., #f472b6"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Button To</Label>
                    <Input
                      type="color"
                      value={theme.specialOffersButtonTo || '#ec4899'}
                      onChange={(e) => updateThemeField('specialOffersButtonTo', e.target.value)}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      value={theme.specialOffersButtonTo || '#ec4899'}
                      onChange={(e) => updateThemeField('specialOffersButtonTo', e.target.value)}
                      placeholder="e.g., #ec4899"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                </div>

                {/* Featured Item Cards */}
                <div className="space-y-4 bg-purple-900/10 border border-purple-700/30 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-purple-300">Featured Item Cards</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">Background From</Label>
                      <Input
                        type="color"
                        value={theme.featuredFrom || '#7c3aed'}
                        onChange={(e) => updateThemeField('featuredFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.featuredFrom || '#7c3aed'}
                        onChange={(e) => updateThemeField('featuredFrom', e.target.value)}
                        placeholder="e.g., #7c3aed"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Background To</Label>
                      <Input
                        type="color"
                        value={theme.featuredTo || '#6d28d9'}
                        onChange={(e) => updateThemeField('featuredTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.featuredTo || '#6d28d9'}
                        onChange={(e) => updateThemeField('featuredTo', e.target.value)}
                        placeholder="e.g., #6d28d9"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">Border Color</Label>
                      <Input
                        type="color"
                        value={theme.featuredBorder || '#8b5cf6'}
                        onChange={(e) => updateThemeField('featuredBorder', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.featuredBorder || '#8b5cf6'}
                        onChange={(e) => updateThemeField('featuredBorder', e.target.value)}
                        placeholder="e.g., #8b5cf6"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Button From</Label>
                      <Input
                        type="color"
                        value={theme.featuredButtonFrom || '#a855f7'}
                        onChange={(e) => updateThemeField('featuredButtonFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.featuredButtonFrom || '#a855f7'}
                        onChange={(e) => updateThemeField('featuredButtonFrom', e.target.value)}
                        placeholder="e.g., #a855f7"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Button To</Label>
                    <Input
                      type="color"
                      value={theme.featuredButtonTo || '#9333ea'}
                      onChange={(e) => updateThemeField('featuredButtonTo', e.target.value)}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      value={theme.featuredButtonTo || '#9333ea'}
                      onChange={(e) => updateThemeField('featuredButtonTo', e.target.value)}
                      placeholder="e.g., #9333ea"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                </div>

                {/* Promoted Item Cards */}
                <div className="space-y-4 bg-cyan-900/10 border border-cyan-700/30 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-cyan-300">Promoted Item Cards</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">Background From</Label>
                      <Input
                        type="color"
                        value={theme.promotedFrom || '#0891b2'}
                        onChange={(e) => updateThemeField('promotedFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.promotedFrom || '#0891b2'}
                        onChange={(e) => updateThemeField('promotedFrom', e.target.value)}
                        placeholder="e.g., #0891b2"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Background To</Label>
                      <Input
                        type="color"
                        value={theme.promotedTo || '#0e7490'}
                        onChange={(e) => updateThemeField('promotedTo', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.promotedTo || '#0e7490'}
                        onChange={(e) => updateThemeField('promotedTo', e.target.value)}
                        placeholder="e.g., #0e7490"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-400">Border Color</Label>
                      <Input
                        type="color"
                        value={theme.promotedBorder || '#06b6d4'}
                        onChange={(e) => updateThemeField('promotedBorder', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.promotedBorder || '#06b6d4'}
                        onChange={(e) => updateThemeField('promotedBorder', e.target.value)}
                        placeholder="e.g., #06b6d4"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Button From</Label>
                      <Input
                        type="color"
                        value={theme.promotedButtonFrom || '#22d3ee'}
                        onChange={(e) => updateThemeField('promotedButtonFrom', e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                      <Input
                        value={theme.promotedButtonFrom || '#22d3ee'}
                        onChange={(e) => updateThemeField('promotedButtonFrom', e.target.value)}
                        placeholder="e.g., #22d3ee"
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Button To</Label>
                    <Input
                      type="color"
                      value={theme.promotedButtonTo || '#06b6d4'}
                      onChange={(e) => updateThemeField('promotedButtonTo', e.target.value)}
                      className="h-10 w-full cursor-pointer"
                    />
                    <Input
                      value={theme.promotedButtonTo || '#06b6d4'}
                      onChange={(e) => updateThemeField('promotedButtonTo', e.target.value)}
                      placeholder="e.g., #06b6d4"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={saveTheme}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Theme
                </Button>
                <Button
                  onClick={resetTheme}
                  variant="outline"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comprehensive Live Preview */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <CardDescription>See how your theme will look across all card types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Standard Item Card Preview */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-white">Standard Item Card</h4>
                <div 
                  className="rounded-2xl shadow-2xl p-6 border-2 border-cyan-500/30 max-w-sm"
                style={{
                  background: `linear-gradient(to bottom right, ${theme.cardFrom}, ${theme.cardTo})`
                }}
              >
                <div className="bg-gray-800 rounded-lg h-48 mb-4 flex items-center justify-center text-gray-500">
                  <span className="text-sm">Item Image</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sample Item Title</h3>
                <p 
                  className="text-sm mb-3"
                  style={{ color: theme.descriptionColor || '#9ca3af' }}
                >
                  Sample item description text
                </p>
                <div 
                  className="text-3xl font-bold mb-4"
                  style={{ color: theme.accentColor }}
                >
                  $99.99
                </div>
                <Button 
                  className="w-full hover:opacity-90"
                  style={{
                    background: `linear-gradient(to right, ${theme.buttonFrom}, ${theme.buttonTo})`
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                </div>
              </div>

              {/* Bundle Card Preview */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-white">Bundle Card</h4>
                <div 
                  className="rounded-2xl shadow-2xl p-6 border-2 border-emerald-500/30 max-w-sm"
                style={{
                  background: `linear-gradient(to bottom right, ${theme.bundleCardFrom || '#059669'}, ${theme.bundleCardTo || '#047857'})`
                }}
              >
                <div className="bg-gray-800 rounded-lg h-48 mb-4 flex items-center justify-center text-gray-500">
                  <span className="text-sm">Bundle Image</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sample Bundle Title</h3>
                <p 
                  className="text-sm mb-3"
                  style={{ color: theme.bundleDescriptionColor || '#9ca3af' }}
                >
                  Sample bundle description text
                </p>
                <div 
                  className="text-3xl font-bold mb-4"
                  style={{ color: theme.bundleAccentColor || '#6ee7b7' }}
                >
                  $199.99
                </div>
                <Button 
                  className="w-full hover:opacity-90"
                  style={{
                    background: `linear-gradient(to right, ${theme.bundleButtonFrom || '#10b981'}, ${theme.bundleButtonTo || '#059669'})`
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Buy Bundle
                </Button>
                </div>
              </div>

              {/* Advertisement & Promoted Items Previews */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-white">Advertisement & Promoted Items</h4>
                
                {/* Top Banner Ads Preview */}
                <div className="space-y-3">
                  <h5 className="text-md font-medium text-blue-300">Top Banner Ads</h5>
                  <div 
                    className="rounded-lg p-4 border-2 max-w-2xl"
                    style={{
                      background: `linear-gradient(to right, ${theme.adBannerFrom || '#701a75'}, ${theme.adBannerTo || '#1f2937'})`,
                      borderColor: theme.adBorderColor || '#a21caf'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h6 className="text-lg font-bold text-white">Special Promotion</h6>
                        <p className="text-sm text-gray-300">Limited time offer - 50% off!</p>
                      </div>
                      <Button 
                        size="sm"
                        style={{
                          background: `linear-gradient(to right, ${theme.adButtonFrom || '#22d3ee'}, ${theme.adButtonTo || '#3b82f6'})`
                        }}
                      >
                        Learn More
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Local Deals Cards Preview */}
                <div className="space-y-3">
                  <h5 className="text-md font-medium text-green-300">Local Deals Cards</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className="rounded-lg p-4 border-2"
                      style={{
                        background: `linear-gradient(to bottom right, ${theme.localDealsFrom || '#059669'}, ${theme.localDealsTo || '#047857'})`,
                        borderColor: theme.localDealsBorder || '#10b981'
                      }}
                    >
                      <div className="bg-gray-800/30 rounded-lg h-32 mb-3 flex items-center justify-center text-gray-300">
                        <span className="text-sm">Deal Image</span>
                      </div>
                      <h6 className="text-lg font-bold text-white mb-2">Local Deal</h6>
                      <p className="text-sm text-gray-300 mb-3">Great savings in your area</p>
                      <Button 
                        size="sm"
                        className="w-full"
                        style={{
                          background: `linear-gradient(to right, ${theme.localDealsButtonFrom || '#22c55e'}, ${theme.localDealsButtonTo || '#16a34a'})`
                        }}
                      >
                        View Deal
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bottom Banner Ads Preview */}
                <div className="space-y-3">
                  <h5 className="text-md font-medium text-orange-300">Bottom Banner Ads</h5>
                  <div 
                    className="rounded-lg p-4 border-2 max-w-2xl"
                    style={{
                      background: `linear-gradient(to right, ${theme.bottomBannerFrom || '#7c2d12'}, ${theme.bottomBannerTo || '#9a3412'})`,
                      borderColor: theme.bottomBannerBorder || '#ea580c'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h6 className="text-lg font-bold text-white">Bottom Banner</h6>
                        <p className="text-sm text-gray-300">Call to action message</p>
                      </div>
                      <Button 
                        size="sm"
                        style={{
                          background: `linear-gradient(to right, ${theme.bottomBannerButtonFrom || '#f97316'}, ${theme.bottomBannerButtonTo || '#ea580c'})`
                        }}
                      >
                        Action
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Special Offers Cards Preview */}
                <div className="space-y-3">
                  <h5 className="text-md font-medium text-pink-300">Special Offers Cards</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className="rounded-lg p-4 border-2"
                      style={{
                        background: `linear-gradient(to bottom right, ${theme.specialOffersFrom || '#be185d'}, ${theme.specialOffersTo || '#9d174d'})`,
                        borderColor: theme.specialOffersBorder || '#ec4899'
                      }}
                    >
                      <div className="bg-gray-800/30 rounded-lg h-32 mb-3 flex items-center justify-center text-gray-300">
                        <span className="text-sm">Offer Image</span>
                      </div>
                      <h6 className="text-lg font-bold text-white mb-2">Special Offer</h6>
                      <p className="text-sm text-gray-300 mb-3">Exclusive deal for you</p>
                      <Button 
                        size="sm"
                        className="w-full"
                        style={{
                          background: `linear-gradient(to right, ${theme.specialOffersButtonFrom || '#f472b6'}, ${theme.specialOffersButtonTo || '#ec4899'})`
                        }}
                      >
                        Get Offer
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Featured Item Cards Preview */}
                <div className="space-y-3">
                  <h5 className="text-md font-medium text-purple-300">Featured Item Cards</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className="rounded-lg p-4 border-2"
                      style={{
                        background: `linear-gradient(to bottom right, ${theme.featuredFrom || '#7c3aed'}, ${theme.featuredTo || '#6d28d9'})`,
                        borderColor: theme.featuredBorder || '#8b5cf6'
                      }}
                    >
                      <div className="bg-gray-800/30 rounded-lg h-32 mb-3 flex items-center justify-center text-gray-300">
                        <span className="text-sm">Featured Image</span>
                      </div>
                      <h6 className="text-lg font-bold text-white mb-2">Featured Item</h6>
                      <p className="text-sm text-gray-300 mb-3">Premium selection</p>
                      <Button 
                        size="sm"
                        className="w-full"
                        style={{
                          background: `linear-gradient(to right, ${theme.featuredButtonFrom || '#a855f7'}, ${theme.featuredButtonTo || '#9333ea'})`
                        }}
                      >
                        View Featured
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Promoted Item Cards Preview */}
                <div className="space-y-3">
                  <h5 className="text-md font-medium text-cyan-300">Promoted Item Cards</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className="rounded-lg p-4 border-2"
                      style={{
                        background: `linear-gradient(to bottom right, ${theme.promotedFrom || '#0891b2'}, ${theme.promotedTo || '#0e7490'})`,
                        borderColor: theme.promotedBorder || '#06b6d4'
                      }}
                    >
                      <div className="bg-gray-800/30 rounded-lg h-32 mb-3 flex items-center justify-center text-gray-300">
                        <span className="text-sm">Promoted Image</span>
                      </div>
                      <h6 className="text-lg font-bold text-white mb-2">Promoted Item</h6>
                      <p className="text-sm text-gray-300 mb-3">Sponsored content</p>
                      <Button 
                        size="sm"
                        className="w-full"
                        style={{
                          background: `linear-gradient(to right, ${theme.promotedButtonFrom || '#22d3ee'}, ${theme.promotedButtonTo || '#06b6d4'})`
                        }}
                      >
                        View Promoted
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Presets - Full Width with Visual Examples */}
          <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
            <CardHeader>
              <CardTitle>Theme Presets</CardTitle>
              <CardDescription>Quick start with pre-made themes - click to see full preview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(THEME_PRESETS).map(([name, preset]) => (
                  <button
                    key={name}
                    onClick={() => applyPreset(name)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      JSON.stringify(theme) === JSON.stringify(preset)
                        ? 'border-pink-500 shadow-lg shadow-pink-500/50'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {/* Mini Preview Card */}
                    <div 
                      className="p-4 h-48"
                      style={{
                        background: `linear-gradient(to bottom right, ${preset.cardFrom}, ${preset.cardTo})`
                      }}
                    >
                      <div className="bg-gray-800/50 rounded-lg h-16 mb-3 flex items-center justify-center text-gray-300">
                        <span className="text-xs">Image</span>
                    </div>
                      <h6 className="text-sm font-bold text-white mb-1">Sample Item</h6>
                      <div 
                        className="text-lg font-bold mb-2"
                        style={{ color: preset.accentColor }}
                      >
                        $99.99
                      </div>
                      <Button 
                        size="sm"
                        className="w-full text-xs"
                        style={{
                          background: `linear-gradient(to right, ${preset.buttonFrom}, ${preset.buttonTo})`
                        }}
                      >
                        View
                      </Button>
                    </div>
                    
                    {/* Advertisement Preview */}
                    <div 
                      className="p-3 border-t"
                      style={{
                        background: `linear-gradient(to right, ${preset.adBannerFrom}, ${preset.adBannerTo})`,
                        borderColor: preset.adBorderColor
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h6 className="text-xs font-bold text-white">Ad Banner</h6>
                          <p className="text-xs text-gray-300">Preview</p>
                        </div>
                        <Button 
                          size="sm"
                          className="text-xs px-2 py-1"
                          style={{
                            background: `linear-gradient(to right, ${preset.adButtonFrom}, ${preset.adButtonTo})`
                          }}
                        >
                          Click
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 p-3">
                      <p className="text-sm font-semibold text-white text-center">{name}</p>
                      <p className="text-xs text-gray-400 text-center mt-1">Click to apply</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Reference */}
          <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
            <CardHeader>
              <CardTitle>Tailwind Color Reference</CardTitle>
              <CardDescription>Available colors and shades you can use</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {TAILWIND_COLORS.map(color => (
                  <div key={color}>
                    <p className="text-sm font-semibold text-gray-400 mb-2 capitalize">{color}</p>
                    <div className="flex gap-1 flex-wrap">
                      {TAILWIND_SHADES.map(shade => (
                        <button
                          key={`${color}-${shade}`}
                          onClick={() => {
                            navigator.clipboard.writeText(`${color}-${shade}`);
                            toast({
                              title: "Copied!",
                              description: `${color}-${shade} copied to clipboard`
                            });
                          }}
                          className={`w-12 h-12 rounded bg-${color}-${shade} hover:ring-2 ring-white transition-all flex items-center justify-center group`}
                          title={`${color}-${shade}`}
                        >
                          <span className="text-[8px] text-white opacity-0 group-hover:opacity-100 font-bold">
                            {shade}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-gray-900 border-gray-800 mt-6">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-400">
            <p>1. <strong className="text-white">Choose a preset</strong> or customize colors manually</p>
            <p>2. <strong className="text-white">Preview</strong> your changes in the live preview card</p>
            <p>3. <strong className="text-white">Click "Save Theme"</strong> to save your settings</p>
            <p>4. <strong className="text-white">Refresh the page</strong> to see your changes applied to the marketplace</p>
            <p className="text-xs text-gray-500 pt-3">
              Note: Color format should be: colorName-shade (e.g., blue-900, purple-500, cyan-400)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

