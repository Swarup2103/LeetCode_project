import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../authSlice';
import { useState, useEffect } from 'react';

// This is a mock hook based on your HomePage logic. 
// If your ThemeProvider context provides a hook, you can use that instead.
const useTheme = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('codecraft-theme') || 'light');

    useEffect(() => {
        localStorage.setItem('codecraft-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    return { theme, toggleTheme };
};


export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className="bg-base-200 border-b border-base-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CC</span>
            </div>
            <span className="text-xl font-bold text-base-content">CodeCraft</span>
          </Link>

          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="btn btn-ghost btn-sm">
                Admin Panel
              </button>
            )}

            <button onClick={toggleTheme} className="btn btn-ghost btn-circle" aria-label="Toggle theme">
              {theme === 'light' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>

            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary text-xl font-semibold">{user?.firstName?.charAt(0)}</span>
                </div>
              </label>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-52">
                <li><Link to="/profile">Profile</Link></li>
                <li><button onClick={handleLogout}>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

