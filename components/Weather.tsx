import React, { useState, useEffect } from 'react';
import { Card } from './Shared';
import { SunIcon, WeatherCloudIcon, WeatherRainIcon, WeatherPartlyCloudyIcon } from './Icons';
import { WeatherData } from '../types';

const getWeatherInfo = (code: number, t: (key: string) => string): { Icon: React.FC<any>, text: string } => {
    switch (code) {
        case 0: return { Icon: SunIcon, text: t('weather_0') };
        case 1: return { Icon: SunIcon, text: t('weather_1') };
        case 2: return { Icon: WeatherPartlyCloudyIcon, text: t('weather_2') };
        case 3: return { Icon: WeatherCloudIcon, text: t('weather_3') };
        case 45: case 48: return { Icon: WeatherCloudIcon, text: t('weather_45') };
        case 51: case 53: case 55: return { Icon: WeatherRainIcon, text: t('weather_51') };
        case 61: case 63: case 65: return { Icon: WeatherRainIcon, text: t('weather_61') };
        case 80: case 81: case 82: return { Icon: WeatherRainIcon, text: t('weather_80') };
        default: return { Icon: SunIcon, text: t('weather_0') };
    }
};

export const Weather: React.FC<{ t: (key: string) => string }> = ({ t }) => {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            // Using Fresno, CA as a default agricultural region
            const lat = 36.75;
            const lon = -119.77;
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Failed to fetch weather data');
                }
                const data = await response.json();
                setWeatherData(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    if (loading) {
        return (
            <Card>
                <div className="flex justify-center items-center h-48">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Card>
        );
    }

    if (error || !weatherData) {
        return (
            <Card>
                <h4 className="text-lg font-semibold text-text-main dark:text-slate-200 mb-4">{t('weather_forecast')}</h4>
                <p className="text-red-500">Could not load weather data.</p>
            </Card>
        );
    }
    
    const { Icon: CurrentIcon, text: currentText } = getWeatherInfo(weatherData.current.weather_code, t);

    return (
        <Card>
            <h4 className="text-lg font-semibold text-text-main dark:text-slate-200 mb-4 flex items-center gap-2">
                <img src="https://cdn-icons-png.flaticon.com/512/869/869869.png" alt="Sun" className="w-7 h-7 inline-block align-middle" />
                {t('weather_forecast')}
            </h4>
            <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <CurrentIcon className="w-16 h-16 text-primary" />
                    {/* Sun image overlay for sunny weather */}
                    {weatherData.current.weather_code === 0 || weatherData.current.weather_code === 1 ? (
                        <img src="https://cdn-icons-png.flaticon.com/512/869/869869.png" alt="Sun" className="absolute top-0 left-0 w-16 h-16 opacity-70 pointer-events-none" />
                    ) : null}
                </div>
                <div>
                    <p className="text-4xl font-bold">{Math.round(weatherData.current.temperature_2m)}°C</p>
                    <p className="text-text-light dark:text-slate-400">{currentText}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 text-sm text-text-light dark:text-slate-400 mb-4">
                <p>{t('humidity')}: {weatherData.current.relative_humidity_2m}%</p>
                <p>{t('wind')}: {weatherData.current.wind_speed_10m.toFixed(1)} km/h</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
                {weatherData.daily.time.slice(1, 5).map((time, index) => {
                    const dayIndex = new Date(time).getDay();
                    const { Icon: ForecastIcon } = getWeatherInfo(weatherData.daily.weather_code[index + 1], t);
                    return (
                         <div key={time} className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                            <p className="font-semibold text-text-main dark:text-slate-300">{t(`day_${dayIndex}`)}</p>
                            <ForecastIcon className="w-8 h-8 my-1 text-secondary"/>
                            <p className="text-text-light dark:text-slate-400">
                                {Math.round(weatherData.daily.temperature_2m_max[index + 1])}° / {Math.round(weatherData.daily.temperature_2m_min[index + 1])}°
                            </p>
                        </div>
                    )
                })}
            </div>
        </Card>
    );
};