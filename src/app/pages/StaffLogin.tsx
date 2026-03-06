import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Shield, ArrowLeft, Zap, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function StaffLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    // Simple demo authentication delay
    setTimeout(() => {
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        toast.success('Access Granted', { description: 'Welcome back, Administrator' });
        navigate('/admin');
      } else {
        toast.error('Access Denied', { description: 'Invalid biometric or credential match' });
      }
      setIsLoggingIn(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-8 text-slate-500 hover:text-blue-600 hover:bg-white/50 rounded-2xl px-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Portal Exit
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
        >
          <Card className="shadow-[0_32px_120px_-20px_rgba(0,0,0,0.1)] border-white/40 bg-white/30 backdrop-blur-3xl rounded-[40px] p-2 md:p-6 overflow-hidden">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="p-5 rounded-3xl bg-blue-600 text-white shadow-2xl shadow-blue-500/20"
                >
                  <Shield size={40} />
                </motion.div>
              </div>
              <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Staff <span className="text-blue-600">Secure</span> Login</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-2">
                Encrypted Clinical Operations Access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-slate-800 font-bold ml-1 text-sm uppercase tracking-wider">Operational ID</Label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <User size={20} />
                    </div>
                    <Input
                      id="username"
                      placeholder="Staff ID"
                      className="h-14 pl-14 pr-5 bg-white/40 border-white/50 focus:bg-white/80 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 rounded-[20px] transition-all duration-300 placeholder:text-slate-400"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-slate-800 font-bold ml-1 text-sm uppercase tracking-wider">Access Protocol</Label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <Lock size={20} />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Security Token"
                      className="h-14 pl-14 pr-5 bg-white/40 border-white/50 focus:bg-white/80 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 rounded-[20px] transition-all duration-300 placeholder:text-slate-400"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="pt-4"
                >
                  <Button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full h-16 bg-blue-600 text-white hover:bg-blue-700 text-lg font-black rounded-3xl shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] transition-all duration-300"
                  >
                    {isLoggingIn ? (
                      <Zap className="animate-spin h-6 w-6" />
                    ) : (
                      "AUTHORIZE ACCESS"
                    )}
                  </Button>
                </motion.div>
              </form>

              <div className="mt-10 p-5 rounded-3xl bg-blue-50/50 border border-blue-100 backdrop-blur-sm">
                <div className="flex gap-3">
                  <Zap className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-800 font-bold leading-relaxed">
                    Notice: Unauthorized access attempts are monitored by the Medspear AI security matrix.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Demo Sandbox</p>
                  <p className="text-xs text-slate-500 mt-1">ID: <span className="font-bold">admin</span> • TOKEN: <span className="font-bold">admin123</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
