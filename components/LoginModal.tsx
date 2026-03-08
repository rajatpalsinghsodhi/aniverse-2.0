import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (user: any) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin ? { email, password } : { email, password, username };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');

      onLogin(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-ink border border-paper/10 overflow-hidden shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-paper/[0.03] text-muted hover:text-paper transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary mb-6">
              <User size={32} />
            </div>
            <h2 className="font-heading text-4xl text-paper mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-paper/40 font-light text-sm">
              {isLogin ? 'Sign in to sync your anime library' : 'Join the community of anime fans'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                  type="text" 
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-paper/[0.03] border border-paper/10 py-4 pl-12 pr-4 text-paper font-mono text-[12px] tracking-wider outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="email" 
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-paper/[0.03] border border-paper/10 py-4 pl-12 pr-4 text-paper font-mono text-[12px] tracking-wider outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="password" 
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-paper/[0.03] border border-paper/10 py-4 pl-12 pr-4 text-paper font-mono text-[12px] tracking-wider outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {error && (
              <p className="text-red-500 font-mono text-[12px] tracking-wider text-center uppercase">{error}</p>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-paper py-4 font-mono text-[12px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-paper border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-paper/[0.06] text-center">
            <p className="text-paper/40 font-mono text-[12px] tracking-wider">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-primary font-bold hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginModal;
