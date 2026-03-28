import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';

export default function StatCard({ icon: Icon, value, label, trend, color = 'primary', delay = 0 }) {
  const colorMap = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    danger: 'text-danger',
    warning: 'text-warning',
    purple: 'text-primary-light',
  };

  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  const prefix = typeof value === 'string' && value.startsWith('$') ? '$' : '';
  const isAnimatable = !isNaN(numericValue) && numericValue > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay,
        type: 'spring',
        mass: 0.5,
        stiffness: 100,
        damping: 12,
      }}
      whileHover={{
        y: -3,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 400, damping: 17 },
      }}
      className="card hover:shadow-card-lift transition-shadow duration-300"
    >
      <div className="flex flex-col items-center text-center gap-2 py-2">
        {Icon && (
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.15, type: 'spring', stiffness: 200, damping: 10 }}
            className={`${colorMap[color] || colorMap.primary}`}
          >
            <Icon size={22} />
          </motion.div>
        )}
        <div className="font-display font-bold text-display-sm text-on-surface">
          {isAnimatable ? (
            <AnimatedNumber value={numericValue} prefix={prefix} />
          ) : (
            value
          )}
        </div>
        <div className="text-label-md text-on-surface-faint uppercase tracking-wider">{label}</div>
        {trend && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.3, type: 'spring', stiffness: 120, damping: 10 }}
            className={`text-body-sm ${trend.startsWith('+') ? 'text-secondary' : 'text-danger'}`}
          >
            {trend}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
