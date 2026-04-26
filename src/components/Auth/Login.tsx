import React, { useState } from 'react';
import { signInWithGoogle } from '../../lib/firebase';
import { Truck, ShieldCheck, LogIn, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
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
            className="w-full bg-white hover:bg-slate-50 disabled:bg-slate-800 disabled:text-slate-600 text-slate-900 font-black py-4 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group"
          >
            {isAuthenticating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            )}
            {isAuthenticating ? 'AUTHENTICATING...' : 'SIGN IN WITH GOOGLE'}
          </button>

          <p className="mt-8 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
