
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getWordInfo, generateImage, generateSpeech } from '../services/geminiService';
import { BookIcon } from './icons/BookIcon';
import { LoadingIcon } from './icons/LoadingIcon';
import { ImageIcon } from './icons/ImageIcon';
import { MicIcon } from './icons/MicIcon';
import { PencilIcon } from './icons/PencilIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { decode, decodeAudioData } from '../utils/audioUtils';

type Direction = 'en-th' | 'th-en';

// SpeechRecognition interfaces
interface SpeechRecognitionAlternative { readonly transcript: string; readonly confidence: number; }
interface SpeechRecognitionResult { readonly isFinal: boolean; readonly length: number; item(index: number): SpeechRecognitionAlternative; [index: number]: SpeechRecognitionAlternative; }
interface SpeechRecognitionResultList { readonly length: number; item(index: number): SpeechRecognitionResult; [index: number]: SpeechRecognitionResult; }
interface SpeechRecognitionEvent extends Event { readonly resultIndex: number; readonly results: SpeechRecognitionResultList; }
interface SpeechRecognitionErrorEvent extends Event { readonly error: string; readonly message: string; }
interface SpeechRecognition extends EventTarget { continuous: boolean; interimResults: boolean; lang: string; onend: ((this: SpeechRecognition, ev: Event) => any) | null; onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null; onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null; onstart: ((this: SpeechRecognition, ev: Event) => any) | null; abort(): void; start(): void; stop(): void; }
declare global { interface Window { SpeechRecognition: { new (): SpeechRecognition; }; webkitSpeechRecognition: { new (): SpeechRecognition; }; } }

