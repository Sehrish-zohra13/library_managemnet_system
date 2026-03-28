import { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';

export default function AnimatedNumber({ value, duration = 1.5, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0
    : value;

  const spring = useSpring(0, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
    restDelta: 0.001,
  });

  const display = useTransform(spring, (current) => {
    const rounded = Math.round(current * 100) / 100;
    if (numericValue >= 1000) {
      return rounded >= 1000000
        ? `${(rounded / 1000000).toFixed(1)}m`
        : rounded >= 1000
        ? `${(rounded / 1000).toFixed(rounded >= 10000 ? 0 : 1)}k`
        : Math.round(rounded).toLocaleString();
    }
    if (Number.isInteger(numericValue)) {
      return Math.round(rounded).toLocaleString();
    }
    return rounded.toFixed(2);
  });

  useEffect(() => {
    if (isInView) {
      spring.set(numericValue);
    }
  }, [isInView, numericValue, spring]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}
