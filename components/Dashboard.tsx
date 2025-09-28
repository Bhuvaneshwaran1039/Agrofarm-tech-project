import React, { useState, useEffect, useRef } from 'react';
import { Uploader } from './Uploader';
import { Card } from './Shared';
import { Weather } from './Weather';
import { analyzeSoilDataWithGemini } from '../services/geminiService';
import { parseDataFile } from '../utils/helpers';
import { SoilDataPoint, Task } from '../types';
import { ACCEPTED_DATA_TYPES } from '../constants';
import {
    LineChart,
    Line,
    Bar,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

declare const Papa: any;

interface SoilAnalysisResult {
    yield: number;
    profit: number;
    summary: string;
}

interface DataChartProps {
    data: SoilDataPoint[];
    t: (key: string) => string;
    theme: 'light' | 'dark';
    chartType: 'line' | 'bar' | 'area';
}

const DataChart: React.FC<DataChartProps> = ({ data, t, theme, chartType }) => {
    if (!data || data.length === 0) {
        return (
            <div className="mt-6 p-4 text-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-text-light dark:text-slate-400">Please upload your dataset to see results.</p>
            </div>
        );
    }
    
    const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b'; // slate-400 : slate-500

    return (
        <div className="mt-2 h-80">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 12 }} />
                    <YAxis tick={{ fill: tickColor, fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', // slate-800 : white
                            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0' // slate-700 : slate-200
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                    {chartType === 'line' && (
                        <>
                            <Line type="monotone" dataKey="moisture" stroke="#3b82f6" strokeWidth={2} name="Moisture" />
                            <Line type="monotone" dataKey="fertility" stroke="#84cc16" strokeWidth={2} name="Fertility" />
                            <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temperature (°C)" />
                        </>
                    )}
                    {chartType === 'bar' && (
                        <>
                            <Bar dataKey="moisture" fill="#3b82f6" name="Moisture" />
                            <Bar dataKey="fertility" fill="#84cc16" name="Fertility" />
                            <Bar dataKey="temperature" fill="#ef4444" name="Temperature (°C)" />
                        </>
                    )}
                    {chartType === 'area' && (
                        <>
                            <Area type="monotone" dataKey="moisture" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} name="Moisture" />
                            <Area type="monotone" dataKey="fertility" stroke="#84cc16" fill="#84cc16" fillOpacity={0.3} strokeWidth={2} name="Fertility" />
                            <Area type="monotone" dataKey="temperature" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} strokeWidth={2} name="Temperature (°C)" />
                        </>
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export const Dashboard: React.FC<{
    soilData: SoilDataPoint[];
    setSoilData: (data: SoilDataPoint[]) => void;
    tasks: Task[];
    t: (key: string) => string;
    theme: 'light' | 'dark';
}> = ({ soilData, setSoilData, tasks, t, theme }) => {
    const [uploadingSoil, setUploadingSoil] = useState(false);
    const [soilAnalysis, setSoilAnalysis] = useState<SoilAnalysisResult | null>(null);
    const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
    const [displayedSoilData, setDisplayedSoilData] = useState<SoilDataPoint[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    // Streaming state
    const [isStreaming, setIsStreaming] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [streamMode, setStreamMode] = useState<'iot' | 'dataset'>('dataset');
    const streamIndexRef = useRef(0);
    const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    
    useEffect(() => {
        setDisplayedSoilData(soilData);
    }, [soilData]);

    // Streaming logic
    useEffect(() => {
        if (!isStreaming || isPaused) {
            if (streamIntervalRef.current) {
                clearInterval(streamIntervalRef.current);
                streamIntervalRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            return;
        }

        // Try IoT/WebSocket first (replace with your real endpoint)
        let iotConnected = false;
        try {
            wsRef.current = new window.WebSocket('ws://localhost:8080/iot');
            wsRef.current.onmessage = (event) => {
                const point = JSON.parse(event.data);
                setDisplayedSoilData(prev => [...prev, point]);
                setLastUpdate(new Date());
                setStreamMode('iot');
            };
            wsRef.current.onopen = () => {
                iotConnected = true;
            };
            wsRef.current.onerror = () => {
                wsRef.current?.close();
                wsRef.current = null;
            };
        } catch {
            iotConnected = false;
        }

        // If no IoT, fallback to dataset playback
        if (!iotConnected && soilData.length > 0) {
            setStreamMode('dataset');
            streamIndexRef.current = 0;
            streamIntervalRef.current = setInterval(() => {
                if (streamIndexRef.current < soilData.length) {
                    setDisplayedSoilData(prev => [...prev, soilData[streamIndexRef.current]]);
                    setLastUpdate(new Date());
                    streamIndexRef.current++;
                } else {
                    setIsStreaming(false);
                    clearInterval(streamIntervalRef.current!);
                }
            }, 1000);
        }

        return () => {
            if (streamIntervalRef.current) {
                clearInterval(streamIntervalRef.current);
                streamIntervalRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [isStreaming, isPaused, soilData]);


    const handleSoilDataUpload = async (file: File) => {
        setUploadingSoil(true);
        setSoilAnalysis(null);
        setStartDate('');
        setEndDate('');
        try {
            const parsedData = await parseDataFile(file);
            setSoilData(parsedData);
            const result = await analyzeSoilDataWithGemini(parsedData);
            if (result) {
                setSoilAnalysis(result);
            }
        } catch (error: any) {
            console.error('Error processing soil data:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setUploadingSoil(false);
        }
    };

    const handleDownloadCsv = () => {
        if (!displayedSoilData || displayedSoilData.length === 0) return;
        const csv = Papa.unparse(displayedSoilData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "soil_analysis_report.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const handleFilter = () => {
        if (!startDate || !endDate) {
            alert("Please select both a start and end date.");
            return;
        }
        const filtered = soilData.filter(d => {
            // Using getTime() for robust comparison, handles different date string formats
            const itemDate = new Date(d.date).getTime();
            // Add 1 to endDate to make the range inclusive
            const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
            const start = new Date(startDate).getTime();
            return itemDate >= start && itemDate <= end;
        });
        setDisplayedSoilData(filtered);
    };

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setDisplayedSoilData(soilData);
    };

    // Streaming controls
    const handleStartStreaming = () => {
        setDisplayedSoilData([]);
        setIsStreaming(true);
        setIsPaused(false);
        setLastUpdate(null);
    };
    const handleStopStreaming = () => {
        setIsStreaming(false);
        setIsPaused(false);
        setLastUpdate(null);
    };
    const handlePauseStreaming = () => {
        setIsPaused(true);
    };
    const handleResumeStreaming = () => {
        setIsPaused(false);
    };

    const pendingTasks = tasks.filter(task => !task.isComplete);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-main dark:text-white">🌱 {t('dashboard_overview')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-text-main dark:text-slate-100">🧑‍🌾 {t('soil_data_analysis')}</h3>
                            {displayedSoilData.length > 0 && (
                                <button onClick={handleDownloadCsv} className="text-sm px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
                                    {t('download_report')}
                                </button>
                            )}
                        </div>
                        {/* Streaming Controls */}
                        <div className="flex items-center gap-3 mb-4">
                            {!isStreaming ? (
                                <button onClick={handleStartStreaming} className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors">Start Streaming</button>
                            ) : (
                                <>
                                    <button onClick={handleStopStreaming} className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors">Stop Streaming</button>
                                    {!isPaused ? (
                                        <button onClick={handlePauseStreaming} className="px-4 py-2 bg-yellow-500 text-white rounded-md font-semibold hover:bg-yellow-600 transition-colors">Pause</button>
                                    ) : (
                                        <button onClick={handleResumeStreaming} className="px-4 py-2 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 transition-colors">Resume</button>
                                    )}
                                    <span className="ml-4 flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${isStreaming && !isPaused ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                        <span className="text-xs text-text-light dark:text-slate-400">Live</span>
                                        {lastUpdate && (
                                            <span className="ml-2 text-xs text-text-light dark:text-slate-400">Last update: {lastUpdate.toLocaleTimeString()}</span>
                                        )}
                                    </span>
                                </>
                            )}
                        </div>
                        <Uploader
                            title={t('upload_soil_csv')}
                            onUpload={handleSoilDataUpload}
                            acceptedTypes={ACCEPTED_DATA_TYPES}
                            uploading={uploadingSoil}
                        />
                         {soilData.length > 0 && (
                            <>
                            <div className="flex flex-wrap items-center gap-4 mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <label htmlFor="startDate" className="text-sm font-medium text-text-light dark:text-slate-400">Start Date:</label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="p-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="endDate" className="text-sm font-medium text-text-light dark:text-slate-400">End Date:</label>
                                    <input
                                        type="date"
                                        id="endDate"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="p-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <button
                                    onClick={handleFilter}
                                    className="px-4 py-2 text-sm bg-secondary text-white rounded-md hover:bg-slate-600 transition-colors"
                                >
                                    Filter
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-600 text-text-main dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                            <div className="flex justify-end items-center gap-2 mt-4">
                                <span className="text-sm text-text-light dark:text-slate-400 mr-2">📊 Chart Type:</span>
                                {(['line', 'bar', 'area'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setChartType(type)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                                            chartType === type
                                                ? 'bg-primary text-white'
                                                : 'bg-slate-200 dark:bg-slate-700 text-text-main dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        {type === 'line' ? '📈 ' : type === 'bar' ? '📊 ' : '🌾 '} {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>
                            </>
                         )}
                         <DataChart data={displayedSoilData} t={t} theme={theme} chartType={chartType} />
                         {soilAnalysis && (
                            <div className="mt-6">
                                <h4 className="text-lg font-semibold text-text-main dark:text-slate-200 mb-2">🔬 {t('soil_analysis_result')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <p className="text-sm text-text-light dark:text-slate-400">🌾 {t('yield_prediction')}</p>
                                        <p className="text-2xl font-bold text-primary">{soilAnalysis.yield} tons/acre</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <p className="text-sm text-text-light dark:text-slate-400">💰 {t('profit_prediction')}</p>
                                        <p className="text-2xl font-bold text-primary">${soilAnalysis.profit.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                    <h5 className="font-semibold mb-1">📝 {t('summary_and_recommendations')}</h5>
                                    <p className="text-text-light dark:text-slate-400 text-sm">{soilAnalysis.summary}</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Weather t={t} />
                    <Card>
                        <h4 className="text-lg font-semibold text-text-main dark:text-slate-200 mb-4">📋 {t('pending_tasks')}</h4>
                        {pendingTasks.length > 0 ? (
                            <ul className="space-y-2">
                                {pendingTasks.slice(0, 5).map(task => (
                                    <li key={task.id} className="text-sm text-text-light dark:text-slate-300">
                                        - {task.title}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-light dark:text-slate-400">No pending tasks. Great job!</p>
                        )}
                         {pendingTasks.length > 5 && (
                             <p className="text-xs text-primary mt-2">{t('view_all_tasks')}</p>
                         )}
                    </Card>
                </div>
            </div>
        </div>
    );
};