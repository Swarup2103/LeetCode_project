import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

// Main HomePage Component
export default function HomePage() {
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [stats, setStats] = useState({ easy: 0, medium: 0, hard: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('codecraft-theme') || 'light');
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all'
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Fetch all problems and user's solved problems on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [problemsRes, solvedRes] = await Promise.all([
          axiosClient.get('/problem/getAllProblems'),
          axiosClient.get('/problem/problemSolvedByUser')
        ]);

        const allProblems = problemsRes.data.problems || [];
        const solvedProblemIds = new Set(solvedRes.data.solvedProblems || []);

        setProblems(allProblems);
        setSolvedProblems(Array.from(solvedProblemIds));

        // Calculate stats based on the user's solved problems
        const solvedStats = allProblems.reduce((acc, prob) => {
          if (solvedProblemIds.has(prob._id)) {
            acc.total++;
            const difficulty = prob.difficulty?.toLowerCase();
            if (difficulty === 'easy') acc.easy++;
            else if (difficulty === 'medium') acc.medium++;
            else if (difficulty === 'hard') acc.hard++;
          }
          return acc;
        }, { easy: 0, medium: 0, hard: 0, total: 0 });

        setStats(solvedStats);
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);
  
  // Apply theme from local storage and update document attribute
  useEffect(() => {
    localStorage.setItem('codecraft-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
    
  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  // Filter problems based on the current filter state
  const filteredProblems = problems.filter(problem => {
      const difficultyMatch = filters.difficulty === 'all' || problem.difficulty.toLowerCase() === filters.difficulty.toLowerCase();
      const tagMatch = filters.tag === 'all' || problem.tags?.toLowerCase() === filters.tag.toLowerCase();
      const isSolved = solvedProblems.includes(problem._id);
      const statusMatch = filters.status === 'all' 
          || (filters.status === 'solved' && isSolved)
          || (filters.status === 'unsolved' && !isSolved);
      return difficultyMatch && tagMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 transition-colors duration-300">
      {/* Header */}
      <header className="bg-base-200 border-b border-base-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CC</span>
              </div>
              <span className="text-xl font-bold text-base-content">CodeCraft</span>
            </div>
            <div className="flex items-center gap-4">
                 {user?.role === 'admin' && (
                    <button onClick={() => navigate('/admin')} className="btn btn-ghost btn-sm">Admin Panel</button>
                 )}
                 <button onClick={toggleTheme} className="btn btn-ghost btn-circle" aria-label="Toggle theme">
                    {theme === 'light' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    )}
                </button>
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                        <div className="w-10 rounded-full bg-primary/20 flex items-center justify-center">
                           <span className="text-primary text-xl font-semibold">{user?.firstName?.charAt(0)}</span>
                        </div>
                    </label>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-52">
                        {/* ✨ ADDED PROFILE LINK ✨ */}
                        <li className="menu-title"><span>Welcome, {user?.firstName}!</span></li>
                        <li>
                            <Link to="/profile" className="justify-between">
                                Profile
                            </Link>
                        </li>
                        <div className="divider my-1"></div>
                        <li><button onClick={handleLogout} className="text-error">Logout</button></li>
                    </ul>
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-base-content mb-4">
            Welcome to <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">CodeCraft</span>
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            Master coding challenges, improve your skills, and prepare for technical interviews.
          </p>
        </div>

        {/* User Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12 mb-12">
          <div className="stat bg-base-200 rounded-lg shadow"><div className="stat-figure text-success"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><div className="stat-title text-base-content/70">Easy Solved</div><div className="stat-value text-success">{stats.easy}</div></div>
          <div className="stat bg-base-200 rounded-lg shadow"><div className="stat-figure text-warning"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div><div className="stat-title text-base-content/70">Medium Solved</div><div className="stat-value text-warning">{stats.medium}</div></div>
          <div className="stat bg-base-200 rounded-lg shadow"><div className="stat-figure text-error"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.959-1.333-2.73 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div><div className="stat-title text-base-content/70">Hard Solved</div><div className="stat-value text-error">{stats.hard}</div></div>
          <div className="stat bg-base-200 rounded-lg shadow"><div className="stat-figure text-secondary"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div><div className="stat-title text-base-content/70">Total Solved</div><div className="stat-value text-secondary">{stats.total}</div></div>
        </div>
        
        {/* Problems Table Section */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="card-title text-2xl text-base-content">Problem Set</h2>
                
                <div className="flex items-center gap-4">
                     <select className="select select-bordered select-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                        <option value='all'>Status</option>
                        <option value='solved'>Solved</option>
                        <option value='unsolved'>Unsolved</option>
                    </select>
                    <select className="select select-bordered select-sm" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>
                        <option value='all'>Difficulty</option>
                        <option value='easy'>Easy</option>
                        <option value='medium'>Medium</option>
                        <option value='hard'>Hard</option>
                    </select>
                    <select className="select select-bordered select-sm" value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })}>
                        <option value='all'>Tags</option>
                        <option value='array'>Array</option>
                        <option value='string'>String</option>
                        <option value='linked list'>Linked List</option>
                        <option value='tree'>Tree</option>
                        <option value='graph'>Graph</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Title</th>
                    <th>Difficulty</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.map((problem) => (
                    <tr key={problem._id} className="hover">
                      <td>
                        {solvedProblems.includes(problem._id) && (
                          <div className="text-success tooltip" data-tip="Solved">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          </div>
                        )}
                      </td>
                      <td>
                        <Link to={`/problem/${problem._id}`} className="link link-hover">
                          {problem.title}
                        </Link>
                      </td>
                      <td>
                        <span className={`badge ${problem.difficulty.toLowerCase() === 'easy' ? 'badge-success' : problem.difficulty.toLowerCase() === 'medium' ? 'badge-warning' : 'badge-error'}`}>
                          {problem.difficulty}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-outline">{problem.tags}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-base-200 border-t border-base-300 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-base-content/70">
            <p>© 2025 CodeCraft. Built with ❤️ for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

