import React, { useState } from 'react';
import ConfigPanel from './components/ConfigPanel';
import ResultDisplay from './components/ResultDisplay';
import TransitionPage from './components/TransitionPage';
import { UserConfig, GeneratedData, ShotCount, AspectRatio, GlobalParams } from './types';
import { generateStoryboard } from './services/geminiService';
import { Video, Film, Clapperboard } from 'lucide-react';

type AppMode = 'storyboard' | 'transitions';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('storyboard');

  // Storyboard Mode State
  const [config, setConfig] = useState<UserConfig>({
    shotCount: ShotCount.Nine,
    aspectRatio: AspectRatio.Wide16_9,
    additionalNotes: '',
    mainDescription: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [resultData, setResultData] = useState<GeneratedData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const data = await generateStoryboard(config, imageFile, resultData?.globalParams);
      setResultData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateParams = (newParams: GlobalParams) => {
    if (resultData) {
      setResultData({
        ...resultData,
        globalParams: newParams
      });
    }
  };

  return (
    <div className="min-h-screen bg-cine-900 text-gray-200 font-sans selection:bg-cine-accent selection:text-cine-900">
      {/* Header */}
      <header className="h-16 border-b border-cine-700 bg-cine-900/80 backdrop-blur-md fixed top-0 w-full z-10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-cine-accent to-orange-600 p-2 rounded-lg shadow-lg">
             <Video size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">CinePrompt <span className="text-cine-accent">AI</span></h1>
            <p className="text-xs text-gray-400 tracking-wide uppercase">Professional Storyboard Generator</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-cine-800 p-1 rounded-lg border border-cine-700">
          <button
            onClick={() => setMode('storyboard')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all
              ${mode === 'storyboard' 
                ? 'bg-cine-700 text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <Clapperboard size={16} /> Storyboard
          </button>
          <button
            onClick={() => setMode('transitions')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all
              ${mode === 'transitions' 
                ? 'bg-cine-teal/20 text-cine-teal border border-cine-teal/30 shadow-sm' 
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <Film size={16} /> Transitions
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-6 px-4 md:px-6 h-screen flex flex-col">
        {mode === 'storyboard' ? (
          <div className="flex flex-col md:flex-row gap-6 h-full max-w-[1920px] mx-auto w-full">
            {/* Left Column: Configuration */}
            <section className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 flex flex-col h-[calc(100vh-100px)]">
               <ConfigPanel 
                 config={config} 
                 setConfig={setConfig} 
                 imageFile={imageFile}
                 setImageFile={setImageFile}
                 onGenerate={handleGenerate}
                 isGenerating={isGenerating}
               />
               {error && (
                 <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-200 text-sm rounded-lg">
                   Error: {error}
                 </div>
               )}
            </section>

            {/* Right Column: Results */}
            <section className="flex-grow flex flex-col h-[calc(100vh-100px)] min-w-0">
              <ResultDisplay 
                data={resultData}
                onUpdateParams={handleUpdateParams}
                onRegenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </section>
          </div>
        ) : (
          <TransitionPage />
        )}
      </main>
    </div>
  );
};

export default App;