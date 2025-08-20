'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { StorySettings } from '@/app/page';

interface StoryControlsProps {
  settings: StorySettings;
  onSettingsChange: (settings: StorySettings) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasImage: boolean;
}

const STORY_STYLES = [
  'Literary', 'Sci-Fi', 'Fantasy', 'Horror', 'Mystery', 'Slice of Life', 'Surreal', 'Adventure', 'Romance', 'Comedy'
];

const STORY_TONES = [
  'Neutral', 'Whimsical', 'Moody', 'Dark', 'Hopeful', 'Mysterious', 'Playful', 'Melancholic', 'Inspiring', 'Suspenseful'
];

export default function StoryControls({ 
  settings, 
  onSettingsChange, 
  onGenerate, 
  isGenerating, 
  hasImage 
}: StoryControlsProps) {
  const updateSetting = <K extends keyof StorySettings>(key: K, value: StorySettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-8">
      {/* Style Selection */}
      <div className="space-y-3">
        <Label className="text-gray-700 font-medium">Story Style</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-white border-gray-200 text-gray-900 hover:bg-gray-50 py-3 rounded-xl font-medium"
            >
              {settings.style}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full bg-white border-gray-200 rounded-xl shadow-lg">
            {STORY_STYLES.map((style) => (
              <DropdownMenuItem
                key={style}
                onClick={() => updateSetting('style', style)}
                className="text-gray-900 hover:bg-gray-50 cursor-pointer py-3 px-4 rounded-lg"
              >
                {style}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tone Selection */}
      <div className="space-y-3">
        <Label className="text-gray-700 font-medium">Story Tone</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-white border-gray-200 text-gray-900 hover:bg-gray-50 py-3 rounded-xl font-medium"
            >
              {settings.tone}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full bg-white border-gray-200 rounded-xl shadow-lg">
            {STORY_TONES.map((tone) => (
              <DropdownMenuItem
                key={tone}
                onClick={() => updateSetting('tone', tone)}
                className="text-gray-900 hover:bg-gray-50 cursor-pointer py-3 px-4 rounded-lg"
              >
                {tone}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Length Slider */}
      <div className="space-y-4 border border-gray-200 p-4 rounded-lg bg-white">
        <div className="flex justify-between items-center">
          <Label className="text-gray-700 font-medium">Story Length</Label>
          <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50">
            {settings.length} words
          </Badge>
        </div>
        <Slider
          value={[settings.length]}
          onValueChange={(value) => updateSetting('length', value[0])}
          min={30}
          max={300}
          step={20}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>Short (30)</span>
          <span>Medium (150)</span>
          <span>Long (300)</span>
        </div>
      </div>

      {/* Hints Textarea */}
      <div className="space-y-3">
        <Label className="text-gray-700 font-medium">Optional Hints</Label>
        <Textarea
          value={settings.hints}
          onChange={(e) => updateSetting('hints', e.target.value)}
          placeholder="Add themes, character names, moods, or any specific elements you'd like in your story..."
          className="bg-white border-gray-200 text-gray-900 placeholder-gray-400 resize-none min-h-[100px] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500">
          Help guide the AI with specific elements you want included
        </p>
      </div>

      {/* Generate Button */}
      <div className="pt-4">
        <Button
          onClick={onGenerate}
          disabled={!hasImage || isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Story...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Story
            </>
          )}
        </Button>
      </div>

      {!hasImage && (
        <p className="text-center text-gray-500 text-sm">
          Select an image above to generate a story
        </p>
      )}
    </div>
  );
}