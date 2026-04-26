import React, { useState } from 'react';
import { signInWithGoogle, signInWithGoogleRedirect } from '../../lib/firebase';
import { Truck, ShieldCheck, LogIn, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      if (!result) {
        console.log('Login cancelled or popup closed.');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      let friendlyMessage = err.message;
      
      const currentHost = window.location.hostname;

      if (err.code === 'auth/unauthorized-domain') {
        friendlyMessage = `The domain "${currentHost}" is not authorized in your Firebase Project. Please add it to "Authentication > Settings > Authorized Domains" in the Firebase Console.`;
      } else if (err.message.includes('missing initial state')) {
        friendlyMessage = 'Session error (Missing Initial State). This often happens in mobile apps or private browsing. Try using a standard browser or enable cookies.';
      } else if (err.code === 'auth/popup-blocked') {
        friendlyMessage = 'Login popup was blocked by your browser. Please allow popups for this site.';
      }
      
      setError(friendlyMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDirectLogin = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setError(null);
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      console.error('Direct Login failed:', err);
      setError(err.message);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">RMC Fleet Log</h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">Secure Trip Management & Billing System</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1 text-center">Login Error</p>
              <p className="text-xs text-rose-300 text-center">{error}</p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-tight">Verified Access</p>
                <p className="text-xs text-slate-500">Only authorized users can log trips</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-tight">Cloud Powered</p>
                <p className="text-xs text-slate-500">Real-time sync across all devices</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={isAuthenticating}
            className="w-full bg-white hover:bg-slate-50 disabled:bg-slate-800 disabled:text-slate-600 text-slate-900 font-black py-4 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group mb-3"
          >
            {isAuthenticating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            )}
            {isAuthenticating ? 'AUTHENTICATING...' : 'SIGN IN WITH GOOGLE'}
          </button>

          <button
            onClick={handleDirectLogin}
            disabled={isAuthenticating}
            className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-600 text-slate-300 font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-widest"
          >
            {isAuthenticating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Direct Login (For APK/PWA)
          </button>

          <p className="mt-8 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
            Trouble signing in? Try opening the app in a<br />
            <span className="text-indigo-400">new tab</span> to bypass browser restrictions.
          </p>

          <p className="mt-4 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
