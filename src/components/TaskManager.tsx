import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  course_id?: string;
  task_type: 'Assignment' | 'Exam' | 'Reading' | 'Project' | 'General';
  courses?: Course;
}

export const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [taskType, setTaskType] = useState<Task['task_type']>('Assignment');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, tasksRes] = await Promise.all([
        supabase.from('courses').select('*'),
        supabase.from('tasks').select('*, courses(*)').order('created_at', { ascending: false }),
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (tasksRes.error) throw tasksRes.error;

      if (coursesRes.data) setCourses(coursesRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
    } catch (err: any) {
      console.error('Error fetching task data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user.id,
            title,
            description,
            course_id: selectedCourseId || null,
            task_type: taskType,
            is_completed: false,
          },
        ])
        .select('*, courses(*)')
        .single();

      if (error) throw error;
      if (data) {
        setTasks([data, ...tasks]);
        setTitle('');
        setDescription('');
        setSelectedCourseId('');
        setTaskType('Assignment');
      }
    } catch (err: any) {
      console.error('Error adding task:', err.message);
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !task.is_completed })
        .eq('id', task.id);

      if (error) throw error;
      setTasks(
        tasks.map((t) => (t.id === task.id ? { ...t, is_completed: !t.is_completed } : t))
      );
    } catch (err: any) {
      console.error('Error updating task status:', err.message);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err: any) {
      console.error('Error deleting task:', err.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Tasks & Assignments</h2>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="bg-white p-4 border rounded-lg shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Add New Task</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Task title (e.g., Read Chapter 4)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 border rounded w-full"
            required
          />
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="p-2 border rounded w-full"
          >
            <option value="">-- Select Course (Optional) --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as Task['task_type'])}
            className="p-2 border rounded w-full"
          >
            <option value="Assignment">Assignment</option>
            <option value="Exam">Exam Prep</option>
            <option value="Reading">Reading</option>
            <option value="Project">Project</option>
            <option value="General">General</option>
          </select>
          <input
            type="text"
            placeholder="Description / Notes (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 border rounded w-full"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
        >
          Add Task
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Todo List</h3>
        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500">No tasks added yet!</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 border rounded-lg shadow-sm flex justify-between items-center bg-white transition ${
                  task.is_completed ? 'opacity-60 bg-gray-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={() => toggleTaskComplete(task)}
                    className="h-5 w-5 text-blue-600 rounded cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`font-semibold text-lg ${
                          task.is_completed ? 'line-through text-gray-500' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.courses && (
                        <span
                          className="text-xs px-2 py-0.5 rounded font-medium text-white"
                          style={{ backgroundColor: task.courses.color }}
                        >
                          {task.courses.code}
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                        {task.task_type}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-0.5">{task.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
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
