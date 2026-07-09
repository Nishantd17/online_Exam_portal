import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, GraduationCap, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import BlobBackground from '../../components/effects/BlobBackground';
import toast from 'react-hot-toast';

const ParticleBackground = lazy(() => import('../../components/effects/ParticleBackground'));

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const { login, loginWithGoogle } = useAuth();
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
      if (user.role === 'admin' || user.role === 'super_admin') {
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

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      const idToken = response.credential;
      const resData = await loginWithGoogle(idToken);
      
      if (resData.isNewUser) {
        toast.success('Google authenticated! Please complete your registration details.', {
          duration: 4500
        });
        // Redirect to signup page with Google details
        navigate('/signup', { 
          state: { 
            isGoogleSignup: true, 
            googleDetails: {
              email: resData.email,
              fullName: resData.fullName,
              avatar: resData.avatar,
              idToken
            }
          } 
        });
      } else {
        const loggedInUser = resData.user;
        toast.success(`Welcome back, ${loggedInUser.fullName}!`, {
          duration: 3000,
          style: { borderRadius: '12px', background: '#10B981', color: '#FFF' }
        });
        if (loggedInUser.role === 'admin' || loggedInUser.role === 'super_admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Google Sign-In failed. Please try again.', {
        duration: 4000,
        style: { borderRadius: '12px', background: '#EF4444', color: '#FFF' }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1061611532483-0d9dlatgmc35708mc3tei9br64ve047i.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInBtn'),
          { 
            theme: 'filled_blue', 
            size: 'large', 
            width: 320, 
            text: 'continue_with', 
            shape: 'rectangular',
            logo_alignment: 'center'
          }
        );
      }
    };

    if (window.google) {
      initializeGoogleSignIn();
    } else {
      let count = 0;
      const interval = setInterval(() => {
        if (window.google) {
          initializeGoogleSignIn();
          clearInterval(interval);
        }
        count++;
        if (count > 25) {
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#050814] transition-colors duration-300 p-4 md:p-8 relative overflow-hidden">

      {/* Layer 1: Blob Morphing Background */}
      <BlobBackground />

      {/* Layer 2: Neural Particle Network */}
      <Suspense fallback={null}>
        <ParticleBackground />
      </Suspense>

      {/* Layer 3: Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 100 }}
        className="relative z-10 w-full max-w-5xl"
      >
        <div
          className="h-[620px] grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden antigravity-float"
          style={{
            background: 'rgba(5,8,20,0.7)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(0,240,255,0.2)',
            boxShadow: '0 0 60px rgba(0,240,255,0.12), 0 0 120px rgba(139,92,246,0.08), inset 0 0 40px rgba(0,0,0,0.4)',
          }}
        >
          {/* Holographic shimmer overlay */}
          <div className="absolute inset-0 holographic rounded-3xl pointer-events-none z-0 opacity-50" />

          {/* Left Side: Brand Panel */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,255,0.08) 0%, rgba(139,92,246,0.12) 50%, rgba(236,72,153,0.06) 100%)',
              borderRight: '1px solid rgba(0,240,255,0.15)',
            }}
          >
            {/* Corner HUD decorations */}
            <div className="hud-corner hud-corner-tl" style={{ borderColor: 'rgba(0,240,255,0.6)', width: 24, height: 24 }} />
            <div className="hud-corner hud-corner-br" style={{ borderColor: 'rgba(0,240,255,0.6)', width: 24, height: 24 }} />

            {/* Dot grid */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(0,240,255,0.08)_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none" />

            {/* Glowing orbs on brand panel */}
            <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full blur-3xl" style={{ background: 'rgba(0,240,255,0.12)' }} />
            <div className="absolute -bottom-20 -right-10 h-60 w-60 rounded-full blur-3xl" style={{ background: 'rgba(139,92,246,0.12)' }} />

            <Link to="/" className="flex items-center gap-2 relative z-10 self-start">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,240,255,0.15)', border: '1px solid rgba(0,240,255,0.3)', boxShadow: '0 0 15px rgba(0,240,255,0.2)' }}>
                <GraduationCap size={20} style={{ color: '#00f0ff' }} />
              </div>
              <span className="font-bold text-lg tracking-tight neon-cyan">ExamPortal</span>
            </Link>

            <div className="space-y-5 relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                <h2 className="text-3xl font-extrabold leading-tight text-white mb-3">Welcome back.</h2>
                <p className="text-sm text-slate-300/80 leading-relaxed">
                  Secure, intelligent exam management. Proctor. Analyze. Excel.
                </p>
              </motion.div>
              <div className="flex flex-col gap-2">
                {['AI-powered proctoring', 'Real-time analytics', 'Multi-tenant security'].map((feat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-2 text-xs text-slate-300"
                  >
                    <Zap size={11} style={{ color: '#00f0ff' }} />
                    {feat}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="text-[9px] text-slate-500 relative z-10 font-mono tracking-widest">
              ▶ SECURED • JWT • SHA-256 • TLS 1.3
            </div>
          </div>

          {/* Right Side: Form */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0], opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 flex flex-col justify-center px-6 py-10 md:px-16 relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2 mb-8"
            >
              <h1 className="text-2xl font-extrabold text-white">Sign In</h1>
              <p className="text-sm text-slate-400">Enter credentials to unlock your portal.</p>
            </motion.div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
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
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32 }} className="relative">
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
                  className="absolute right-3 top-8.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }} className="flex items-center justify-between text-xs font-semibold">
                <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none">
                  <input type="checkbox" className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Forgot password?
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}>
                <Button type="submit" loading={loading} className="w-full mt-2">
                  Sign In
                </Button>
              </motion.div>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-slate-800/80"></div>
              <span className="text-xs text-slate-500 font-medium">OR</span>
              <div className="h-px flex-1 bg-slate-800/80"></div>
            </div>

            <div className="w-full flex justify-center">
              <div className="group relative w-full max-w-[320px] h-[44px]">
                {/* Custom gorgeous styled button */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center gap-3 rounded-xl font-bold text-sm transition-all duration-300 pointer-events-none bg-slate-950/40 border border-cyan-500/35 text-white group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:bg-slate-950/70 shadow-[inset_0_0_10px_rgba(0,240,255,0.05)]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="tracking-wide text-xs">Continue with Google</span>
                </div>

                {/* Hidden official Google button wrapper */}
                <div 
                  id="googleSignInBtn" 
                  className="absolute inset-0 w-full h-full opacity-[0.01] cursor-pointer"
                ></div>
              </div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="text-cyan-400 font-bold hover:underline inline-flex items-center gap-0.5 group">
                Create account <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
