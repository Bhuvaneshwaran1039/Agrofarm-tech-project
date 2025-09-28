// Fix: Define all the types used throughout the application.

export interface SoilDataPoint {
  date: string;
  moisture: number;
  fertility: number;
  temperature: number;
}

export enum Role {
  Farmer = 'Farmer/User',
  Scientist = 'Crop Scientist',
  Researcher = 'Researcher',
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: Role;
}

export interface RiskAlert {
  id: string;
  risk: string;
  level: 'High' | 'Medium' | 'Low';
  recommendation: string;
  timestamp: string;
}

export interface Task {
  id: number;
  title: string;
  isComplete: boolean;
  dueDate: string;
  reminder?: string | null;
}

export interface LandImageAnalysis {
  isDroneImage: boolean;
  ndvi?: number;
  ndre?: number;
  healthMap: {
    healthy: number;
    mediumStress: number;
    highStress: number;
  };
  summary: string;
}

export interface DiseaseDetection {
  diseaseName: string;
  confidence: number;
  treatmentSteps: string[];
}

export interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}
