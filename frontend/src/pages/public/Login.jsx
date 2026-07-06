import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, GraduationCap, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.fullName}!`, {
        duration: 3000,
        style: { borderRadius: '12px', background: '#10B981', color: '#FFF' }
      });
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error(err.message || 'Login failed. Please verify credentials.', {
        duration: 4000,
        style: { borderRadius: '12px', background: '#EF4444', color: '#FFF' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg transition-colors duration-300 p-4 md:p-8">
      {/* Central Login Card Split */}
      <div className="w-full max-w-5xl h-[600px] grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-2xl bg-white dark:bg-darkSurface">
        {/* Left Side: Brand Panel */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-tr from-brand-blue via-brand-blueDark to-brand-violet flex-col justify-between p-12 text-white relative overflow-hidden">
          {/* Geometric floating vector overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0c_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />

          <Link to="/" className="flex items-center gap-2 relative z-10 self-start">
            <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
            <span className="font-bold text-lg tracking-tight">ExamPortal</span>
          </Link>

          <div className="space-y-4 relative z-10">
            <h2 className="text-3xl font-extrabold leading-tight">Welcome back.</h2>
            <p className="text-sm text-slate-100/80 leading-relaxed">
              Integrate. Proctor. Analyze. Secure exams optimized for web runtime sandboxes.
            </p>
          </div>

          <div className="text-[10px] text-slate-200/50 relative z-10 font-mono">
            SECURED END-TO-END VIA JWT & SHA-256
          </div>
        </div>

        {/* Right Side: Form */}
        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="lg:col-span-7 flex flex-col justify-center px-6 py-10 md:px-16"
        >
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Sign In</h1>
            <p className="text-sm text-slate-400 dark:text-darkMuted">Enter credentials to unlock dashboard portals.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <Input
              label="Email Address"
              id="email"
              type="email"
              placeholder="e.g. name@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={16} />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-8.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <label className="flex items-center gap-2 text-slate-500 dark:text-darkMuted cursor-pointer select-none">
                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-800 text-brand-blue focus:ring-brand-blue" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-brand-blue hover:text-brand-blueDark transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign In
            </Button>
          </form>

          {/* Registration link */}
          <div className="mt-8 text-center text-xs text-slate-400 dark:text-darkMuted">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-blue font-bold hover:underline inline-flex items-center gap-0.5 group">
              Create account <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
