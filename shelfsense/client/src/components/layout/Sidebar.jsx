import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, User, Shield, LogOut, ScanLine, Menu, X,
  CalendarClock, DollarSign, BookMarked, Settings, Link2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import SettingsPanel from '../ui/SettingsPanel';

const studentLinks = [
  { to: '/dashboard', label: 'Library Dashboard', icon: LayoutDashboard },
  { to: '/books', label: 'Book Borrowing', icon: BookOpen },
  { to: '/profile', label: 'User Profile', icon: User },
  { to: '/scan', label: 'Issue / Return', icon: ScanLine },
  { to: '/reservations', label: 'Reservations', icon: CalendarClock },
  { to: '/fines', label: 'Fine Management', icon: DollarSign },
];

const adminLinks = [
  { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
  { to: '/admin/books', label: 'Book Management', icon: BookMarked },
  { to: '/admin/reservations', label: 'Reservations', icon: CalendarClock },
  { to: '/admin/fines', label: 'Fine Requests', icon: DollarSign },
  { to: '/dashboard', label: 'Library View', icon: BookOpen },
  { to: '/profile', label: 'Profile', icon: User },
];

const sidebarVariants = {
  hidden: { x: -30, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      staggerChildren: 0.04,
      delayChildren: 0.15,
    },
  },
};

const linkVariants = {
  hidden: { x: -12, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 120, damping: 14 },
  },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isAdmin = user?.role === 'Admin';
  const links = isAdmin ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile toggle */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-container text-on-surface"
      >
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Menu size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setCollapsed(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className={`fixed top-0 left-0 h-screen w-60 bg-surface-container-low z-40
          flex flex-col transition-transform duration-300 ease-spring-soft
          ${collapsed ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="w-9 h-9 rounded-lg bg-primary-gradient flex items-center justify-center"
            >
              <Link2 size={18} className="text-white" />
            </motion.div>
            <div>
              <h1 className="font-display font-bold text-on-surface text-base">Lib-Link</h1>
              <p className="text-[10px] text-on-surface-faint uppercase tracking-[0.15em]">
                {isAdmin ? 'Admin Panel' : 'The Digital Curator'}
              </p>
            </div>
          </div>
        </div>

        {/* Section label */}
        <div className="px-6 py-2">
          <p className="text-label-sm text-on-surface-faint uppercase tracking-[0.2em]">
            {isAdmin ? 'Administration' : 'Navigation'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
          {links.map((link, i) => {
            const isEnd = link.to === '/dashboard' || link.to === '/admin';
            return (
              <motion.div key={link.to} variants={linkVariants}>
                <NavLink
                  to={link.to}
                  end={isEnd}
                  onClick={() => setCollapsed(false)}
                  className={({ isActive }) =>
                    isActive ? 'sidebar-item-active' : 'sidebar-item'
                  }
                >
                  <link.icon size={18} />
                  <span className="text-body-md">{link.label}</span>
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-2 border-t border-outline-variant/10 pt-3">
          {!isAdmin && (
            <NavLink
              to="/scan"
              onClick={() => setCollapsed(false)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-body-md py-2.5"
            >
              <ScanLine size={16} />
              <span>Scan Book</span>
            </NavLink>
          )}

          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setSettingsOpen(true); setCollapsed(false); }}
            className="sidebar-item w-full"
          >
            <Settings size={18} />
            <span className="text-body-md">Settings</span>
          </motion.button>

          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="sidebar-item w-full text-danger hover:text-danger"
          >
            <LogOut size={18} />
            <span className="text-body-md">Logout</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Settings Panel */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
