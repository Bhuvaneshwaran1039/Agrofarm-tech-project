import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../types';
import { Card } from './Shared';
import { ClipboardListIcon, BellIcon, TrashIcon } from './Icons';

interface TasksProps {
    tasks: Task[];
    t: (key: string) => string;
    onAddTask: (title: string, dueDate: string) => void;
    onToggleComplete: (taskId: number) => void;
    onSetReminder: (taskId: number, reminder: string | null) => void | Promise<void>;
    onDeleteTask: (taskId: number) => void;
    // Fix: Add onClearCompletedTasks to props to handle clearing completed tasks.
    onClearCompletedTasks: () => void;
}

const TaskItem: React.FC<{
    task: Task;
    onToggleComplete: (id: number) => void;
    onSetReminder: (id: number, reminder: string | null) => void | Promise<void>;
    onDeleteTask: (id: number) => void;
}> = ({ task, onToggleComplete, onSetReminder, onDeleteTask }) => {
    const [isEditingReminder, setIsEditingReminder] = useState(false);
    const reminderInputRef = useRef<HTMLInputElement>(null);

    const handleReminderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSetReminder(task.id, e.target.value || null);
        setIsEditingReminder(false);
    };
    
    const handleClearReminder = () => {
        onSetReminder(task.id, null);
    };

    useEffect(() => {
        if (isEditingReminder) {
            reminderInputRef.current?.focus();
        }
    }, [isEditingReminder]);

    return (
        <li className="flex items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg transition-all duration-300">
            <input
                type="checkbox"
                checked={task.isComplete}
                onChange={() => onToggleComplete(task.id)}
                className="w-5 h-5 mr-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600 flex-shrink-0"
            />
            <div className="flex-grow">
                <p className={`text-text-main dark:text-slate-200 ${task.isComplete ? 'line-through text-slate-500' : ''}`}>
                    {task.title}
                </p>
                <div className="flex items-center space-x-2 text-xs text-text-light dark:text-slate-400">
                    {task.dueDate && (
                        <span className={`${task.isComplete ? 'line-through' : ''}`}>
                            Due: {task.dueDate}
                        </span>
                    )}
                    {task.reminder && (
                        <span className="flex items-center text-primary/80">
                            <BellIcon className="w-3 h-3 mr-1" />
                            {new Date(task.reminder).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                        </span>
                    )}
                </div>
            </div>
             <div className="flex items-center space-x-3 ml-4">
                <div className="relative">
                    <button onClick={() => setIsEditingReminder(prev => !prev)} title="Set/Edit Reminder">
                        <BellIcon className={`w-5 h-5 transition-colors ${task.reminder ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} />
                    </button>
                    {isEditingReminder && (
                        <div className="absolute right-0 top-8 z-10 p-2 bg-card dark:bg-slate-700 border dark:border-slate-600 rounded-md shadow-lg flex flex-col space-y-2">
                             <input
                                ref={reminderInputRef}
                                type="datetime-local"
                                defaultValue={task.reminder ? task.reminder.slice(0, 16) : ''}
                                onChange={handleReminderChange}
                                className="p-1 bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md text-sm"
                            />
                            {task.reminder && <button onClick={handleClearReminder} className="text-xs text-red-500 hover:underline">Clear Reminder</button>}
                        </div>
                    )}
                </div>
                <button onClick={() => onDeleteTask(task.id)} title="Delete Task">
                    <TrashIcon className="w-5 h-5 text-slate-400 hover:text-red-500 transition-colors" />
                </button>
            </div>
        </li>
    );
};


export const Tasks: React.FC<TasksProps> = ({ tasks, t, onAddTask, onToggleComplete, onSetReminder, onDeleteTask, onClearCompletedTasks }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');

    const handleAddTaskClick = () => {
        if (!newTaskTitle.trim()) return;
        onAddTask(newTaskTitle, newTaskDueDate);
        setNewTaskTitle('');
        setNewTaskDueDate('');
    };

    const sortedTasks = [...tasks].sort((a, b) => (a.isComplete ? 1 : -1) - (b.isComplete ? 1 : -1) || (a.dueDate && b.dueDate ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : 0));
    const hasCompletedTasks = tasks.some(task => task.isComplete);

    return (
        <Card>
            <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center">
                <ClipboardListIcon className="w-6 h-6 mr-3 text-primary" />
                {t('tasks_title')}
            </h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTaskClick()}
                    placeholder={t('new_task_placeholder')}
                    className="flex-grow p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-main dark:text-slate-200"
                />
                <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-slate-400"
                />
                <button
                    onClick={handleAddTaskClick}
                    className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors"
                >
                    {t('add')}
                </button>
            </div>
            <ul className="space-y-3">
                {sortedTasks.map(task => (
                    <TaskItem 
                        key={task.id} 
                        task={task} 
                        onToggleComplete={onToggleComplete}
                        onSetReminder={onSetReminder}
                        onDeleteTask={onDeleteTask}
                    />
                ))}
                 {sortedTasks.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-4">No tasks yet. Add one above!</p>}
            </ul>
             {/* Fix: Add a button to clear completed tasks. */}
             {hasCompletedTasks && (
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClearCompletedTasks}
                        className="px-4 py-2 text-sm font-medium text-red-600 transition-colors bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900"
                    >
                        {t('clear_completed')}
                    </button>
                </div>
            )}
        </Card>
    );
};