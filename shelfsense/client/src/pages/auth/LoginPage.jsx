import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Search, Code, Mail, Lock, User, GraduationCap, Shield, Link2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import AnimatedNumber from '../../components/ui/AnimatedNumber';

const springTransition = { type: 'spring', stiffness: 100, damping: 15 };

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('Student');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    usn: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const creds = role === 'Admin'
          ? { email: form.email, password: form.password }
          : { usn: form.usn, password: form.password };
        await login(creds);
        toast.success('Welcome back to the archive!');
      } else {
        await register({
          name: form.name,
          email: form.email,
          usn: form.usn,
          password: form.password,
        });
        toast.success('Access granted!');
      }
    } catch (err) {
      const msg = err.response?.data?.error
        || (err.code === 'ERR_NETWORK' ? 'Cannot reach the server. Make sure the backend is running.' : 'Authentication failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, title: 'AI Curation', desc: 'Let our neural engines organize your messy collection into logical, thematic clusters with zero manual tagging.' },
    { icon: Search, title: 'Instant Search', desc: 'Global OCR indexing for every page.' },
    { icon: Code, title: 'Developer API', desc: 'Integrate your archive with any tool.' },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.05 }}
        className="flex items-center justify-between px-6 md:px-12 py-4"
      >
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Link2 size={20} className="text-primary" />
          </motion.div>
          <span className="font-display font-bold text-on-surface text-lg">Lib-Link</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-body-md text-on-surface-dim hover:text-on-surface transition-colors">Features</a>
          <a href="#" className="text-body-md text-on-surface-dim hover:text-on-surface transition-colors">Library</a>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setIsLogin(true); }}
            className="text-body-md text-primary font-medium"
          >Login</motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setIsLogin(false); }}
            className="btn-secondary text-body-md py-2 px-5"
          >Sign Up</motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left - Hero */}
          <motion.div
            initial={{ opacity: 0, x: -40, filter: 'blur(6px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ ...springTransition, delay: 0.1 }}
            className="pt-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springTransition, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-body-sm mb-6"
            >
              <motion.span
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-2 h-2 rounded-full bg-secondary"
              />
              Now in Private Alpha
            </motion.div>

            <h1 className="font-display font-bold text-display-lg leading-tight mb-6">
              The <span className="gradient-text">Digital</span><br />
              Curator.
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.3 }}
              className="text-body-lg text-on-surface-dim max-w-md mb-10 leading-relaxed"
            >
              Elevate your knowledge management. A high-tech gallery
              for your personal library, designed with intentional
              asymmetry and tonal depth for the modern scholar.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.4 }}
              className="flex gap-10 mb-12"
            >
              <div>
                <p className="font-display font-bold text-display-sm text-on-surface">
                  <AnimatedNumber value={12000} suffix="+" />
                </p>
                <p className="text-label-md text-on-surface-faint uppercase tracking-wider">Active Curators</p>
              </div>
              <div>
                <p className="font-display font-bold text-display-sm text-on-surface">
                  <AnimatedNumber value={4800000} suffix="" />
                </p>
                <p className="text-label-md text-on-surface-faint uppercase tracking-wider">Books Indexed</p>
              </div>
              <div>
                <p className="font-display font-bold text-display-sm text-on-surface">
                  <AnimatedNumber value={99.9} suffix="%" />
                </p>
                <p className="text-label-md text-on-surface-faint uppercase tracking-wider">Sync Uptime</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right - Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={{ type: 'spring', mass: 0.6, stiffness: 80, damping: 14, delay: 0.25 }}
            className="card-elevated p-8 rounded-2xl"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 120, damping: 16 }}
              >
                <div className="text-center mb-6">
                  <h2 className="font-display font-bold text-headline-lg text-on-surface mb-1">
                    {isLogin ? 'Welcome Back' : 'Request Access'}
                  </h2>
                  <p className="text-body-md text-on-surface-dim">
                    {isLogin ? 'Enter your credentials to access your archive' : 'Create your curator account'}
                  </p>
                </div>

                {/* Role Selection */}
                {isLogin && (
                  <div className="mb-6">
                    <p className="text-label-md text-on-surface-faint uppercase tracking-wider mb-2">Role Selection</p>
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setRole('Student')}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-body-md font-medium transition-all duration-300
                          ${role === 'Student'
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'bg-surface-container text-on-surface-dim hover:bg-surface-bright'
                          }`}
                      >
                        <GraduationCap size={16} />
                        Student
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setRole('Admin')}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-body-md font-medium transition-all duration-300
                          ${role === 'Admin'
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'bg-surface-container text-on-surface-dim hover:bg-surface-bright'
                          }`}
                      >
                        <Shield size={16} />
                        Admin
                      </motion.button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={springTransition}>
                      <label className="text-label-md text-on-surface-faint uppercase tracking-wider block mb-1.5">Full Name</label>
                      <div className="relative input-focus-glow">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint" />
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          placeholder="Your full name"
                          className="input-field pl-10"
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {(role === 'Admin' || !isLogin) && (
                    <div>
                      <label className="text-label-md text-on-surface-faint uppercase tracking-wider block mb-1.5">Email Address</label>
                      <div className="relative input-focus-glow">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          placeholder="curator@lib-link.io"
                          className="input-field pl-10"
                          required={role === 'Admin' || !isLogin}
                        />
                      </div>
                    </div>
                  )}

                  {(role === 'Student' || !isLogin) && (
                    <div>
                      <label className="text-label-md text-on-surface-faint uppercase tracking-wider block mb-1.5">
                        {isLogin ? 'USN' : 'USN (University Seat Number)'}
                      </label>
                      <div className="relative input-focus-glow">
                        <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint" />
                        <input
                          type="text"
                          value={form.usn}
                          onChange={e => setForm({ ...form, usn: e.target.value })}
                          placeholder="1RV22CS001"
                          className="input-field pl-10"
                          required={role === 'Student' && isLogin}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-label-md text-on-surface-faint uppercase tracking-wider">Password</label>
                      {isLogin && <a href="#" className="text-body-sm text-primary hover:underline">Forgot?</a>}
                    </div>
                    <div className="relative input-focus-glow">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint" />
                      <input
                        type="password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••••"
                        className="input-field pl-10"
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      isLogin ? 'Access Archive' : 'Request Access'
                    )}
                  </motion.button>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-body-sm text-on-surface-dim">
                    {isLogin ? "New to the library? " : "Already have access? "}
                    <button
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-primary font-medium hover:underline"
                    >
                      {isLogin ? 'Request Access' : 'Login'}
                    </button>
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Features */}
        <div id="features" className="mt-20 md:mt-32">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.5 }}
            className="text-center text-label-md text-on-surface-faint uppercase tracking-[0.2em] mb-12"
          >
            Discover the Architecture
          </motion.p>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.5 + i * 0.12,
                  type: 'spring',
                  stiffness: 80,
                  damping: 12,
                }}
                whileHover={{
                  y: -4,
                  scale: 1.02,
                  transition: { type: 'spring', stiffness: 400, damping: 17 },
                }}
                className="card hover:shadow-card-lift transition-shadow duration-300 p-8"
              >
                <motion.div
                  initial={{ scale: 0.5, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.6 + i * 0.12,
                    type: 'spring',
                    stiffness: 200,
                    damping: 10,
                  }}
                  className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
                >
                  <feat.icon size={20} className="text-primary" />
                </motion.div>
                <h3 className="font-display font-bold text-headline-sm text-on-surface mb-2">{feat.title}</h3>
                <p className="text-body-md text-on-surface-dim leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 py-8 flex flex-col md:flex-row items-center justify-between text-body-sm text-on-surface-faint"
        >
          <div>
            <span className="font-display font-bold text-on-surface">Lib-Link</span>
            <p className="text-label-sm uppercase tracking-wider">The Digital Curator © {new Date().getFullYear()}</p>
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-on-surface transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-on-surface transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-on-surface transition-colors">Documentation</a>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
