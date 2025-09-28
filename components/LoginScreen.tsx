import React, { useState } from 'react';
import { Role, User } from '../types';
import { supabaseLogin } from '../services/apiPlaceholders';
import { Card, Button } from './Shared';
import { LeafIcon } from './Icons';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  t: (key: string) => string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, t }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<Role>(Role.Farmer);
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !mobile) {
      alert('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    const userToLogin = { id: '', name, email, mobile, role };
    const { user } = await supabaseLogin(userToLogin);
    if (user) {
      onLogin(user);
    }
    setIsLoading(false);
  };

  // Attractive agriculture-themed background image (Pixabay, free to use)
  // You can replace the image URL with your own asset if desired
  const bgImageUrl = '/static/login-bg.jpg'; // Local agriculture image
    return (
      <div className="flex items-center justify-center min-h-screen bg-background dark:bg-slate-900 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${bgImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.32,
            filter: 'blur(1.5px)',
          }}
        />
        {/* Overlay for extra contrast */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/60 via-transparent to-slate-900/60 pointer-events-none" />
        {/* Login Card */}
        <div className="relative z-20 w-full flex items-center justify-center">
          <Card className="max-w-md w-full backdrop-blur-md bg-white/90 dark:bg-slate-800/90 shadow-xl">
            <div className="text-center mb-8">
              <LeafIcon className="w-12 h-12 text-primary mx-auto" />
              <h2 className="mt-2 text-2xl font-bold text-text-main dark:text-white">{t('login_welcome')}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-light dark:text-slate-300">{t('name')}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light dark:text-slate-300">{t('email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light dark:text-slate-300">{t('password')}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                {/* This mobile number would be used for SMS alerts as per requirements */}
                <label className="block text-sm font-medium text-text-light dark:text-slate-300">{t('mobile')}</label>
                <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light dark:text-slate-300">{t('role')}</label>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                  <option value={Role.Farmer}>{t('role_farmer')}</option>
                  <option value={Role.Scientist}>{t('role_scientist')}</option>
                  <option value={Role.Researcher}>{t('role_researcher')}</option>
                </select>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full justify-center">
                {isLoading ? 'Logging in...' : t('login')}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
};

export default LoginScreen;
