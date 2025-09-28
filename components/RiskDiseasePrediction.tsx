import React, { useState, useEffect, useContext } from 'react';
import { LANGUAGES } from '../constants';
// Helper to get translation function from app context or fallback to English
const getTranslation = () => {
  // Try to get language from localStorage (set in App.tsx)
  const lang = localStorage.getItem('agrofarm-lang') || 'en';
  return (key: string) => LANGUAGES[lang]?.[key] || LANGUAGES['en']?.[key] || key;
};
import { sendSmsAlert } from '../services/apiPlaceholders';
import { parseDataFile } from '../utils/helpers';
import Papa from 'papaparse';
import { analyzeSoilDataWithGemini } from '../services/geminiService';


const crops = [
  'Wheat',
  'Rice',
  'Corn',
  'Soybean',
  'Barley',
  'Cotton',
  'Sugarcane',
  'Potato',
  'Tomato',
  'Chili',
  'Onion',
  'Groundnut',
  'Maize',
  'Other',
];


const RiskDiseasePrediction: React.FC = () => {
  const t = getTranslation();
  // Removed crop and location fields
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsError, setSmsError] = useState('');
  const [userMobile, setUserMobile] = useState('');

  // Get user phone from localStorage (set at login)
  useEffect(() => {
    const storedUser = localStorage.getItem('agrofarm-user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserMobile(user.mobile || '');
      } catch {}
    }
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    setSmsSent(false);
    setSmsError('');
    setResult(null);
    if (!file) {
      setResult('Please upload a dataset for AI-powered prediction.');
      setLoading(false);
      return;
    }
    try {
      // Parse file (CSV, JSON, Excel)
      const parsedData = await parseDataFile(file);
      // AI prediction
      const aiResult = await analyzeSoilDataWithGemini(parsedData);
      if (!aiResult) throw new Error('AI could not analyze the dataset.');
      // Build a rich HTML result with diseases and risks
      let resultHtml = `\n\u2728 <b>AI Analysis Result</b>\n\n<b>Dataset:</b> ${fileName}`;
      if (aiResult.diseases && aiResult.diseases.length > 0) {
        resultHtml += `\n\n<b>Predicted Diseases:</b>`;
        aiResult.diseases.forEach((d: any) => {
          resultHtml += `\n- <b>${d.name}</b> (${Math.round(d.probability * 100)}%): ${d.explanation}`;
        });
      }
      if (aiResult.risks && aiResult.risks.length > 0) {
        resultHtml += `\n\n<b>Predicted Risks:</b>`;
        aiResult.risks.forEach((r: any) => {
          resultHtml += `\n- <b>${r.name}</b> (${Math.round(r.probability * 100)}%): ${r.explanation}`;
        });
      }
      resultHtml += `\n\n<b>Predicted Yield:</b> ${aiResult.yield} tons/acre`;
      resultHtml += `\n<b>Predicted Profit:</b> $${aiResult.profit}`;
      resultHtml += `\n<b>Summary & Recommendations:</b> ${aiResult.summary}`;
      setResult(resultHtml);
      // Send SMS
      if (userMobile) {
        let smsText = `AgroFarm AI Prediction\n`;
        if (aiResult.diseases && aiResult.diseases.length > 0) {
          smsText += `Diseases: ` + aiResult.diseases.map((d: any) => `${d.name} (${Math.round(d.probability * 100)}%)`).join(', ') + '\n';
        }
        if (aiResult.risks && aiResult.risks.length > 0) {
          smsText += `Risks: ` + aiResult.risks.map((r: any) => `${r.name} (${Math.round(r.probability * 100)}%)`).join(', ') + '\n';
        }
        smsText += `Yield: ${aiResult.yield} tons/acre\nProfit: $${aiResult.profit}\nSummary: ${aiResult.summary}`;
        try {
          const smsRes = await sendSmsAlert(userMobile, smsText);
          if (smsRes.success) setSmsSent(true);
          else setSmsError('Failed to send SMS.');
        } catch (err) {
          setSmsError('Failed to send SMS.');
        }
      }
    } catch (err: any) {
      setResult('Could not analyze the dataset. Please check your file format.');
      setSmsError('');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
      <h2 className="text-3xl font-extrabold text-primary mb-2 text-center">{t('risk_disease_prediction') || 'Risk & Disease Prediction'}</h2>
      <p className="text-slate-500 dark:text-slate-300 mb-6 text-center">{t('risk_disease_prediction_desc') || 'Upload your soil dataset to get instant AI-powered risk and disease predictions in your language.'}</p>
      <form
        className="space-y-5"
        onSubmit={e => {
          e.preventDefault();
          handlePredict();
        }}
        encType="multipart/form-data"
      >
        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-200">{t('upload_soil_csv') || 'Upload Dataset (CSV, Excel, or JSON)'}</label>
          <input
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            className="block w-full text-sm text-slate-700 dark:text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
                setFileName(e.target.files[0].name);
              } else {
                setFile(null);
                setFileName('');
              }
            }}
          />
          {fileName && <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">{t('selected_file') || 'Selected'}: {fileName}</span>}
        </div>
        <button
          type="submit"
          className="w-full py-2 rounded-lg bg-gradient-to-r from-green-500 to-lime-400 text-white font-bold text-lg shadow-md hover:from-green-600 hover:to-lime-500 transition disabled:opacity-60"
          disabled={!file || loading}
        >
          {loading ? t('predicting') || 'Predicting...' : t('predict') || 'Predict'}
        </button>
      </form>
      {result && (
        <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-green-50 to-lime-100 dark:from-slate-700 dark:to-slate-800 border border-green-200 dark:border-green-700 shadow-inner animate-fade-in">
          <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">{t('prediction_result') || 'Prediction Result'}</h3>
          <pre className="whitespace-pre-wrap text-slate-700 dark:text-slate-200 text-base leading-relaxed" dangerouslySetInnerHTML={{__html: result}} />
          {smsSent && (
            <div className="mt-4 p-3 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-center font-semibold">{t('sms_sent') || 'SMS sent'}: {userMobile}</div>
          )}
          {smsError && (
            <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 text-center font-semibold">{smsError}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskDiseasePrediction;
