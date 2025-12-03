
import React, { useState, useEffect } from 'react';
import { generateVideoScriptAndPrompt, generateVideoFromPrompt, getVideosOperation } from '../services/geminiService';
import { LoadingIcon } from './icons/LoadingIcon';
import { VideoIcon } from './icons/VideoIcon';
import { DownloadIcon } from './icons/DownloadIcon';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type AspectRatio = '16:9' | '1:1' | '9:16';
type LoadingState = 'idle' | 'script' | 'video' | 'error' | 'done';

interface VocabularyItem {
    word: string;
    definition: string;
}

interface LessonData {
    story: string;
    vocabulary: VocabularyItem[];
    videoUrl: string;
}

const VideoLessons: React.FC = () => {
    const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'needed' | 'ready'>('checking');
    const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [lessonData, setLessonData] = useState<LessonData | null>(null);

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

    const handleGenerate = async () => {
        setLoadingState('script');
        setError(null);
        setLessonData(null);

        try {
            const scriptData = await generateVideoScriptAndPrompt(difficulty);
            if (!scriptData) {
                throw new Error("Failed to generate a lesson script.");
            }

            setLoadingState('video');
            let operation = await generateVideoFromPrompt(scriptData.videoPrompt, aspectRatio);

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
            const videoUrl = URL.createObjectURL(videoBlob);
            
            setLessonData({
                story: scriptData.story,
                vocabulary: scriptData.vocabulary,
                videoUrl: videoUrl,
            });
            setLoadingState('done');

        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            if (message.includes("Requested entity was not found")) {
                setError("Your API key seems invalid for this feature. Please select a valid key with the Veo model enabled.");
                setApiKeyStatus('needed');
            } else {
                setError(`Failed to create lesson: ${message}`);
            }
            setLoadingState('error');
        }
    };

    const handleDownload = () => {
        if (!lessonData?.videoUrl) return;
        const a = document.createElement('a');
        a.href = lessonData.videoUrl;
        a.download = `gemini-lesson-${difficulty}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const DifficultyButton = ({ level }: { level: Difficulty }) => (
        <button
          onClick={() => setDifficulty(level)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            difficulty === level
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {level}
        </button>
    );

    const renderContent = () => {
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

        if (loadingState === 'script' || loadingState === 'video') {
            const message = loadingState === 'script' 
                ? "Our AI teacher is writing a unique story for you..."
                : "The animation studio is creating your video. This can take a few minutes, so please be patient!";
            return (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500">
                    <LoadingIcon className="w-16 h-16 mb-4" />
                    <p className="text-lg font-semibold">{message}</p>
                </div>
            );
        }

        if (loadingState === 'done' && lessonData) {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden p-2">
                    <div className="flex flex-col items-center justify-center bg-black rounded-lg overflow-hidden">
                        <video src={lessonData.videoUrl} controls className="w-full h-auto max-h-full" />
                        <button 
                          onClick={handleDownload}
                          className="mt-2 mb-2 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Download Video
                        </button>
                    </div>
                    <div className="overflow-y-auto space-y-4 pr-2">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Key Vocabulary</h3>
                            <ul className="mt-2 space-y-2">
                                {lessonData.vocabulary.map(item => (
                                    <li key={item.word} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                                        <p className="font-bold text-indigo-800 dark:text-indigo-300">{item.word}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.definition}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Transcript</h3>
                            <p className="mt-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md whitespace-pre-wrap">{lessonData.story}</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                 <VideoIcon className="w-20 h-20 mb-4 text-gray-300 dark:text-gray-600" />
                 <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Ready to Learn with Video?</h3>
                 <p className="mt-2 max-w-md text-gray-600 dark:text-gray-400">
                    Select a difficulty level and we'll generate a custom animated story to help you learn new vocabulary in context.
                 </p>
                 {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        );

    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Video Vocabulary Lessons</h2>
                <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 font-semibold">Level:</div>
                        <div className="flex gap-2">
                            <DifficultyButton level="Beginner" />
                            <DifficultyButton level="Intermediate" />
                            <DifficultyButton level="Advanced" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                         <label htmlFor="aspectRatio" className="font-semibold flex-shrink-0">Ratio:</label>
                         <select
                            id="aspectRatio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            disabled={apiKeyStatus !== 'ready' || loadingState === 'script' || loadingState === 'video'}
                            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-3 rounded-md focus:ring-indigo-500 focus:outline-none border border-gray-300 dark:border-gray-600"
                        >
                            <option value="16:9">16:9</option>
                            <option value="1:1">1:1</option>
                            <option value="9:16">9:16</option>
                        </select>
                    </div>

                    <div className="flex-grow flex justify-end">
                        <button 
                            onClick={handleGenerate} 
                            disabled={apiKeyStatus !== 'ready' || loadingState === 'script' || loadingState === 'video'}
                            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                        >
                            Generate Lesson
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                {renderContent()}
            </div>
        </div>
    );
};

export default VideoLessons;
