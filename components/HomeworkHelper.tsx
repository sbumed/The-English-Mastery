
import React, { useState, useRef } from 'react';
import { analyzeHomework } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { LoadingIcon } from './icons/LoadingIcon';
import { CameraIcon } from './icons/CameraIcon';
import { HomeworkIcon } from './icons/HomeworkIcon';
import { ChatIcon } from './icons/ChatIcon';

const HomeworkHelper: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setError(null);
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            setAnalysis(null);
        }
    };

    const handleAnalyze = async () => {
        if (!imageFile && !inputText.trim()) return;

        setIsLoading(true);
        setError(null);
        
        try {
            let base64: string | null = null;
            let mimeType: string | null = null;

            if (imageFile) {
                base64 = await fileToBase64(imageFile);
                mimeType = imageFile.type;
            }

            const textToSend = inputText.trim() || null;
            
            const result = await analyzeHomework(base64, mimeType, textToSend);
            
            if (result) {
                setAnalysis(result);
            } else {
                setError("Unable to analyze. Please check your input and try again.");
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred while processing.");
        } finally {
            setIsLoading(false);
        }
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Homework Helper</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Upload a photo or type your English homework question.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="flex flex-col lg:flex-row gap-6 h-full">
                    
                    {/* Left Column: Inputs */}
                    <div className="lg:w-1/3 flex flex-col gap-4">
                        {/* 1. Image Input Area */}
                        {!imagePreview ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-video rounded-3xl border-4 border-dashed border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group bg-white dark:bg-slate-800"
                            >
                                <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <CameraIcon className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-slate-700 dark:text-slate-200">Upload Photo</p>
                                    <p className="text-xs text-slate-400">JPG, PNG</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group">
                                <img src={imagePreview} alt="Homework" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                <button 
                                    onClick={clearImage}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove image"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            className="hidden" 
                        />

                        {/* Separator */}
                        <div className="flex items-center gap-3 px-2">
                             <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                             <span className="text-xs font-bold text-slate-400 uppercase">AND / OR</span>
                             <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                        </div>

                        {/* 2. Text Input Area */}
                        <div className="relative">
                            <div className="absolute top-3 left-3 text-slate-400">
                                <ChatIcon className="w-5 h-5" />
                            </div>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type your homework question or add instructions here..."
                                className="w-full h-32 pl-10 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:outline-none resize-none text-sm shadow-sm"
                            />
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading || (!imageFile && !inputText.trim())}
                            className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                        >
                            {isLoading ? <LoadingIcon className="w-6 h-6" /> : <HomeworkIcon className="w-6 h-6" />}
                            {isLoading ? 'Analyzing...' : 'Solve & Explain'}
                        </button>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Results */}
                    <div className="lg:w-2/3 flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <HomeworkIcon className="w-5 h-5 text-violet-500" />
                                AI Tutor Explanation
                            </h3>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                    <LoadingIcon className="w-12 h-12 text-violet-500" />
                                    <p className="animate-pulse font-medium">Reviewing your work...</p>
                                </div>
                            ) : analysis ? (
                                <div className="prose dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-headings:text-slate-800 dark:prose-headings:text-white prose-strong:text-violet-600 dark:prose-strong:text-violet-400">
                                    <div className="whitespace-pre-wrap">{analysis}</div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 opacity-60">
                                    <HomeworkIcon className="w-24 h-24 mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Ready to help!</p>
                                    <p className="text-sm">Upload a photo or type a question to start.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeworkHelper;
