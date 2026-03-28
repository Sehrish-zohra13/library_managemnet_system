import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Edit3, BookOpen, DollarSign, CalendarDays, Shield, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 14 },
  },
};

export default function UserProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [totalFine, setTotalFine] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', department: '' });
  const [historyFilter, setHistoryFilter] = useState('all');

  useEffect(() => {
    if (user) {
      setEditForm({ name: user.name || '', department: user.department || '' });
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [issuesRes, resRes, finesRes] = await Promise.all([
        api.get('/issues/my'),
        api.get('/reservations/my'),
        api.get('/fines/my'),
      ]);
      setIssues(issuesRes.data || []);
      setReservations(resRes.data || []);
      setTotalFine(finesRes.data?.totalFine || 0);
    } catch (err) {
      console.error('Profile data error:', err);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    try {
      const res = await api.put('/auth/profile', editForm);
      updateUser(res.data);
      setEditModal(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const activeIssues = issues.filter(i => i.status === 'Issued' || i.status === 'Overdue');
  const returnedIssues = issues.filter(i => i.status === 'Returned');
  const filteredHistory = historyFilter === 'all' ? issues : issues.filter(i => {
    const year = new Date(i.issue_date).getFullYear();
    return year.toString() === historyFilter;
  });

  const getDaysLeft = (dueDate) => Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));

  if (loading) return <SkeletonLoader type="card" count={3} />;

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
      {/* Profile Header */}
      <motion.div variants={staggerItem} className="card p-8 flex flex-col md:flex-row items-start gap-6">
        <motion.div
          className="relative"
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 12 }}
        >
          <div className="w-28 h-28 rounded-2xl bg-primary-gradient flex items-center justify-center">
            <User size={48} className="text-white" />
          </div>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 10 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-primary text-white text-label-sm font-semibold uppercase"
          >
            {user?.role === 'Admin' ? 'Admin' : 'Student'}
          </motion.span>
        </motion.div>
        <div className="flex-1">
          <h1 className="font-display font-bold text-display-sm text-on-surface">{user?.name}</h1>
          <p className="text-body-md text-on-surface-dim mt-1">
            {user?.department || 'Department'} • ID: #{user?.usn || user?.email}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 120, damping: 14 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-body-sm"
            >
              <CheckCircle size={14} /> Verified Account
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 120, damping: 14 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-body-sm"
            >
              <BookOpen size={14} /> Borrow Limit: {user?.borrow_limit || 3} books
            </motion.span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setEditForm({ name: user?.name || '', department: user?.department || '' }); setEditModal(true); }}
          className="btn-secondary flex items-center gap-2 text-body-md"
        >
          <Edit3 size={16} /> Edit Profile
        </motion.button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Currently Borrowed */}
        <motion.div variants={staggerItem} className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-headline-sm text-on-surface">Currently Borrowed</h2>
              <p className="text-body-sm text-on-surface-dim">Manage your active readings and due dates</p>
            </div>
            <BookOpen size={20} className="text-on-surface-faint" />
          </div>
          {activeIssues.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {activeIssues.map((issue, i) => {
                const daysLeft = getDaysLeft(issue.due_date);
                const progress = Math.max(0, Math.min(100, ((14 - daysLeft) / 14) * 100));
                return (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 120, damping: 14 }}
                    whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-low"
                  >
                    <div className="w-14 h-20 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center text-xl">📚</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-md font-semibold text-on-surface truncate">{issue.title}</p>
                      <p className="text-body-sm text-on-surface-dim">by {issue.author}</p>
                      <div className="mt-2 flex justify-between text-body-sm">
                        <span className={daysLeft > 0 ? 'text-primary' : 'text-danger'}>
                          {daysLeft > 0 ? `DUE IN ${daysLeft} DAYS` : `OVERDUE`}
                        </span>
                        <span className="text-on-surface-faint">
                          RETURN BY {new Date(issue.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full rounded-full ${daysLeft <= 3 ? 'bg-danger' : 'bg-primary'}`}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <BookOpen size={40} className="mx-auto text-on-surface-faint mb-3" />
              <p className="text-body-md text-on-surface-dim">No active loans</p>
              <button onClick={() => navigate('/books')} className="text-primary text-body-md mt-2">Search for books →</button>
            </div>
          )}
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Fines */}
          <motion.div variants={staggerItem} className="card">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={18} className="text-danger" />
              <h3 className="font-display font-bold text-headline-sm text-on-surface">Fines & Balance</h3>
            </div>
            <p className="font-display font-bold text-display-sm text-on-surface">
              $<AnimatedNumber value={totalFine || 0} />
            </p>
            <p className="text-label-md text-on-surface-faint uppercase mb-4">Outstanding Balance</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/fines')} className="btn-secondary w-full text-body-md">Pay Dues</motion.button>
          </motion.div>

          {/* Reservations */}
          <motion.div variants={staggerItem} className="card">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={18} className="text-primary" />
              <h3 className="font-display font-bold text-headline-sm text-on-surface">Reservations</h3>
            </div>
            {reservations.length > 0 ? reservations.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 120, damping: 14 }}
                className="flex items-center gap-3 py-2"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-sm">📖</div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-medium text-on-surface truncate">{r.title}</p>
                  <p className="text-body-sm text-secondary">Position: {r.current_position} in queue</p>
                </div>
              </motion.div>
            )) : (
              <p className="text-body-sm text-on-surface-dim">No active reservations</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Lending Archive */}
      <motion.div variants={staggerItem} className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-headline-sm text-on-surface">Lending Archive</h2>
          <div className="flex gap-1">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setHistoryFilter('all')} className={historyFilter === 'all' ? 'chip-active' : 'chip-inactive'}>All History</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setHistoryFilter(new Date().getFullYear().toString())} className={historyFilter === new Date().getFullYear().toString() ? 'chip-active' : 'chip-inactive'}>{new Date().getFullYear()} Only</motion.button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="table-header py-3 px-4">Title & ISBN</th>
                <th className="table-header py-3 px-4">Issued Date</th>
                <th className="table-header py-3 px-4">Returned Date</th>
                <th className="table-header py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((issue, i) => (
                <motion.tr
                  key={issue.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.04, type: 'spring', stiffness: 120, damping: 16 }}
                  className="table-row"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-surface-container-high flex-shrink-0" />
                      <div>
                        <p className="text-body-md font-medium text-on-surface">{issue.title}</p>
                        <p className="text-body-sm text-on-surface-faint">{issue.isbn || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-body-md text-on-surface-dim">
                    {new Date(issue.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-body-md text-on-surface-dim">
                    {issue.return_date ? new Date(issue.return_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-label-sm font-semibold uppercase px-2 py-0.5 rounded-md
                      ${issue.status === 'Returned' ? 'bg-secondary/15 text-secondary' : ''}
                      ${issue.status === 'Issued' ? 'bg-primary/15 text-primary' : ''}
                      ${issue.status === 'Overdue' ? 'bg-danger/15 text-danger' : ''}
                    `}>{issue.status}{issue.status === 'Overdue' && parseFloat(issue.fine) > 0 ? ` ($${parseFloat(issue.fine).toFixed(2)})` : ''}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredHistory.length === 0 && (
          <p className="text-center py-8 text-body-md text-on-surface-dim">No history records found</p>
        )}
      </motion.div>

      {/* Footer Stats */}
      <motion.div variants={staggerItem} className="flex flex-wrap gap-8 items-center py-4">
        <div>
          <p className="font-display font-bold text-display-sm text-on-surface">
            <AnimatedNumber value={issues.length} />
          </p>
          <p className="text-label-md text-on-surface-faint uppercase">Books Read</p>
        </div>
        <div>
          <p className="font-display font-bold text-display-sm text-on-surface">
            <AnimatedNumber value={reservations.length} />
          </p>
          <p className="text-label-md text-on-surface-faint uppercase">Reservations</p>
        </div>
        <div>
          <p className="font-display font-bold text-display-sm text-on-surface">
            <AnimatedNumber value={issues.length > 0 ? Math.round((returnedIssues.length / issues.length) * 100) : 100} suffix="%" />
          </p>
          <p className="text-label-md text-on-surface-faint uppercase">Return Score</p>
        </div>
      </motion.div>

      {/* Edit Profile Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Profile">
        <div className="space-y-4">
          <div>
            <label className="text-label-md text-on-surface-faint uppercase block mb-1.5">Name</label>
            <div className="input-focus-glow">
              <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-label-md text-on-surface-faint uppercase block mb-1.5">Department</label>
            <div className="input-focus-glow">
              <input type="text" value={editForm.department || ''} onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEditModal(false)} className="btn-secondary flex-1">Cancel</motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleEditProfile} className="btn-primary flex-1">Save Changes</motion.button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
