import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Briefcase, GraduationCap, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);


  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // student, admin
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // Password strength states
  const [strength, setStrength] = useState(0); // 0 to 4
  const [reqs, setReqs] = useState({ length: false, number: false, upper: false, special: false });

  // OTP Verification states
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const otpRefs = useRef([]);

  const { signup, login, sendOtp, verifyOtp, signupWithGoogle, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Google Signup states
  const [googleIdToken, setGoogleIdToken] = useState('');
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);

  // Watch for state passed from Login page (when a Google user is new)
  useEffect(() => {
    if (location.state?.isGoogleSignup && location.state?.googleDetails) {
      const { email, fullName, idToken } = location.state.googleDetails;
      setEmail(email);
      setFullName(fullName);
      setGoogleIdToken(idToken);
      setIsGoogleSignup(true);
      setStep(2); // Skip Step 1 (account credentials/password) since Google verified them
    }
  }, [location.state]);

  // Watch password field to check security strength rules
  useEffect(() => {
    const checks = {
      length: password.length >= 8,
      number: /[0-9]/.test(password),
      upper: /[A-Z]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    setReqs(checks);

    const score = Object.values(checks).filter(Boolean).length;
    setStrength(score);
  }, [password]);

  // Countdown timer for OTP
  useEffect(() => {
    if (step === 3 && timer > 0) {
      const countdown = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [step, timer]);

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      const idToken = response.credential;
      const resData = await loginWithGoogle(idToken);
      
      if (resData.isNewUser) {
        toast.success('Google authenticated! Please select your role and details.', {
          duration: 4500
        });
        setEmail(resData.email);
        setFullName(resData.fullName);
        setGoogleIdToken(idToken);
        setIsGoogleSignup(true);
        setStep(2);
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
    const initializeGoogleSignUp = () => {
      if (window.google && step === 1) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1061611532483-0d9dlatgmc35708mc3tei9br64ve047i.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse
        });
        const btnElement = document.getElementById('googleSignUpBtn');
        if (btnElement) {
          window.google.accounts.id.renderButton(
            btnElement,
            { 
              theme: 'filled_blue', 
              size: 'large', 
              width: 320, 
              text: 'signup_with', 
              shape: 'rectangular',
              logo_alignment: 'center'
            }
          );
        }
      }
    };

    if (window.google) {
      initializeGoogleSignUp();
    } else {
      let count = 0;
      const interval = setInterval(() => {
        if (window.google) {
          initializeGoogleSignUp();
          clearInterval(interval);
        }
        count++;
        if (count > 25) {
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [step]);


  const handleNextStep = async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!fullName || !email || password.length < 8) {
        return toast.error('Please fulfill Account details and a secure password.');
      }
      setStep(2);
    } else if (step === 2) {
      if (role === 'admin' && !organization) {
        return toast.error('Please enter your Institution/Organization name.');
      }
      if (role === 'student' && !joinCode) {
        return toast.error('Please enter your Organization Join Code.');
      }

      if (isGoogleSignup) {
        setLoading(true);
        try {
          const user = await signupWithGoogle({
            idToken: googleIdToken,
            role,
            organization,
            joinCode,
            phone
          });
          toast.success(`Welcome to ExamPortal, ${user.fullName}!`, {
            duration: 4000,
            style: { borderRadius: '12px', background: '#10B981', color: '#FFF' }
          });
          if (user.role === 'admin' || user.role === 'super_admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/student/dashboard');
          }
        } catch (err) {
          toast.error(err.message || 'Google registration failed. Please try again.', {
            duration: 4000,
            style: { borderRadius: '12px', background: '#EF4444', color: '#FFF' }
          });
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        await sendOtp(email);
        setStep(3);
        setTimer(60);
        toast.success('A 6-digit OTP verification code was sent to your email.');
      } catch (err) {
        toast.error(err.message || 'Failed to send verification code. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOtpChange = (value, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input box
    if (value && idx < 5) {
      otpRefs.current[idx + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    // Backspace: focus previous
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1].focus();
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      return toast.error('Please enter the complete 6-digit verification code.');
    }

    setLoading(true);
    try {
      // First verify OTP
      await verifyOtp(email, enteredOtp);

      // Signup operation
      await signup({ fullName, email, password, role, organization, phone, joinCode });
      
      // Auto login
      await login(email, password);

      toast.success('Account created and verified successfully!', {
        duration: 4000
      });
      
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please check inputs.');
      // If it's a verification code error, keep the user on step 3 but clear the OTP fields
      if (err.message && (err.message.toLowerCase().includes('otp') || err.message.toLowerCase().includes('verification') || err.message.toLowerCase().includes('code'))) {
        setOtp(['', '', '', '', '', '']);
        if (otpRefs.current[0]) {
          otpRefs.current[0].focus();
        }
      } else {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStrengthLabel = () => {
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-brand-red', 'bg-brand-amber', 'bg-brand-blue', 'bg-brand-emerald'];
    return {
      text: labels[strength - 1] || 'Too Weak',
      color: colors[strength - 1] || 'bg-slate-200'
    };
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg transition-colors duration-300 p-4 md:p-8">
      <div className="w-full max-w-xl bg-white dark:bg-darkSurface border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden relative">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-1">
            <Link to="/" className="text-slate-800 dark:text-darkText font-bold text-sm tracking-tight flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-brand-blue flex items-center justify-center text-white"><GraduationCap size={12} /></div>
              ExamPortal
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-brand-blue' : 'w-2.5 bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Elements wrapper */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              onSubmit={handleNextStep}
              className="space-y-4"
            >
              <div className="space-y-2 mb-6">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Create Account</h2>
                <p className="text-xs text-slate-450 dark:text-darkMuted">Step 1: Configure basic login parameters</p>
              </div>

              <Input
                label="Full Name"
                id="fullName"
                placeholder="e.g. Dr. Arthur Pendelton"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User size={16} />}
                required
              />

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

              <Input
                label="Create Password"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={16} />}
                required
              />

              {/* Password strength visualizer */}
              {password && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400 dark:text-darkMuted">Password Strength</span>
                    <span className="text-slate-800 dark:text-darkText">{getStrengthLabel().text}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex gap-1 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          idx < strength ? getStrengthLabel().color : 'bg-slate-200 dark:bg-slate-800/80'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-450 dark:text-darkMuted">
                    <span className={reqs.length ? 'text-brand-emerald font-bold' : ''}>✓ Min 8 characters</span>
                    <span className={reqs.number ? 'text-brand-emerald font-bold' : ''}>✓ Contains digit</span>
                    <span className={reqs.upper ? 'text-brand-emerald font-bold' : ''}>✓ Uppercase letter</span>
                    <span className={reqs.special ? 'text-brand-emerald font-bold' : ''}>✓ Special symbol</span>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full mt-6">
                Next: Profile Details <ArrowRight size={14} className="ml-1" />
              </Button>

              <div className="flex items-center gap-3 my-4">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                <span className="text-xs text-slate-450 dark:text-darkMuted font-medium">OR</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
              </div>

              <div className="w-full flex justify-center">
                <div className="group relative w-full max-w-[320px] h-[44px]">
                  {/* Custom gorgeous styled button */}
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center gap-3 rounded-xl font-bold text-sm transition-all duration-300 pointer-events-none bg-white border border-slate-200 text-slate-800 dark:bg-slate-950/40 dark:border-slate-800 dark:text-white group-hover:border-brand-blue group-hover:bg-slate-50 dark:group-hover:border-brand-blue dark:group-hover:bg-slate-950/70 shadow-sm dark:shadow-[inset_0_0_10px_rgba(0,240,255,0.02)]">
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
                    <span className="tracking-wide text-xs">Sign up with Google</span>
                  </div>

                  {/* Hidden official Google button wrapper */}
                  <div 
                    id="googleSignUpBtn" 
                    className="absolute inset-0 w-full h-full opacity-[0.01] cursor-pointer"
                  ></div>
                </div>
              </div>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              onSubmit={handleNextStep}
              className="space-y-5"
            >
              <div className="space-y-2 mb-4">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Profile Details</h2>
                <p className="text-xs text-slate-450 dark:text-darkMuted">Step 2: Choose role privileges and organizations</p>
              </div>

              {/* Role selection visual card grid */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Choose Portal Privilege</span>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setRole('student')}
                    className={`border p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      role === 'student'
                        ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 dark:border-brand-blueLight'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                      🎓
                    </div>
                    <span className="text-xs font-bold text-slate-850 dark:text-darkText text-center leading-tight">Student Portal</span>
                  </div>
                  <div
                    onClick={() => setRole('admin')}
                    className={`border p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      role === 'admin'
                        ? 'border-brand-violet bg-brand-violet/5 dark:bg-brand-violet/10 dark:border-brand-violet'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-violet/10 flex items-center justify-center text-brand-violet">
                      🛡️
                    </div>
                    <span className="text-xs font-bold text-slate-850 dark:text-darkText text-center leading-tight">Administrator</span>
                  </div>
                </div>
              </div>

              {role === 'admin' ? (
                <Input
                  label="Institution / Organization Name"
                  id="organization"
                  placeholder="e.g. Stanford University"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  icon={<Briefcase size={16} />}
                  required
                />
              ) : (
                <Input
                  label="Organization Join Code"
                  id="joinCode"
                  placeholder="e.g. ABC483XZ"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  icon={<Lock size={16} />}
                  required
                />
              )}

              <Input
                label="Phone Number (Optional)"
                id="phone"
                placeholder="e.g. +1 (555) 019-2834"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone size={16} />}
              />

              <div className="flex gap-4 pt-4">
                <Button variant="outline" type="button" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft size={14} className="mr-1" /> Back
                </Button>
                <Button type="submit" className="flex-1">
                  {isGoogleSignup ? 'Complete Registration' : 'Verify Email'} <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form
              key="step3"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              onSubmit={handleSignupSubmit}
              className="space-y-6"
            >
              <div className="space-y-3 mb-4 text-center">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Verify Your Email</h2>
                <p className="text-xs text-slate-450 dark:text-darkMuted leading-relaxed max-w-sm mx-auto">
                  We've sent a 6-digit code to <strong>{email}</strong>. Enter the digits below.
                </p>
              </div>

              {/* Multi OTP Input fields */}
              <div className="flex items-center justify-center gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="h-12 w-12 rounded-xl border border-slate-200 bg-white text-center text-lg font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue dark:bg-darkSurface dark:text-darkText dark:border-slate-800"
                  />
                ))}
              </div>

              <div className="text-center text-xs">
                {timer > 0 ? (
                  <span className="text-slate-450 dark:text-darkMuted">Resend code in {timer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await sendOtp(email);
                        setTimer(60);
                        toast.success('Verification code resent.');
                      } catch (err) {
                        toast.error(err.message || 'Failed to resend code. Please try again.');
                      }
                    }}
                    className="text-brand-blue font-bold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" type="button" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft size={14} className="mr-1" /> Back
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Verify & Register
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center text-xs text-slate-400 dark:text-darkMuted border-t border-slate-100 dark:border-slate-800/80 pt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-blue font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
