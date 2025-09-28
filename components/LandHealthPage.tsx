import React, { useState, useMemo } from 'react';
import { Uploader } from './Uploader';
import { Card } from './Shared';
import { analyzeLandImageWithGemini } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import { LandImageAnalysis } from '../types';
import { ACCEPTED_IMAGE_TYPES } from '../constants';

const HealthMap: React.FC<{ analysis: LandImageAnalysis | null; t: (key: string) => string }> = ({ analysis, t }) => {
    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number; } | null>(null);

    const gridCells = useMemo(() => {
        if (!analysis) return [];
        const { healthy, mediumStress, highStress } = analysis.healthMap;
        const total = healthy + mediumStress + highStress;
        if (total === 0) return [];

        const numHealthy = Math.round((healthy / total) * 100);
        const numMedium = Math.round((mediumStress / total) * 100);
        const numHigh = 100 - numHealthy - numMedium;

        const cells = Array(numHealthy).fill({ color: 'bg-green-500', status: t('healthy') })
            .concat(Array(numMedium).fill({ color: 'bg-yellow-500', status: t('medium_stress') }))
            .concat(Array(numHigh).fill({ color: 'bg-red-500', status: t('high_stress') }));
        
        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cells[i], cells[j]] = [cells[j], cells[i]];
        }
        return cells;
    }, [analysis, t]);

    const handleMouseMove = (e: React.MouseEvent, status: string) => {
        setTooltip({ content: status, x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const handleDownload = () => {
        if (!analysis) return;
        const reportContent = `
Land Health Report
--------------------
Date: ${new Date().toLocaleDateString()}
Summary: ${analysis.summary}
Health Distribution:
- Healthy: ${analysis.healthMap.healthy}%
- Medium Stress: ${analysis.healthMap.mediumStress}%
- High Stress: ${analysis.healthMap.highStress}%
${analysis.isDroneImage ? `NDVI: ${analysis.ndvi?.toFixed(3)}\nNDRE: ${analysis.ndre?.toFixed(3)}` : ''}
        `;
        const blob = new Blob([reportContent.trim()], { type: 'text/plain' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "land_health_report.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            {tooltip && (
                <div
                    style={{ position: 'fixed', top: tooltip.y, left: tooltip.x, transform: 'translate(15px, -30px)' }}
                    className="z-50 px-2 py-1 text-xs text-white bg-slate-900/80 dark:bg-black/80 rounded-md shadow-lg pointer-events-none"
                >
                    {tooltip.content}
                </div>
            )}
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-text-main dark:text-slate-200">{t('land_health_map')}</h4>
                {analysis && <button onClick={handleDownload} className="text-sm px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">{t('download_report')}</button>}
            </div>
            {analysis ? (
                <>
                    <div 
                        className="grid grid-cols-10 gap-1 w-full aspect-square mb-4"
                        onMouseLeave={handleMouseLeave}
                    >
                        {gridCells.map((cell, i) => (
                            <div 
                                key={i} 
                                className={`h-full w-full rounded-sm transition-transform hover:scale-110 hover:z-10 ${cell.color}`}
                                onMouseMove={(e) => handleMouseMove(e, cell.status)}
                            ></div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-text-light dark:text-slate-400">
                        <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>{t('healthy')}</span>
                        <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>{t('medium_stress')}</span>
                        <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>{t('high_stress')}</span>
                    </div>
                </>
            ) : <p className="text-text-light dark:text-slate-400">{t('no_dataset_message')}</p>}
        </Card>
    );
};

export const LandHealthPage: React.FC<{ t: (key: string) => string; }> = ({ t }) => {
    const [landAnalysis, setLandAnalysis] = useState<LandImageAnalysis | null>(null);
    const [uploadingLand, setUploadingLand] = useState(false);

    const handleLandImageUpload = async (file: File) => {
        setUploadingLand(true);
        setLandAnalysis(null);
        try {
            const base64Image = await fileToBase64(file);
            const result = await analyzeLandImageWithGemini(base64Image, file.type);
            setLandAnalysis(result);
        } catch (error) {
            console.error('Error processing land image:', error);
        } finally {
            setUploadingLand(false);
        }
    };
    
    return (
        <div className="space-y-6">
             <Card>
                <Uploader
                    title={t('upload_land_image')}
                    onUpload={handleLandImageUpload}
                    acceptedTypes={ACCEPTED_IMAGE_TYPES}
                    uploading={uploadingLand}
                />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <HealthMap analysis={landAnalysis} t={t} />
                </div>
                {landAnalysis && (
                    <Card>
                        <h4 className="text-lg font-semibold text-text-main dark:text-slate-200 mb-2">Analysis Summary</h4>
                        <p className="text-text-light dark:text-slate-400">{landAnalysis.summary}</p>
                        {landAnalysis.isDroneImage && (
                            <div className="mt-4 space-y-2 text-sm">
                                <p><strong className="font-semibold text-text-main dark:text-slate-300">NDVI:</strong> {landAnalysis.ndvi?.toFixed(3) ?? 'N/A'}</p>
                                <p><strong className="font-semibold text-text-main dark:text-slate-300">NDRE:</strong> {landAnalysis.ndre?.toFixed(3) ?? 'N/A'}</p>
                            </div>
                        )}
                         <div className="mt-4 space-y-2 text-sm">
                                <p><strong className="font-semibold text-text-main dark:text-slate-300">{t('healthy')}:</strong> {landAnalysis.healthMap.healthy}%</p>
                                <p><strong className="font-semibold text-text-main dark:text-slate-300">{t('medium_stress')}:</strong> {landAnalysis.healthMap.mediumStress}%</p>
                                <p><strong className="font-semibold text-text-main dark:text-slate-300">{t('high_stress')}:</strong> {landAnalysis.healthMap.highStress}%</p>
                            </div>
                    </Card>
                )}
            </div>
        </div>
    );
};