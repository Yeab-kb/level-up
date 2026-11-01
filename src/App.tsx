import React, { useState } from 'react';
import { CoursesManager } from './components/CoursesManager';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TaskManager } from './components/TaskManager';

export function App() {
  const [activeTab, setActiveTab] = useState<'courses' | 'tasks' | 'pomodoro'>('courses');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  const handleQuickAddClick = () => {
    setActiveTab('tasks');
    setShowQuickAddModal(true);
    setTimeout(() => setShowQuickAddModal(false), 3000);
  };

  return (
    <div className="min-h-screen text-gray-100 p-6 relative">
      {/* Live Motion Scenic Background Elements */}
      <div className="scenic-bg">
        <div className="scenic-orb-1"></div>
        <div className="scenic-orb-2"></div>
      </div>

      <header className="max-w-4xl mx-auto mb-8 flex flex-wrap justify-between items-center border-b border-gray-800 pb-4 gap-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-extrabold text-white tracking-wide">Level-Up Dashboard</h1>
          
          <button
            onClick={handleQuickAddClick}
            className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow transition cursor-pointer"
            title="Quick Add Task"
          >
            <span className="text-lg font-bold">+</span>
            <span>Add</span>
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'courses'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'pomodoro'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Pomodoro Timer
          </button>
        </div>
      </header>

      {showQuickAddModal && (
        <div className="max-w-4xl mx-auto mb-4 bg-emerald-950/80 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-lg text-sm font-medium transition">
          💡 Switched to Tasks! Use the form below to add your new assignment or task.
        </div>
      )}

      <main className="max-w-4xl mx-auto">
        {activeTab === 'courses' && <CoursesManager />}
        {activeTab === 'tasks' && <TaskManager />}
        {activeTab === 'pomodoro' && <PomodoroTimer />}
      </main>
    </div>
  );
}

export default App;
