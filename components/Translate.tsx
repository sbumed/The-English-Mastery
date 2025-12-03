
import React, { useState, useRef, useEffect } from 'react';
import { translateContent, generateSpeech, translateImage } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { fileToBase64 } from '../utils/fileUtils';
import { LoadingIcon } from './icons/LoadingIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { MicIcon } from './icons/MicIcon';
import { CameraIcon } from './icons/CameraIcon';

// Reuse SpeechRecognition types from Vocabulary.tsx
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}
interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    abort(): void;
    start(): void;
    stop(): void;
}
declare global {
    interface Window {
      SpeechRecognition: { new (): SpeechRecognition; };
      webkitSpeechRecognition: { new (): SpeechRecognition; };
    }
}

type Direction = 'en-th' | 'th-en';

const Translate: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [direction, setDirection] = useState<Direction>('en-th');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isSpeechRecognitionSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();
        };
    }, []);

    const handleTranslate = async () => {
        if (!inputText.trim()) return;
        
        setIsTranslating(true);
        setError(null);
        setOutputText('');

        try {
            const fromLang = direction === 'en-th' ? 'English' : 'Thai';
            const toLang = direction === 'en-th' ? 'Thai' : 'English';
            
            const result = await translateContent(inputText, fromLang, toLang);
            if (result) {
                setOutputText(result);
            } else {
                setError("Translation failed. Please try again.");
            }
        } catch (err) {
            setError("An error occurred during translation.");
        } finally {
            setIsTranslating(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsTranslating(true);
        setError(null);
        setOutputText('');
        
        try {
            const base64 = await fileToBase64(file);
            const targetLang = direction === 'en-th' ? 'Thai' : 'English';
            const result = await translateImage(base64, file.type, targetLang);
            
            if (result) {
                setOutputText(result);
                // Optionally describe what happened in input
                setInputText('[Image Translated]');
            } else {
                setError("Could not translate text from image.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to process image.");
        } finally {
            setIsTranslating(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePlayAudio = async (text: string) => {
        if (!text || isAudioLoading) return;
        setIsAudioLoading(true);
        try {
            const audioBase64 = await generateSpeech(text);
            if (audioBase64) {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const decodedData = decode(audioBase64);
                const audioBuffer = await decodeAudioData(decodedData, audioContext, 24000, 1);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start(0);
            } else {
                setError("Failed to generate speech.");
            }
        } catch (err) {
            console.error(err);
            setError("Audio playback failed.");
        } finally {
            setIsAudioLoading(false);
        }
    };

    const toggleDirection = () => {
        setDirection(prev => prev === 'en-th' ? 'th-en' : 'en-th');
        setInputText('');
        setOutputText('');
    };

    const handleMicClick = () => {
        if (!isSpeechRecognitionSupported) return;

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;

        recognition.lang = direction === 'en-th' ? 'en-US' : 'th-TH';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error(event.error);
            setIsListening(false);
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInputText(prev => (prev ? prev + ' ' : '') + transcript);
        };

        recognition.start();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Sentence Translator</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Translate text, speech, or images.</p>
            </div>

            <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto">
                {/* Language Toggle */}
                <div className="flex justify-center items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl self-center shadow-inner">
                    <button 
                        onClick={() => setDirection('en-th')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${direction === 'en-th' ? 'bg-white dark:bg-slate-700 shadow-md text-violet-600 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                    >
                        English → Thai
                    </button>
                    <button 
                        onClick={toggleDirection}
                        className="px-3 text-slate-400 hover:text-violet-500 transition-colors"
                    >
                        ⇄
                    </button>
                    <button 
                        onClick={() => setDirection('th-en')}
                         className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${direction === 'th-en' ? 'bg-white dark:bg-slate-700 shadow-md text-violet-600 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                    >
                        Thai → English
                    </button>
                </div>

                {/* Input Area */}
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                        {direction === 'en-th' ? 'English Text / Image' : 'ข้อความภาษาไทย / รูปภาพ'}
                    </label>
                    <div className="relative group">
                        <textarea 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={direction === 'en-th' ? "Type or paste English text here..." : "พิมพ์หรือวางข้อความภาษาไทยที่นี่..."}
                            className="w-full h-40 p-5 pr-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:outline-none resize-none text-base shadow-sm group-hover:shadow-md transition-shadow"
                        />
                         <div className="absolute top-4 right-4 flex flex-col gap-2">
                             {/* Hidden File Input */}
                             <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                             />
                             <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isTranslating}
                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all disabled:opacity-50 shadow-sm border border-slate-200 dark:border-slate-600"
                                title="Upload Image to Translate"
                             >
                                <CameraIcon className="w-5 h-5" />
                             </button>

                             <button
                                type="button"
                                onClick={handleMicClick}
                                disabled={!isSpeechRecognitionSupported || isTranslating}
                                className={`p-2.5 rounded-xl transition-all disabled:opacity-50 shadow-sm border border-slate-200 dark:border-slate-600
                                    ${isListening ? 'bg-red-500 text-white animate-pulse border-red-500' : 'bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-violet-600 hover:bg-violet-50'}`}
                                title="Voice Input"
                             >
                                <MicIcon className="w-5 h-5" />
                             </button>
                         </div>
                    </div>
                    <button 
                        onClick={handleTranslate}
                        disabled={isTranslating || !inputText.trim()}
                        className="self-end px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 transition-all flex items-center gap-2"
                    >
                        {isTranslating ? <LoadingIcon className="w-5 h-5" /> : 'Translate Text'}
                    </button>
                </div>

                {/* Output Area */}
                {outputText && (
                    <div className="flex flex-col gap-3 animate-fade-in mt-2">
                        <label className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider pl-1">
                            {direction === 'en-th' ? 'คำแปลภาษาไทย' : 'English Translation'}
                        </label>
                        <div className="relative p-6 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 rounded-3xl">
                            <p className="text-lg text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed font-medium">{outputText}</p>
                            <button 
                                onClick={() => handlePlayAudio(outputText)}
                                disabled={isAudioLoading}
                                className="absolute top-4 right-4 p-2.5 bg-white dark:bg-slate-800 rounded-full shadow-md text-violet-600 hover:text-violet-800 hover:scale-110 disabled:opacity-50 transition-all"
                                title="Listen"
                            >
                                {isAudioLoading ? <LoadingIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl text-center">
                        <p className="text-red-500 dark:text-red-400 text-sm font-medium">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Translate;
