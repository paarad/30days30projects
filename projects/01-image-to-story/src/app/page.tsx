'use client';

import { useState, useEffect } from 'react';
import ImageInput from '@/components/ImageInput';
import StoryControls from '@/components/StoryControls';
import ImagePreview from '@/components/ImagePreview';
import StoryDisplay from '@/components/StoryDisplay';
import { Card } from '@/components/ui/card';

export interface StorySettings {
  style: string;
  tone: string;
  length: number;
  hints: string;
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'upload' | 'url' | 'gallery' | null>(null);
  const [story, setStory] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [storySettings, setStorySettings] = useState<StorySettings>({
    style: 'Literary',
    tone: 'Neutral',
    length: 300,
    hints: ''
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleImageSelect = (imageUrl: string, source: 'upload' | 'url' | 'gallery') => {
    setSelectedImage(imageUrl);
    setImageSource(source);
    setStory(null);
  };

  const handleGenerateStory = async () => {
    if (!selectedImage) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: selectedImage,
          imageSource,
          settings: storySettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(`API Error ${response.status}: ${errorData.error || 'Failed to generate story'}`);
      }

      const data = await response.json();
      setStory(data.story);
    } catch (error) {
      console.error('Error generating story:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate story'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-400">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-light text-gray-900 mb-6 tracking-tight">
            Image to Story
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed">
            Transform any image into a captivating story with AI.
            <br />
            Simple. Powerful. Beautiful.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Panel */}
            <div className="space-y-8">
              <Card className="p-8 bg-gray-50/50 border-0 shadow-sm rounded-2xl">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Choose Image</h2>
                <ImageInput onImageSelect={handleImageSelect} />
              </Card>

              <Card className="p-8 bg-gray-50/50 border-0 shadow-sm rounded-2xl">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Story Settings</h2>
                <StoryControls 
                  settings={storySettings}
                  onSettingsChange={setStorySettings}
                  onGenerate={handleGenerateStory}
                  isGenerating={isGenerating}
                  hasImage={!!selectedImage}
                />
              </Card>
            </div>

            {/* Right Panel */}
            <div className="space-y-8">
              <Card className="p-8 bg-gray-50/50 border-0 shadow-sm rounded-2xl">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Preview</h2>
                <ImagePreview imageUrl={selectedImage} />
              </Card>

              <Card className="p-8 bg-gray-50/50 border-0 shadow-sm rounded-2xl">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Story</h2>
                <StoryDisplay 
                  story={story} 
                  isGenerating={isGenerating}
                  settings={storySettings}
                />
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}