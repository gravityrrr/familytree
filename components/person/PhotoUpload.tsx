'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Camera, Image as ImageIcon, Link, X, Upload } from 'lucide-react';

interface PhotoUploadProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  onUrlUpload?: (url: string) => Promise<void>;
  currentPhotoUrl?: string | null;
}

export function PhotoUpload({ open, onClose, onUpload, onUrlUpload, currentPhotoUrl }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (selectedFile) await onUpload(selectedFile);
      else if (urlInput && onUrlUpload) await onUrlUpload(urlInput);
      resetAndClose();
    } finally { setLoading(false); }
  };

  const resetAndClose = () => {
    setPreview(null); setSelectedFile(null); setUrlInput(''); setShowUrlInput(false); onClose();
  };

  return (
    <Sheet open={open} onClose={resetAndClose} title="Upload Photo">
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      {preview && (
        <div className="relative mb-4">
          <Image src={preview} alt="Preview" width={400} height={192} className="w-full h-48 object-cover rounded-card" unoptimized />
          <button onClick={() => { setPreview(null); setSelectedFile(null); }} className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {!preview && currentPhotoUrl && (
        <div className="mb-4">
          <Image src={currentPhotoUrl} alt="Current photo" width={400} height={192} className="w-full h-48 object-cover rounded-card opacity-50" unoptimized />
          <p className="text-xs text-center text-gray-400 mt-1">Current photo</p>
        </div>
      )}

      {!preview && !showUrlInput && (
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 p-3 rounded-card hover:bg-gray-50 transition-colors text-left" onClick={() => cameraInputRef.current?.click()}>
            <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center"><Camera className="w-5 h-5 text-brand" /></div>
            <div><p className="text-sm font-medium text-gray-900">Take Photo</p><p className="text-xs text-gray-500">Open camera</p></div>
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-card hover:bg-gray-50 transition-colors text-left" onClick={() => fileInputRef.current?.click()}>
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-sm font-medium text-gray-900">Choose from Library</p><p className="text-xs text-gray-500">Select from device</p></div>
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-card hover:bg-gray-50 transition-colors text-left" onClick={() => setShowUrlInput(true)}>
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center"><Link className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-sm font-medium text-gray-900">Enter URL</p><p className="text-xs text-gray-500">Paste image link</p></div>
          </button>
        </div>
      )}

      {showUrlInput && !preview && (
        <div className="space-y-3">
          <Input label="Image URL" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com/photo.jpg" id="photo-url" />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowUrlInput(false)} className="flex-1">Back</Button>
            <Button onClick={handleConfirm} loading={loading} disabled={!urlInput} className="flex-1"><Upload className="w-4 h-4 mr-1" />Upload</Button>
          </div>
        </div>
      )}

      {preview && <Button onClick={handleConfirm} loading={loading} className="w-full" size="lg"><Upload className="w-4 h-4 mr-1.5" />Use This Photo</Button>}
    </Sheet>
  );
}
