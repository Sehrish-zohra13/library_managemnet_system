import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Users, Search, Filter, XCircle, CheckCircle, Clock, Bell, BookOpen, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 14 },
  },
};

export default function AdminReservations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (user?.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    fetchReservations();
  }, [statusFilter]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      const res = await api.get('/reservations/all', { params });
      setReservations(res.data);
    } catch (err) {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/reservations/${id}/cancel`);
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (err) {
      toast.error('Failed to cancel reservation');
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Notified': return { label: 'Ready', color: 'bg-secondary/15 text-secondary', dotColor: 'bg-secondary', icon: Bell };
      case 'Active': return { label: 'Waiting', color: 'bg-primary/15 text-primary', dotColor: 'bg-primary', icon: Clock };
      case 'Fulfilled': return { label: 'Completed', color: 'bg-surface-container-high text-on-surface-dim', dotColor: 'bg-on-surface-dim', icon: CheckCircle };
      case 'Expired': return { label: 'Expired', color: 'bg-danger/15 text-danger', dotColor: 'bg-danger', icon: AlertTriangle };
      case 'Cancelled': return { label: 'Cancelled', color: 'bg-surface-container-high text-on-surface-faint', dotColor: 'bg-on-surface-faint', icon: XCircle };
      default: return { label: status, color: 'bg-surface-container text-on-surface-dim', dotColor: 'bg-on-surface-dim', icon: Clock };
    }
  };

  const filteredReservations = searchQuery
    ? reservations.filter(r =>
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.usn?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : reservations;

  const stats = {
    total: reservations.length,
    active: reservations.filter(r => r.status === 'Active').length,
    notified: reservations.filter(r => r.status === 'Notified').length,
    expired: reservations.filter(r => r.status === 'Expired').length,
  };

  const statusFilters = ['All', 'Active', 'Notified', 'Fulfilled', 'Expired', 'Cancelled'];

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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <motion.div variants={staggerItem}>
          <h1 className="font-display font-bold text-display-sm text-on-surface">
            Reservation <span className="gradient-text">Management</span>
          </h1>
          <p className="text-body-md text-on-surface-dim mt-1 max-w-lg">
            Monitor and manage all book reservations across the library system.
          </p>
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card py-4 px-5 text-center hover:shadow-card-lift transition-shadow duration-300"
        >
          <CalendarClock size={24} className="text-primary mx-auto mb-2" />
          <p className="font-display font-bold text-display-sm text-on-surface">
            <AnimatedNumber value={stats.total} />
          </p>
          <p className="text-label-sm text-on-surface-faint uppercase">Total</p>
        </motion.div>
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card py-4 px-5 text-center hover:shadow-card-lift transition-shadow duration-300"
        >
          <Clock size={24} className="text-primary mx-auto mb-2" />
          <p className="font-display font-bold text-display-sm text-primary">
            <AnimatedNumber value={stats.active} />
          </p>
          <p className="text-label-sm text-on-surface-faint uppercase">Waiting</p>
        </motion.div>
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card py-4 px-5 text-center hover:shadow-card-lift transition-shadow duration-300"
        >
          <Bell size={24} className="text-secondary mx-auto mb-2" />
          <p className="font-display font-bold text-display-sm text-secondary">
            <AnimatedNumber value={stats.notified} />
          </p>
          <p className="text-label-sm text-on-surface-faint uppercase">Notified</p>
        </motion.div>
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card py-4 px-5 text-center hover:shadow-card-lift transition-shadow duration-300"
        >
          <AlertTriangle size={24} className="text-danger mx-auto mb-2" />
          <p className="font-display font-bold text-display-sm text-danger">
            <AnimatedNumber value={stats.expired} />
          </p>
          <p className="text-label-sm text-on-surface-faint uppercase">Expired</p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-label-md text-on-surface-faint uppercase tracking-wider mr-1">Status:</span>
          {statusFilters.map((status) => (
            <motion.button
              key={status}
              whileTap={{ scale: 0.93 }}
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? 'chip-active' : 'chip-inactive'}
            >
              {status}
            </motion.button>
          ))}
        </div>
        <div className="relative input-focus-glow">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchFocused ? 'text-primary' : 'text-on-surface-faint'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search by book, student, USN..."
            className="bg-surface-container-low text-on-surface text-body-sm py-2 pl-9 pr-4 rounded-lg
                       outline-none placeholder:text-on-surface-faint border border-transparent
                       focus:border-primary/30 focus:shadow-glow-input w-64 transition-all duration-300"
          />
        </div>
      </motion.div>

      {/* Reservations Table */}
      <motion.div variants={staggerItem} className="card p-2">
        {/* Table Header */}
        <div className="hidden md:flex items-center gap-4 px-4 py-3 text-label-md">
          <div className="w-10" />
          <div className="flex-1 table-header">Book</div>
          <div className="w-40 table-header">Student</div>
          <div className="w-20 text-center table-header">Queue #</div>
          <div className="w-28 text-center table-header">Status</div>
          <div className="w-32 table-header">Date</div>
          <div className="w-24 text-center table-header">Actions</div>
        </div>

        {loading ? (
          <SkeletonLoader type="row" count={6} />
        ) : filteredReservations.length > 0 ? (
          <div className="divide-y divide-outline-variant/10">
            {filteredReservations.map((res, i) => {
              const statusConfig = getStatusConfig(res.status);
              return (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.03,
                    type: 'spring',
                    stiffness: 120,
                    damping: 16,
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(31, 43, 73, 0.5)',
                    transition: { type: 'spring', stiffness: 300, damping: 20 },
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200"
                >
                  {/* Book icon */}
                  <div className="w-10 h-14 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center text-lg overflow-hidden">
                    {res.cover_url ? (
                      <img src={res.cover_url} alt={res.title} className="w-full h-full object-cover" />
                    ) : '📚'}
                  </div>

                  {/* Book info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-body-md font-semibold text-on-surface truncate">{res.title}</h3>
                    <p className="text-body-sm text-on-surface-dim">{res.author}</p>
                  </div>

                  {/* Student */}
                  <div className="hidden md:block w-40">
                    <p className="text-body-md text-on-surface truncate">{res.user_name}</p>
                    <p className="text-body-sm text-on-surface-faint">{res.usn || res.email}</p>
                  </div>

                  {/* Queue position */}
                  <div className="hidden md:block w-20 text-center">
                    {res.status === 'Active' || res.status === 'Notified' ? (
                      <span className="font-display font-bold text-headline-sm text-primary">
                        #{res.current_position}
                      </span>
                    ) : (
                      <span className="text-body-sm text-on-surface-faint">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="hidden sm:flex w-28 justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase ${statusConfig.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="hidden md:block w-32">
                    <p className="text-body-sm text-on-surface-dim">
                      {new Date(res.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {res.notified_at && (
                      <p className="text-body-sm text-secondary">
                        Notified: {new Date(res.notified_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 w-24 text-center">
                    {(res.status === 'Active' || res.status === 'Notified') ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCancel(res.id)}
                        className="text-body-sm font-medium px-3 py-1.5 rounded-lg
                                   bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                      >
                        Cancel
                      </motion.button>
                    ) : (
                      <span className="text-body-sm text-on-surface-faint">—</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <CalendarClock size={48} className="mx-auto text-on-surface-faint mb-4" />
            <p className="text-headline-sm text-on-surface-dim">No reservations found</p>
            <p className="text-body-md text-on-surface-faint mt-1">
              {statusFilter !== 'All' ? 'Try a different status filter' : 'No reservations in the system yet'}
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
