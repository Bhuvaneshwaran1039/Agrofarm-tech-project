import { SoilDataPoint } from '../types';

declare const Papa: any;
declare const XLSX: any;

// A helper to ensure data conforms to the SoilDataPoint interface
const mapRowToSoilDataPoint = (row: any): SoilDataPoint => ({
  date: row.date || new Date().toISOString().split('T')[0],
  moisture: row.moisture || 0,
  fertility: row.fertility || 0,
  temperature: row.temperature || 0,
});


export const parseDataFile = (file: File): Promise<SoilDataPoint[]> => {
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results: { data: any[] }) => {
          const parsedData = results.data.map(mapRowToSoilDataPoint);
          resolve(parsedData);
        },
        error: (error: Error) => reject(error),
      });
    } else if (fileName.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const jsonData = JSON.parse(text);
          if (Array.isArray(jsonData)) {
            const parsedData = jsonData.map(mapRowToSoilDataPoint);
            resolve(parsedData);
          } else {
            reject(new Error("Unsupported JSON format. Expected an array of objects."));
          }
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const parsedData = jsonData.map(mapRowToSoilDataPoint);
          resolve(parsedData);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Unsupported file type. Please upload a CSV, JSON, or Excel file."));
    }
  });
};


export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // remove data:image/...;base64, part
    };
    reader.onerror = error => reject(error);
  });
};