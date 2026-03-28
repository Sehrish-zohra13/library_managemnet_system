import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Mail, Lock, Sun, Moon, Bell, BellOff,
  BookOpen, LogOut, Shield, DollarSign, Globe,
  Save, Check, AlertTriangle, Eye, EyeOff, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const panelVariants = {
  hidden: { x: 320, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 18 },
  },
  exit: {
    x: 320,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.06,
      type: 'spring',
      stiffness: 120,
      damping: 14,
    },
  }),
};

function Toggle({ checked, onChange, label, icon: Icon, description }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {Icon && <Icon size={18} className="text-on-surface-dim" />}
        <div>
          <p className="text-body-md text-on-surface">{label}</p>
          {description && <p className="text-body-sm text-on-surface-faint">{description}</p>}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300
          ${checked ? 'bg-primary' : 'bg-surface-container-high'}`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </motion.button>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, index = 0 }) {
  return (
    <motion.div
      custom={index}
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl bg-surface-container p-5 space-y-3"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className="text-primary" />
        <h3 className="text-label-md text-on-surface-faint uppercase tracking-wider font-semibold">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

export default function SettingsPanel({ isOpen, onClose }) {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme, notifications, updateNotifications, language, setLanguage } = useTheme();
  const navigate = useNavigate();

  // Profile
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Security
  const [securityForm, setSecurityForm] = useState({ oldPassword: '', newPassword: '' });
  const [securitySaving, setSecuritySaving] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Borrowing
  const [borrowing, setBorrowing] = useState({ borrow_limit: 3, current_borrowed: 0 });

  // Admin
  const [adminSettings, setAdminSettings] = useState({ default_borrow_limit: 3, fine_per_day: 2.50 });
  const [adminSaving, setAdminSaving] = useState(false);

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    if (isOpen && user) {
      setProfileForm({ name: user.name || '', email: user.email || '' });
      fetchBorrowing();
      if (isAdmin) fetchAdminSettings();
    }
  }, [isOpen, user]);

  const fetchBorrowing = async () => {
    try {
      const res = await api.get('/settings/borrowing');
      setBorrowing(res.data);
    } catch (err) {}
  };

  const fetchAdminSettings = async () => {
    try {
      const res = await api.get('/settings/admin');
      setAdminSettings({
        default_borrow_limit: res.data.default_borrow_limit || 3,
        fine_per_day: res.data.fine_per_day || 2.50,
      });
    } catch (err) {}
  };

  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) { toast.error('Name is required'); return; }
    setProfileSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        name: profileForm.name,
        department: user?.department,
      });
      updateUser(res.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!securityForm.oldPassword || !securityForm.newPassword) {
      toast.error('Both fields are required');
      return;
    }
    if (securityForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setSecuritySaving(true);
    try {
      await api.put('/settings/password', securityForm);
      toast.success('Password changed successfully');
      setSecurityForm({ oldPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleAdminSave = async () => {
    setAdminSaving(true);
    try {
      await api.put('/settings/admin', adminSettings);
      toast.success('Admin settings saved');
    } catch (err) {
      toast.error('Failed to save admin settings');
    } finally {
      setAdminSaving(false);
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/');
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />

          {/* Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-surface-container-low z-[70]
                       flex flex-col shadow-ambient-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
              <div>
                <h2 className="font-display font-bold text-headline-md text-on-surface">Settings</h2>
                <p className="text-body-sm text-on-surface-faint">Manage your account & preferences</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-container transition-colors"
              >
                <X size={20} className="text-on-surface-dim" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* ──────────── 1. Profile ──────────── */}
              <SectionCard title="Profile" icon={User} index={0}>
                <div className="space-y-3">
                  <div>
                    <label className="text-label-sm text-on-surface-faint uppercase block mb-1">Name</label>
                    <div className="relative input-focus-glow">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint" />
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                        className="input-field pl-9 text-body-md py-2.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-label-sm text-on-surface-faint uppercase block mb-1">Email</label>
                    <div className="relative input-focus-glow">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint" />
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                        className="input-field pl-9 text-body-md py-2.5"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-body-sm text-on-surface-faint">
                    <Shield size={12} />
                    <span>Role: <span className="text-primary font-semibold">{user?.role}</span></span>
                    <span className="mx-1">•</span>
                    <span>ID: {user?.usn || user?.email}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="btn-primary w-full py-2.5 text-body-md flex items-center justify-center gap-2"
                  >
                    {profileSaving ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                      <><Save size={14} /> Save Profile</>
                    )}
                  </motion.button>
                </div>
              </SectionCard>

              {/* ──────────── 2. Security ──────────── */}
              <SectionCard title="Security" icon={Lock} index={1}>
                <div className="space-y-3">
                  <div>
                    <label className="text-label-sm text-on-surface-faint uppercase block mb-1">Current Password</label>
                    <div className="relative input-focus-glow">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint" />
                      <input
                        type={showOldPass ? 'text' : 'password'}
                        value={securityForm.oldPassword}
                        onChange={e => setSecurityForm(p => ({ ...p, oldPassword: e.target.value }))}
                        className="input-field pl-9 pr-10 text-body-md py-2.5"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-faint hover:text-on-surface transition-colors"
                      >
                        {showOldPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-label-sm text-on-surface-faint uppercase block mb-1">New Password</label>
                    <div className="relative input-focus-glow">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={securityForm.newPassword}
                        onChange={e => setSecurityForm(p => ({ ...p, newPassword: e.target.value }))}
                        className="input-field pl-9 pr-10 text-body-md py-2.5"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-faint hover:text-on-surface transition-colors"
                      >
                        {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {securityForm.newPassword && securityForm.newPassword.length < 6 && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-body-sm text-danger mt-1 flex items-center gap-1"
                      >
                        <AlertTriangle size={12} /> Min 6 characters
                      </motion.p>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePasswordChange}
                    disabled={securitySaving}
                    className="btn-secondary w-full py-2.5 text-body-md flex items-center justify-center gap-2"
                  >
                    {securitySaving ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-on-surface-faint/30 border-t-on-surface-faint rounded-full" />
                    ) : (
                      <><Lock size={14} /> Change Password</>
                    )}
                  </motion.button>
                </div>
              </SectionCard>

              {/* ──────────── 3. Theme ──────────── */}
              <SectionCard title="Appearance" icon={Sun} index={2}>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                      {theme === 'dark' ? (
                        <motion.div key="moon" initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }}>
                          <Moon size={18} className="text-primary-light" />
                        </motion.div>
                      ) : (
                        <motion.div key="sun" initial={{ rotate: 90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: -90, scale: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }}>
                          <Sun size={18} className="text-warning" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div>
                      <p className="text-body-md text-on-surface">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                      <p className="text-body-sm text-on-surface-faint">Currently active</p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleTheme}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-300
                      ${theme === 'dark' ? 'bg-primary' : 'bg-warning/80'}`}
                  >
                    <motion.div
                      animate={{ x: theme === 'dark' ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                    />
                  </motion.button>
                </div>
              </SectionCard>

              {/* ──────────── 4. Notifications ──────────── */}
              <SectionCard title="Notifications" icon={Bell} index={3}>
                <Toggle
                  checked={notifications.dueReminders}
                  onChange={v => updateNotifications('dueReminders', v)}
                  icon={Bell}
                  label="Due Reminders"
                  description="Get notified before book due dates"
                />
                <div className="border-t border-outline-variant/10" />
                <Toggle
                  checked={notifications.alerts}
                  onChange={v => updateNotifications('alerts', v)}
                  icon={notifications.alerts ? Bell : BellOff}
                  label="System Alerts"
                  description="Reservation updates & announcements"
                />
              </SectionCard>

              {/* ──────────── 5. Borrowing Preferences ──────────── */}
              <SectionCard title="Borrowing" icon={BookOpen} index={4}>
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
                    className="p-4 rounded-xl bg-surface-container-high text-center"
                  >
                    <p className="font-display font-bold text-headline-md text-primary">
                      {borrowing.borrow_limit}
                    </p>
                    <p className="text-label-sm text-on-surface-faint uppercase mt-1">Max Books</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
                    className="p-4 rounded-xl bg-surface-container-high text-center"
                  >
                    <p className={`font-display font-bold text-headline-md ${borrowing.current_borrowed >= borrowing.borrow_limit ? 'text-danger' : 'text-secondary'}`}>
                      {borrowing.current_borrowed}
                    </p>
                    <p className="text-label-sm text-on-surface-faint uppercase mt-1">Currently Out</p>
                  </motion.div>
                </div>
                {borrowing.current_borrowed >= borrowing.borrow_limit && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 text-danger text-body-sm"
                  >
                    <AlertTriangle size={14} />
                    <span>Borrow limit reached. Return a book to issue more.</span>
                  </motion.div>
                )}
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(borrowing.current_borrowed / borrowing.borrow_limit) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full ${borrowing.current_borrowed >= borrowing.borrow_limit ? 'bg-danger' : 'bg-primary'}`}
                  />
                </div>
              </SectionCard>

              {/* ──────────── 6. Language ──────────── */}
              <SectionCard title="Language" icon={Globe} index={5}>
                <div className="space-y-1">
                  {languages.map((lang) => (
                    <motion.button
                      key={lang.code}
                      whileHover={{ x: 3, backgroundColor: 'rgba(31, 43, 73, 0.5)' }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      onClick={() => setLanguage(lang.code)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left
                        ${language === lang.code ? 'bg-primary/10' : ''}`}
                    >
                      <span className={`text-body-md ${language === lang.code ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                        {lang.label}
                      </span>
                      {language === lang.code && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        >
                          <Check size={16} className="text-primary" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </SectionCard>

              {/* ──────────── 7. Admin Settings ──────────── */}
              {isAdmin && (
                <SectionCard title="Admin Controls" icon={Shield} index={6}>
                  <div className="space-y-3">
                    <div>
                      <label className="text-label-sm text-on-surface-faint uppercase block mb-1">Default Book Limit per Student</label>
                      <div className="relative input-focus-glow">
                        <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint" />
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={adminSettings.default_borrow_limit}
                          onChange={e => setAdminSettings(p => ({ ...p, default_borrow_limit: parseInt(e.target.value) || 3 }))}
                          className="input-field pl-9 text-body-md py-2.5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-label-sm text-on-surface-faint uppercase block mb-1">Fine Per Day ($)</label>
                      <div className="relative input-focus-glow">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint" />
                        <input
                          type="number"
                          min="0"
                          step="0.50"
                          value={adminSettings.fine_per_day}
                          onChange={e => setAdminSettings(p => ({ ...p, fine_per_day: parseFloat(e.target.value) || 0 }))}
                          className="input-field pl-9 text-body-md py-2.5"
                        />
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAdminSave}
                      disabled={adminSaving}
                      className="btn-primary w-full py-2.5 text-body-md flex items-center justify-center gap-2"
                    >
                      {adminSaving ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <><Save size={14} /> Save Admin Settings</>
                      )}
                    </motion.button>
                    <p className="text-body-sm text-on-surface-faint text-center">
                      Changes apply to all student accounts
                    </p>
                  </div>
                </SectionCard>
              )}
            </div>

            {/* ──────────── 8. Logout Footer ──────────── */}
            <div className="px-5 py-4 border-t border-outline-variant/10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                         bg-danger/10 text-danger font-semibold text-body-md
                         hover:bg-danger/20 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </motion.button>
              <p className="text-center text-body-sm text-on-surface-faint mt-2">
                Lib-Link v1.0 • The Digital Curator
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
