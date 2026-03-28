import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, X, BookOpen, Sparkles, History, BarChart3, Package, Bell, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Timer } from 'lucide-react';
import api from '../../services/api';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 14 },
  },
};

function CountdownTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${mins}m remaining`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const diff = new Date(expiresAt) - new Date();
  const isUrgent = diff < 4 * 60 * 60 * 1000; // less than 4 hours

  return (
    <span className={`flex items-center gap-1 text-body-sm font-medium ${isUrgent ? 'text-danger' : 'text-secondary'}`}>
      <Timer size={14} />
      {timeLeft}
    </span>
  );
}

export default function Reservations() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [popular, setPopular] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resRes, popRes, histRes] = await Promise.all([
        api.get('/reservations/my'),
        api.get('/reservations/popular'),
        api.get('/reservations/history'),
      ]);
      setReservations(resRes.data);
      setPopular(popRes.data);
      setHistory(histRes.data);
    } catch (err) {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (id) => {
    try {
      await api.delete(`/reservations/${id}`);
      toast.success('Reservation cancelled');
      fetchData();
    } catch (err) {
      toast.error('Failed to cancel');
    }
  };

  const reserveBook = async (bookId) => {
    try {
      const res = await api.post('/reservations', { book_id: bookId });
      toast.success(`Reserved! Position: #${res.data.position}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reserve');
    }
  };

  const notifiedReservations = reservations.filter(r => r.status === 'Notified');
  const activeReservations = reservations.filter(r => r.status === 'Active');

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Notified': return { label: 'Ready to Collect', color: 'bg-secondary/15 text-secondary', dotColor: 'bg-secondary' };
      case 'Active': return { label: 'Waiting in Queue', color: 'bg-primary/15 text-primary', dotColor: 'bg-primary' };
      case 'Fulfilled': return { label: 'Completed', color: 'bg-surface-container-high text-on-surface-dim', dotColor: 'bg-on-surface-dim' };
      case 'Expired': return { label: 'Expired', color: 'bg-danger/15 text-danger', dotColor: 'bg-danger' };
      case 'Cancelled': return { label: 'Cancelled', color: 'bg-surface-container-high text-on-surface-faint', dotColor: 'bg-on-surface-faint' };
      default: return { label: status, color: 'bg-surface-container text-on-surface-dim', dotColor: 'bg-on-surface-dim' };
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      }}
      className="space-y-8"
    >
      {/* Notification Banner for Ready Books */}
      <AnimatePresence>
        {notifiedReservations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            className="relative overflow-hidden rounded-2xl bg-secondary/8 border border-secondary/20 p-6"
          >
            <div className="absolute top-0 left-0 h-full w-1.5 bg-secondary rounded-full" />
            <div className="flex items-start gap-4 ml-3">
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0"
              >
                <Bell size={22} className="text-secondary" />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-headline-sm text-on-surface mb-1">
                  Your reserved book{notifiedReservations.length > 1 ? 's are' : ' is'} now available!
                </h3>
                {notifiedReservations.map((res, i) => (
                  <div key={res.id} className="flex items-center justify-between mt-2 p-3 rounded-lg bg-surface-container/50">
                    <div>
                      <p className="text-body-md font-semibold text-on-surface">"{res.title}"</p>
                      <p className="text-body-sm text-on-surface-dim">by {res.author}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {res.expires_at && <CountdownTimer expiresAt={res.expires_at} />}
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/scan')}
                        className="btn-primary py-2 px-4 text-body-sm"
                      >
                        Issue Now
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <motion.div variants={staggerItem}>
          <h1 className="font-display font-bold text-display-sm text-on-surface">
            Queue <span className="gradient-text">Intelligence</span>
          </h1>
          <p className="text-body-md text-on-surface-dim mt-1 max-w-lg">
            Secure your access to exclusive knowledge. Track your position in real-time as the curator prepares your selection.
          </p>
        </motion.div>

        <div className="flex gap-3">
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -2, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="card py-3 px-5 text-center hover:shadow-card-lift transition-shadow duration-300"
          >
            <p className="text-label-sm text-on-surface-faint uppercase">Ready</p>
            <p className="font-display font-bold text-headline-md text-secondary">
              {notifiedReservations.length}
            </p>
          </motion.div>
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -2, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="card py-3 px-5 text-center hover:shadow-card-lift transition-shadow duration-300"
          >
            <p className="text-label-sm text-on-surface-faint uppercase">Waiting</p>
            <p className="font-display font-bold text-headline-md text-primary">
              {activeReservations.length}
            </p>
          </motion.div>
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -2, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="card py-3 px-5 text-center hover:shadow-card-lift transition-shadow duration-300"
          >
            <p className="text-label-sm text-on-surface-faint uppercase">Active Slots</p>
            <p className="font-display font-bold text-headline-md text-on-surface-dim">
              {reservations.length} / 5
            </p>
          </motion.div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Active Queue */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-label-md text-on-surface-faint uppercase tracking-wider">Active Queue</h2>

          {reservations.length > 0 ? reservations.map((res, i) => {
            const statusConfig = getStatusConfig(res.status);
            const isReady = res.status === 'Notified';

            return (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: i * 0.1,
                  type: 'spring',
                  stiffness: 80,
                  damping: 12,
                }}
                whileHover={{
                  y: -3,
                  transition: { type: 'spring', stiffness: 400, damping: 17 },
                }}
                className={`card-elevated flex flex-col sm:flex-row items-start gap-5 p-6 hover:shadow-card-lift transition-shadow duration-300
                  ${isReady ? 'ring-1 ring-secondary/30' : ''}`}
              >
                <div className="w-20 h-28 rounded-xl bg-surface-container flex-shrink-0 flex items-center justify-center text-3xl overflow-hidden">
                  📚
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-label-sm font-semibold uppercase ${statusConfig.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                          {statusConfig.label}
                        </span>
                        {isReady && res.expires_at && (
                          <CountdownTimer expiresAt={res.expires_at} />
                        )}
                      </div>
                      <h3 className="font-display font-bold text-headline-md text-on-surface">{res.title}</h3>
                      <p className="text-body-md text-on-surface-dim">by {res.author} • {res.category}</p>
                    </div>
                    {!isReady && (
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 200, damping: 10 }}
                        className="text-right flex-shrink-0"
                      >
                        <p className="font-display font-bold text-display-sm text-primary">{String(res.current_position).padStart(2, '0')}</p>
                        <p className="text-label-sm text-on-surface-faint uppercase">Position</p>
                      </motion.div>
                    )}
                    {isReady && (
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 10 }}
                        className="flex-shrink-0"
                      >
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate('/scan')}
                          className="btn-primary py-2.5 px-5 text-body-sm"
                        >
                          <CheckCircle size={14} className="inline mr-1.5" />
                          Issue Now
                        </motion.button>
                      </motion.div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {!isReady && (
                    <div className="mt-4 h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(10, (1 - (res.current_position - 1) / Math.max(res.total_in_queue, 1)) * 100)}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-primary-gradient rounded-full"
                      />
                    </div>
                  )}
                  {isReady && (
                    <div className="mt-4 h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-gradient-to-r from-secondary to-emerald-400 rounded-full"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-body-sm text-on-surface-dim">
                    {!isReady && (
                      <>
                        <span className="flex items-center gap-1"><Clock size={14} /> Est. {res.current_position * 3} days left</span>
                        <span className="flex items-center gap-1"><Users size={14} /> {res.current_position - 1} person{res.current_position > 2 ? 's' : ''} ahead</span>
                      </>
                    )}
                    {isReady && (
                      <span className="flex items-center gap-1 text-secondary font-medium">
                        <CheckCircle size={14} /> Book is ready for pickup
                      </span>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => cancelReservation(res.id)}
                      className="ml-auto text-danger hover:text-danger-dim flex items-center gap-1 transition-colors"
                    >
                      <X size={14} /> Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          }) : (
            <motion.div variants={staggerItem} className="card text-center py-16">
              <BookOpen size={48} className="mx-auto text-on-surface-faint mb-4" />
              <p className="text-headline-sm text-on-surface-dim font-display">No active reservations</p>
              <p className="text-body-md text-on-surface-faint mt-1">Reserve books that are currently unavailable</p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/books')} className="btn-primary mt-4">Browse Catalog</motion.button>
            </motion.div>
          )}
        </div>

        {/* Highly Requested + Tips */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-label-md text-on-surface-faint uppercase tracking-wider mb-4">Highly Requested</h2>
            <div className="space-y-3">
              {popular.map((book, i) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.2 + i * 0.08,
                    type: 'spring',
                    stiffness: 120,
                    damping: 14,
                  }}
                  whileHover={{
                    x: -3,
                    transition: { type: 'spring', stiffness: 300, damping: 20 },
                  }}
                  className="card flex items-center gap-3"
                >
                  <div className="w-12 h-16 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center">📖</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-semibold text-on-surface truncate">{book.title}</p>
                    <p className="text-body-sm text-on-surface-dim">
                      {book.reservation_count} in queue • {book.issued_count} Issued
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => reserveBook(book.id)}
                    className="text-body-sm font-medium px-3 py-1.5 rounded-lg bg-primary/15 text-primary
                             hover:bg-primary/25 transition-colors flex-shrink-0 flex items-center gap-1"
                  >
                    <Users size={12} />
                    Reserve
                  </motion.button>
                </motion.div>
              ))}
              {popular.length === 0 && (
                <p className="text-body-sm text-on-surface-dim text-center py-4">No popular reservations</p>
              )}
            </div>
          </div>

          {/* Curator's Tip */}
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="card bg-secondary/5 border border-secondary/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles size={18} className="text-secondary" />
              </motion.div>
              <h3 className="font-display font-bold text-body-lg text-on-surface">How Reservations Work</h3>
            </div>
            <div className="space-y-2 text-body-md text-on-surface-dim leading-relaxed">
              <p>📌 Reserve unavailable books to join the <span className="text-primary font-semibold">waiting queue</span></p>
              <p>🔔 Get notified when the book becomes <span className="text-secondary font-semibold">available</span></p>
              <p>⏰ You have <span className="text-danger font-semibold">24 hours</span> to collect after notification</p>
              <p>♻️ If missed, the next person in queue is auto-promoted</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <motion.div variants={staggerItem}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-label-md text-on-surface-faint uppercase tracking-wider mb-4 hover:text-on-surface-dim transition-colors"
          >
            <History size={16} />
            Reservation History ({history.length})
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </motion.button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 14 }}
                className="overflow-hidden"
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {history.map((res, i) => {
                    const statusConfig = getStatusConfig(res.status);
                    return (
                      <motion.div
                        key={res.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 120, damping: 14 }}
                        className="card opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${statusConfig.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-body-md font-semibold text-on-surface truncate">{res.title}</p>
                        <p className="text-body-sm text-on-surface-faint">{res.author}</p>
                        <p className="text-body-sm text-on-surface-faint mt-1">
                          {new Date(res.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Bottom Feature Cards */}
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        {[
          { icon: History, title: 'History Log', desc: 'View your past readings and contributions to the archive.', color: 'text-on-surface-dim' },
          { icon: Package, title: 'Smart Pickup', desc: 'Available books can be collected from Locker 4B using your ID.', color: 'text-primary' },
          { icon: BarChart3, title: 'Supply Stats', desc: "Currently 89% of the 'Design' category is in circulation.", color: 'text-on-surface-dim' },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.6 + i * 0.1,
              type: 'spring',
              stiffness: 80,
              damping: 12,
            }}
            whileHover={{
              y: -4,
              scale: 1.02,
              transition: { type: 'spring', stiffness: 400, damping: 17 },
            }}
            className={`card hover:shadow-card-lift transition-shadow duration-300 cursor-pointer ${i === 1 ? 'bg-surface-container-high' : ''}`}
          >
            <card.icon size={24} className={`${card.color} mb-3`} />
            <h3 className="font-display font-bold text-headline-sm text-on-surface mb-1">{card.title}</h3>
            <p className="text-body-md text-on-surface-dim">{card.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
