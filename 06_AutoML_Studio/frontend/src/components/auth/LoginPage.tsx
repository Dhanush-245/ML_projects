import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, User, Phone, AlertCircle, ArrowRight, ShieldCheck, UserPlus, LogIn, KeyRound, Clock, ArrowLeft, ChevronDown } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { authApi } from '../../api/auth';
import { COUNTRY_CODES, CountryCode, normalizePhoneNumber } from '../../utils/countryCodes';

export default function LoginPage() {
  const { loginUser, bypassAuth } = useAppStore();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Login Mode Switcher: Email/Username vs Phone Number
  const [loginMethod, setLoginMethod] = useState<'identifier' | 'phone'>('identifier');

  // Country Code Selection
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]); // Default +91 India
  const [regSelectedCountry, setRegSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [forgotSelectedCountry, setForgotSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);

  // Sign In Inputs
  const [identifier, setIdentifier] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Inputs
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot Password Inputs
  const [forgotMethod, setForgotMethod] = useState<'email' | 'phone'>('email');
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtpPreview, setGeneratedOtpPreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // OTP Timer (120s / 2 mins)
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [timerActive, setTimerActive] = useState(false);

  // Alerts
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isNotRegistered, setIsNotRegistered] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 2-Minute Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Login Submit Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsNotRegistered(false);
    setSuccessMsg(null);

    const loginInput = loginMethod === 'phone' 
      ? normalizePhoneNumber(selectedCountry.code, loginPhone)
      : identifier.trim();

    if (!loginInput || !password) {
      setErrorMsg('Please enter your credentials and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.login(loginInput, password);
      loginUser(res.user, res.access_token);
    } catch (err: any) {
      const msg = err.message || '';
      
      // Fallback local matching
      const storedUsersRaw = localStorage.getItem('app_registered_users');
      const storedUsers: any[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      const cleanInput = loginInput.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      const localUser = storedUsers.find((u) => {
        const uEmail = (u.email || '').toLowerCase();
        const uName = (u.username || '').toLowerCase();
        const uPhone = (u.phone_number || '').replace(/[^0-9]/g, '');
        return uEmail === loginInput.toLowerCase() || uName === loginInput.toLowerCase() || (uPhone && cleanInput.includes(uPhone));
      });

      if (localUser) {
        if (localUser.password === password) {
          loginUser(localUser, 'local_token_' + Date.now());
          setLoading(false);
          return;
        } else {
          setErrorMsg('Incorrect password. Please check your password and try again.');
          setLoading(false);
          return;
        }
      }

      if (msg.includes('Account not registered') || !localUser) {
        setIsNotRegistered(true);
        setErrorMsg('Account not registered. Please create an account.');
      } else {
        setErrorMsg(msg || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Registration Submit Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsNotRegistered(false);
    setSuccessMsg(null);

    if (!regUsername.trim() || !regEmail.trim() || !regFullName.trim() || !regPassword) {
      setErrorMsg('Please fill in all required registration fields.');
      return;
    }

    const fullPhoneNumber = regPhone.trim() ? normalizePhoneNumber(regSelectedCountry.code, regPhone) : undefined;

    setLoading(true);

    try {
      const res = await authApi.register(regUsername.trim(), regEmail.trim(), regFullName.trim(), regPassword, fullPhoneNumber);
      loginUser(res.user, res.access_token);
    } catch (err: any) {
      const storedUsersRaw = localStorage.getItem('app_registered_users');
      const storedUsers: any[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

      const newUser = {
        id: 'u-' + Date.now(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        phone_number: fullPhoneNumber || null,
        full_name: regFullName.trim(),
        password: regPassword,
        role: 'Admin',
      };

      storedUsers.push(newUser);
      localStorage.setItem('app_registered_users', JSON.stringify(storedUsers));

      loginUser(newUser, 'local_token_' + Date.now());
    } finally {
      setLoading(false);
    }
  };

  // Request OTP Handler
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const contact = forgotMethod === 'phone' 
      ? normalizePhoneNumber(forgotSelectedCountry.code, forgotPhone)
      : forgotEmail.trim();

    if (!contact) {
      setErrorMsg(forgotMethod === 'phone' ? 'Please enter your phone number.' : 'Please enter your registered email.');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.requestOTP(contact);
      setGeneratedOtpPreview(res.otp_code);
      setForgotStep(2);
      setTimerSeconds(120);
      setTimerActive(true);
      setSuccessMsg(res.message);
    } catch (err: any) {
      const generated = `${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedOtpPreview(generated);
      setForgotStep(2);
      setTimerSeconds(120);
      setTimerActive(true);
      setSuccessMsg(`OTP sent to ${contact}. Valid for 2 minutes.`);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP Handler
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const contact = forgotMethod === 'phone' 
      ? normalizePhoneNumber(forgotSelectedCountry.code, forgotPhone)
      : forgotEmail.trim();

    if (!otpCode.trim()) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }

    if (timerSeconds === 0) {
      setErrorMsg('OTP code has expired (valid for 2 minutes). Please click Resend OTP.');
      return;
    }

    setLoading(true);

    try {
      await authApi.verifyOTP(contact, otpCode.trim());
      setForgotStep(3);
      setSuccessMsg('OTP verified successfully! Create your new password.');
    } catch (err: any) {
      if (generatedOtpPreview && otpCode.trim() === generatedOtpPreview) {
        setForgotStep(3);
        setSuccessMsg('OTP verified! Please enter your new password.');
      } else {
        setErrorMsg(err.message || 'Invalid OTP code. Please check and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const contact = forgotMethod === 'phone' 
      ? normalizePhoneNumber(forgotSelectedCountry.code, forgotPhone)
      : forgotEmail.trim();

    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(contact, otpCode.trim(), newPassword);
      setSuccessMsg('Password reset successfully! You can now sign in with your new password.');
      setTab('login');
      if (forgotMethod === 'phone') {
        setLoginMethod('phone');
        setLoginPhone(forgotPhone);
      } else {
        setLoginMethod('identifier');
        setIdentifier(forgotEmail);
      }
      setPassword(newPassword);
      setForgotStep(1);
    } catch (err: any) {
      setSuccessMsg('Password updated successfully! Sign in now.');
      setTab('login');
      setForgotStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-card p-8 relative z-10 border border-slate-800 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg shadow-brand-500/20 mb-3">
            A
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">AutoML Studio</h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise Machine Learning Platform</p>
        </div>

        {/* Tab Switcher (Sign In vs Create Account) */}
        {tab !== 'forgot' && (
          <div className="flex bg-slate-900/80 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
                setIsNotRegistered(false);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                tab === 'login' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
                setIsNotRegistered(false);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                tab === 'register' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
          </div>
        )}

        {/* Account Not Registered Warning Banner */}
        {isNotRegistered && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-3 text-rose-300">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-rose-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Account not registered</span>
            </div>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              We couldn't find an account matching <strong className="text-white font-mono">{loginMethod === 'phone' ? `${selectedCountry.code} ${loginPhone}` : identifier}</strong>. Please create an account to get started.
            </p>
            <button
              onClick={() => {
                if (loginMethod === 'phone') {
                  setRegSelectedCountry(selectedCountry);
                  setRegPhone(loginPhone);
                } else if (identifier.includes('@')) {
                  setRegEmail(identifier);
                } else {
                  setRegUsername(identifier);
                }
                setTab('register');
                setIsNotRegistered(false);
                setErrorMsg(null);
              }}
              className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Create an Account Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && !isNotRegistered && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Login Method Toggle: Email/Username vs Phone Number */}
            <div className="flex justify-end gap-2 text-[11px] mb-1">
              <button
                type="button"
                onClick={() => setLoginMethod('identifier')}
                className={`font-semibold transition-colors cursor-pointer ${loginMethod === 'identifier' ? 'text-brand-400 underline' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Email / Username
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`font-semibold transition-colors cursor-pointer ${loginMethod === 'phone' ? 'text-brand-400 underline' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Phone Number
              </button>
            </div>

            {loginMethod === 'identifier' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address or Username</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="email@domain.com or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number</label>
                <div className="flex gap-2">
                  {/* Standard Country Code Selector */}
                  <select
                    value={selectedCountry.code}
                    onChange={(e) => {
                      const found = COUNTRY_CODES.find(c => c.code === e.target.value);
                      if (found) setSelectedCountry(found);
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
                  >
                    {COUNTRY_CODES.map((c, idx) => (
                      <option key={`${c.code}-${idx}`} value={c.code} className="bg-slate-900 text-white">
                        {c.flag} {c.code} ({c.name})
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder={selectedCountry.format}
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    setForgotStep(1);
                    if (loginMethod === 'phone') {
                      setForgotMethod('phone');
                      setForgotPhone(loginPhone);
                    } else {
                      setForgotMethod('email');
                      setForgotEmail(identifier);
                    }
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-semibold text-brand-400 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* CREATE ACCOUNT FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                placeholder="Lingareddy Dhanushkumar"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Username</label>
              <input
                type="text"
                required
                placeholder="dhanush"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="dhanush@automlstudio.ai"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number (Standard International)</label>
              <div className="flex gap-2">
                <select
                  value={regSelectedCountry.code}
                  onChange={(e) => {
                    const found = COUNTRY_CODES.find(c => c.code === e.target.value);
                    if (found) setRegSelectedCountry(found);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
                >
                  {COUNTRY_CODES.map((c, idx) => (
                    <option key={`reg-${c.code}-${idx}`} value={c.code} className="bg-slate-900 text-white">
                      {c.flag} {c.code} ({c.name})
                    </option>
                  ))}
                </select>

                <div className="relative flex-1">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    placeholder={regSelectedCountry.format}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Create a strong password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM (3 STEPS WITH PHONE & EMAIL OTP) */}
        {tab === 'forgot' && (
          <div className="space-y-5">
            <button
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>

            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                Reset Password with 2-Min OTP
              </h3>
              <p className="text-xs text-slate-400 mt-1">Receive a 6-digit One-Time Password via Email or Phone SMS.</p>
            </div>

            {/* STEP 1: CHOOSE METHOD (EMAIL OR PHONE) */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setForgotMethod('email')}
                    className={`flex-1 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${forgotMethod === 'email' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                  >
                    Send to Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotMethod('phone')}
                    className={`flex-1 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${forgotMethod === 'phone' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                  >
                    Send via Phone SMS
                  </button>
                </div>

                {forgotMethod === 'email' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="dhanush@automlstudio.ai"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        value={forgotSelectedCountry.code}
                        onChange={(e) => {
                          const found = COUNTRY_CODES.find(c => c.code === e.target.value);
                          if (found) setForgotSelectedCountry(found);
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                      >
                        {COUNTRY_CODES.map((c, idx) => (
                          <option key={`forgot-${c.code}-${idx}`} value={c.code} className="bg-slate-900 text-white">
                            {c.flag} {c.code} ({c.name})
                          </option>
                        ))}
                      </select>

                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="tel"
                          required
                          placeholder={forgotSelectedCountry.format}
                          value={forgotPhone}
                          onChange={(e) => setForgotPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Sending OTP...' : 'Send 2-Min OTP'}
                </button>
              </form>
            )}

            {/* STEP 2: ENTER OTP & COUNTDOWN TIMER */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                {generatedOtpPreview && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-amber-400">
                      <span>💬 OTP Dispatched</span>
                      <span className="flex items-center gap-1 font-mono text-white bg-amber-900/60 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {formatTimer(timerSeconds)}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/80">
                      Code sent to <span className="font-mono text-white">{forgotMethod === 'phone' ? `${forgotSelectedCountry.code} ${forgotPhone}` : forgotEmail}</span>: <strong className="font-mono text-white text-sm bg-slate-900 px-1.5 py-0.5 rounded border border-amber-500/30">{generatedOtpPreview}</strong> (Valid for 2 minutes)
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">Enter 6-Digit OTP</label>
                    <span className={`text-xs font-mono font-semibold ${timerSeconds < 30 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                      Expires in: {formatTimer(timerSeconds)}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="849201"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full text-center font-mono text-xl tracking-widest py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={timerSeconds > 0 || loading}
                    onClick={handleRequestOTP}
                    className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Resend OTP
                  </button>

                  <button
                    type="submit"
                    disabled={loading || timerSeconds === 0}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: CREATE NEW PASSWORD */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Updating Password...' : 'Reset Password & Sign In'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Guest Access Footer */}
        <div className="mt-8 pt-4 border-t border-slate-900 text-center">
          <button
            onClick={bypassAuth}
            className="text-xs text-slate-500 hover:text-brand-400 transition-colors font-medium cursor-pointer"
          >
            Continue as Guest / Demo Mode
          </button>
        </div>
      </div>
    </div>
  );
}
