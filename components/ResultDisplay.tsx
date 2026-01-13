import React, { useState, useEffect } from 'react';
import { GeneratedData, GlobalParams } from '../types';
import { Copy, RefreshCw, Sliders, Layers, Grid as GridIcon, Zap } from 'lucide-react';

interface ResultDisplayProps {
  data: GeneratedData | null;
  onUpdateParams: (newParams: GlobalParams) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, onUpdateParams, onRegenerate, isGenerating }) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'split' | 'short'>('grid');
  const [editableParams, setEditableParams] = useState<GlobalParams | null>(null);

  useEffect(() => {
    if (data) {
      setEditableParams(data.globalParams);
    }
  }, [data]);

  if (!data || !editableParams) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-cine-800/50 rounded-xl border border-cine-700 border-dashed">
        <Layers size={48} className="mb-4 opacity-50" />
        <p className="text-lg">Ready to Generate</p>
        <p className="text-sm opacity-60">Enter details and click generate to see cinematic prompts.</p>
      </div>
    );
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  // Construct the Split Prompt string dynamically
  const getSplitPromptText = (shot: { id: number; title: string; content: string }) => {
    return `
=== SHOT ${shot.id}: ${shot.title} ===
${shot.content}

-- Style Parameters --
Theme: ${editableParams.theme}
Environment: ${editableParams.environment}
Lighting: ${editableParams.lighting}
Camera: ${editableParams.camera}
Color Grade: ${editableParams.colorGrade}
Artist/Style: ${editableParams.artistStyle}
    `.trim();
  };

  // Construct the Shortened Prompt string
  const getShortPromptText = (shot: { id: number; title: string; shortContent: string }) => {
    return `
${shot.title} :: ${shot.shortContent} :: Theme: ${editableParams.theme}, ${editableParams.environment} :: Lighting: ${editableParams.lighting} :: Cam: ${editableParams.camera}, ${editableParams.colorGrade}, ${editableParams.artistStyle}
    `.trim().replace(/\s+/g, ' '); // Clean up extra spaces/newlines for the "short" version
  };

  const getGridPromptText = () => {
    // Reconstruct the full prompt string based on current data
    return `
"shot": "${data.shot}",
"subject": "${data.subjectIntro}",
"shots": [
${data.shots.map(s => `${s.title}\n${s.content}`).join('\n\n')}
],
"Theme": "${editableParams.theme}",
"Environment": "${editableParams.environment}",
"Lighting Studio": "${editableParams.lighting}",
"Camera": "${editableParams.camera}",
"Color Grade": "${editableParams.colorGrade}",
"Artist": "${editableParams.artistStyle}"
    `.trim();
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Parameters Editor (Top) */}
      <div className="bg-cine-800 p-4 rounded-xl border border-cine-700 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-cine-accent uppercase tracking-wider flex items-center gap-2">
            <Sliders size={16} /> Global Style Parameters
          </h3>
          <button 
            onClick={() => {
              if (editableParams) onUpdateParams(editableParams);
              onRegenerate();
            }}
            disabled={isGenerating}
            className="text-xs bg-cine-700 hover:bg-cine-600 text-white px-3 py-1 rounded flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
            {isGenerating ? 'Updating...' : 'Refine & Regenerate'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(editableParams).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
              <input
                type="text"
                value={value as string}
                onChange={(e) => setEditableParams({ ...editableParams, [key]: e.target.value })}
                className="w-full bg-cine-900 border border-cine-700 rounded px-2 py-1 text-xs text-gray-200 focus:ring-1 focus:ring-cine-accent truncate"
                title={value as string}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Prompts Display Area */}
      <div className="flex-grow bg-cine-800 rounded-xl border border-cine-700 shadow-lg flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-cine-700">
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors
              ${activeTab === 'grid' ? 'bg-cine-700/50 text-white border-b-2 border-cine-accent' : 'text-gray-400 hover:bg-cine-700/30'}
            `}
          >
            <GridIcon size={16} /> Unified Grid Prompt
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors
              ${activeTab === 'split' ? 'bg-cine-700/50 text-white border-b-2 border-cine-accent' : 'text-gray-400 hover:bg-cine-700/30'}
            `}
          >
            <Layers size={16} /> Split Prompts
          </button>
          <button
            onClick={() => setActiveTab('short')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors
              ${activeTab === 'short' ? 'bg-cine-700/50 text-white border-b-2 border-cine-accent' : 'text-gray-400 hover:bg-cine-700/30'}
            `}
          >
            <Zap size={16} /> Short Prompts
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-cine-900/50">
          {activeTab === 'grid' && (
            <div className="relative group">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 leading-relaxed bg-cine-900 p-4 rounded-lg border border-cine-700">
                {getGridPromptText()}
              </pre>
              <button
                onClick={() => handleCopy(getGridPromptText())}
                className="absolute top-2 right-2 p-2 bg-cine-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cine-600"
                title="Copy to Clipboard"
              >
                <Copy size={16} />
              </button>
            </div>
          )}

          {activeTab === 'split' && (
            <div className="space-y-6">
              {data.shots.map((shot) => (
                <div key={shot.id} className="relative group bg-cine-900 border border-cine-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2 border-b border-cine-800 pb-2">
                    <span className="font-bold text-cine-accent text-sm">Shot {shot.id}</span>
                    <button
                      onClick={() => handleCopy(getSplitPromptText(shot))}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Copy this shot"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-gray-300 leading-relaxed">
                    {getSplitPromptText(shot)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'short' && (
            <div className="space-y-4">
              {data.shots.map((shot) => (
                <div key={shot.id} className="relative group bg-cine-900 border border-cine-700 rounded-lg p-4">
                   <div className="flex justify-between items-center mb-2 border-b border-cine-800 pb-2">
                    <span className="font-bold text-cine-accent text-sm">Shot {shot.id} (Short)</span>
                    <button
                      onClick={() => handleCopy(getShortPromptText(shot))}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Copy this shot"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="font-mono text-xs text-gray-300 leading-relaxed break-words">
                    {shot.shortContent ? getShortPromptText(shot) : "Short content not available. Please regenerate."}
                  </p>
                  <p className="mt-2 text-[10px] text-gray-500 text-right">
                    {shot.shortContent ? `${getShortPromptText(shot).length} chars` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;