const Vocabulary: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<{ original: string; translated: string; examples: string[]; ipa: string | null; thaiReading: string | null } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isInfoLoading, setIsInfoLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>('en-th');
  const [isListening, setIsListening] = useState(false);
  
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceFeedback, setPracticeFeedback] = useState<{ message: string; type: 'correct' | 'incorrect' } | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<{ [key: string]: boolean }>({});
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSpeechRecognitionSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const resetPracticeMode = () => { setIsPracticeMode(false); setPracticeInput(''); setPracticeFeedback(null); };

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    setIsInfoLoading(true); setIsImageLoading(false); setError(null); setResult(null); setImageUrl(null); resetPracticeMode();
    try {
      const targetLanguage = direction === 'en-th' ? 'Thai' : 'English';
      const wordInfo = await getWordInfo(inputText.trim(), targetLanguage);
      if (wordInfo) {
        setResult({ 
            original: inputText.trim(), 
            translated: wordInfo.translation, 
            examples: wordInfo.exampleSentences, 
            ipa: wordInfo.ipa,
            thaiReading: wordInfo.thaiReading
        });
        setIsInfoLoading(false);
        if (direction === 'en-th') {
            setIsImageLoading(true);
            const url = await generateImage(wordInfo.imagePrompt);
            if (url) setImageUrl(url);
            setIsImageLoading(false);
        }
      } else { setError('Could not get information for this text.'); setIsInfoLoading(false); }
    } catch (err) { setError('An error occurred while fetching the information.'); setIsInfoLoading(false); }
  }, [inputText, direction]);

  const setTranslationDirection = (newDirection: Direction) => { setDirection(newDirection); setInputText(''); setResult(null); setImageUrl(null); setError(null); resetPracticeMode(); };

  const handleMicClick = () => {
    if (!isSpeechRecognitionSupported) { alert("Speech recognition is not supported."); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.lang = direction === 'en-th' ? 'en-US' : 'th-TH';
    recognition.continuous = false; recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => { console.error('Speech error:', event.error); setError(`Speech error: ${event.error}`); setIsListening(false); };
    recognition.onresult = (event) => { const transcript = event.results[0][0].transcript; setInputText(transcript); };
    recognition.start();
  };

  useEffect(() => { return () => { recognitionRef.current?.abort(); }; }, []);

  const handleStartPractice = () => { setIsPracticeMode(true); setPracticeInput(''); setPracticeFeedback(null); };
  const handleCheckSpelling = (e: React.FormEvent) => {
    e.preventDefault(); if (!practiceInput.trim() || !result) return;
    if (practiceInput.trim().toLowerCase() === result.original.toLowerCase()) { setPracticeFeedback({ message: 'Correct! Well done!', type: 'correct' }); } 
    else { setPracticeFeedback({ message: `Not quite. The correct spelling is "${result.original}".`, type: 'incorrect' }); }
  };

  const playAudio = async (base64Audio: string) => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const decodedData = decode(base64Audio);
        const audioBuffer = await decodeAudioData(decodedData, audioContext, 24000, 1);
        const source = audioContext.createBufferSource(); source.buffer = audioBuffer; source.connect(audioContext.destination); source.start(0);
    } catch (e) { console.error("Error playing audio:", e); setError("Failed to play audio."); }
  };

  const handlePlayAudio = async (text: string, key: string) => {
    if (!text || isLoadingAudio[key]) return;
    setIsLoadingAudio(prev => ({ ...prev, [key]: true })); setError(null);
    try { const audioData = await generateSpeech(text); if (audioData) await playAudio(audioData); else setError(`Could not generate audio.`); } 
    catch (err) { setError('An error occurred while generating audio.'); } 
    finally { setIsLoadingAudio(prev => ({ ...prev, [key]: false })); }
  };

  const DirectionButton = ({ dir, label }: { dir: Direction, label: string }) => (
    <button onClick={() => setTranslationDirection(dir)} className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${direction === dir ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{label}</button>
  );

  const isLoading = isInfoLoading || isImageLoading;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 py-6 border-b border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
             <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Smart Dictionary</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Definitions, pronunciation, and images powered by AI.</p>
             </div>
             <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-full self-start md:self-auto">
                <DirectionButton dir="en-th" label="Eng ➔ Thai" />
                <DirectionButton dir="th-en" label="Thai ➔ Eng" />
            </div>
        </div>

        <form onSubmit={handleSearch} className="relative flex items-center group">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={direction === 'en-th' ? "Type an English word..." : "พิมพ์คำศัพท์ภาษาไทย..."}
              className="w-full pl-6 pr-24 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-lg transition-all group-hover:shadow-md"
              disabled={isLoading}
            />
            <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={!isSpeechRecognitionSupported || isLoading}
                  className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-slate-400 hover:text-violet-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  <MicIcon className="w-6 h-6" />
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="p-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-500/20"
                >
                  {isLoading ? <LoadingIcon className="w-6 h-6" /> : <BookIcon className="w-6 h-6" />}
                </button>
            </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {error && <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-center mb-4">{error}</div>}
        
        {isInfoLoading && (
             <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
                <LoadingIcon className="w-12 h-12 mb-4 text-violet-400" />
                <p className="animate-pulse">Analyzing vocabulary...</p>
            </div>
        )}

        {result && (
          <div className="animate-fade-in space-y-6">
            {/* Top Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                
                {/* Definition Card */}
                <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 dark:bg-violet-900/10 rounded-full -mr-10 -mt-10 blur-2xl transition-all group-hover:bg-violet-100 dark:group-hover:bg-violet-900/20" />
                     
                     <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Word</p>
                                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white capitalize tracking-tight">{result.original}</h3>
                            </div>
                            {direction === 'en-th' && (
                                <button onClick={() => handlePlayAudio(result.original, 'original')} disabled={isLoadingAudio['original']} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-full text-violet-600 hover:bg-violet-50 transition-colors">
                                    {isLoadingAudio['original'] ? <LoadingIcon className="w-6 h-6" /> : <SpeakerIcon className="w-6 h-6" />}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 mb-6 flex-wrap">
                             <p className="text-2xl font-medium text-violet-600 dark:text-violet-400">{result.translated}</p>
                             
                             {result.ipa && (
                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg font-mono text-sm border border-slate-200 dark:border-slate-600">
                                    {result.ipa}
                                </span>
                             )}

                             {result.thaiReading && (
                                <span className="px-2.5 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 rounded-lg text-sm font-medium border border-violet-100 dark:border-violet-800">
                                    {result.thaiReading}
                                </span>
                             )}

                             <button onClick={() => handlePlayAudio(result.translated, 'translated')} disabled={isLoadingAudio['translated']} className="p-1.5 text-slate-400 hover:text-violet-500 transition-colors">
                                {isLoadingAudio['translated'] ? <LoadingIcon className="w-4 h-4" /> : <SpeakerIcon className="w-4 h-4" />}
                             </button>
                        </div>

                        {result.examples && result.examples.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Example Usage</p>
                                <ul className="space-y-2">
                                    {result.examples.map((sentence, i) => (
                                        <li key={i} className="text-slate-600 dark:text-slate-300 italic pl-3 border-l-2 border-violet-200 dark:border-violet-800">{sentence}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                     </div>
                </div>

                {/* Image Card */}
                <div className="aspect-square md:aspect-auto md:h-full bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden relative shadow-inner">
                    {isImageLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <LoadingIcon className="w-10 h-10 mb-2" />
                            <p className="text-xs">Drawing...</p>
                        </div>
                    ) : imageUrl ? (
                        <img src={imageUrl} alt={result.original} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                    ) : direction === 'en-th' && !isInfoLoading ? (
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                             <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                             <p className="text-xs">No image</p>
                         </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                             <BookIcon className="w-16 h-16 mb-2 opacity-50" />
                             <p className="text-xs">Definition only</p>
                         </div>
                    )}
                    {/* Badge */}
                    {imageUrl && <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md">AI Generated</div>}
                </div>
            </div>
            
            {/* Practice Section */}
            {!isPracticeMode ? (
                <button onClick={handleStartPractice} className="w-full group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        <PencilIcon className="w-5 h-5" /> Test Your Spelling
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
            ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 text-center animate-fade-in">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Spelling Challenge</h3>
                    <p className="text-slate-500 mb-6">Type the {direction === 'en-th' ? 'English' : 'Thai'} word for: <strong className="text-violet-600 text-xl block mt-1">{result.translated}</strong></p>
                    <form onSubmit={handleCheckSpelling} className="flex gap-2 max-w-md mx-auto">
                        <input type="text" value={practiceInput} onChange={(e) => setPracticeInput(e.target.value)} placeholder="Type here..." className="flex-1 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" autoFocus disabled={!!practiceFeedback} />
                        <button type="submit" disabled={!practiceInput.trim() || !!practiceFeedback} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">Check</button>
                    </form>
                    {practiceFeedback && (
                        <div className="mt-6 animate-fade-in">
                            <p className={`text-lg font-bold ${practiceFeedback.type === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}>{practiceFeedback.message}</p>
                            <button onClick={resetPracticeMode} className="mt-4 text-slate-400 hover:text-slate-600 text-sm underline">Close Challenge</button>
                        </div>
                    )}
                </div>
            )}
          </div>
        )}

        {!isLoading && !result && !error && (
            <div className="flex flex-col items-center justify-center h-full opacity-40 mt-10">
                <BookIcon className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 font-medium">Start your search above</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Vocabulary;
