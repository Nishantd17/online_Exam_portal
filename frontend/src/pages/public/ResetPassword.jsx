import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, GraduationCap, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shake, setShake] = useState(false);

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.', {
        duration: 4000,
        style: { borderRadius: '12px', background: '#EF4444', color: '#FFF' }
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.', {
        duration: 4000,
        style: { borderRadius: '12px', background: '#EF4444', color: '#FFF' }
      });
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSubmitted(true);
      toast.success('Password updated successfully!', {
        duration: 5000,
        style: { borderRadius: '12px', background: '#10B981', color: '#FFF' }
      });
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error(err.message || 'Token is invalid or has expired.', {
        duration: 4000,
        style: { borderRadius: '12px', background: '#EF4444', color: '#FFF' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg transition-colors duration-300 p-4 md:p-8">
      <div className="w-full max-w-5xl h-[600px] grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800/50 shadow-2xl bg-white dark:bg-[#0d112b]/60 dark:backdrop-blur-xl dark:shadow-[0_0_50px_rgba(0,240,255,0.15)] antigravity-float">
        {/* Left Side: Brand Panel */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-tr from-brand-blue via-brand-blueDark to-brand-violet dark:from-[#1b1437] dark:via-[#110e30] dark:to-[#2d1b69] border-r dark:border-slate-800/40 flex-col justify-between p-12 text-white relative overflow-hidden">
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
            <h2 className="text-3xl font-extrabold leading-tight">Create New Password.</h2>
            <p className="text-sm text-slate-100/80 leading-relaxed">
              Your password should be strong and unique to guarantee the safety of your student transcripts and records.
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
          {submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5"
            >
              <div className="flex justify-center text-emerald-500 dark:text-emerald-400">
                <CheckCircle size={64} className="animate-bounce" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Password Updated!</h1>
                <p className="text-sm text-slate-500 dark:text-darkMuted max-w-md mx-auto leading-relaxed">
                  Your new credentials are fully active. Redirecting you to the sign-in page shortly...
                </p>
              </div>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft size={16} /> Back to Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Reset Account Password</h1>
                <p className="text-sm text-slate-400 dark:text-darkMuted">Enter your new secure password details below.</p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                <div className="relative">
                  <Input
                    label="New Password"
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

                <div className="relative">
                  <Input
                    label="Confirm New Password"
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock size={16} />}
                    required
                  />
                </div>

                <Button type="submit" loading={loading} className="w-full mt-2">
                  Update Password
                </Button>
              </form>

              <div className="text-center mt-6">
                <Link to="/login" className="text-xs text-brand-blue hover:underline inline-flex items-center gap-1 font-bold">
                  <ArrowLeft size={12} /> Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
