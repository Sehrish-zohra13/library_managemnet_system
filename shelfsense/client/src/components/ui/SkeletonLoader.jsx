import { motion } from 'framer-motion';

const shimmerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      type: 'spring',
      stiffness: 120,
      damping: 14,
    },
  }),
};

function ShimmerBlock({ className }) {
  return <div className={`skeleton-shimmer bg-surface-container-high rounded-lg ${className}`} />;
}

export default function SkeletonLoader({ count = 3, type = 'card' }) {
  if (type === 'row') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={shimmerVariants}
            className="flex items-center gap-4 p-4 rounded-xl"
          >
            <ShimmerBlock className="w-14 h-20" />
            <div className="flex-1 space-y-2">
              <ShimmerBlock className="h-4 w-3/4" />
              <ShimmerBlock className="h-3 w-1/2" />
            </div>
            <ShimmerBlock className="h-8 w-20" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'stat') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={shimmerVariants}
            className="card"
          >
            <div className="flex flex-col items-center gap-3 py-4">
              <ShimmerBlock className="w-8 h-8" />
              <ShimmerBlock className="h-8 w-16" />
              <ShimmerBlock className="h-3 w-20" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          initial="hidden"
          animate="visible"
          variants={shimmerVariants}
          className="card"
        >
          <ShimmerBlock className="h-40 mb-4" />
          <ShimmerBlock className="h-4 w-3/4 mb-2" />
          <ShimmerBlock className="h-3 w-1/2" />
        </motion.div>
      ))}
    </div>
  );
}
