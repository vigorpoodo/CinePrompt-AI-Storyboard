import React, { useState, useRef } from 'react';
import { TransitionConfig, TransitionResult } from '../types';
import { generateTransitions } from '../services/geminiService';
import { UploadCloud, X, Film, Sparkles, Copy, ArrowRight, Settings } from 'lucide-react';

const TransitionPage: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [config, setConfig] = useState<TransitionConfig>({
    transitionCount: 1,
    additionalNotes: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<TransitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0] && e.dataTransfer.files[0].type.startsWith('image/')) {
      setImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await generateTransitions(config, imageFile);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate transitions");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full max-w-[1920px] mx-auto">
      
      {/* Left Panel: Configuration */}
      <section className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 flex flex-col h-[calc(100vh-100px)] bg-cine-800 rounded-xl border border-cine-700 shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6 text-cine-teal">
          <Film size={24} />
          <h2 className="text-xl font-bold tracking-wide">Transition Filler</h2>
        </div>

        <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Upload Area */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Storyboard Source Image</label>
            {!imageFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                  ${isDragging ? 'border-cine-teal bg-cine-700/50' : 'border-cine-600 bg-cine-900/50 hover:bg-cine-800'}
                `}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files && setImageFile(e.target.files[0])} className="hidden" />
                <UploadCloud size={32} className={`mb-2 ${isDragging ? 'text-cine-teal' : 'text-gray-400'}`} />
                <p className="text-sm text-gray-300 font-medium text-center">{isDragging ? 'Drop here' : 'Upload Storyboard Grid'}</p>
                <p className="text-xs text-gray-500 mt-1">AI will detect shots automatically</p>
              </div>
            ) : (
              <div className="relative group rounded-lg border border-cine-600 bg-cine-900/50 p-2">
                <div className="relative h-40 w-full overflow-hidden rounded-md">
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={(e) => { e.stopPropagation(); setImageFile(null); }} className="bg-red-500/90 text-white rounded-full p-2 hover:bg-red-600">
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex justify-between">
                <span>Transition Frames</span>
                <span className="text-cine-teal font-mono">{config.transitionCount}</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="1" 
                value={config.transitionCount} 
                onChange={(e) => setConfig({ ...config, transitionCount: Number(e.target.value) as 1 | 2 | 3 })}
                className="w-full h-2 bg-cine-900 rounded-lg appearance-none cursor-pointer accent-cine-teal"
              />
              <p className="text-xs text-gray-500">Number of frames to generate between each existing shot.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Settings size={16} /> Context / Notes
              </label>
              <textarea
                className="w-full bg-cine-900 border border-cine-700 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-cine-teal focus:outline-none h-24"
                placeholder="E.g. Make the transitions blurry, or focus on character movement..."
                value={config.additionalNotes}
                onChange={(e) => setConfig({ ...config, additionalNotes: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !imageFile}
            className={`w-full py-3 px-4 rounded-lg font-bold text-lg tracking-wide shadow-lg transition-all
              ${isGenerating || !imageFile
                ? 'bg-cine-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cine-teal to-cyan-600 text-white hover:from-teal-400 hover:to-cyan-500 transform hover:scale-[1.02]'
              }
            `}
          >
            {isGenerating ? 'Analyzing Sequence...' : 'Generate Transitions'}
          </button>
        </div>
        {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-200 text-sm rounded-lg">Error: {error}</div>}
      </section>

      {/* Right Panel: Results */}
      <section className="flex-grow flex flex-col h-[calc(100vh-100px)] min-w-0 bg-cine-800 rounded-xl border border-cine-700 shadow-lg overflow-hidden">
        {!result ? (
           <div className="h-full flex flex-col items-center justify-center text-gray-500">
             <ArrowRight size={48} className="mb-4 opacity-50 text-cine-teal" />
             <p className="text-lg">No Transitions Yet</p>
             <p className="text-sm opacity-60">Upload a storyboard grid to generate filling shots.</p>
           </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-cine-700 bg-cine-800/50">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Style Analysis</h3>
               <p className="text-sm text-gray-200 italic border-l-2 border-cine-teal pl-3">{result.analysis}</p>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-cine-900/50 space-y-6">
              {result.transitions.map((transition, idx) => (
                <div key={idx} className="bg-cine-900 border border-cine-700 rounded-lg p-0 overflow-hidden">
                  <div className="bg-cine-800 border-b border-cine-700 p-3 flex items-center gap-3">
                    <span className="bg-cine-700 text-gray-300 px-2 py-1 rounded text-xs font-bold">SHOT {transition.fromShotIndex}</span>
                    <ArrowRight size={14} className="text-cine-teal" />
                    <span className="text-cine-teal font-bold text-sm tracking-wide flex items-center gap-1"><Sparkles size={12} /> {config.transitionCount} Transition(s)</span>
                    <ArrowRight size={14} className="text-cine-teal" />
                    <span className="bg-cine-700 text-gray-300 px-2 py-1 rounded text-xs font-bold">SHOT {transition.toShotIndex}</span>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {transition.transitionPrompts.map((prompt) => (
                      <div key={prompt.order} className="relative group">
                        <div className="flex items-start gap-3">
                           <div className="mt-1 min-w-[24px] h-6 flex items-center justify-center bg-cine-teal/20 text-cine-teal text-xs rounded-full font-bold">
                             {prompt.order}
                           </div>
                           <p className="text-sm text-gray-300 font-mono leading-relaxed">{prompt.content}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(prompt.content)}
                          className="absolute top-0 right-0 p-1.5 text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                          title="Copy"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default TransitionPage;