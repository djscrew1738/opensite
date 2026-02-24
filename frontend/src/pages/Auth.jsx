import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Building2, Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { error: showToastError, success: showToastSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      showToastSuccess('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      showToastError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsSubmitting(true);
    try {
      await login('guest@ctlplumbingllc.com', 'guest');
      showToastSuccess('Logged in as Guest!');
      navigate(from, { replace: true });
    } catch (err) {
      showToastError(err.message || 'Guest login failed. Is the database seeded?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-forge relative overflow-hidden px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-blueprint opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        className="max-w-md w-full relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-blue to-blue-800 mb-6 shadow-[0_0_40px_rgba(59,130,246,0.3)] ring-1 ring-white/10 relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Building2 className="w-10 h-10 text-white relative z-10" />
          </div>
          <h1 className="text-4xl font-display font-black text-white tracking-tight mb-2">
            Job Pulse
          </h1>
          <p className="text-surface-400 font-bold tracking-widest uppercase text-[10px]">
            CTL Plumbing LLC Intelligence
          </p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-surface-elevated/80 backdrop-blur-2xl border border-border-strong rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle top border glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-blue/50 to-transparent" />

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Sign In</h2>
            <p className="text-surface-400 text-sm mt-1">Access your field operations platform</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-surface-300">Email or Username</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-accent-blue transition-colors" />
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-primary/50 border border-border-strong rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all text-base"
                  placeholder="Email or djscrew"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-surface-300">Password</label>
                <button 
                  type="button"
                  onClick={() => showToastError('Please contact your administrator to reset your password.')}
                  className="text-[10px] font-bold text-accent-blue hover:text-blue-400 uppercase tracking-wider transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-accent-blue transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-primary/50 border border-border-strong rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all text-base"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-accent-blue hover:bg-accent-hover disabled:opacity-50 text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 group mt-6 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-strong" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface-elevated text-surface-500 font-semibold uppercase tracking-wider text-[10px]">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-surface-primary hover:bg-surface-card border border-border-strong disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <User className="w-5 h-5 text-surface-400" />
            Login as Guest
          </button>

          <div className="mt-8 text-center">
            <p className="text-sm text-surface-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent-blue hover:text-blue-400 font-semibold transition-colors">
                Register now
              </Link>
            </p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mt-8 text-center">
          <p className="text-[11px] text-surface-500 font-medium tracking-widest uppercase">
            Protected by enterprise-grade security
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const { error: showToastError, success: showToastSuccess } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) return;

    if (password !== confirmPassword) {
      return showToastError('Passwords do not match');
    }

    setIsSubmitting(true);
    try {
      await register({ username, email, password });
      showToastSuccess('Account created successfully!');
      navigate('/');
    } catch (err) {
      showToastError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-forge relative overflow-hidden px-4 py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-blueprint opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        className="max-w-md w-full relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-blue-800 mb-6 shadow-[0_0_40px_rgba(59,130,246,0.3)] ring-1 ring-white/10 relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Building2 className="w-8 h-8 text-white relative z-10" />
          </div>
          <h1 className="text-3xl font-display font-black text-white tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-surface-400 font-medium">
            Join the Job Pulse platform
          </p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-surface-elevated/80 backdrop-blur-2xl border border-border-strong rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle top border glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-blue/50 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-surface-300">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-accent-blue transition-colors" />
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-primary/50 border border-border-strong rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all text-base"
                  placeholder="John Doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-surface-300">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-accent-blue transition-colors" />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-primary/50 border border-border-strong rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all text-base"
                  placeholder="name@ctlplumbing.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-surface-300">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-accent-blue transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-primary/50 border border-border-strong rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all text-base"
                  placeholder="•••••••• (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-surface-300">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-accent-blue transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-primary/50 border border-border-strong rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all text-base"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-accent-blue hover:bg-accent-hover disabled:opacity-50 text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 group mt-8 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-surface-400">
              Already have an account?{' '}
              <Link to="/login" className="text-accent-blue hover:text-blue-400 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
