import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit3, Trash2, Download, Printer, AlertTriangle, BookOpen, CheckCircle, Filter } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const emptyBook = {
  title: '', author: '', category: 'General', quantity: 1,
  floor_num: 1, row_num: 1, rack_num: 1, isbn: '', year: '', description: '',
};

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 14 },
  },
};

export default function AdminBooks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({ ...emptyBook });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (user?.role !== 'Admin') { navigate('/dashboard'); return; }
    fetchBooks();
    fetchStats();
  }, [page, searchQuery]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 8 };
      if (searchQuery) params.search = searchQuery;
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

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {}
  };

  const handleAdd = async () => {
    if (!form.title || !form.author) { toast.error('Title and author required'); return; }
    setSaving(true);
    try {
      await api.post('/books', form);
      toast.success('Book added!');
      setAddModal(false);
      setForm({ ...emptyBook });
      fetchBooks();
      fetchStats();
    } catch (err) {
      toast.error('Failed to add book');
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/books/${editModal.id}`, form);
      toast.success('Book updated!');
      setEditModal(null);
      fetchBooks();
    } catch (err) {
      toast.error('Failed to update');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this book?')) return;
    try {
      await api.delete(`/books/${id}`);
      toast.success('Book deleted');
      fetchBooks();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const openEditModal = (book) => {
    setForm({
      title: book.title, author: book.author, category: book.category,
      quantity: book.quantity, floor_num: book.floor_num, row_num: book.row_num,
      rack_num: book.rack_num, isbn: book.isbn || '', year: book.year || '',
      description: book.description || '',
    });
    setEditModal(book);
  };

  const BookForm = ({ onSubmit, submitLabel }) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-label-md text-on-surface-faint uppercase block mb-1">Title *</label>
          <div className="input-focus-glow">
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="input-field" placeholder="Book title" />
          </div>
        </div>
        <div className="col-span-2">
          <label className="text-label-md text-on-surface-faint uppercase block mb-1">Author *</label>
          <div className="input-focus-glow">
            <input type="text" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })}
              className="input-field" placeholder="Author name" />
          </div>
        </div>
        <div>
          <label className="text-label-md text-on-surface-faint uppercase block mb-1">Category</label>
          <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            className="input-field" placeholder="e.g. Computer Science" />
        </div>
        <div>
          <label className="text-label-md text-on-surface-faint uppercase block mb-1">Quantity</label>
          <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
            className="input-field" />
        </div>
        <div>
          <label className="text-label-md text-on-surface-faint uppercase block mb-1">ISBN</label>
          <input type="text" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })}
            className="input-field" placeholder="978-..." />
        </div>
        <div>
          <label className="text-label-md text-on-surface-faint uppercase block mb-1">Year</label>
          <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}
            className="input-field" placeholder="2024" />
        </div>
        <div>
          <label className="text-label-md text-on-surface-faint uppercase block mb-1">Floor</label>
          <input type="number" min="1" value={form.floor_num} onChange={e => setForm({ ...form, floor_num: parseInt(e.target.value) || 1 })}
            className="input-field" />
        </div>
        <div>
          <label className="text-label-md text-on-surface-faint uppercase block mb-1">Row</label>
          <input type="number" min="1" value={form.row_num} onChange={e => setForm({ ...form, row_num: parseInt(e.target.value) || 1 })}
            className="input-field" />
        </div>
        <div>
          <label className="text-label-md text-on-surface-faint uppercase block mb-1">Rack</label>
          <input type="number" min="1" value={form.rack_num} onChange={e => setForm({ ...form, rack_num: parseInt(e.target.value) || 1 })}
            className="input-field" />
        </div>
        <div className="col-span-2">
          <label className="text-label-md text-on-surface-faint uppercase block mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="input-field resize-none" rows={3} placeholder="Brief description..." />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setAddModal(false); setEditModal(null); }} className="btn-secondary flex-1">Cancel</motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onSubmit} disabled={saving} className="btn-primary flex-1">
          {saving ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto" /> : submitLabel}
        </motion.button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <motion.div variants={staggerItem}>
          <h1 className="font-display font-bold text-display-sm text-on-surface">Book Inventory Management</h1>
          <p className="text-body-md text-on-surface-dim mt-1">Manage the library's digital and physical assets.</p>
        </motion.div>
        <motion.button
          variants={staggerItem}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setForm({ ...emptyBook }); setAddModal(true); }}
          className="btn-primary flex items-center gap-2 text-body-md"
        >
          <Plus size={16} /> Add New Book
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.01, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card p-5 hover:shadow-card-lift transition-shadow duration-300"
        >
          <p className="text-label-md text-on-surface-faint uppercase mb-1">Total Titles</p>
          <p className="font-display font-bold text-headline-lg text-on-surface">
            <AnimatedNumber value={stats.totalTitles || 0} />
          </p>
          <p className="text-body-sm text-secondary mt-1">+4.2% from last month</p>
        </motion.div>
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.01, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card p-5 hover:shadow-card-lift transition-shadow duration-300"
        >
          <p className="text-label-md text-on-surface-faint uppercase mb-1">Checked Out</p>
          <p className="font-display font-bold text-headline-lg text-on-surface">
            <AnimatedNumber value={stats.issuedBooks || 0} />
          </p>
          <p className="text-body-sm text-primary mt-1">↕ 31% turnover rate</p>
        </motion.div>
        <motion.div
          variants={staggerItem}
          whileHover={{ y: -3, scale: 1.01, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="card p-5 hover:shadow-card-lift transition-shadow duration-300"
        >
          <p className="text-label-md text-on-surface-faint uppercase mb-1">Overdue Items</p>
          <p className="font-display font-bold text-headline-lg text-danger">
            <AnimatedNumber value={stats.overdueBooks || 0} />
          </p>
          <p className="text-body-sm text-warning mt-1 flex items-center gap-1">
            <AlertTriangle size={12} /> Action required
          </p>
        </motion.div>
      </div>

      {/* Inventory Table */}
      <motion.div variants={staggerItem} className="card p-2">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-headline-sm text-on-surface">Inventory List</h2>
            <motion.button whileTap={{ scale: 0.95 }} className="chip-inactive text-body-sm flex items-center gap-1"><Filter size={12} /> All</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="chip-inactive text-body-sm flex items-center gap-1"><Filter size={12} /> Recently Added</motion.button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative input-focus-glow">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-faint" />
              <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search inventory..." className="bg-surface-container-low text-on-surface text-body-sm py-2 pl-9 pr-4 rounded-lg outline-none placeholder:text-on-surface-faint w-48 border border-transparent focus:border-primary/30 focus:shadow-glow-input transition-all duration-300" />
            </div>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} className="p-2 rounded-lg hover:bg-surface-bright text-on-surface-dim transition-colors"><Download size={16} /></motion.button>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} className="p-2 rounded-lg hover:bg-surface-bright text-on-surface-dim transition-colors"><Printer size={16} /></motion.button>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 text-label-md">
          <div className="col-span-4 table-header">Title & Author</div>
          <div className="col-span-2 table-header">ISBN-13</div>
          <div className="col-span-2 table-header text-center">Status</div>
          <div className="col-span-2 table-header text-center">Category</div>
          <div className="col-span-2 table-header text-center">Actions</div>
        </div>

        {loading ? <SkeletonLoader type="row" count={6} /> : (
          <AnimatePresence mode="popLayout">
            <div>
              {books.map((book, i) => {
                const available = book.quantity - book.issued_count;
                const statusLabel = available > 0 ? 'Available' : book.issued_count > 0 ? 'Reserved' : 'Available';
                const statusColor = available > 0 ? 'text-secondary bg-secondary/15' : 'text-warning bg-warning/15';

                return (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                    transition={{
                      delay: i * 0.03,
                      type: 'spring',
                      stiffness: 120,
                      damping: 16,
                    }}
                    whileHover={{
                      backgroundColor: 'rgba(31, 43, 73, 0.3)',
                      transition: { type: 'spring', stiffness: 300, damping: 20 },
                    }}
                    layout
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center px-4 py-3 rounded-xl transition-all"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-14 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center text-lg">📚</div>
                      <div className="min-w-0">
                        <p className="text-body-md font-semibold text-on-surface truncate">{book.title}</p>
                        <p className="text-body-sm text-on-surface-dim">{book.author}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-body-sm text-on-surface-dim font-mono">{book.isbn || '—'}</div>
                    <div className="col-span-2 text-center">
                      <span className={`text-label-sm font-semibold uppercase px-2 py-0.5 rounded-md ${statusColor}`}>
                        {statusLabel.toUpperCase()}
                      </span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-dim text-label-sm">
                        {book.category}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        onClick={() => openEditModal(book)}
                        className="p-2 rounded-lg hover:bg-surface-bright text-on-surface-dim transition-colors"
                      >
                        <Edit3 size={15} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        onClick={() => handleDelete(book.id)}
                        className="p-2 rounded-lg hover:bg-danger/15 text-on-surface-dim hover:text-danger transition-colors"
                      >
                        <Trash2 size={15} />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4">
            <p className="text-body-sm text-on-surface-dim">
              Showing <span className="font-semibold text-on-surface">{(page-1)*8+1}-{Math.min(page*8,total)}</span> of <span className="font-semibold text-on-surface">{total.toLocaleString()}</span> titles
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-body-sm font-medium transition-colors ${p === page ? 'bg-primary text-white' : 'text-on-surface-dim hover:bg-surface-bright'}`}
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
                  className="w-8 h-8 rounded-lg text-body-sm font-medium text-on-surface-dim hover:bg-surface-bright"
                >
                  {totalPages}
                </motion.button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Add Book Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add New Book" maxWidth="max-w-2xl">
        <BookForm onSubmit={handleAdd} submitLabel="Add Book" />
      </Modal>

      {/* Edit Book Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit Book" maxWidth="max-w-2xl">
        <BookForm onSubmit={handleEdit} submitLabel="Save Changes" />
      </Modal>
    </motion.div>
  );
}
