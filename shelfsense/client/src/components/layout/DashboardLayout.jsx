import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 16,
    scale: 0.98,
    filter: 'blur(3px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      mass: 0.5,
      stiffness: 100,
      damping: 15,
      staggerChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    filter: 'blur(2px)',
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="lg:ml-60">
        <Navbar />
        <main className="p-4 md:p-6 lg:p-8 max-w-[1400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
