
import React, { useState, useRef, useEffect } from 'react';
import { getQnAResponse } from '../services/geminiService';
import type { GroundingSource } from '../types';
import { LoadingIcon } from './icons/LoadingIcon';
import { MicIcon } from './icons/MicIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChatIcon } from './icons/ChatIcon';

// SpeechRecognition interfaces
interface SpeechRecognitionAlternative { readonly transcript: string; readonly confidence: number; }
interface SpeechRecognitionResult { readonly isFinal: boolean; readonly length: number; item(index: number): SpeechRecognitionAlternative; [index: number]: SpeechRecognitionAlternative; }
interface SpeechRecognitionResultList { readonly length: number; item(index: number): SpeechRecognitionResult; [index: number]: SpeechRecognitionResult; }
interface SpeechRecognitionEvent extends Event { readonly resultIndex: number; readonly results: SpeechRecognitionResultList; }
interface SpeechRecognitionErrorEvent extends Event { readonly error: string; readonly message: string; }
interface SpeechRecognition extends EventTarget { continuous: boolean; interimResults: boolean; lang: string; onend: ((this: SpeechRecognition, ev: Event) => any) | null; onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null; onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null; onstart: ((this: SpeechRecognition, ev: Event) => any) | null; abort(): void; start(): void; stop(): void; }
declare global { interface Window { SpeechRecognition: { new (): SpeechRecognition; }; webkitSpeechRecognition: { new (): SpeechRecognition; }; } }

interface Message {
    role: 'user' | 'model';
    text: string;
    sources?: GroundingSource[];
}

const QnA: React.FC = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState<'English' | 'Thai'>('English');
    const [isListening, setIsListening] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    
    const isSpeechRecognitionSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            // Convert history for API
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            // Construct prompt with language instruction
            const prompt = language === 'Thai' 
                ? `ตอบคำถามต่อไปนี้เป็นภาษาไทย: ${userMessage}` 
                : userMessage;

            const { text, sources } = await getQnAResponse(prompt, history);
            
            setMessages(prev => [...prev, { 
                role: 'model', 
                text: text,
                sources: sources
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
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

        recognition.lang = language === 'English' ? 'en-US' : 'th-TH';
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
            setInput(transcript);
            // Optional: Auto-submit could be added here
        };

        recognition.start();
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'English' ? 'Thai' : 'English');
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Ask AI</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Powered by Google Search</p>
                </div>
                <button 
                    onClick={toggleLanguage}
                    className="px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold uppercase tracking-wide hover:bg-violet-200 dark:hover:bg-violet-800/40 transition-colors"
                >
                    {language}
                </button>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-60 space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/20 dark:to-fuchsia-900/20 rounded-full flex items-center justify-center mb-2">
                            <SparklesIcon className="w-10 h-10 text-violet-500/70" />
                        </div>
                        <p className="text-slate-500 font-medium text-center max-w-xs">
                            {language === 'English' 
                                ? "Ask me anything about English learning or general knowledge!" 
                                : "ถามอะไรก็ได้เกี่ยวกับการเรียนภาษาอังกฤษหรือความรู้ทั่วไป!"}
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`
                            max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm relative
                            ${msg.role === 'user' 
                                ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-tr-sm shadow-violet-500/20' 
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-100 dark:border-slate-700/50'
                            }
                        `}>
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                            
                            {/* Sources Display */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sources</p>
                                    <div className="flex flex-wrap gap-2">
                                        {msg.sources.map((source, i) => (
                                            <a 
                                                key={i} 
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-violet-600 dark:text-violet-400 hover:underline hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors truncate max-w-xs"
                                            >
                                                <span className="truncate">{source.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700/50 flex items-center gap-2 shadow-sm">
                            <LoadingIcon className="w-4 h-4 text-violet-500" />
                            <span className="text-sm text-slate-400">Searching & Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 dark:to-transparent">
                <form onSubmit={handleSubmit} className="relative flex items-center gap-2 max-w-3xl mx-auto bg-white dark:bg-slate-800 p-1.5 rounded-[1.5rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200 dark:border-slate-700 ring-4 ring-slate-50 dark:ring-slate-900">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={language === 'English' ? "Type your question..." : "พิมพ์คำถามของคุณ..."}
                        className="flex-1 pl-4 pr-2 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                        disabled={isLoading}
                    />
                    
                    <div className="flex items-center gap-1 pr-1">
                        <button
                            type="button"
                            onClick={handleMicClick}
                            disabled={isLoading}
                            className={`p-2.5 rounded-full transition-all duration-200 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-violet-600'}`}
                        >
                            <MicIcon className="w-5 h-5" />
                        </button>
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="p-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40 transform hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                        >
                            {isLoading ? <LoadingIcon className="w-5 h-5" /> : <ChatIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QnA;
