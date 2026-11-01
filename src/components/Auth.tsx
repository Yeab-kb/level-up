import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Show / Hide password toggle states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isResetMode) {
        // Step A: Send reset email OR update to the new password
        if (newPassword) {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          setMessage({ text: 'Password successfully updated! You can now log in.', type: 'success' });
          setIsResetMode(false);
          setNewPassword('');
        } else {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          if (error) throw error;
          setMessage({ text: 'Reset email sent! Please check your inbox and enter your new password below.', type: 'success' });
        }
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ text: 'Sign up successful! Please check your email to verify.', type: 'success' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'An error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-900/90 border border-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full space-y-6 backdrop-blur-md">
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-extrabold text-white">Level-Up</h2>
          <p className="text-sm text-gray-400">
            {isResetMode ? 'Set New Password' : isSignUp ? 'Create your account' : 'Welcome back, sign in to continue'}
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm font-medium ${
              message.type === 'error'
                ? 'bg-red-950/80 border border-red-800 text-red-200'
                : 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuthAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Normal Login / Signup Password Field with Eye Toggle */}
          {!isResetMode && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full p-2.5 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-gray-400 hover:text-white"
                >
                  {showPassword ? 'HIDE 👁️' : 'SHOW 👁️‍🗨️'}
                </button>
              </div>
            </div>
          )}

          {/* Password Reset Field: Allows user to type their new password directly */}
          {isResetMode && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full p-2.5 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-gray-400 hover:text-white"
                >
                  {showNewPassword ? 'HIDE 👁️' : 'SHOW 👁️‍🗨️'}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : isResetMode
              ? newPassword
                ? 'Save New Password'
                : 'Send Reset Email'
              : isSignUp
              ? 'Sign Up'
              : 'Sign In'}
          </button>
        </form>

        <div className="flex flex-col space-y-2 text-sm text-center text-gray-400">
          {!isResetMode ? (
            <>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="hover:text-blue-400 transition"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
              <button
                type="button"
                onClick={() => setIsResetMode(true)}
                className="hover:text-blue-400 transition text-xs text-gray-500"
              >
                Forgot your password? Reset it here
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setNewPassword('');
              }}
              className="hover:text-blue-400 transition text-blue-400 font-medium"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
