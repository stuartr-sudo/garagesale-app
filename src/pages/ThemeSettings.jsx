import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Palette, RotateCcw, Save, Eye } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

// Default theme presets
const THEME_PRESETS = {
  'Navy to Purple': {
    cardFrom: 'blue-900',
    cardTo: 'purple-900',
    buttonFrom: 'purple-500',
    buttonTo: 'pink-600',
    accentColor: 'cyan-400'
  },
  'Dark Slate': {
    cardFrom: 'slate-700',
    cardTo: 'slate-600',
    buttonFrom: 'purple-500',
    buttonTo: 'pink-600',
    accentColor: 'cyan-400'
  },
  'Ocean Blue': {
    cardFrom: 'blue-800',
    cardTo: 'cyan-900',
    buttonFrom: 'blue-500',
    buttonTo: 'cyan-600',
    accentColor: 'blue-300'
  },
  'Sunset': {
    cardFrom: 'orange-800',
    cardTo: 'pink-900',
    buttonFrom: 'orange-500',
    buttonTo: 'pink-600',
    accentColor: 'orange-300'
  },
  'Forest': {
    cardFrom: 'green-900',
    cardTo: 'emerald-900',
    buttonFrom: 'green-500',
    buttonTo: 'emerald-600',
    accentColor: 'green-300'
  },
  'Royal': {
    cardFrom: 'purple-900',
    cardTo: 'indigo-900',
    buttonFrom: 'purple-500',
    buttonTo: 'indigo-600',
    accentColor: 'purple-300'
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
                      value={theme.cardFrom}
                      onChange={(e) => updateThemeField('cardFrom', e.target.value)}
                      placeholder="e.g., blue-900"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">To Color</Label>
                    <Input
                      value={theme.cardTo}
                      onChange={(e) => updateThemeField('cardTo', e.target.value)}
                      placeholder="e.g., purple-900"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Format: color-shade (e.g., blue-900, purple-800)
                </p>
              </div>

              {/* Button Gradient */}
              <div className="space-y-3">
                <Label className="text-white text-lg">Button Gradient</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-gray-400">From Color</Label>
                    <Input
                      value={theme.buttonFrom}
                      onChange={(e) => updateThemeField('buttonFrom', e.target.value)}
                      placeholder="e.g., purple-500"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">To Color</Label>
                    <Input
                      value={theme.buttonTo}
                      onChange={(e) => updateThemeField('buttonTo', e.target.value)}
                      placeholder="e.g., pink-600"
                      className="bg-gray-800 border-gray-700 text-white mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-3">
                <Label className="text-white text-lg">Accent Color</Label>
                <Input
                  value={theme.accentColor}
                  onChange={(e) => updateThemeField('accentColor', e.target.value)}
                  placeholder="e.g., cyan-400"
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500">
                  Used for price text and highlights
                </p>
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

          {/* Preview */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <CardDescription>See how your theme will look</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Preview Card */}
              <div className={`bg-gradient-to-br from-${theme.cardFrom} to-${theme.cardTo} rounded-2xl shadow-2xl p-6 border-2 border-cyan-500/30`}>
                <div className="bg-gray-800 rounded-lg h-48 mb-4 flex items-center justify-center text-gray-500">
                  <span className="text-sm">Item Image</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sample Item Title</h3>
                <div className={`text-3xl font-bold text-${theme.accentColor} mb-4`}>
                  $99.99
                </div>
                <Button className={`w-full bg-gradient-to-r from-${theme.buttonFrom} to-${theme.buttonTo} hover:opacity-90`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Theme Presets - Full Width */}
          <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
            <CardHeader>
              <CardTitle>Theme Presets</CardTitle>
              <CardDescription>Quick start with pre-made themes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                    <div className={`h-24 bg-gradient-to-br from-${preset.cardFrom} to-${preset.cardTo}`}>
                      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-r from-${preset.buttonFrom} to-${preset.buttonTo} h-8`} />
                    </div>
                    <div className="bg-gray-800 p-2">
                      <p className="text-xs font-semibold text-white text-center">{name}</p>
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

