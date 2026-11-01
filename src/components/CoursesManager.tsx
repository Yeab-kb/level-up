import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Course {
  id: string;
  name: string;
  code: string;
  instructor?: string;
  schedule_summary?: string;
  color: string;
}

export const CoursesManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [scheduleSummary, setScheduleSummary] = useState('');
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setCourses(data);
    } catch (err: any) {
      console.error('Error fetching courses:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');

      const { data, error } = await supabase
        .from('courses')
        .insert([
          {
            user_id: user.id,
            name,
            code,
            instructor,
            schedule_summary: scheduleSummary,
            color,
          },
        ])
        .select();

      if (error) throw error;
      if (data) {
        setCourses([data[0], ...courses]);
        setName('');
        setCode('');
        setInstructor('');
        setScheduleSummary('');
        setColor('#3b82f6');
      }
    } catch (err: any) {
      console.error('Error adding course:', err.message);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
      setCourses(courses.filter((course) => course.id !== id));
    } catch (err: any) {
      console.error('Error deleting course:', err.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Course Management</h2>

      <form onSubmit={handleAddCourse} className="bg-white p-4 border rounded-lg shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Add New Course</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Course Name (e.g., Computer Networks)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 border rounded w-full"
            required
          />
          <input
            type="text"
            placeholder="Course Code (e.g., CS101)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="p-2 border rounded w-full"
            required
          />
          <input
            type="text"
            placeholder="Instructor (Optional)"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            type="text"
            placeholder="Schedule (e.g., Mon/Wed 10:00 AM)"
            value={scheduleSummary}
            onChange={(e) => setScheduleSummary(e.target.value)}
            className="p-2 border rounded w-full"
          />
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Badge Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-14 cursor-pointer border rounded"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Save Course
        </button>
      </form>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Courses</h3>
        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="text-gray-500">No courses added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-4 border rounded-lg shadow-sm flex justify-between items-start bg-white"
                style={{ borderLeft: `6px solid ${course.color}` }}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg">{course.code}</span>
                    <span className="text-gray-600 font-medium">{course.name}</span>
                  </div>
                  {course.instructor && (
                    <p className="text-sm text-gray-500">Instructor: {course.instructor}</p>
                  )}
                  {course.schedule_summary && (
                    <p className="text-sm text-gray-500">Schedule: {course.schedule_summary}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteCourse(course.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
