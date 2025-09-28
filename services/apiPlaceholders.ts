import { User, RiskAlert } from '../types';

// Supabase Placeholder
export const supabaseLogin = async (user: User): Promise<{ user: User; error: null }> => {
  console.log("Simulating Supabase login for:", user);
  // In a real app, you'd call Supabase here.
  await new Promise(res => setTimeout(res, 500));
  return { user, error: null };
};

export const uploadDataToSupabase = async (userId: string, data: any): Promise<{ success: true }> => {
    console.log(`Simulating data upload to Supabase for user ${userId}:`, data);
    await new Promise(res => setTimeout(res, 500));
    return { success: true };
}

export const getRiskAlertsFromSupabase = async (userId: string): Promise<RiskAlert[]> => {
    console.log(`Simulating fetching risk alerts for user ${userId}`);
    await new Promise(res => setTimeout(res, 500));
    return [
        { id: '1', risk: 'Low Moisture', level: 'High', recommendation: 'Irrigate 20mm today.', timestamp: '2023-10-27T10:00:00Z' },
        { id: '2', risk: 'Pest (Aphids)', level: 'Medium', recommendation: 'Consider applying neem oil.', timestamp: '2023-10-26T14:30:00Z' },
        { id: '3', risk: 'Nitrogen Deficiency', level: 'Low', recommendation: 'Monitor leaf color.', timestamp: '2023-10-25T08:00:00Z' },
    ];
};


// Twilio Placeholder
export const sendSmsAlert = async (mobile: string, message: string): Promise<{ success: boolean }> => {
  console.log(`Simulating sending SMS via Twilio to ${mobile}: "${message}"`);
  // In a real app, you'd call Twilio's API here.
  await new Promise(res => setTimeout(res, 500));
  return { success: true };
};