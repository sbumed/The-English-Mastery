
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveConnection, Type, FunctionDeclaration } from '@google/genai';
import { decode, encode, decodeAudioData } from '../utils/audioUtils';
import { MicIcon } from './icons/MicIcon';
import { StopIcon } from './icons/StopIcon';
import { LoadingIcon } from './icons/LoadingIcon';

interface Feedback {
    score: number;
    correctedPhrase: string;
    explanation: string;
}

interface TranscriptItem {
    user: string;
    model: string;
    feedback?: Feedback;
}

const feedbackTool = {
    functionDeclarations: [
        {
            name: "provideFeedback",
            description: "Provides feedback on the user's English grammar, sentence structure, and fluency.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    score: {
                        type: Type.NUMBER,
                        description: "A score from 0 to 100 based on grammar, vocabulary usage, and clarity.",
                    },
                    correctedPhrase: {
                        type: Type.STRING,
                        description: "A corrected or more natural version of what the user said. If it was perfect, just repeat it or make it slightly more native-like.",
                    },
                    explanation: {
                        type: Type.STRING,
                        description: "A brief explanation of the grammar error or a tip to sound more natural.",
                    },
                },
                required: ["score", "correctedPhrase", "explanation"],
            },
        },
    ],
};

const Conversation: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const currentFeedbackRef = useRef<Feedback | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveConnection> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [transcripts]);

    const stopConversation = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
                session.close();
            }).catch(e => console.error("Error closing session:", e));
            sessionPromiseRef.current = null;
        }

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(e => console.error("Error closing input audio context:", e));
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(e => console.error("Error closing output audio context:", e));
        }

        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;

        setIsRecording(false);
        setIsConnecting(false);
    }, []);
    
    const startConversation = async () => {
        setIsConnecting(true);
        setError(null);
        setTranscripts([]);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';
        currentFeedbackRef.current = null;

        try {
            if (!process.env.API_KEY) {
                throw new Error("API key is not configured.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                        
                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                        
                        setIsConnecting(false);
                        setIsRecording(true);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.toolCall) {
                            const functionCalls = message.toolCall.functionCalls;
                            const responses = functionCalls.map(fc => {
                                if (fc.name === 'provideFeedback') {
                                    currentFeedbackRef.current = fc.args as unknown as Feedback;
                                }
                                return {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: 'ok' }
                                };
                            });
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then(session => {
                                     session.sendToolResponse({ functionResponses: responses });
                                });
                            }
                        }

                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscriptionRef.current.trim();
                            const fullOutput = currentOutputTranscriptionRef.current.trim();
                            const feedback = currentFeedbackRef.current;

                            if(fullInput || fullOutput){
                                setTranscripts(prev => [...prev, { 
                                    user: fullInput, 
                                    model: fullOutput,
                                    feedback: feedback || undefined
                                }]);
                            }
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                            currentFeedbackRef.current = null;
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                           const outputCtx = outputAudioContextRef.current;
                           nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);

                           const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                           const source = outputCtx.createBufferSource();
                           source.buffer = audioBuffer;
                           source.connect(outputCtx.destination);
                           
                           source.onended = () => { audioSourcesRef.current.delete(source); };
                           source.start(nextStartTimeRef.current);
                           nextStartTimeRef.current += audioBuffer.duration;
                           audioSourcesRef.current.add(source);
                        }
                        
                        if (message.serverContent?.interrupted) {
                             audioSourcesRef.current.forEach(source => source.stop());
                             audioSourcesRef.current.clear();
                             nextStartTimeRef.current = 0;
                        }

                    },
                    onclose: () => {
                        stopConversation();
                    },
                    onerror: (e: ErrorEvent) => {
                        setError(`An error occurred: ${e.message}`);
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    tools: [feedbackTool],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: `You are a friendly and helpful English tutor. Your goal is to help the user practice speaking English. 
                    1. Listen carefully to what the user says.
                    2. ALWAYS call the "provideFeedback" tool to evaluate their sentence structure, grammar, and naturalness. Give a score (0-100), a corrected version of their sentence (Better way to say), and a short explanation.
                    3. After calling the tool, respond verbally to the content of their message to keep the conversation flowing naturally. Be encouraging. Do not explicitly read out the score or the correction unless it is a major error that hinders understanding.`,
                }
            });

        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to start conversation: ${message}`);
            setIsConnecting(false);
            stopConversation();
        }
    };

    useEffect(() => {
        return () => {
            stopConversation();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Conversation Tutor</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Improve your fluency with real-time AI feedback.</p>
            </div>
            
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
                {transcripts.map((t, i) => (
                    <div key={i} className="space-y-3 animate-fade-in">
                       {t.user && (
                           <div className="flex flex-col items-end group">
                                <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] md:max-w-[70%] shadow-lg shadow-violet-500/20">
                                    <p className="leading-relaxed">{t.user}</p>
                                </div>
                                
                                {t.feedback && (
                                    <div className="mt-3 mr-1 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl rounded-tr-sm max-w-[85%] md:max-w-[70%] border-l-4 border-gray-200 shadow-md hover:shadow-lg transition-shadow"
                                        style={{ borderColor: t.feedback.score >= 80 ? '#22c55e' : t.feedback.score >= 60 ? '#eab308' : '#ef4444' }}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Feedback</span>
                                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${
                                                t.feedback.score >= 80 ? 'bg-green-500' : 
                                                t.feedback.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}>
                                                <span>Score:</span>
                                                <span className="text-sm">{t.feedback.score}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                                <p className="text-slate-800 dark:text-slate-200 text-sm">
                                                    <span className="font-bold text-violet-600 dark:text-violet-400 text-xs block mb-0.5 uppercase">Better way to say:</span> 
                                                    {t.feedback.correctedPhrase}
                                                </p>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs italic pl-1 border-l-2 border-slate-200 dark:border-slate-700">
                                                {t.feedback.explanation}
                                            </p>
                                        </div>
                                    </div>
                                )}
                           </div>
                       )}
                       {t.model && (
                           <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-5 py-3 rounded-2xl rounded-tl-sm max-w-[85%] md:max-w-[70%] shadow-sm border border-slate-100 dark:border-slate-700/50">
                                    <p className="leading-relaxed">{t.model}</p>
                                </div>
                           </div>
                       )}
                    </div>
                ))}
                
                {!isRecording && transcripts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-6">
                        <div className="w-24 h-24 bg-violet-50 dark:bg-violet-900/20 rounded-full flex items-center justify-center ring-1 ring-violet-100 dark:ring-violet-800/30 animate-pulse">
                             <MicIcon className="w-12 h-12 text-violet-500" />
                        </div>
                        <div className="max-w-xs mx-auto">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Start Speaking</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                Tap the microphone below to start a real-time conversation. I'll listen and help you correct your grammar instantly!
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex-shrink-0 p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 dark:to-transparent flex flex-col items-center gap-4 relative z-10">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm px-4 py-2 rounded-xl animate-fade-in">
                        {error}
                    </div>
                )}
                
                <div className="relative">
                    {/* Pulse Effect */}
                    {isRecording && (
                        <>
                             <span className="absolute inset-0 rounded-full animate-ping bg-red-400/30"></span>
                             <span className="absolute -inset-2 rounded-full animate-pulse bg-red-500/10"></span>
                        </>
                    )}
                    
                    <button
                        onClick={isRecording ? stopConversation : startConversation}
                        disabled={isConnecting}
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ease-out shadow-2xl transform hover:scale-105 active:scale-95
                            ${isRecording 
                                ? 'bg-gradient-to-br from-red-500 to-pink-600 ring-4 ring-red-100 dark:ring-red-900/30' 
                                : 'bg-gradient-to-br from-violet-600 to-fuchsia-600 ring-4 ring-violet-100 dark:ring-violet-900/30 hover:shadow-violet-500/40'
                            }
                            ${isConnecting ? 'opacity-90 cursor-wait' : ''}
                        `}
                    >
                        {isConnecting ? (
                            <LoadingIcon className="w-8 h-8 text-white/90" />
                        ) : isRecording ? (
                            <StopIcon className="w-8 h-8 text-white drop-shadow-md" />
                        ) : (
                            <MicIcon className="w-9 h-9 text-white drop-shadow-md" />
                        )}
                    </button>
                </div>
                
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500 h-5">
                    {isConnecting ? "Connecting..." : isRecording ? "Listening..." : "Tap to practice"}
                </p>
            </div>
        </div>
    );
};

export default Conversation;
