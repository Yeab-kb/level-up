import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Course {
  id: string;
  name: string;
  code: string;
}

export const PomodoroTimer: React.FC = () => {
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [sessionSavedMsg, setSessionSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Update seconds left whenever user changes target duration while timer is paused
  useEffect(() => {
    if (!isActive) {
      setSecondsLeft((mode === 'study' ? targetMinutes : breakMinutes) * 60);
    }
  }, [targetMinutes, breakMinutes, mode]);

  // Main countdown tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (interval) clearInterval(interval);
            handleFinishSession(mode === 'study' ? targetMinutes : 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, mode, targetMinutes]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase.from('courses').select('id, name, code');
      if (error) throw error;
      if (data) setCourses(data);
    } catch (err: any) {
      console.error('Error fetching courses:', err.message);
    }
  };

  // Helper to log actual elapsed minutes into Supabase
  const logSessionToDatabase = async (actualMinutes: number) => {
    if (actualMinutes <= 0) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('study_sessions').insert([
        {
          user_id: user.id,
          course_id: selectedCourseId || null,
          duration_minutes: actualMinutes,
        },
      ]);

      if (error) throw error;
      setSessionSavedMsg(`🎉 Logged ${actualMinutes} minute(s) of focus to Supabase!`);
      setTimeout(() => setSessionSavedMsg(null), 4000);
    } catch (err: any) {
      console.error('Error saving study session:', err.message);
    }
  };

  const handleFinishSession = (completedMinutes: number) => {
    if (mode === 'study' && completedMinutes > 0) {
      logSessionToDatabase(completedMinutes);
    }
  };

  const handleStopAndSaveEarly = () => {
    if (mode === 'study') {
      const totalSecondsPlanned = targetMinutes * 60;
      const secondsElapsed = totalSecondsPlanned - secondsLeft;
      const actualMinutes = Math.floor(secondsElapsed / 60);

      setIsActive(false);
      if (actualMinutes > 0) {
        logSessionToDatabase(actualMinutes);
      } else {
        setSessionSavedMsg('⚠️ Session stopped early (under 1 minute, not logged).');
        setTimeout(() => setSessionSavedMsg(null), 3000);
      }
    }
    resetTimer();
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft((mode === 'study' ? targetMinutes : breakMinutes) * 60);
  };

  const switchMode = (newMode: 'study' | 'break') => {
    setIsActive(false);
    setMode(newMode);
    setSecondsLeft((newMode === 'study' ? targetMinutes : breakMinutes) * 60);
  };

  const displayMinutes = Math.floor(secondsLeft / 60);
  const displaySeconds = secondsLeft % 60;

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-6 text-center border">
      <div className="flex justify-center space-x-2 border-b pb-3">
        <button
          onClick={() => switchMode('study')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
            mode === 'study' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Study Session
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
            mode === 'break' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Break
        </button>
      </div>

      {/* Adjust Custom Durations */}
      {!isActive && (
        <div className="grid grid-cols-2 gap-3 text-left text-xs text-gray-600">
          <div>
            <label className="block font-medium mb-1">Study Duration (min):</label>
            <input
              type="number"
              min="1"
              max="180"
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(Number(e.target.value) || 1)}
              className="w-full p-1.5 border rounded"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Break Duration (min):</label>
            <input
              type="number"
              min="1"
              max="60"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value) || 1)}
              className="w-full p-1.5 border rounded"
            />
          </div>
        </div>
      )}

      {/* Course Selector */}
      {mode === 'study' && (
        <div className="text-left">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link Session to Course:
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">-- General Study --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Timer Display */}
      <div className="text-6xl font-extrabold text-gray-800 tracking-wider font-mono">
        {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
      </div>

      {/* Timer Control Buttons */}
      <div className="flex justify-center space-x-3">
        <button
          onClick={toggleTimer}
          className={`px-5 py-2 text-white font-semibold rounded-lg transition ${
            isActive
              ? 'bg-amber-500 hover:bg-amber-600'
              : mode === 'study'
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        
        {isActive && mode === 'study' && (
          <button
            onClick={handleStopAndSaveEarly}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition text-sm"
          >
            Log & Finish Early
          </button>
        )}

        <button
          onClick={resetTimer}
          className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
        >
          Reset
        </button>
      </div>

      {sessionSavedMsg && (
        <p className="text-green-600 text-sm font-medium animate-fade-in">
          {sessionSavedMsg}
        </p>
      )}
    </div>
  );
};
