import React from 'react';
import { Download, Image as ImageIcon } from 'lucide-react';

interface ImageDisplayProps {
  imageUrl: string;
  prompt: string;
  onDownload?: () => void;
}

export function ImageDisplay({ imageUrl, prompt, onDownload }: ImageDisplayProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (onDownload) {
      onDownload();
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-sage-200/30 animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-5 h-5 text-sage-600" />
          <span className="text-sm font-medium text-sage-700">Generated Image</span>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-1 px-3 py-1.5 bg-sage-100 hover:bg-sage-200 rounded-lg transition-colors text-sm text-sage-700"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
      </div>
      
      <div className="relative group">
        <img
          src={imageUrl}
          alt={prompt}
          className="w-full rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
          style={{ maxHeight: '400px', objectFit: 'contain' }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors duration-300" />
      </div>
      
      <div className="mt-3 p-3 bg-sage-50/50 rounded-lg">
        <p className="text-sm text-sage-600">
          <span className="font-medium">Prompt:</span> {prompt}
        </p>
      </div>
    </div>
  );
}