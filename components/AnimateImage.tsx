
import React, { useState, useEffect, useRef } from 'react';
import { generateVideoFromImage, getVideosOperation } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { LoadingIcon } from './icons/LoadingIcon';
import { MovieIcon } from './icons/MovieIcon';
import { ImageIcon } from './icons/ImageIcon';
import { DownloadIcon } from './icons/DownloadIcon';

type AspectRatio = '16:9' | '9:16';
type LoadingState = 'idle' | 'generating' | 'error' | 'done';

const AnimateImage: React.FC = () => {
    const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'needed' | 'ready'>('checking');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkKey = async () => {
            if (await window.aistudio.hasSelectedApiKey()) {
                setApiKeyStatus('ready');
            } else {
                setApiKeyStatus('needed');
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        await window.aistudio.openSelectKey();
        setApiKeyStatus('ready');
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if(file.size > 4 * 1024 * 1024) {
                setError("Image size should not exceed 4MB.");
                return;
            }
            setError(null);
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };
    
    const handleGenerate = async () => {
        if (!imageFile) {
            setError("Please upload an image first.");
            return;
        }

        setLoadingState('generating');
        setError(null);
        setVideoUrl(null);

        try {
            const imageBase64 = await fileToBase64(imageFile);
            let operation = await generateVideoFromImage(imageBase64, imageFile.type, prompt, aspectRatio);

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await getVideosOperation(operation);
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) {
                throw new Error("Video generation finished, but no download link was found.");
            }
            
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
             if (!videoResponse.ok) {
                 if (videoResponse.status === 404) throw new Error("Video resource not found. It may have expired. Please try again.");
                 throw new Error(`Failed to fetch video data. Status: ${videoResponse.status}`);
            }
            const videoBlob = await videoResponse.blob();
            const url = URL.createObjectURL(videoBlob);
            
            setVideoUrl(url);
            setLoadingState('done');

        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            if (message.includes("Requested entity was not found")) {
                setError("Your API key seems invalid for this feature. Please select a valid key with the Veo model enabled.");
                setApiKeyStatus('needed');
            } else {
                setError(`Failed to create video: ${message}`);
            }
            setLoadingState('error');
        }
    };

    const handleDownload = () => {
        if (!videoUrl) return;
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = `gemini-animation.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    
    const renderContent = () => {
        if (loadingState === 'generating') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500">
                    <LoadingIcon className="w-16 h-16 mb-4" />
                    <p className="text-lg font-semibold">Animating your image... This may take a few minutes.</p>
                </div>
            );
        }

        if (loadingState === 'done' && videoUrl) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4">
                     <video src={videoUrl} controls className="max-w-full max-h-[80%] rounded-lg bg-black" />
                     <button 
                        onClick={handleDownload}
                        className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        Download Video
                    </button>
                </div>
            );
        }

        return (
             <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500">
                <MovieIcon className="w-16 h-16 mb-4" />
                <p>Your animated image will appear here.</p>
            </div>
        );
    };


    const renderMainArea = () => {
        if (apiKeyStatus === 'checking') {
            return <div className="flex items-center justify-center h-full"><LoadingIcon className="w-12 h-12" /></div>;
        }

        if (apiKeyStatus === 'needed') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">API Key Required</h3>
                    <p className="mt-2 max-w-md text-gray-600 dark:text-gray-400">
                        This feature uses the Veo model for video generation and requires you to select an API key. Please visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">the billing documentation</a> for more information.
                    </p>
                    <button onClick={handleSelectKey} className="mt-4 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors">
                        Select API Key
                    </button>
                    {error && <p className="text-red-500 mt-4">{error}</p>}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full overflow-hidden">
                <div className="lg:col-span-1 p-4 md:p-6 border-r border-gray-200 dark:border-gray-700 flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Animate Image</h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">1. Upload Image</label>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600">
                           {imageFile ? 'Change Image' : 'Select Image'}
                        </button>
                        {imagePreview && (
                            <div className="mt-4 aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                                <img src={imagePreview} alt="Preview" className="max-h-full max-w-full" />
                            </div>
                        )}
                        {!imagePreview && (
                             <div className="mt-4 aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                <ImageIcon className="w-12 h-12" />
                                <p className="mt-2 text-sm">Image preview</p>
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">2. Animation Prompt (Optional)</label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'a gentle breeze blowing through the trees'"
                            className="w-full h-24 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">3. Aspect Ratio</label>
                        <select
                            id="aspectRatio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                        </select>
                    </div>

                    <div className="flex-grow flex flex-col justify-end">
                        <button 
                            onClick={handleGenerate} 
                            disabled={loadingState === 'generating' || !imageFile}
                            className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                        >
                           {loadingState === 'generating' ? 'Generating...' : 'Animate Image'}
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                <div className="lg:col-span-2 bg-gray-100 dark:bg-gray-900/50">
                    {renderContent()}
                </div>
            </div>
        );
    };

    return <div className="h-full">{renderMainArea()}</div>;
};

export default AnimateImage;
