import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 16,
    scale: 0.98,
    filter: 'blur(4px)',
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
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    filter: 'blur(2px)',
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger wrapper for list/grid children
export function StaggerContainer({ children, className = '', staggerDelay = 0.06, delayStart = 0.1 }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delayStart,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger child
export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          y: 20,
          scale: 0.97,
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: 'spring',
            mass: 0.4,
            stiffness: 120,
            damping: 12,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Card hover wrapper with scale + shadow elevation
export function HoverCard({ children, className = '', scale = 1.02 }) {
  return (
    <motion.div
      whileHover={{
        scale,
        y: -2,
        transition: { type: 'spring', stiffness: 400, damping: 17 },
      }}
      whileTap={{
        scale: 0.98,
        transition: { type: 'spring', stiffness: 400, damping: 17 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
