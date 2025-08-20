'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Link, Shuffle, Image as ImageIcon } from 'lucide-react';

interface ImageInputProps {
  onImageSelect: (imageUrl: string, source: 'upload' | 'url' | 'gallery') => void;
}

const BOTTO_GALLERY = [
  // Local gallery images
  '/gallery/terrasse.jpg',
  '/gallery/sirat.jpg',
  '/gallery/punk.png',
  '/gallery/pepe.jpg',
  '/gallery/mt_fuji.jpg',
  '/gallery/6529xBotto.png',
  // Unsplash images for variety
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop',
];

export default function ImageInput({ onImageSelect }: ImageInputProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'gallery'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageSelect(result, 'upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    
    setIsLoadingUrl(true);
    try {
      const url = new URL(urlInput);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid URL protocol');
      }
      
      onImageSelect(urlInput, 'url');
      setUrlInput('');
    } catch (error) {
      console.error('Invalid URL:', error);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleGallerySelect = (imageUrl: string) => {
    onImageSelect(imageUrl, 'gallery');
  };

  const handleShuffle = () => {
    const randomImage = BOTTO_GALLERY[Math.floor(Math.random() * BOTTO_GALLERY.length)];
    onImageSelect(randomImage, 'gallery');
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex p-1 bg-gray-100 rounded-xl">
        {[
          { id: 'upload', label: 'Upload', icon: Upload },
          { id: 'url', label: 'URL', icon: Link },
          { id: 'gallery', label: 'Gallery', icon: ImageIcon },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'upload' | 'url' | 'gallery')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50/50"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-1">Click to upload an image</p>
              <p className="text-gray-500 text-sm">PNG, JPG, WEBP up to 10MB</p>
            </div>
          </div>
        )}

        {activeTab === 'url' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-url" className="text-gray-700 font-medium">Image URL</Label>
              <input
                id="image-url"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="https://example.com/image.jpg"
                className="w-full mt-2 p-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim() || isLoadingUrl}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium"
            >
              {isLoadingUrl ? 'Loading...' : 'Load Image'}
            </Button>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-700 font-medium">Gallery</p>
              <Button
                onClick={handleShuffle}
                variant="outline"
                size="sm"
                className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Shuffle
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {BOTTO_GALLERY.map((imageUrl, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-200 transition-all hover:scale-105"
                  onClick={() => handleGallerySelect(imageUrl)}
                >
                  <img
                    src={imageUrl}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}