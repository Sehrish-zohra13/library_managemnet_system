import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, DollarSign, FileText, User,
  AlertTriangle, Search, Filter, MessageSquare, BookOpen, Shield
} from 'lucide-react';
import api from '../../services/api';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 14 },
  },
};

const statusConfig = {
  Pending: { color: 'text-amber-400', bg: 'bg-amber-400/15', border: 'border-amber-400/20', icon: Clock, label: 'Pending' },
  Approved: { color: 'text-secondary', bg: 'bg-secondary/15', border: 'border-secondary/20', icon: CheckCircle, label: 'Approved' },
  Rejected: { color: 'text-danger', bg: 'bg-danger/15', border: 'border-danger/20', icon: XCircle, label: 'Rejected' },
};

export default function AdminFineRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionModal, setActionModal] = useState(null); // { request, action: 'Approved' | 'Rejected' }
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/fines/requests');
      setRequests(res.data || []);
    } catch (err) {
      toast.error('Failed to load fine requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setProcessing(true);
    try {
      await api.put(`/fines/requests/${actionModal.request.id}`, {
        status: actionModal.action,
        admin_note: adminNote.trim() || null,
      });
      toast.success(`Request ${actionModal.action.toLowerCase()} successfully`);
      setRequests(prev =>
        prev.map(r =>
          r.id === actionModal.request.id
            ? { ...r, status: actionModal.action, admin_note: adminNote.trim() || null }
            : r
        )
      );
      setActionModal(null);
      setAdminNote('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process request');
    } finally {
      setProcessing(false);
    }
  };

  const quickAction = async (id, status) => {
    try {
      await api.put(`/fines/requests/${id}`, { status });
      toast.success(`Request ${status.toLowerCase()}`);
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status } : r)
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process');
    }
  };

  const filteredRequests = requests
    .filter(r => filter === 'All' || r.status === filter)
    .filter(r => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (r.user_name || '').toLowerCase().includes(q) ||
        (r.usn || '').toLowerCase().includes(q) ||
        (r.book_title || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q)
      );
    });

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;
  const totalWaivedAmount = requests
    .filter(r => r.status === 'Approved')
    .reduce((sum, r) => sum + parseFloat(r.fine || 0), 0);

  if (loading) return <SkeletonLoader type="card" count={4} />;

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
      <motion.div variants={staggerItem}>
        <h1 className="font-display font-bold text-display-sm text-on-surface">Fine Waiver Requests</h1>
        <p className="text-body-md text-on-surface-dim mt-1">Review and manage student fine waiver petitions</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card p-5 flex flex-col items-center text-center hover:shadow-card-lift transition-shadow duration-300"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          >
            <Clock size={24} className="text-amber-400 mb-2" />
          </motion.div>
          <p className="font-display font-bold text-display-sm text-on-surface">
            <AnimatedNumber value={pendingCount} />
          </p>
          <p className="text-label-md text-on-surface-faint uppercase">Pending</p>
        </motion.div>

        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card p-5 flex flex-col items-center text-center hover:shadow-card-lift transition-shadow duration-300"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.05, type: 'spring', stiffness: 200, damping: 10 }}
          >
            <CheckCircle size={24} className="text-secondary mb-2" />
          </motion.div>
          <p className="font-display font-bold text-display-sm text-on-surface">
            <AnimatedNumber value={approvedCount} />
          </p>
          <p className="text-label-md text-on-surface-faint uppercase">Approved</p>
        </motion.div>

        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card p-5 flex flex-col items-center text-center hover:shadow-card-lift transition-shadow duration-300"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 10 }}
          >
            <XCircle size={24} className="text-danger mb-2" />
          </motion.div>
          <p className="font-display font-bold text-display-sm text-on-surface">
            <AnimatedNumber value={rejectedCount} />
          </p>
          <p className="text-label-md text-on-surface-faint uppercase">Rejected</p>
        </motion.div>

        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card p-5 flex flex-col items-center text-center hover:shadow-card-lift transition-shadow duration-300"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 10 }}
          >
            <DollarSign size={24} className="text-primary mb-2" />
          </motion.div>
          <p className="font-display font-bold text-display-sm text-on-surface">
            $<AnimatedNumber value={totalWaivedAmount} />
          </p>
          <p className="text-label-md text-on-surface-faint uppercase">Total Waived</p>
        </motion.div>
      </div>

      {/* Search & Filters */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student name, USN, or book..."
            className="input-field pl-10 w-full"
          />
        </div>
        <div className="flex gap-1">
          {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
            <motion.button
              key={f}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f)}
              className={filter === f ? 'chip-active' : 'chip-inactive'}
            >
              {f}
              {f === 'Pending' && pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-400/20 text-amber-400">
                  {pendingCount}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Request Cards */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req, i) => {
            const cfg = statusConfig[req.status];
            const StatusIcon = cfg.icon;
            const isPending = req.status === 'Pending';
            const daysOverdue = req.due_date
              ? Math.max(0, Math.ceil((new Date(req.issue_date ? req.return_date || new Date() : new Date()) - new Date(req.due_date)) / (1000 * 60 * 60 * 24)))
              : 0;

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.1 + i * 0.06,
                  type: 'spring',
                  stiffness: 120,
                  damping: 14,
                }}
                whileHover={{
                  y: -2,
                  transition: { type: 'spring', stiffness: 400, damping: 17 },
                }}
                className={`card-elevated hover:shadow-card-lift transition-shadow duration-300 ${
                  isPending ? 'border-l-4 border-l-amber-400/50' : ''
                }`}
              >
                {/* Top Row: User Info + Status + Fine */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-body-lg font-semibold text-on-surface">{req.user_name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon size={10} /> {req.status}
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-faint">USN: {req.usn || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-headline-md text-danger">
                      ${parseFloat(req.fine || 0).toFixed(2)}
                    </p>
                    <p className="text-label-sm text-on-surface-faint">Fine Amount</p>
                  </div>
                </div>

                {/* Book Details */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container/50 mb-3">
                  <div className="w-8 h-10 rounded bg-surface-container-high flex items-center justify-center text-sm flex-shrink-0">
                    📚
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-medium text-on-surface truncate">{req.book_title}</p>
                    <div className="flex items-center gap-2 text-body-sm text-on-surface-faint flex-wrap">
                      <span>Issued: {new Date(req.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span className="text-danger flex items-center gap-1">
                        <AlertTriangle size={10} /> Due: {new Date(req.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="p-3 rounded-lg bg-surface-container/30 mb-4">
                  <p className="text-label-sm text-on-surface-faint uppercase mb-1 flex items-center gap-1">
                    <MessageSquare size={10} /> Student's Reason
                  </p>
                  <p className="text-body-md text-on-surface-dim leading-relaxed">"{req.reason}"</p>
                </div>

                {/* Admin Note (if already processed) */}
                {req.admin_note && !isPending && (
                  <div className={`p-3 rounded-lg mb-4 ${
                    req.status === 'Approved' ? 'bg-secondary/5 border border-secondary/15' : 'bg-danger/5 border border-danger/15'
                  }`}>
                    <p className="text-label-sm text-on-surface-faint uppercase mb-1 flex items-center gap-1">
                      <Shield size={10} /> Admin Note
                    </p>
                    <p className="text-body-md text-on-surface-dim leading-relaxed">"{req.admin_note}"</p>
                  </div>
                )}

                {/* Actions */}
                {isPending ? (
                  <div className="flex gap-2 mt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setActionModal({ request: req, action: 'Approved' }); setAdminNote(''); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                               bg-secondary/15 text-secondary font-semibold text-body-md
                               hover:bg-secondary/25 transition-colors"
                    >
                      <CheckCircle size={16} /> Approve
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setActionModal({ request: req, action: 'Rejected' }); setAdminNote(''); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                               bg-danger/15 text-danger font-semibold text-body-md
                               hover:bg-danger/25 transition-colors"
                    >
                      <XCircle size={16} /> Reject
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => quickAction(req.id, 'Approved')}
                      title="Quick Approve (no note)"
                      className="px-3 py-2.5 rounded-lg bg-surface-container-high text-on-surface-dim
                               hover:bg-secondary/15 hover:text-secondary transition-colors"
                    >
                      ⚡
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/10">
                    <p className="text-body-sm text-on-surface-faint">
                      Processed: {new Date(req.updated_at || req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${cfg.bg}`}>
                      <StatusIcon size={12} className={cfg.color} />
                      <span className={`text-label-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <motion.div
            variants={staggerItem}
            className="card text-center py-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
              <FileText size={48} className="mx-auto text-on-surface-faint mb-3" />
            </motion.div>
            <p className="text-headline-sm text-on-surface-dim font-display">
              {filter !== 'All' || searchQuery ? 'No matching requests' : 'No fine waiver requests'}
            </p>
            <p className="text-body-md text-on-surface-faint mt-1">
              {filter !== 'All' || searchQuery
                ? 'Try adjusting your filters or search terms'
                : 'Student waiver petitions will appear here'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setAdminNote(''); }}
        title={actionModal?.action === 'Approved' ? 'Approve Fine Waiver' : 'Reject Fine Waiver'}
      >
        {actionModal && (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              className="p-4 rounded-xl bg-surface-container"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-body-lg font-semibold text-on-surface">{actionModal.request.user_name}</h3>
                  <p className="text-body-sm text-on-surface-faint">USN: {actionModal.request.usn || 'N/A'}</p>
                </div>
                <p className="font-display font-bold text-headline-sm text-danger">
                  ${parseFloat(actionModal.request.fine || 0).toFixed(2)}
                </p>
              </div>
              <p className="text-body-sm text-on-surface-dim">
                Book: <span className="font-medium text-on-surface">{actionModal.request.book_title}</span>
              </p>
            </motion.div>

            <div className={`p-3 rounded-lg ${
              actionModal.action === 'Approved'
                ? 'bg-secondary/10 border border-secondary/20'
                : 'bg-danger/10 border border-danger/20'
            }`}>
              <p className={`text-body-md font-semibold ${
                actionModal.action === 'Approved' ? 'text-secondary' : 'text-danger'
              }`}>
                {actionModal.action === 'Approved'
                  ? '✅ This will waive the student\'s fine (set to $0.00)'
                  : '❌ The fine will remain active and the student will be notified'}
              </p>
            </div>

            <div>
              <label className="text-label-md text-on-surface-faint uppercase block mb-1.5">
                Admin Note (Optional)
              </label>
              <div className="input-focus-glow">
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={
                    actionModal.action === 'Approved'
                      ? 'e.g., Fine waived due to valid medical reason...'
                      : 'e.g., Insufficient justification for waiver...'
                  }
                  className="input-field resize-none"
                />
              </div>
              <p className="text-label-sm text-on-surface-faint mt-1 text-right">{adminNote.length}/500</p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setActionModal(null); setAdminNote(''); }}
                className="btn-secondary flex-1"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAction}
                disabled={processing}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-body-md transition-colors ${
                  actionModal.action === 'Approved'
                    ? 'bg-secondary text-white hover:bg-secondary/90'
                    : 'bg-danger text-white hover:bg-danger/90'
                }`}
              >
                {processing ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <>
                    {actionModal.action === 'Approved' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {actionModal.action === 'Approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
