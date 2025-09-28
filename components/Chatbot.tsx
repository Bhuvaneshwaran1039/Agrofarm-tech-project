import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse, generateImageWithGemini } from '../services/geminiService';
import { SoilDataPoint } from '../types';
import { Card } from './Shared';
import { ChatIcon, MicrophoneIcon, SpeakerIcon } from './Icons';

// Fix: Define the Message interface for chat messages.
interface Message {
    role: 'user' | 'model';
    text?: string;
    imageUrl?: string;
    languageCode?: string;
}

interface ChatbotProps {
    soilData: SoilDataPoint[];
    t: (key: string) => string;
}

// Fix: Implement the Chatbot component with full functionality.
export const Chatbot: React.FC<ChatbotProps> = ({ soilData, t }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null); // To hold SpeechRecognition instance
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Speech Recognition setup
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListen = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setInput('');
            recognitionRef.current.start();
        }
        setIsListening(prev => !prev);
    };

    const speakText = (text: string, lang: string = 'en-US') => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            window.speechSynthesis.cancel(); // Cancel any previous speech
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Check for image generation command
            const imagePromptPrefix = 'generate a picture of';
            if (input.toLowerCase().startsWith(imagePromptPrefix)) {
                const prompt = input.substring(imagePromptPrefix.length).trim();
                const imageUrl = await generateImageWithGemini(prompt);
                const modelMessage: Message = { role: 'model', imageUrl };
                setMessages(prev => [...prev, modelMessage]);
            } else {
                // Regular chat
                const history = messages.filter(m => m.text).map(m => ({
                    role: m.role,
                    parts: [{ text: m.text! }]
                }));

                const { responseText, languageCode } = await getChatbotResponse(history, input, soilData);
                const modelMessage: Message = { role: 'model', text: responseText, languageCode };
                setMessages(prev => [...prev, modelMessage]);
            }
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };


    return (
        <Card className="flex flex-col h-[calc(100vh-3rem)]">
            <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center">
                <ChatIcon className="w-6 h-6 mr-3 text-primary" />
                {t('chatbot_advisor')}
            </h2>
            <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white font-bold">A</div>}
                        <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-text-main dark:text-slate-200'}`}>
                            {msg.text && (
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            )}
                            {msg.imageUrl && (
                                <img src={msg.imageUrl} alt="Generated" className="rounded-md max-w-sm" />
                            )}
                        </div>
                         {msg.role === 'model' && msg.text && (
                            <button onClick={() => speakText(msg.text!, msg.languageCode)} title="Read aloud" className="self-center">
                                <SpeakerIcon className="w-5 h-5 text-slate-400 hover:text-primary" />
                            </button>
                        )}
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white font-bold">A</div>
                         <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                            </div>
                        </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <textarea
                        value={isListening ? t('listening') : input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('ask_me')}
                        className="w-full p-3 pr-24 bg-slate-100 dark:bg-slate-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-main dark:text-slate-200 resize-none"
                        rows={2}
                        disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                         <button onClick={toggleListen} disabled={isLoading || !recognitionRef.current} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50">
                             <MicrophoneIcon className={`w-6 h-6 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
                         </button>
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim()}
                            className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Send
                        </button>
                    </div>
                </div>
                 <p className="text-xs text-slate-400 mt-2 text-center">{t('generate_image_prompt')}</p>
            </div>
        </Card>
    );
};
