import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, FileText, TrendingUp, CheckCircle, XCircle, Activity, Package, Mail, Plus, CalendarClock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 14 },
  },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [fineRequests, setFineRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (user?.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, activityRes, finesRes, analyticsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/recent-activity'),
        api.get('/fines/requests'),
        api.get('/admin/analytics'),
      ]);
      setStats(statsRes.data);
      setRecentActivity(activityRes.data);
      setFineRequests(finesRes.data.filter(r => r.status === 'Pending'));
      setAnalytics(analyticsRes.data);
      setTimeout(() => setChartReady(true), 500);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleFineRequest = async (id, status) => {
    try {
      await api.put(`/fines/requests/${id}`, { status });
      toast.success(`Request ${status.toLowerCase()}`);
      setFineRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      toast.error('Failed to update request');
    }
  };

  const getTimeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 60) return `${mins} minutes ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  if (loading) return <SkeletonLoader type="stat" count={4} />;

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
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Collection - Large Card */}
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.01, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card p-6 hover:shadow-card-lift transition-shadow duration-300"
        >
          <p className="text-label-md text-on-surface-faint uppercase tracking-wider mb-2">Total Collection</p>
          <div className="flex items-baseline gap-3">
            <p className="font-display font-bold text-display-md text-on-surface">
              <AnimatedNumber value={stats?.totalBooks || 0} />
            </p>
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 120, damping: 14 }}
              className="text-secondary text-body-md font-medium"
            >
              +12%
            </motion.span>
          </div>
          <div className="flex gap-2 mt-4">
            <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-label-sm font-semibold">
              {Math.floor((stats?.totalBooks || 0) * 0.34).toLocaleString()} Physical
            </span>
            <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary text-label-sm font-semibold">
              {Math.floor((stats?.totalBooks || 0) * 0.66).toLocaleString()} Digital
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card p-6 flex flex-col items-center justify-center text-center hover:shadow-card-lift transition-shadow duration-300"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 10 }}
          >
            <Users size={28} className="text-primary mb-2" />
          </motion.div>
          <p className="font-display font-bold text-display-sm text-on-surface">
            <AnimatedNumber value={stats?.activeLoans || 0} />
          </p>
          <p className="text-label-md text-on-surface-faint uppercase">Active Loans</p>
        </motion.div>

        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card p-6 flex flex-col items-center justify-center text-center hover:shadow-card-lift transition-shadow duration-300 cursor-pointer"
          onClick={() => navigate('/admin/fines')}
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 200, damping: 10 }}
          >
            <FileText size={28} className="text-secondary mb-2" />
          </motion.div>
          <p className="font-display font-bold text-display-sm text-on-surface">
            <AnimatedNumber value={stats?.pendingRequests || 0} />
          </p>
          <p className="text-label-md text-on-surface-faint uppercase">Pending Requests</p>
        </motion.div>

        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card p-6 flex flex-col items-center justify-center text-center hover:shadow-card-lift transition-shadow duration-300 cursor-pointer"
          onClick={() => navigate('/admin/reservations')}
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 10 }}
          >
            <CalendarClock size={28} className="text-primary mb-2" />
          </motion.div>
          <p className="font-display font-bold text-display-sm text-on-surface">
            <AnimatedNumber value={stats?.activeReservations || 0} />
          </p>
          <p className="text-label-md text-on-surface-faint uppercase">Reservations</p>
        </motion.div>
      </div>

      {/* Curator Logs + Fee Waiver Requests */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Curator Logs */}
        <motion.div
          variants={staggerItem}
          className="lg:col-span-3 card"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-headline-sm text-on-surface">Curator Logs</h2>
            <button className="text-body-sm text-primary font-medium hover:underline">View All History</button>
          </div>
          <div className="space-y-1 loom-scroll max-h-[400px] overflow-y-auto">
            {recentActivity.map((act, i) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.2 + i * 0.05,
                  type: 'spring',
                  stiffness: 120,
                  damping: 14,
                }}
                whileHover={{
                  backgroundColor: 'rgba(31, 43, 73, 0.5)',
                  x: 3,
                  transition: { type: 'spring', stiffness: 300, damping: 20 },
                }}
                className="flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer"
              >
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.05, type: 'spring', stiffness: 200, damping: 10 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${act.status === 'Issued' ? 'bg-primary/15' : act.status === 'Returned' ? 'bg-secondary/15' : 'bg-danger/15'}`}
                >
                  {act.status === 'Issued' ? <BookOpen size={16} className="text-primary" /> :
                   act.status === 'Returned' ? <CheckCircle size={16} className="text-secondary" /> :
                   <Activity size={16} className="text-danger" />}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md text-on-surface">
                    <span className="font-semibold">{act.user_name}</span>
                    {' '}{act.status === 'Issued' ? 'issued' : act.status === 'Returned' ? 'returned' : 'overdue on'}
                    {' '}<span className="italic text-primary">"{act.title}"</span>
                  </p>
                  <p className="text-body-sm text-on-surface-faint">
                    {getTimeAgo(act.created_at)} • FL{act.floor_num}-R{act.row_num}
                  </p>
                </div>
                <span className="text-on-surface-faint">›</span>
              </motion.div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-center py-8 text-body-md text-on-surface-dim">No recent activity</p>
            )}
          </div>
        </motion.div>

        {/* Fee Waiver Requests */}
        <motion.div
          variants={staggerItem}
          className="lg:col-span-2 space-y-4"
        >
          <h2 className="font-display font-bold text-headline-sm text-on-surface">Fee Waiver Requests</h2>
          {fineRequests.length > 0 ? fineRequests.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.3 + i * 0.1,
                type: 'spring',
                stiffness: 100,
                damping: 14,
              }}
              whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
              className="card-elevated"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-body-lg font-semibold text-on-surface">{req.user_name}</p>
                  <p className="text-body-sm text-on-surface-faint">ID: {req.usn || 'N/A'}</p>
                </div>
                <p className="font-display font-bold text-headline-sm text-danger">${parseFloat(req.fine).toFixed(2)}</p>
              </div>
              <p className="text-body-md text-on-surface-dim mb-4 leading-relaxed">
                "{req.reason}"
              </p>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleFineRequest(req.id, 'Approved')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                           bg-secondary/15 text-secondary font-semibold text-body-md
                           hover:bg-secondary/25 transition-colors"
                >
                  <CheckCircle size={16} /> Approve
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleFineRequest(req.id, 'Rejected')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                           bg-danger/15 text-danger font-semibold text-body-md
                           hover:bg-danger/25 transition-colors"
                >
                  <XCircle size={16} /> Reject
                </motion.button>
              </div>
            </motion.div>
          )) : (
            <div className="card text-center py-8">
              <CheckCircle size={32} className="mx-auto text-secondary mb-2" />
              <p className="text-body-md text-on-surface-dim">No pending requests</p>
            </div>
          )}

          {/* Librarian Toolbox */}
          <motion.div
            variants={staggerItem}
            className="card"
          >
            <p className="text-label-md text-on-surface-faint uppercase tracking-wider mb-3">Librarian Toolbox</p>
            <div className="space-y-2">
              <motion.button
                whileHover={{ x: 4, backgroundColor: 'rgba(31, 43, 73, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
              >
                <Package size={18} className="text-on-surface-dim" />
                <span className="text-body-md text-on-surface">Batch Inventory Check</span>
              </motion.button>
              <motion.button
                whileHover={{ x: 4, backgroundColor: 'rgba(31, 43, 73, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
              >
                <Mail size={18} className="text-on-surface-dim" />
                <span className="text-body-md text-on-surface">Broadcast Announcement</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Analytics Charts */}
      {analytics && (
        <motion.div
          variants={staggerItem}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-headline-sm text-on-surface">Most Borrowed Books</h2>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/admin/books')}
              className="text-body-sm text-primary font-medium hover:underline"
            >
              Manage Inventory →
            </motion.button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartReady ? analytics.popular?.slice(0, 8) : analytics.popular?.slice(0, 8).map(d => ({ ...d, borrow_count: 0 }))} layout="vertical" barSize={20}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="title" width={180}
                  tick={{ fill: '#9ca3bf', fontSize: 12 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0f1930',
                    border: '1px solid rgba(64,72,93,0.3)',
                    borderRadius: '12px',
                    color: '#dee5ff',
                  }}
                  cursor={{ fill: 'rgba(139, 124, 247, 0.05)' }}
                  animationDuration={300}
                />
                <Bar dataKey="borrow_count" radius={[0, 6, 6, 0]} animationDuration={1200} animationEasing="ease-out">
                  {analytics.popular?.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={i < 3 ? '#8b7cf7' : '#1f2b49'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
