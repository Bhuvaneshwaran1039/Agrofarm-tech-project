// Fix: Create the main App component to structure the application.
// Fix: Import `useRef` from React.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoginScreen from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { Tasks } from './components/Tasks';
import { Chatbot } from './components/Chatbot';
import { LandHealthPage } from './components/LandHealthPage';
import { PlantHealthPage } from './components/PlantHealthPage';
import { SoilDataPoint, Task, User, Role } from './types';
import { DashboardIcon, ChatIcon, ClipboardListIcon, LeafIcon, SunIcon, MoonIcon, GlobeIcon, LogoutIcon } from './components/Icons';
import { sendSmsAlert, supabaseLogin } from './services/apiPlaceholders';
import { Button, Card } from './components/Shared';
import { LANGUAGES } from './constants';
import AgricultureLibrary from './components/AgricultureLibrary';



type Page = 'dashboard' | 'tasks' | 'land' | 'plant' | 'chatbot' | 'risk' | 'library';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [page, setPage] = useState<Page>('dashboard');
    const [theme, setTheme] = useState<'light' | 'dark'>(
      localStorage.getItem('agrofarm-theme') as 'light' | 'dark' || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    );
    const [language, setLanguage] = useState(localStorage.getItem('agrofarm-lang') || 'en');
    const [soilData, setSoilData] = useState<SoilDataPoint[]>([]);
    const notificationTimeouts = useRef<{[key: number]: number}>({});
    const [tasks, setTasks] = useState<Task[]>(() => {
        const savedTasks = localStorage.getItem('agrofarm-tasks');
        return savedTasks ? JSON.parse(savedTasks) : [];
    });

    useEffect(() => {
        localStorage.setItem('agrofarm-tasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('agrofarm-theme', theme);
    }, [theme]);
    
    useEffect(() => {
        const storedUser = localStorage.getItem('agrofarm-user');
        if(storedUser) {
            setUser(JSON.parse(storedUser));
        }
    },[]);

    useEffect(() => {
        localStorage.setItem('agrofarm-lang', language);
    }, [language]);
    
    // Dynamic translation function
    const t = useCallback((key: string): string => {
        return LANGUAGES[language]?.[key] || LANGUAGES['en']?.[key] || key;
    }, [language]);
    
    // Reschedule notifications on load
    useEffect(() => {
        tasks.forEach(task => {
            if (task.reminder && new Date(task.reminder) > new Date()) {
                scheduleNotification(task);
            }
        });
        // Clear timeouts on component unmount
        return () => {
             Object.values(notificationTimeouts.current).forEach(clearTimeout);
        }
    }, []);

    const scheduleNotification = (task: Task) => {
        if (notificationTimeouts.current[task.id]) {
            clearTimeout(notificationTimeouts.current[task.id]);
        }
        if (task.reminder) {
            const reminderTime = new Date(task.reminder).getTime();
            const now = new Date().getTime();
            const delay = reminderTime - now;

            if (delay > 0) {
                 const timeoutId = window.setTimeout(() => {
                    new Notification('AgroFarm Task Reminder', {
                        body: `Don't forget: ${task.title}`,
                    });
                }, delay);
                notificationTimeouts.current[task.id] = timeoutId;
            }
        }
    };
    
    const cancelNotification = (taskId: number) => {
        if (notificationTimeouts.current[taskId]) {
            clearTimeout(notificationTimeouts.current[taskId]);
            delete notificationTimeouts.current[taskId];
        }
    };


    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const handleLogin = (loggedInUser: User) => {
        const userWithId = { ...loggedInUser, id: `user-${Date.now()}`};
        setUser(userWithId);
        localStorage.setItem('agrofarm-user', JSON.stringify(userWithId));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('agrofarm-user');
    };

    const handleAddTask = (title: string, dueDate: string) => {
        const newTask: Task = {
            id: Date.now(),
            title,
            dueDate,
            isComplete: false,
        };
        setTasks(prev => [...prev, newTask]);
    };

    const handleToggleComplete = (taskId: number) => {
        const task = tasks.find(t => t.id === taskId);
        if (task && !task.isComplete) {
             cancelNotification(taskId);
        }
        setTasks(prev => prev.map(task => task.id === taskId ? { ...task, isComplete: !task.isComplete } : task));
    };
    
    const handleDeleteTask = (taskId: number) => {
        cancelNotification(taskId);
        setTasks(prev => prev.filter(task => task.id !== taskId));
    };

    const handleClearCompletedTasks = () => {
        // No need to cancel notifications here as they should already be cancelled on completion
        setTasks(prev => prev.filter(task => !task.isComplete));
    };

    const handleSetReminder = async (taskId: number, reminder: string | null) => {
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (!taskToUpdate) return;
        
        // Request permission if setting a new reminder
        if(reminder && Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
             const updatedTask = { ...taskToUpdate, reminder };
             setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
             scheduleNotification(updatedTask);
        } else if (reminder) {
            alert("Please enable notifications to set reminders.");
        } else {
             // Allow clearing reminder even if permission is denied
             const updatedTask = { ...taskToUpdate, reminder: null };
             setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
             cancelNotification(taskId);
        }
    };

    const RiskDiseasePredictionPage = React.lazy(() => import('./components/RiskDiseasePredictionPage'));
    const renderPage = () => {
        switch (page) {
            case 'dashboard':
                return <Dashboard soilData={soilData} setSoilData={setSoilData} tasks={tasks} t={t} theme={theme} />;
            case 'tasks':
                return <Tasks tasks={tasks} t={t} onAddTask={handleAddTask} onToggleComplete={handleToggleComplete} onSetReminder={handleSetReminder} onDeleteTask={handleDeleteTask} onClearCompletedTasks={handleClearCompletedTasks} />;
            case 'land':
                return <LandHealthPage t={t} />;
            case 'plant':
                return <PlantHealthPage t={t} />;
            case 'chatbot':
                return <Chatbot soilData={soilData} t={t} />;
            case 'risk':
                return (
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <RiskDiseasePredictionPage />
                  </React.Suspense>
                );
            case 'library':
                return user && user.role === 'Researcher' ? <AgricultureLibrary user={user} /> : <Dashboard soilData={soilData} setSoilData={setSoilData} tasks={tasks} t={t} theme={theme} />;
            default:
                return <Dashboard soilData={soilData} setSoilData={setSoilData} tasks={tasks} t={t} theme={theme} />;
        }
    };
    
    const emojiLabels: Record<Page, string> = {
        dashboard: '🌱 ',
        tasks: '📋 ',
        land: '🌍 ',
        plant: '🌿 ',
        chatbot: '🤖 ',
        risk: '🦠 ',
        library: '📚 ',
    };
    const NavItem: React.FC<{
        pageName: Page;
        icon: React.ReactNode;
        label: string;
    }> = ({ pageName, icon, label }) => (
        <button
            onClick={() => setPage(pageName)}
            className={`w-full flex items-center p-3 my-2 rounded-lg transition-colors ${
                page === pageName
                ? 'bg-primary text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            {icon}
            <span className="ml-4 font-semibold">{emojiLabels[pageName]}{label}</span>
        </button>
    );
    
    if (!user) {
        return <LoginScreen onLogin={handleLogin} t={t} />;
    }

    return (
        <div className={`flex h-screen bg-background dark:bg-slate-900 font-sans`}>
            {/* Sidebar */}
            <aside className="w-64 bg-card dark:bg-slate-800 shadow-lg flex flex-col p-4">
                <div className="flex items-center mb-8">
                    <LeafIcon className="w-8 h-8 text-primary" />
                    <h1 className="ml-2 text-2xl font-bold text-text-main dark:text-white">AgroFarm</h1>
                </div>
                <nav>
                    <NavItem pageName="dashboard" icon={<DashboardIcon className="w-6 h-6" />} label={t('dashboard')} />
                    <NavItem pageName="tasks" icon={<ClipboardListIcon className="w-6 h-6" />} label={t('tasks')} />
                    <NavItem pageName="land" icon={<GlobeIcon className="w-6 h-6" />} label={t('land_health')} />
                    <NavItem pageName="plant" icon={<LeafIcon className="w-6 h-6" />} label={t('plant_health')} />
                    <NavItem pageName="chatbot" icon={<ChatIcon className="w-6 h-6" />} label={t('chatbot_advisor')} />
                    <NavItem pageName="risk" icon={<SunIcon className="w-6 h-6" />} label="Risk & Disease Prediction" />
                    {user && user.role === 'Researcher' && (
                        <NavItem pageName="library" icon={<span className="w-6 h-6">📚</span>} label="Agriculture Library" />
                    )}
                </nav>
                <div className="mt-auto">
                     <div className="p-3 border-t dark:border-slate-700">
                        <p className="font-semibold text-text-main dark:text-white truncate">{user.name}</p>
                        <p className="text-sm text-text-light dark:text-slate-400">{t(`role_${user.role.split('/')[0].toLowerCase()}`)}</p>
                        <button onClick={handleLogout} className="w-full flex items-center mt-3 p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50">
                            <LogoutIcon className="w-5 h-5" />
                            <span className="ml-3 font-semibold text-sm">{t('logout')}</span>
                        </button>
                    </div>
                    <div className="flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <GlobeIcon className="w-6 h-6" />
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="ml-4 font-semibold bg-transparent w-full focus:outline-none"
                        >
                            <option value="en">English</option>
                            <option value="ta">தமிழ்</option>
                            <option value="fr">Français</option>
                            <option value="ml">മലയാളം</option>
                            <option value="te">తెలుగు</option>
                            <option value="kn">ಕನ್ನಡ</option>
                        </select>
                    </div>
                     <button onClick={toggleTheme} className="w-full flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                        {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                        <span className="ml-4 font-semibold">{theme === 'light' ? t('dark_mode') : t('light_mode')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    );
};

export default App;