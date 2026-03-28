import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, AlertTriangle, Send, CheckCircle, XCircle, Clock, FileText, Shield, Bell, History } from 'lucide-react';
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
  Pending: { color: 'text-amber-400', bg: 'bg-amber-400/15', icon: Clock, label: 'Pending Review' },
  Approved: { color: 'text-secondary', bg: 'bg-secondary/15', icon: CheckCircle, label: 'Waiver Approved' },
  Rejected: { color: 'text-danger', bg: 'bg-danger/15', icon: XCircle, label: 'Request Rejected' },
};

export default function FineManagement() {
  const [fines, setFines] = useState([]);
  const [totalFine, setTotalFine] = useState(0);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestModal, setRequestModal] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('fines');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [finesRes, requestsRes] = await Promise.all([
        api.get('/fines/my'),
        api.get('/fines/my-requests'),
      ]);
      setFines(finesRes.data?.fines || []);
      setTotalFine(finesRes.data?.totalFine || 0);
      setMyRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Fines error:', err);
      toast.error('Failed to load fines');
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async () => {
    if (!reason.trim()) { toast.error('Please provide a reason'); return; }
    setSubmitting(true);
    try {
      await api.post('/fines/request', { issue_id: requestModal.id, reason });
      toast.success('Fine waiver request submitted');
      setRequestModal(null);
      setReason('');
      fetchData(); // Refresh data
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const overdueItems = fines.filter(f => f.status === 'Overdue' || f.status === 'Issued');
  const paidItems = fines.filter(f => f.status === 'Returned');
  const recentDecisions = myRequests.filter(r => r.status !== 'Pending');
  const pendingRequests = myRequests.filter(r => r.status === 'Pending');

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
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="font-display font-bold text-display-sm text-on-surface">Fine Management</h1>
        <p className="text-body-md text-on-surface-dim mt-1">Track and manage your outstanding dues</p>
      </motion.div>

      {/* Notification Banners for recent decisions */}
      <AnimatePresence>
        {recentDecisions
          .filter(r => {
            const hoursSince = (Date.now() - new Date(r.updated_at || r.created_at)) / 3600000;
            return hoursSince < 72; // Show decisions from last 72 hours
          })
          .slice(0, 2)
          .map((req) => {
            const cfg = statusConfig[req.status];
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={`notif-${req.id}`}
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                className={`relative overflow-hidden rounded-xl ${cfg.bg} border ${
                  req.status === 'Approved' ? 'border-secondary/20' : 'border-danger/20'
                } p-4`}
              >
                <div className={`absolute top-0 left-0 h-full w-1 ${
                  req.status === 'Approved' ? 'bg-secondary' : 'bg-danger'
                }`} />
                <div className="flex items-center gap-3 ml-2">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Bell size={20} className={cfg.color} />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-body-md font-semibold text-on-surface">
                      {req.status === 'Approved'
                        ? `✅ Your fine waiver for "${req.book_title}" has been approved!`
                        : `❌ Your fine waiver for "${req.book_title}" was rejected.`}
                    </p>
                    {req.admin_note && (
                      <p className="text-body-sm text-on-surface-dim mt-0.5">
                        Admin note: "{req.admin_note}"
                      </p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${cfg.bg}`}>
                    <StatusIcon size={14} className={cfg.color} />
                    <span className={`text-label-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* Total Fine Card */}
      <motion.div
        variants={staggerItem}
        whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="card-elevated p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-card-lift transition-shadow duration-300"
      >
        <div className="flex items-center gap-5">
          <motion.div
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            className="w-16 h-16 rounded-2xl bg-danger/15 flex items-center justify-center"
          >
            <DollarSign size={32} className="text-danger" />
          </motion.div>
          <div>
            <p className="text-label-md text-on-surface-faint uppercase">Total Outstanding Fine</p>
            <p className="font-display font-bold text-display-md text-on-surface">
              $<AnimatedNumber value={totalFine || 0} />
            </p>
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="font-display font-bold text-headline-md text-danger">
              <AnimatedNumber value={overdueItems.length} />
            </p>
            <p className="text-label-sm text-on-surface-faint uppercase">Overdue Items</p>
          </div>
          <div>
            <p className="font-display font-bold text-headline-md text-amber-400">
              <AnimatedNumber value={pendingRequests.length} />
            </p>
            <p className="text-label-sm text-on-surface-faint uppercase">Pending Waivers</p>
          </div>
          <div>
            <p className="font-display font-bold text-headline-md text-secondary">
              <AnimatedNumber value={paidItems.length} />
            </p>
            <p className="text-label-sm text-on-surface-faint uppercase">Settled</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={staggerItem} className="flex gap-1">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('fines')}
          className={activeTab === 'fines' ? 'chip-active' : 'chip-inactive'}
        >
          <DollarSign size={14} className="inline mr-1" /> Outstanding Fines
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('requests')}
          className={activeTab === 'requests' ? 'chip-active' : 'chip-inactive'}
        >
          <FileText size={14} className="inline mr-1" /> My Waiver Requests
          {pendingRequests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-400/20 text-amber-400">
              {pendingRequests.length}
            </span>
          )}
        </motion.button>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'fines' ? (
          <motion.div
            key="fines-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            {/* Overdue Books */}
            <div>
              <h2 className="font-display font-bold text-headline-sm text-on-surface mb-4">Overdue Books</h2>
              {overdueItems.length > 0 ? (
                <div className="space-y-3">
                  {overdueItems.map((item, i) => {
                    const daysLate = Math.ceil((new Date() - new Date(item.due_date)) / (1000 * 60 * 60 * 24));
                    const hasWaiver = item.waiver_status;
                    const waiverCfg = hasWaiver ? statusConfig[item.waiver_status] : null;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
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
                        className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-card-lift transition-shadow duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 rounded-lg bg-surface-container-high flex items-center justify-center text-xl">📚</div>
                          <div>
                            <h3 className="text-body-lg font-semibold text-on-surface">{item.title}</h3>
                            <p className="text-body-sm text-on-surface-dim">{item.author}</p>
                            <div className="flex items-center gap-2 mt-1 text-body-sm flex-wrap">
                              <span className="text-danger flex items-center gap-1">
                                <AlertTriangle size={12} /> {daysLate > 0 ? `${daysLate} days overdue` : 'Due today'}
                              </span>
                              <span className="text-on-surface-faint">•</span>
                              <span className="text-on-surface-faint">
                                Due: {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              {hasWaiver && waiverCfg && (
                                <>
                                  <span className="text-on-surface-faint">•</span>
                                  <span className={`flex items-center gap-1 ${waiverCfg.color}`}>
                                    <waiverCfg.icon size={12} /> {waiverCfg.label}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-display font-bold text-headline-sm text-danger">${parseFloat(item.fine || 0).toFixed(2)}</p>
                            <p className="text-label-sm text-on-surface-faint">$2.50/day</p>
                          </div>
                          {!hasWaiver || item.waiver_status === 'Rejected' ? (
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setRequestModal(item)}
                              className="btn-secondary text-body-sm py-2 px-4 flex items-center gap-1.5"
                            >
                              <Send size={14} /> Request Waiver
                            </motion.button>
                          ) : item.waiver_status === 'Pending' ? (
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400/10 text-amber-400 text-body-sm font-semibold">
                              <Clock size={14} /> Under Review
                            </div>
                          ) : item.waiver_status === 'Approved' ? (
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary/10 text-secondary text-body-sm font-semibold">
                              <CheckCircle size={14} /> Waived
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  variants={staggerItem}
                  className="card text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  >
                    <CheckCircle size={48} className="mx-auto text-secondary mb-3" />
                  </motion.div>
                  <p className="text-headline-sm text-on-surface-dim font-display">All clear!</p>
                  <p className="text-body-md text-on-surface-faint mt-1">You have no outstanding fines</p>
                </motion.div>
              )}
            </div>

            {/* Recent Payments / History */}
            {paidItems.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display font-bold text-headline-sm text-on-surface mb-4">Recent Payments</h2>
                <div className="space-y-2">
                  {paidItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.2 + i * 0.05,
                        type: 'spring',
                        stiffness: 120,
                        damping: 16,
                      }}
                      whileHover={{
                        backgroundColor: 'rgba(15, 25, 48, 0.5)',
                        x: 3,
                        transition: { type: 'spring', stiffness: 300, damping: 20 },
                      }}
                      className="flex items-center justify-between p-4 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center">
                          <CheckCircle size={16} className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-body-md font-medium text-on-surface">{item.title}</p>
                          <p className="text-body-sm text-on-surface-faint">
                            Returned {item.return_date ? new Date(item.return_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.waiver_status === 'Approved' && (
                          <span className="text-label-sm font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-md">WAIVED</span>
                        )}
                        <span className="text-body-md font-semibold text-on-surface-dim">${parseFloat(item.fine || 0).toFixed(2)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="requests-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            className="space-y-4"
          >
            <h2 className="font-display font-bold text-headline-sm text-on-surface">Waiver Request History</h2>
            {myRequests.length > 0 ? (
              <div className="space-y-3">
                {myRequests.map((req, i) => {
                  const cfg = statusConfig[req.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: 0.08 + i * 0.06,
                        type: 'spring',
                        stiffness: 120,
                        damping: 14,
                      }}
                      whileHover={{
                        y: -2,
                        transition: { type: 'spring', stiffness: 400, damping: 17 },
                      }}
                      className="card hover:shadow-card-lift transition-shadow duration-300"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                            <StatusIcon size={20} className={cfg.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-body-lg font-semibold text-on-surface">{req.book_title}</h3>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${cfg.bg} ${cfg.color}`}>
                                <StatusIcon size={10} /> {req.status}
                              </span>
                            </div>
                            <p className="text-body-sm text-on-surface-dim">{req.book_author}</p>
                            <p className="text-body-sm text-on-surface-faint mt-1">
                              Submitted: {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-display font-bold text-headline-sm text-on-surface-dim">
                            ${parseFloat(req.amount || 0).toFixed(2)}
                          </p>
                          <p className="text-label-sm text-on-surface-faint">Fine Amount</p>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="mt-3 p-3 rounded-lg bg-surface-container/50">
                        <p className="text-label-sm text-on-surface-faint uppercase mb-1">Your Reason</p>
                        <p className="text-body-md text-on-surface-dim leading-relaxed">"{req.reason}"</p>
                      </div>

                      {/* Admin Note */}
                      {req.admin_note && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className={`mt-2 p-3 rounded-lg ${req.status === 'Approved' ? 'bg-secondary/5 border border-secondary/15' : 'bg-danger/5 border border-danger/15'}`}
                        >
                          <p className="text-label-sm text-on-surface-faint uppercase mb-1 flex items-center gap-1">
                            <Shield size={10} /> Admin Response
                          </p>
                          <p className="text-body-md text-on-surface-dim leading-relaxed">"{req.admin_note}"</p>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card text-center py-16"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <History size={48} className="mx-auto text-on-surface-faint mb-3" />
                </motion.div>
                <p className="text-headline-sm text-on-surface-dim font-display">No waiver requests yet</p>
                <p className="text-body-md text-on-surface-faint mt-1">
                  Submit a waiver request from your overdue fines to get started
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiver Request Modal */}
      <Modal isOpen={!!requestModal} onClose={() => setRequestModal(null)} title="Request Fine Waiver">
        {requestModal && (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              className="p-4 rounded-xl bg-surface-container"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-body-lg font-semibold text-on-surface">{requestModal.title}</h3>
                  <p className="text-body-sm text-on-surface-dim">{requestModal.author}</p>
                  <p className="text-body-sm text-on-surface-faint mt-1">
                    Due: {new Date(requestModal.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <p className="font-display font-bold text-headline-sm text-danger">${parseFloat(requestModal.fine || 0).toFixed(2)}</p>
              </div>
            </motion.div>

            <div>
              <label className="text-label-md text-on-surface-faint uppercase block mb-1.5">Reason for Request</label>
              <div className="input-focus-glow">
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Explain why you believe this fine should be waived..."
                  className="input-field resize-none"
                />
              </div>
              <p className="text-label-sm text-on-surface-faint mt-1 text-right">{reason.length}/1000</p>
            </div>

            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setRequestModal(null)} className="btn-secondary flex-1">Cancel</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={submitRequest} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {submitting ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <><Send size={16} /> Submit Request</>}
              </motion.button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
