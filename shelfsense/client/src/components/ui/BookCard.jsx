import { motion } from 'framer-motion';
import { MapPin, CalendarClock } from 'lucide-react';

export default function BookCard({ book, onAction, onReserve, actionLabel = 'Issue Book', reservationInfo, variant = 'row', index = 0 }) {
  const available = (book.quantity || 0) - (book.issued_count || 0);
  const isAvailable = available > 0;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          delay: index * 0.06,
          type: 'spring',
          stiffness: 120,
          damping: 14,
        }}
        whileHover={{
          backgroundColor: 'rgba(31, 43, 73, 0.8)',
          x: 4,
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        }}
        className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer"
      >
        <div className="w-12 h-16 rounded-lg bg-surface-container-high flex-shrink-0 overflow-hidden">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-faint text-body-sm">
              📖
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-md font-semibold text-on-surface truncate">{book.title}</p>
          <p className="text-body-sm text-on-surface-dim">{book.author}</p>
        </div>
      </motion.div>
    );
  }

  const getActionButton = () => {
    if (isAvailable) {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          onClick={() => onAction?.(book)}
          className="text-body-sm font-medium px-4 py-2 rounded-lg transition-all duration-200
            bg-surface-container-high text-on-surface hover:bg-surface-bright"
        >
          {actionLabel}
        </motion.button>
      );
    }

    // Book is unavailable
    if (reservationInfo?.reserved) {
      // User already has a reservation
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/15 text-primary"
        >
          <CalendarClock size={14} />
          <span className="text-body-sm font-semibold">
            Queued #{reservationInfo.reservation?.current_position || reservationInfo.reservation?.position}
          </span>
        </motion.div>
      );
    }

    // Can reserve
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={() => onReserve?.(book)}
        className="text-body-sm font-medium px-4 py-2 rounded-lg transition-all duration-200
          bg-primary/15 text-primary hover:bg-primary/25 flex items-center gap-1.5"
      >
        <CalendarClock size={14} />
        Reserve
      </motion.button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        type: 'spring',
        stiffness: 120,
        damping: 16,
      }}
      whileHover={{
        backgroundColor: 'rgba(31, 43, 73, 0.5)',
        scale: 1.005,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }}
      className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200"
    >
      {/* Cover */}
      <div className="w-14 h-20 rounded-lg bg-surface-container-high flex-shrink-0 overflow-hidden">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-body-lg font-semibold text-on-surface truncate">{book.title}</h3>
        <p className="text-body-sm text-on-surface-dim">{book.category} • {book.year || ''}</p>
      </div>

      {/* Author */}
      <div className="hidden md:block w-36">
        <p className="text-body-md text-on-surface-dim">{book.author}</p>
      </div>

      {/* Location */}
      <div className="hidden lg:block">
        <span className="location-badge">
          <MapPin size={12} />
          FL {String(book.floor_num).padStart(2, '0')} • R {String(book.row_num).padStart(2, '0')} • K {String(book.rack_num).padStart(2, '0')}
        </span>
      </div>

      {/* Status */}
      <div className="hidden sm:block w-24 text-center">
        {isAvailable ? (
          <span className="status-available">
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full bg-secondary inline-block"
            />
            Available
          </span>
        ) : (
          <span className="status-issued">
            <span className="w-2 h-2 rounded-full bg-danger inline-block" />
            Issued
          </span>
        )}
      </div>

      {/* Action */}
      <div className="flex-shrink-0">
        {getActionButton()}
      </div>
    </motion.div>
  );
}
