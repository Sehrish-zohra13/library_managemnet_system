import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, Keyboard, CheckCircle, MapPin, Hash, RotateCcw, Calendar,
  Camera, CameraOff, Zap, BookOpen
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const panelTransition = { type: 'spring', stiffness: 100, damping: 14 };

export default function ScanAction() {
  const navigate = useNavigate();
  const [step, setStep] = useState('scan');
  const [mode, setMode] = useState('issue');
  const [books, setBooks] = useState([]);
  const [myIssues, setMyIssues] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [issuedData, setIssuedData] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');

  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const modeRef = useRef(mode);
  const mountedRef = useRef(true);
  const lastScanTimeRef = useRef(0);
  const initAttemptRef = useRef(0);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    // Start scanner on mount
    startCamera();
    return () => {
      mountedRef.current = false;
      cleanupScanner();
    };
  }, []);

  const fetchData = async () => {
    try {
      const [booksRes, issuesRes] = await Promise.all([
        api.get('/books', { params: { limit: 100 } }),
        api.get('/issues/my'),
      ]);
      if (!mountedRef.current) return;
      setBooks(booksRes.data.books || []);
      setMyIssues(issuesRes.data.filter(i => i.status === 'Issued' || i.status === 'Overdue'));
    } catch (err) {}
  };

  const cleanupScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    scannerRef.current = null;
    try {
      const state = scanner.getState();
      if (state === 2) await scanner.stop();
      scanner.clear();
    } catch (e) {
      // Ignore cleanup errors
    }
    setScannerActive(false);
  };

  const startCamera = async () => {
    // Wait for DOM to mount
    await new Promise(r => setTimeout(r, 500));
    if (!mountedRef.current) return;

    const containerId = 'qr-reader-container';
    const el = document.getElementById(containerId);
    if (!el) {
      console.error('QR container not found in DOM');
      setCameraError('Scanner container not found. Please reload the page.');
      return;
    }

    // Clean up any existing scanner
    await cleanupScanner();
    // Give browser time to release camera
    await new Promise(r => setTimeout(r, 200));

    try {
      const scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;
      processingRef.current = false;

      const config = {
        fps: 10,
        qrbox: { width: 200, height: 200 },
        disableFlip: false,
      };

      await scanner.start(
        { facingMode: 'environment' },
        config,
        onQrCodeScanned,
        () => {} // Ignore per-frame no-QR errors
      );

      if (!mountedRef.current) {
        await cleanupScanner();
        return;
      }

      setCameraReady(true);
      setScannerActive(true);
      setCameraError(null);
      console.log('✅ QR Scanner started successfully');

    } catch (err) {
      console.error('❌ Camera start failed:', err);
      if (!mountedRef.current) return;
      setCameraReady(false);
      setScannerActive(false);

      const errStr = String(err);
      if (errStr.includes('NotAllowed') || errStr.includes('Permission')) {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings, then reload the page.');
      } else if (errStr.includes('NotFound') || errStr.includes('Requested device not found')) {
        setCameraError('No camera found on this device.');
      } else if (errStr.includes('NotReadable') || errStr.includes('Could not start video source')) {
        setCameraError('Camera is in use by another app. Close other apps using the camera and try again.');
      } else {
        setCameraError(`Camera error: ${errStr.substring(0, 120)}`);
      }
    }
  };

  // Called by html5-qrcode whenever a QR is decoded
  const onQrCodeScanned = async (decodedText) => {
    const now = Date.now();

    // Debounce: skip if already processing or scanned same code recently
    if (processingRef.current) return;
    if (now - lastScanTimeRef.current < 3000) return;

    processingRef.current = true;
    lastScanTimeRef.current = now;

    // Parse QR data
    let bookId = decodedText.trim();
    try {
      const parsed = JSON.parse(decodedText);
      bookId = String(parsed.bookId || parsed.book_id || parsed.isbn || parsed.id || decodedText);
    } catch (e) {
      // Plain text — use as is
    }

    setLastScannedCode(bookId);
    const currentMode = modeRef.current;

    try {
      const res = await api.post('/scan', { bookId, action: currentMode });

      if (!mountedRef.current) return;

      if (res.data.action === 'issued') {
        setIssuedData(res.data.data);
        setSelectedBook(res.data.book);
        setStep('success');
        setRecentScans(prev => [{ ...res.data.book, scanStatus: 'JUST ISSUED' }, ...prev.slice(0, 4)]);
        toast.success('Book issued successfully!');
      } else if (res.data.action === 'returned') {
        setRecentScans(prev => [{ ...res.data.book, scanStatus: 'RETURNED', fine: res.data.fine }, ...prev.slice(0, 4)]);
        toast.success(res.data.fine > 0 ? `Book returned! Fine: $${res.data.fine.toFixed(2)}` : 'Book returned successfully!');
        fetchData();
        // Unlock after delay (scanner keeps running)
        setTimeout(() => { processingRef.current = false; }, 2500);
        return;
      }
    } catch (err) {
      if (!mountedRef.current) return;
      toast.error(err.response?.data?.error || 'Failed to process scan');
      // Unlock after delay so user can try again
      setTimeout(() => { processingRef.current = false; }, 2000);
      return;
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setStep('scan');
    setSelectedBook(null);
    processingRef.current = false;
    lastScanTimeRef.current = 0;
    setLastScannedCode('');
  };

  const selectManualBook = (book) => {
    setSelectedBook(book);
    setManualEntry(false);
    if (mode === 'issue') setStep('detected');
    else setStep('return-confirm');
  };

  const handleIssue = async () => {
    setLoading(true);
    try {
      const bookId = selectedBook.id || selectedBook.book_id;
      const res = await api.post('/scan', { bookId: String(bookId), action: 'issue' });
      setIssuedData(res.data.data);
      setStep('success');
      setRecentScans(prev => [{ ...selectedBook, scanStatus: 'JUST ISSUED' }, ...prev.slice(0, 4)]);
      toast.success('Book issued successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to issue');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/issues/return/${selectedBook.id}`);
      toast.success(`Book returned! ${res.data.fine > 0 ? `Fine: $${res.data.fine.toFixed(2)}` : ''}`);
      setRecentScans(prev => [{ ...selectedBook, scanStatus: 'RETURNED' }, ...prev.slice(0, 4)]);
      setStep('scan');
      setSelectedBook(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to return');
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = mode === 'issue'
    ? books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) && b.quantity - b.issued_count > 0)
    : myIssues.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const retryCamera = () => {
    setCameraError(null);
    processingRef.current = false;
    startCamera();
  };

  const scanAnother = () => {
    setStep('scan');
    setSelectedBook(null);
    setIssuedData(null);
    processingRef.current = false;
    lastScanTimeRef.current = 0;
    setLastScannedCode('');
    fetchData();
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={panelTransition}>
          <h1 className="font-display font-bold text-display-sm text-on-surface">Scan & Action</h1>
          <p className="text-body-md text-on-surface-dim mt-1">Point the camera at any QR code to instantly issue or return a book.</p>
        </motion.div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setManualEntry(true)} className="btn-secondary flex items-center gap-2 text-body-md">
          <Keyboard size={16} /> Manual Entry
        </motion.button>
      </div>

      {/* Mode Toggle */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...panelTransition, delay: 0.1 }} className="flex gap-2">
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => switchMode('issue')} className={mode === 'issue' ? 'chip-active' : 'chip-inactive'}>
          <BookOpen size={14} className="inline mr-1" /> Issue Book
        </motion.button>
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => switchMode('return')} className={mode === 'return' ? 'chip-active' : 'chip-inactive'}>
          <RotateCcw size={14} className="inline mr-1" /> Return Book
        </motion.button>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Scanner Area — container ALWAYS in DOM */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={panelTransition}
          className="lg:col-span-3 card overflow-hidden"
        >
          <div className="relative rounded-xl overflow-hidden bg-black" style={{ minHeight: '360px' }}>
            {/* QR container — always rendered, visibility toggled */}
            <div
              id="qr-reader-container"
              style={{
                width: '100%',
                minHeight: '360px',
                display: step === 'scan' ? 'block' : 'none',
              }}
            />

            {/* Paused overlay */}
            {step !== 'scan' && (
              <div className="flex items-center justify-center" style={{ minHeight: '360px' }}>
                <div className="text-center">
                  <CheckCircle size={32} className="mx-auto text-secondary mb-2" />
                  <p className="text-on-surface-dim text-body-md">Scanner paused</p>
                </div>
              </div>
            )}

            {/* Camera Error */}
            {cameraError && step === 'scan' && (
              <div className="absolute inset-0 bg-surface-container-low flex items-center justify-center z-20">
                <div className="text-center p-6 max-w-xs">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }}>
                    <CameraOff size={48} className="mx-auto text-danger mb-4" />
                  </motion.div>
                  <p className="text-body-lg font-semibold text-on-surface mb-2">Camera Unavailable</p>
                  <p className="text-body-sm text-on-surface-dim mb-4">{cameraError}</p>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={retryCamera} className="btn-primary text-body-sm py-2 px-4">
                    <Camera size={14} className="inline mr-1.5" /> Retry Camera
                  </motion.button>
                </div>
              </div>
            )}

            {/* Overlay instructions */}
            {step === 'scan' && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <div className="absolute top-4 left-0 right-0 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <Zap size={14} className="text-secondary" />
                    </motion.div>
                    <span className="text-body-sm text-white/90 font-medium">Align QR code within the frame to scan</span>
                  </div>
                </div>

                {lastScannedCode && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-14 left-0 right-0 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/30 backdrop-blur-sm text-[11px] text-white/80 font-mono">
                      <CheckCircle size={10} /> Last: {lastScannedCode}
                    </span>
                  </motion.div>
                )}

                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm ${mode === 'issue' ? 'bg-primary/30' : 'bg-secondary/30'}`}>
                    {mode === 'issue' ? <BookOpen size={14} className="text-primary" /> : <RotateCcw size={14} className="text-secondary" />}
                    <span className="text-body-sm text-white/90 font-semibold">{mode === 'issue' ? 'Issue Mode' : 'Return Mode'}</span>
                    {scannerActive && (
                      <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-secondary" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...panelTransition, delay: 0.15 }}
          className="lg:col-span-2 space-y-4"
        >
          <AnimatePresence mode="wait">
            {step === 'scan' && (
              <motion.div key="scan" initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97 }} transition={panelTransition} className="card text-center py-10">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                  {scannerActive ? <Camera size={48} className="mx-auto text-secondary mb-4" /> : <ScanLine size={48} className="mx-auto text-on-surface-faint mb-4" />}
                </motion.div>
                <p className="text-headline-sm font-display font-bold text-on-surface-dim">
                  {scannerActive ? (mode === 'issue' ? 'Ready to Issue' : 'Ready to Return') : 'Starting Camera...'}
                </p>
                <p className="text-body-md text-on-surface-faint mt-2">
                  {scannerActive ? 'Scanner is live — point at any QR code' : 'Please allow camera access when prompted'}
                </p>
                {scannerActive && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-body-sm text-secondary font-medium">
                    <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-secondary" />
                    Camera active — scanning continuously
                  </motion.div>
                )}
                {recentScans.length > 0 && (
                  <div className="mt-6 text-left space-y-2">
                    <p className="text-label-sm text-on-surface-faint uppercase px-1">Recent Scans</p>
                    {recentScans.slice(0, 3).map((scan, i) => (
                      <motion.div key={`recent-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-container-low">
                        <div className="w-8 h-10 rounded bg-surface-container-high flex items-center justify-center text-sm">📚</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-medium text-on-surface truncate">{scan.title}</p>
                          <p className="text-[11px] text-on-surface-dim">{scan.author}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${scan.scanStatus === 'JUST ISSUED' ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary'}`}>{scan.scanStatus}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 'detected' && selectedBook && (
              <motion.div key="detected" initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={panelTransition} className="card-elevated space-y-4">
                <div className="flex items-center gap-2">
                  <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="text-label-md text-secondary font-semibold uppercase">Book Detected</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-28 rounded-lg bg-surface-container flex items-center justify-center text-3xl">📚</div>
                  <div>
                    <h3 className="font-display font-bold text-headline-md text-on-surface">{selectedBook.title}</h3>
                    <p className="text-body-md text-on-surface-dim">{selectedBook.author}</p>
                    <span className="inline-flex items-center gap-1 mt-1 text-body-sm text-secondary"><CheckCircle size={14} /> Available</span>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleIssue} disabled={loading} className="btn-primary w-full">
                  {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto" /> : 'Confirm & Issue Book'}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={scanAnother} className="btn-secondary w-full">Cancel</motion.button>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-surface-container-low">
                    <p className="text-label-sm text-on-surface-faint uppercase">Location</p>
                    <p className="font-display font-bold text-body-lg text-on-surface">FL{selectedBook.floor_num}-R{selectedBook.row_num}-K{selectedBook.rack_num}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low">
                    <p className="text-label-sm text-on-surface-faint uppercase">ISBN</p>
                    <p className="font-display font-bold text-body-lg text-on-surface">{selectedBook.isbn || 'N/A'}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'return-confirm' && selectedBook && (
              <motion.div key="return" initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={panelTransition} className="card-elevated space-y-4">
                <div className="flex items-center gap-2">
                  <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-label-md text-primary font-semibold uppercase">Currently Issued to You</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-28 rounded-lg bg-surface-container flex items-center justify-center text-3xl">📚</div>
                  <div>
                    <h3 className="font-display font-bold text-headline-md text-on-surface">{selectedBook.title}</h3>
                    <p className="text-body-md text-on-surface-dim">{selectedBook.author}</p>
                    <div className="mt-1">
                      <p className="text-label-sm text-on-surface-faint uppercase">Due Date</p>
                      <p className="text-body-md text-on-surface flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(selectedBook.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleReturn} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <><RotateCcw size={16} /> Confirm Return</>}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={scanAnother} className="btn-secondary w-full">Cancel</motion.button>
              </motion.div>
            )}

            {step === 'success' && issuedData && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={panelTransition} className="card-elevated text-center py-8 space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10, stiffness: 200 }} className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center">
                  <CheckCircle size={40} className="text-white" />
                </motion.div>
                <h2 className="font-display font-bold text-headline-lg text-on-surface">Book Issued!</h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low">
                  <span className="text-body-md text-on-surface-dim">Return by:</span>
                  <span className="font-display font-bold text-primary">{new Date(issuedData.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ...panelTransition }} className="flex items-center gap-4 p-4 rounded-xl bg-surface-container text-left">
                  <div className="w-14 h-20 rounded-lg bg-surface-container-high flex items-center justify-center text-2xl">📚</div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-headline-sm text-on-surface">{issuedData.title}</h3>
                    <p className="text-body-md text-on-surface-dim">{issuedData.author}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-body-sm text-on-surface-faint"><MapPin size={12} className="inline mr-1" />FL{issuedData.floor_num}-R{issuedData.row_num}</span>
                      <span className="text-body-sm text-on-surface-faint"><Hash size={12} className="inline mr-1" />{issuedData.transaction_id}</span>
                    </div>
                  </div>
                </motion.div>
                <div className="flex gap-3 pt-2">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={scanAnother} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <ScanLine size={16} /> Scan Another
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/dashboard')} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Done
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Recently Scanned — below cards when not scanning */}
      {step !== 'scan' && recentScans.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...panelTransition, delay: 0.3 }}>
          <h2 className="font-display font-bold text-headline-sm text-on-surface mb-4">Recently Scanned</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentScans.slice(0, 3).map((scan, i) => (
              <motion.div key={`bottom-${i}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, type: 'spring', stiffness: 120, damping: 14 }} whileHover={{ y: -2 }} className="card flex items-center gap-3">
                <div className="w-10 h-14 rounded-lg bg-surface-container-high flex items-center justify-center">📖</div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-medium text-on-surface truncate">{scan.title}</p>
                  <p className="text-body-sm text-on-surface-dim">{scan.author}</p>
                  <span className={`text-label-sm font-semibold ${scan.scanStatus === 'JUST ISSUED' ? 'text-secondary' : 'text-primary'}`}>✓ {scan.scanStatus}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Manual Entry Overlay */}
      <AnimatePresence>
        {manualEntry && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setManualEntry(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }} transition={{ type: 'spring', stiffness: 100, damping: 18 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-container-low z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-headline-md text-on-surface">Manual Entry</h2>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setManualEntry(false)} className="btn-ghost">✕</motion.button>
              </div>
              <div className="input-focus-glow">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by title..." className="input-field mb-4" />
              </div>
              <div className="space-y-2 loom-scroll max-h-[calc(100vh-200px)] overflow-y-auto">
                {filteredBooks.map((book, i) => (
                  <motion.button key={book.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 16 }} whileHover={{ x: -4, backgroundColor: 'rgba(15, 25, 48, 0.5)' }} onClick={() => selectManualBook(book)} className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left">
                    <div className="w-10 h-14 bg-surface-container-high rounded-lg flex items-center justify-center">📚</div>
                    <div>
                      <p className="text-body-md font-medium text-on-surface">{book.title}</p>
                      <p className="text-body-sm text-on-surface-dim">{book.author}</p>
                    </div>
                  </motion.button>
                ))}
                {filteredBooks.length === 0 && (
                  <p className="text-center py-8 text-body-md text-on-surface-dim">{mode === 'issue' ? 'No available books found' : 'No issued books found'}</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
