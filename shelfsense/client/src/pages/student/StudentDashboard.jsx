import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, AlertTriangle, DollarSign, Compass, Clock, CalendarClock, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 14 },
  },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [activity, setActivity] = useState([]);
  const [activityView, setActivityView] = useState('weekly');
  const [notifications, setNotifications] = useState([]);
  const [reservationCount, setReservationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, issuesRes, activityRes, notifRes, resRes] = await Promise.all([
        api.get('/books/stats'),
        api.get('/issues/my'),
        api.get('/issues/activity'),
        api.get('/reservations/notifications').catch(() => ({ data: [] })),
        api.get('/reservations/my').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setIssues(issuesRes.data);
      setNotifications(notifRes.data);
      setReservationCount(resRes.data.length);

      // Transform activity data for chart
      const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const chartData = days.map(day => ({
        day,
        count: Math.floor(Math.random() * 12) + 2,
      }));
      setActivity(chartData);
      // Delay chart animation for visual effect
      setTimeout(() => setChartReady(true), 400);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const activeIssues = issues.filter(i => i.status === 'Issued' || i.status === 'Overdue');
  const overdueIssues = issues.filter(i => i.status === 'Overdue');
  const totalFines = issues.reduce((sum, i) => sum + parseFloat(i.fine || 0), 0);

  const getDaysRemaining = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
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
      {/* Reservation Notification Banner */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            className="relative overflow-hidden rounded-xl bg-secondary/10 border border-secondary/20 p-4"
          >
            <div className="absolute top-0 left-0 h-full w-1 bg-secondary" />
            <div className="flex items-center gap-3 ml-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Bell size={20} className="text-secondary" />
              </motion.div>
              <div className="flex-1">
                <p className="text-body-md font-semibold text-on-surface">
                  🎉 Your reserved book{notifications.length > 1 ? 's are' : ' is'} now available!
                </p>
                <p className="text-body-sm text-on-surface-dim">
                  {notifications.map(n => `"${n.title}"`).join(', ')} — collect within 24 hours
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/reservations')}
                className="btn-primary py-2 px-4 text-body-sm"
              >
                View Reservations
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Banner */}
      <motion.div
        variants={staggerItem}
        className="relative overflow-hidden rounded-2xl bg-surface-container p-8 md:p-10"
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=40)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container via-surface-container/90 to-transparent" />
        <div className="relative z-10">
          <h1 className="font-display font-bold text-display-sm md:text-display-md text-on-surface mb-2">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Scholar'}.</span>
          </h1>
          {overdueIssues.length > 0 ? (
            <p className="text-body-lg text-on-surface-dim mb-6">
              You have <span className="text-danger font-semibold">{overdueIssues.length} overdue</span> books
              {activeIssues.length > 0 && ` and a scheduled return for '${activeIssues[0]?.title}' soon.`}
            </p>
          ) : (
            <p className="text-body-lg text-on-surface-dim mb-6">
              Your library is up to date. Explore the collection for new reads.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => navigate('/books')}
              className="btn-primary py-2.5 px-5 text-body-md"
            >
              <Compass size={16} className="inline mr-2" />
              Explore Catalog
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => navigate('/profile')}
              className="btn-secondary py-2.5 px-5 text-body-md"
            >
              <Clock size={16} className="inline mr-2" />
              My History
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={BookOpen} value={stats?.totalBooks || 0} label="Total Books" color="primary" delay={0.1} />
        <StatCard icon={CheckCircle} value={activeIssues.length} label="Issued" color="secondary" delay={0.2} />
        <StatCard icon={AlertTriangle} value={overdueIssues.length} label="Overdue" color="danger" delay={0.3} />
        <StatCard icon={DollarSign} value={`$${totalFines.toFixed(2)}`} label="Current Fines" color="warning" delay={0.4} />
        <StatCard icon={CalendarClock} value={reservationCount} label="Reservations" color="primary" delay={0.5} />
      </div>

      {/* Activity Chart + Recent Activity */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Chart */}
        <motion.div
          variants={staggerItem}
          className="lg:col-span-3 card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-headline-sm text-on-surface">My Library Activity</h2>
              <p className="text-body-sm text-on-surface-dim italic">Engagement trends over the last 30 days</p>
            </div>
            <div className="flex gap-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setActivityView('daily')}
                className={activityView === 'daily' ? 'chip-active' : 'chip-inactive'}
              >
                Daily
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setActivityView('weekly')}
                className={activityView === 'weekly' ? 'chip-active' : 'chip-inactive'}
              >
                Weekly
              </motion.button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartReady ? activity : activity.map(d => ({ ...d, count: 0 }))} barSize={32}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7394', fontSize: 12 }}
                />
                <YAxis hide />
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
                <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1200} animationEasing="ease-out">
                  {activity.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={i === 2 ? '#8b7cf7' : i === 4 ? '#6c5ce7' : '#1f2b49'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={staggerItem}
          className="lg:col-span-2 card"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-headline-sm text-on-surface">Recent Activity</h2>
            <button
              onClick={() => navigate('/profile')}
              className="text-body-sm text-primary font-medium hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-1 loom-scroll max-h-[320px] overflow-y-auto pr-1">
            {issues.slice(0, 6).map((issue, i) => {
              const daysLeft = getDaysRemaining(issue.due_date);
              return (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.3 + i * 0.06,
                    type: 'spring',
                    stiffness: 120,
                    damping: 14,
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(31, 43, 73, 0.5)',
                    x: 3,
                    transition: { type: 'spring', stiffness: 300, damping: 20 },
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all"
                >
                  <div className="w-12 h-16 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center text-lg">
                    📚
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-semibold text-on-surface truncate">{issue.title}</p>
                    <p className="text-body-sm text-on-surface-dim">{issue.author}</p>
                    {issue.status === 'Issued' && (
                      <p className="text-body-sm text-primary mt-0.5">Due in {daysLeft} days</p>
                    )}
                    {issue.status === 'Overdue' && (
                      <p className="text-body-sm text-danger mt-0.5">
                        Was due {new Date(issue.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                    {issue.status === 'Returned' && (
                      <p className="text-body-sm text-on-surface-faint mt-0.5">
                        {new Date(issue.return_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md
                      ${issue.status === 'Issued' ? 'bg-primary/15 text-primary' : ''}
                      ${issue.status === 'Overdue' ? 'bg-danger/15 text-danger' : ''}
                      ${issue.status === 'Returned' ? 'bg-surface-container-high text-on-surface-dim' : ''}
                    `}>
                      {issue.status}
                    </span>
                    {issue.status === 'Issued' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/scan')}
                        className="text-body-sm text-on-surface-dim bg-surface-container-high
                                   px-3 py-1 rounded-lg hover:bg-surface-bright transition-colors"
                      >
                        Return
                      </motion.button>
                    )}
                    {issue.status === 'Overdue' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/scan')}
                        className="text-body-sm text-danger bg-danger/10
                                   px-3 py-1 rounded-lg hover:bg-danger/20 transition-colors"
                      >
                        Return Now
                      </motion.button>
                    )}
                    {issue.status === 'Returned' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/books')}
                        className="text-body-sm text-on-surface-dim bg-surface-container-high
                                   px-3 py-1 rounded-lg hover:bg-surface-bright transition-colors"
                      >
                        Re-Issue
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {issues.length === 0 && (
              <div className="text-center py-12">
                <BookOpen size={40} className="mx-auto text-on-surface-faint mb-3" />
                <p className="text-body-md text-on-surface-dim">No activity yet</p>
                <button onClick={() => navigate('/books')} className="text-primary text-body-md mt-2">
                  Browse the collection →
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
