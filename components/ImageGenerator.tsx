
import React, { useState, useCallback, useRef } from 'react';
import { generateImage, getWordInfo } from '../services/geminiService';
import { ImageIcon } from './icons/ImageIcon';
import { LoadingIcon } from './icons/LoadingIcon';
import { SaveIcon } from './icons/SaveIcon';
import { PrintIcon } from './icons/PrintIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface FlashcardData {
    word: string;
    translation: string;
    ipa: string | null;
    thaiReading: string | null;
    imageUrl: string;
}

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [flashcard, setFlashcard] = useState<FlashcardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setFlashcard(null);

    try {
        // 1. Get word info (Translation, IPA, Thai Reading)
        const wordInfo = await getWordInfo(prompt.trim(), 'Thai');
        
        if (!wordInfo) {
            throw new Error("Could not fetch word information.");
        }

        // 2. Generate Image
        const imagePrompt = wordInfo.imagePrompt || prompt.trim();
        const url = await generateImage(imagePrompt);

        if (url) {
            setFlashcard({
                word: prompt.trim(),
                translation: wordInfo.translation,
                ipa: wordInfo.ipa,
                thaiReading: wordInfo.thaiReading,
                imageUrl: url
            });
        } else {
            setError('Could not generate an image for this word.');
        }
    } catch (err) {
      console.error(err);
      setError('An error occurred while creating the flashcard.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);

  const handleSave = async () => {
      if (!cardRef.current || !(window as any).html2canvas) return;
      
      try {
          const canvas = await (window as any).html2canvas(cardRef.current, {
              useCORS: true,
              scale: 3, // Higher resolution for better quality
              backgroundColor: null
          });
          
          const link = document.createElement('a');
          link.download = `flashcard-${flashcard?.word.replace(/\s+/g, '-')}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      } catch (err) {
          console.error("Error saving flashcard:", err);
          alert("Failed to save flashcard.");
      }
  };

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 no-print">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Flashcard Creator</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Turn words into beautiful, printable cards.</p>
      </div>

      <div className="flex-shrink-0 p-6 no-print">
        <form onSubmit={handleGenerate} className="relative flex items-center max-w-2xl mx-auto">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter an English word (e.g., 'Apple')"
            className="w-full pl-6 pr-32 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="absolute right-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-500/20"
          >
            {isLoading ? <LoadingIcon className="w-5 h-5" /> : 'Create'}
          </button>
        </form>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
        {error && <div className="bg-red-50 text-red-500 px-6 py-3 rounded-xl text-center mb-6 no-print font-medium">{error}</div>}
        
        {isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 no-print">
                <div className="relative">
                    <LoadingIcon className="w-16 h-16 text-violet-200 dark:text-violet-900" />
                    <LoadingIcon className="w-16 h-16 text-violet-600 absolute top-0 left-0 animate-spin" style={{ animationDuration: '1.5s' }} />
                </div>
                <p className="mt-4 font-medium animate-pulse">Designing your flashcard...</p>
            </div>
        )}

        {flashcard && (
            <div className="flex flex-col items-center space-y-8 w-full max-w-md animate-fade-in pb-10">
                {/* Flashcard Element */}
                <div 
                    id="flashcard-container"
                    ref={cardRef}
                    className="w-full aspect-[3/4] bg-white text-slate-900 rounded-3xl shadow-2xl shadow-slate-300/50 overflow-hidden border-8 border-white ring-1 ring-slate-200 flex flex-col relative"
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-slate-50/50 pointer-events-none z-10" />
                    
                    <div className="h-[55%] w-full bg-slate-100 relative overflow-hidden">
                        <img 
                            src={flashcard.imageUrl} 
                            alt={flashcard.word} 
                            className="w-full h-full object-cover" 
                        />
                        {/* Decoration */}
                        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-full">
                            <SparklesIcon className="w-5 h-5 text-violet-500" />
                        </div>
                    </div>
                    
                    <div className="h-[45%] p-6 flex flex-col items-center justify-center text-center bg-white relative z-20">
                        <h3 className="text-5xl font-extrabold text-slate-900 capitalize mb-2 tracking-tight">{flashcard.word}</h3>
                        
                        <div className="flex flex-col items-center gap-1 mb-6">
                             {flashcard.ipa && (
                                <p className="text-lg text-slate-400 font-mono bg-slate-50 px-3 py-0.5 rounded-lg">{flashcard.ipa}</p>
                            )}
                            {flashcard.thaiReading && (
                                <p className="text-xl text-violet-600 font-bold">({flashcard.thaiReading})</p>
                            )}
                        </div>

                        <div className="w-12 h-1.5 bg-gradient-to-r from-violet-200 to-fuchsia-200 rounded-full mb-5"></div>
                        <p className="text-3xl text-slate-800 font-bold">{flashcard.translation}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 w-full no-print">
                    <button
                        onClick={handleSave}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 dark:bg-slate-700 text-white rounded-2xl font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-all hover:-translate-y-1 shadow-lg"
                    >
                        <SaveIcon className="w-5 h-5" />
                        Save Image
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold hover:shadow-violet-500/30 hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                        <PrintIcon className="w-5 h-5" />
                        Print
                    </button>
                </div>
            </div>
        )}

        {!isLoading && !flashcard && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-40 mt-8 no-print">
                <ImageIcon className="w-24 h-24 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 font-medium">Enter a word to generate a card</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;
