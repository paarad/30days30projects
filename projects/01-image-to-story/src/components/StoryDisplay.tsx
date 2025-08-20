'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Download, BookOpen, Loader2 } from 'lucide-react';
import { StorySettings } from '@/app/page';

interface StoryDisplayProps {
  story: string | null;
  isGenerating: boolean;
  settings: StorySettings;
}

export default function StoryDisplay({ story, isGenerating, settings }: StoryDisplayProps) {
  const handleCopyStory = async () => {
    if (story && typeof window !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(story);
      } catch (error) {
        console.error('Failed to copy story:', error);
      }
    }
  };

  const handleDownloadStory = () => {
    if (story && typeof window !== 'undefined') {
      const blob = new Blob([story], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-700 text-lg font-medium mb-2">Creating your story...</p>
          <p className="text-gray-500 text-sm">
            Analyzing the image and crafting a {settings.style.toLowerCase()} story with a {settings.tone.toLowerCase()} tone
          </p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-[400px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">Your story will appear here</p>
          <p className="text-gray-400 text-sm">
            Select an image and click "Generate Story" to begin
          </p>
        </div>
      </div>
    );
  }

  const wordCount = story.split(/\s+/).length;

  return (
    <div className="space-y-6">
      {/* Story Metadata */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
            {settings.style}
          </Badge>
          <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
            {settings.tone}
          </Badge>
          <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50">
            {wordCount} words
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleCopyStory}
            variant="outline"
            size="sm"
            className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button
            onClick={handleDownloadStory}
            variant="outline"
            size="sm"
            className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Story Content */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <div className="prose prose-gray max-w-none">
          {story.split('\n').map((paragraph, index) => (
            <p
              key={index}
              className="text-gray-800 leading-relaxed mb-4 last:mb-0 text-base"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Reading Time Estimate */}
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          Estimated reading time: {Math.ceil(wordCount / 200)} minute{Math.ceil(wordCount / 200) !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}