import React, { useState } from 'react';
import { Uploader } from './Uploader';
import { Card } from './Shared';
import { detectPlantDiseaseWithGemini } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import { DiseaseDetection } from '../types';
import { ACCEPTED_IMAGE_TYPES } from '../constants';

const DiseaseReport: React.FC<{ detection: DiseaseDetection | null; t: (key: string) => string; }> = ({ detection, t }) => {
    if (!detection) return null;
    return (
        <Card>
            <h4 className="text-lg font-semibold text-text-main dark:text-slate-200 mb-2">{t('disease_detection_report')}</h4>
            <p className="text-text-light dark:text-slate-400"><strong className="text-text-main dark:text-slate-300">{t('disease_name')}:</strong> {detection.diseaseName}</p>
            <p className="text-text-light dark:text-slate-400"><strong className="text-text-main dark:text-slate-300">{t('confidence')}:</strong> {detection.confidence}%</p>
            <div className="mt-4">
                <h5 className="font-semibold text-text-main dark:text-slate-300 mb-1">{t('treatment_steps')}</h5>
                <ul className="list-disc list-inside text-text-light dark:text-slate-400 space-y-1">
                    {detection.treatmentSteps.map((step, i) => <li key={i}>{step}</li>)}
                </ul>
            </div>
        </Card>
    );
}

export const PlantHealthPage: React.FC<{ t: (key: string) => string; }> = ({ t }) => {
    const [diseaseDetection, setDiseaseDetection] = useState<DiseaseDetection | null>(null);
    const [uploadingDisease, setUploadingDisease] = useState(false);

    const handleDiseaseImageUpload = async (file: File) => {
        setUploadingDisease(true);
        setDiseaseDetection(null);
        try {
            const base64Image = await fileToBase64(file);
            const result = await detectPlantDiseaseWithGemini(base64Image, file.type);
            setDiseaseDetection(result);
        } catch (error) {
            console.error('Error processing disease image:', error);
        } finally {
            setUploadingDisease(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Card>
                <Uploader
                    title={t('upload_plant_image')}
                    onUpload={handleDiseaseImageUpload}
                    acceptedTypes={ACCEPTED_IMAGE_TYPES}
                    uploading={uploadingDisease}
                />
            </Card>
            <DiseaseReport detection={diseaseDetection} t={t} />
        </div>
    );
};