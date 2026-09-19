import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(''); // only present when the server has EXPOSE_DEV_OTP=true
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const fullPhone = `+91${phoneNumber}`;

  const postJson = async (path, body) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  };

  const handleGetOTP = async (e) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    setIsSubmitting(true);
    try {
      const { ok, data } = await postJson('/api/auth/login', { phone: fullPhone });
      if (!ok) {
        alert(data.message || 'Could not send OTP. Please try again later.');
        return;
      }
      setDevOtp(data.devOtp || '');
      setIsVerifying(true);
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { ok, data } = await postJson('/api/auth/verify', { phone: fullPhone, otp });
      if (!ok) {
        alert(data.message || 'Invalid OTP. Please try again.');
        setOtp('');
        return;
      }
      login(data.token);
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Wallpaper - Replace '/login-bg.jpg' with your desired image in /public */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')", backgroundAttachment: 'fixed' }}
        aria-hidden="true"
      ></div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center mb-8">
          <img
            src="/micon.png"
            alt="MyKolkata Logo"
            className="w-24 h-24 mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2">MyKolkata</h1>
          <p className="text-gray-200 text-center">
            Login to explore Kolkata <span className="text-red-500">❤</span>
          </p>
        </div>

        {/* Glassmorphism Container */}
        <div
          className="w-full max-w-sm p-6 rounded-lg backdrop-blur-md bg-white/30 border border-white/20 shadow-lg"
        >
          <form
            onSubmit={isVerifying ? handleVerifyOTP : handleGetOTP}
            className="space-y-6"
          >
            {!isVerifying ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="Enter phone number"
                    className="flex-1 p-3 border rounded-lg text-base dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    maxLength={10}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    autoComplete="tel"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full p-3 border rounded-lg text-base dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                />
                {devOtp && (
                  <p className="text-xs text-gray-800">Demo mode: your OTP is {devOtp}</p>
                )}
                <button
                  type="button"
                  onClick={() => { setIsVerifying(false); setOtp(''); setDevOtp(''); }}
                  className="text-sm text-gray-800 underline"
                >
                  Change number / resend OTP
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 text-white font-bold p-3 rounded-lg active:bg-orange-700 transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {isSubmitting ? 'Please wait...' : isVerifying ? 'Verify OTP' : 'Get OTP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
