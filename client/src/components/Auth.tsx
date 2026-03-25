import React, { useState } from 'react';
import { UserProfile, UserRole, MUNICIPALITIES } from '../types';
import { Leaf, Loader2, User, Lock, Mail, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [municipality, setMunicipality] = useState(MUNICIPALITIES[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API delay
    setTimeout(() => {
      if (isLogin) {
        if (email === 'admin' && password === '123') {
          onAuthSuccess({
            uid: 'admin-id',
            email: 'admin@samar.gov',
            displayName: 'System Admin',
            role: 'admin',
            createdAt: new Date().toISOString()
          });
        } else if (email === 'farmer' && password === '123') {
          onAuthSuccess({
            uid: 'farmer-id',
            email: 'farmer@samar.gov',
            displayName: 'Juan Dela Cruz',
            role: 'farmer',
            municipality: 'Catbalogan',
            isApproved: true,
            createdAt: new Date().toISOString()
          });
        } else if (email === 'buyer' && password === '123') {
          onAuthSuccess({
            uid: 'buyer1',
            email: 'buyer@samar.gov',
            displayName: 'Buyer Maria',
            role: 'buyer',
            createdAt: new Date().toISOString()
          });
        } else {
          setError('Invalid credentials. Try admin/123, farmer/123, or buyer/123');
          setLoading(false);
        }
      } else {
        // Registration mock
        onAuthSuccess({
          uid: Math.random().toString(36).substr(2, 9),
          email,
          displayName,
          role,
          municipality: role === 'farmer' ? municipality : undefined,
          isApproved: role === 'farmer' ? false : true,
          createdAt: new Date().toISOString(),
        });
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Side - Branding */}
        <div className="md:w-1/2 bg-emerald-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <Leaf className="w-10 h-10 text-emerald-400" />
              <h1 className="text-3xl font-bold tracking-tight">Samar Farmers</h1>
            </div>
            <h2 className="text-4xl font-light leading-tight mb-6">
              Empowering <span className="text-emerald-400 font-bold italic">Local Agriculture</span> in Samar.
            </h2>
            <p className="text-emerald-200 text-lg">
              Connecting farmers directly to buyers for a sustainable and thriving community.
            </p>
          </div>
          
          <div className="relative z-10 mt-12">
            <div className="flex items-center gap-4 text-emerald-400">
              <div className="w-12 h-1px bg-emerald-400/30"></div>
              <span className="text-sm uppercase tracking-widest font-semibold">Online Marketplace</span>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-600 rounded-full blur-3xl opacity-20"></div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-12">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-stone-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h3>
            <p className="text-stone-500">
              {isLogin ? 'Sign in (admin/123, farmer/123, buyer/123)' : 'Join our community of farmers and buyers'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                  <input
                    required
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-stone-700">Username or Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                <input
                  required
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-stone-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="123"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-stone-700">I am a...</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="farmer">Farmer</option>
                  </select>
                </div>
                {role === 'farmer' && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-stone-700">Municipality</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                      <select
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      >
                        {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              disabled={loading}
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-stone-500 hover:text-emerald-600 font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
