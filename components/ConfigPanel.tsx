import React, { useState, useRef } from 'react';
import { AspectRatio, ShotCount, UserConfig } from '../types';
import { Settings, Image as ImageIcon, Type, Clapperboard, UploadCloud, X } from 'lucide-react';

interface ConfigPanelProps {
  config: UserConfig;
  setConfig: React.Dispatch<React.SetStateAction<UserConfig>>;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  setConfig,
  imageFile,
  setImageFile,
  onGenerate,
  isGenerating,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
      }
    }
  };

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-cine-800 p-6 rounded-xl border border-cine-700 shadow-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6 text-cine-accent">
        <Clapperboard size={24} />
        <h2 className="text-xl font-bold tracking-wide">Project Setup</h2>
      </div>

      <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
        {/* Main Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Type size={16} /> Story Description / Script
          </label>
          <textarea
            className="w-full bg-cine-900 border border-cine-700 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-cine-accent focus:outline-none min-h-[120px]"
            placeholder="Describe the scene, action, characters, and atmosphere..."
            value={config.mainDescription}
            onChange={(e) => setConfig({ ...config, mainDescription: e.target.value })}
          />
        </div>

        {/* Reference Image - Drag & Drop */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <ImageIcon size={16} /> Reference Image (Optional)
          </label>
          
          {!imageFile ? (
            <div
              onClick={handleZoneClick}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                ${isDragging 
                  ? 'border-cine-accent bg-cine-700/50' 
                  : 'border-cine-600 bg-cine-900/50 hover:bg-cine-800 hover:border-cine-500'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud size={32} className={`mb-2 ${isDragging ? 'text-cine-accent' : 'text-gray-400'}`} />
              <p className="text-sm text-gray-300 font-medium text-center">
                {isDragging ? 'Drop image here' : 'Click or Drag & Drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, WEBP</p>
            </div>
          ) : (
            <div className="relative group rounded-lg border border-cine-600 bg-cine-900/50 p-2">
              <div className="relative h-40 w-full overflow-hidden rounded-md">
                <img 
                  src={URL.createObjectURL(imageFile)} 
                  alt="Preview" 
                  className="h-full w-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                    }}
                    className="bg-red-500/90 text-white rounded-full p-2 hover:bg-red-600 transition-colors transform hover:scale-110"
                    title="Remove image"
                    >
                    <X size={20} />
                    </button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400 px-1">
                 <span className="truncate max-w-[180px]">{imageFile.name}</span>
                 <button 
                   onClick={() => setImageFile(null)}
                   className="text-red-400 hover:text-red-300 underline"
                 >
                   Remove
                 </button>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500">AI will analyze character roles, lighting, and composition from this image.</p>
        </div>

        {/* Layout Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase">Shot Count</label>
            <select
              className="w-full bg-cine-900 border border-cine-700 rounded-lg p-2 text-sm text-gray-200 focus:ring-1 focus:ring-cine-accent"
              value={config.shotCount}
              onChange={(e) => setConfig({ ...config, shotCount: Number(e.target.value) as ShotCount })}
            >
              <option value={ShotCount.Three}>3 Shots (1x3)</option>
              <option value={ShotCount.Four}>4 Shots (2x2)</option>
              <option value={ShotCount.Six}>6 Shots (2x3)</option>
              <option value={ShotCount.Nine}>9 Shots (3x3)</option>
              <option value={ShotCount.Sixteen}>16 Shots (4x4)</option>
              <option value={ShotCount.Twenty}>20 Shots (4x5)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase">Aspect Ratio</label>
            <select
              className="w-full bg-cine-900 border border-cine-700 rounded-lg p-2 text-sm text-gray-200 focus:ring-1 focus:ring-cine-accent"
              value={config.aspectRatio}
              onChange={(e) => setConfig({ ...config, aspectRatio: e.target.value as AspectRatio })}
            >
              <option value={AspectRatio.Wide16_9}>16:9 Widescreen</option>
              <option value={AspectRatio.Cinema2_39_1}>2.39:1 Cinema</option>
              <option value={AspectRatio.Classic4_3}>4:3 Classic</option>
              <option value={AspectRatio.Portrait9_16}>9:16 Vertical</option>
              <option value={AspectRatio.Square1_1}>1:1 Square</option>
            </select>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Settings size={16} /> Additional Requirements
          </label>
          <textarea
            className="w-full bg-cine-900 border border-cine-700 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-cine-accent focus:outline-none h-24"
            placeholder="Selling points, specific atmosphere, camera moves..."
            value={config.additionalNotes}
            onChange={(e) => setConfig({ ...config, additionalNotes: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={onGenerate}
          disabled={isGenerating || (!config.mainDescription && !imageFile)}
          className={`w-full py-3 px-4 rounded-lg font-bold text-lg tracking-wide shadow-lg transition-all
            ${isGenerating || (!config.mainDescription && !imageFile)
              ? 'bg-cine-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cine-accent to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 transform hover:scale-[1.02]'
            }
          `}
        >
          {isGenerating ? 'Analyzing & Generating...' : 'Generate Storyboard Prompts'}
        </button>
      </div>
    </div>
  );
};

export default ConfigPanel;