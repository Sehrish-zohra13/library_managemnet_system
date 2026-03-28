import { motion } from 'framer-motion';
import { Search, Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.1 }}
      className="sticky top-0 z-20 bg-surface/80 backdrop-blur-glass"
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl ml-12 lg:ml-0">
          <motion.div
            className="relative input-focus-glow"
            animate={{ scale: searchFocused ? 1.01 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchFocused ? 'text-primary' : 'text-on-surface-faint'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search the collection..."
              className="w-full bg-surface-container-low text-on-surface text-body-md
                         py-2.5 pl-10 pr-4 rounded-lg outline-none
                         placeholder:text-on-surface-faint
                         border border-transparent
                         focus:border-primary/30 focus:shadow-glow-input
                         transition-all duration-300"
            />
          </motion.div>
        </form>

        {/* Right section */}
        <div className="flex items-center gap-4 ml-4">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="relative p-2 rounded-lg hover:bg-surface-container transition-colors"
          >
            <Bell size={18} className="text-on-surface-dim" />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10, delay: 0.5 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full
                           text-[9px] font-bold text-white flex items-center justify-center"
            >
              3
            </motion.span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-lg
                       hover:bg-surface-container transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-body-md font-medium text-on-surface">{user?.name || 'User'}</p>
              <p className="text-body-sm text-on-surface-faint">
                {user?.role === 'Admin' ? 'Curator Admin' : user?.department || 'Student'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-gradient flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
