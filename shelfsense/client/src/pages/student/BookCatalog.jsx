import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, List, Grid3X3, MapPin, ChevronLeft, ChevronRight, CheckCircle, BookMarked, CalendarClock, Bell } from 'lucide-react';
import api from '../../services/api';
import BookCard from '../../components/ui/BookCard';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 14 },
  },
};

export default function BookCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popular, setPopular] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [issueModal, setIssueModal] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [reservationMap, setReservationMap] = useState({});
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory, page, searchQuery]);

  useEffect(() => {
    fetchMeta();
    fetchNotifications();
  }, []);

  // Fetch reservation status for all displayed (unavailable) books
  useEffect(() => {
    if (books.length > 0) {
      fetchReservationStatuses();
    }
  }, [books]);

  const fetchMeta = async () => {
    try {
      const [catRes, statRes, popRes] = await Promise.all([
        api.get('/books/categories'),
        api.get('/books/stats'),
        api.get('/books/popular'),
      ]);
      setCategories(['All', ...catRes.data]);
      setStats(statRes.data);
      setPopular(popRes.data.slice(0, 5));
    } catch (err) {}
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 8 };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory !== 'All') params.category = selectedCategory;

      const res = await api.get('/books', { params });
      setBooks(res.data.books);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservationStatuses = async () => {
    const unavailableBooks = books.filter(b => (b.quantity - b.issued_count) <= 0);
    if (unavailableBooks.length === 0) return;

    try {
      const results = await Promise.all(
        unavailableBooks.map(b => api.get(`/reservations/check/${b.id}`).catch(() => ({ data: { reserved: false } })))
      );
      const map = {};
      unavailableBooks.forEach((book, i) => {
        map[book.id] = results[i].data;
      });
      setReservationMap(map);
    } catch (err) {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/reservations/notifications');
      setNotifications(res.data);
    } catch (err) {}
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleIssue = async (book) => {
    const available = book.quantity - book.issued_count;
    if (available <= 0) {
      // Show reserve modal or redirect
      navigate('/reservations');
      return;
    }
    setIssueModal(book);
  };

  const handleReserve = async (book) => {
    try {
      const res = await api.post('/reservations', { book_id: book.id });
      toast.success(`Reserved! You are #${res.data.position} in queue`);
      // Update the reservation map immediately
      setReservationMap(prev => ({
        ...prev,
        [book.id]: { reserved: true, reservation: { current_position: res.data.position } }
      }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reserve');
    }
  };

  const confirmIssue = async () => {
    setIssuing(true);
    try {
      const res = await api.post('/issues/issue', { book_id: issueModal.id });
      toast.success(`"${issueModal.title}" issued successfully!`);
      setIssueModal(null);
      fetchBooks();
      fetchMeta();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to issue book');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
      }}
      className="space-y-6"
    >
      {/* Notification Banner */}
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
                  Your reserved book{notifications.length > 1 ? 's are' : ' is'} now available!
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

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <motion.div variants={staggerItem}>
          <h1 className="font-display font-bold text-display-sm text-on-surface">Midnight Archive</h1>
          <p className="text-body-md text-on-surface-dim mt-1">
            A curated experience for the modern librarian. Explore {total.toLocaleString()} titles within the digital vault.
          </p>
        </motion.div>

        <div className="flex gap-3">
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -2, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="card flex items-center gap-3 py-3 px-5 hover:shadow-card-lift transition-shadow duration-300"
          >
            <CheckCircle size={18} className="text-secondary" />
            <div>
              <p className="font-display font-bold text-headline-sm text-on-surface">
                <AnimatedNumber value={stats.availableBooks || 0} />
              </p>
              <p className="text-label-sm text-on-surface-faint uppercase">Available</p>
            </div>
          </motion.div>
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -2, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="card flex items-center gap-3 py-3 px-5 hover:shadow-card-lift transition-shadow duration-300"
          >
            <BookMarked size={18} className="text-danger" />
            <div>
              <p className="font-display font-bold text-headline-sm text-on-surface">
                <AnimatedNumber value={stats.issuedBooks || 0} />
              </p>
              <p className="text-label-sm text-on-surface-faint uppercase">Issued</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-label-md text-on-surface-faint uppercase tracking-wider mr-1">Filters:</span>
          {categories.slice(0, 8).map((cat) => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.93 }}
              onClick={() => { setSelectedCategory(cat); setPage(1); }}
              className={selectedCategory === cat ? 'chip-active' : 'chip-inactive'}
            >
              {cat}
            </motion.button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative input-focus-glow">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchFocused ? 'text-primary' : 'text-on-surface-faint'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search by Title, Author, or ISBN..."
              className="bg-surface-container-low text-on-surface text-body-sm py-2 pl-9 pr-4 rounded-lg
                         outline-none placeholder:text-on-surface-faint border border-transparent
                         focus:border-primary/30 focus:shadow-glow-input w-64 transition-all duration-300"
            />
          </form>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-surface-bright text-on-surface' : 'text-on-surface-faint hover:text-on-surface'}`}
          >
            <List size={18} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-surface-bright text-on-surface' : 'text-on-surface-faint hover:text-on-surface'}`}
          >
            <Grid3X3 size={18} />
          </motion.button>
        </div>
      </motion.div>

      {/* Book List */}
      <motion.div variants={staggerItem} className="card p-2">
        {/* Table Header */}
        <div className="hidden md:flex items-center gap-4 px-4 py-3 text-label-md">
          <div className="w-14" />
          <div className="flex-1 table-header">Book Title & Metadata</div>
          <div className="w-36 table-header">Author</div>
          <div className="hidden lg:block table-header">Location</div>
          <div className="w-24 text-center table-header">Status</div>
          <div className="w-24 text-center table-header">Actions</div>
        </div>

        {loading ? (
          <SkeletonLoader type="row" count={6} />
        ) : books.length > 0 ? (
          <div className="divide-y divide-outline-variant/10">
            {books.map((book, i) => (
              <BookCard
                key={book.id}
                book={book}
                index={i}
                onAction={handleIssue}
                onReserve={handleReserve}
                actionLabel={book.quantity - book.issued_count > 0 ? 'Issue Book' : 'Reserved'}
                reservationInfo={reservationMap[book.id]}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 14 }}
            className="text-center py-16"
          >
            <Search size={48} className="mx-auto text-on-surface-faint mb-4" />
            <p className="text-headline-sm text-on-surface-dim">No books found</p>
            <p className="text-body-md text-on-surface-faint mt-1">Try adjusting your search or filters</p>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 mt-2">
            <p className="text-body-sm text-on-surface-dim">
              Showing <span className="font-semibold text-on-surface">{(page - 1) * 8 + 1}-{Math.min(page * 8, total)}</span> of <span className="font-semibold text-on-surface">{total.toLocaleString()}</span> books
            </p>
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-surface-bright disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </motion.button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-body-sm font-medium transition-colors
                    ${p === page ? 'bg-primary text-white' : 'text-on-surface-dim hover:bg-surface-bright'}`}
                >
                  {p}
                </motion.button>
              ))}
              {totalPages > 5 && <span className="text-on-surface-faint px-1">...</span>}
              {totalPages > 5 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPage(totalPages)}
                  className={`w-8 h-8 rounded-lg text-body-sm font-medium transition-colors
                    ${page === totalPages ? 'bg-primary text-white' : 'text-on-surface-dim hover:bg-surface-bright'}`}
                >
                  {totalPages}
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-surface-bright disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Issue Confirmation Modal */}
      <Modal isOpen={!!issueModal} onClose={() => setIssueModal(null)} title="Confirm Issue">
        {issueModal && (
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-surface-container mb-6"
            >
              <div className="w-16 h-22 rounded-lg bg-surface-container-high flex items-center justify-center text-2xl">📚</div>
              <div>
                <h3 className="font-display font-bold text-headline-sm text-on-surface">{issueModal.title}</h3>
                <p className="text-body-md text-on-surface-dim">{issueModal.author}</p>
                <div className="flex gap-3 mt-2">
                  <span className="location-badge text-body-sm">
                    <MapPin size={12} />
                    FL {String(issueModal.floor_num).padStart(2, '0')} • R {String(issueModal.row_num).padStart(2, '0')} • K {String(issueModal.rack_num).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </motion.div>
            <div className="rounded-xl bg-surface-container-low p-4 mb-6 text-center">
              <p className="text-body-sm text-on-surface-dim">Return by</p>
              <p className="font-display font-bold text-headline-md text-primary">
                {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </p>
              <p className="text-body-sm text-on-surface-faint">(14 Days)</p>
            </div>
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setIssueModal(null)} className="btn-secondary flex-1">Cancel</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={confirmIssue} disabled={issuing} className="btn-primary flex-1">
                {issuing ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto" />
                ) : 'Confirm & Issue'}
              </motion.button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
