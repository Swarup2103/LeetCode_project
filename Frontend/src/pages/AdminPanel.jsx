import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient.js';

export default function AdminPanel() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/problem/getAllProblems');
      const problemsData = response.data.problems || [];
      setProblems(problemsData);
      
      // Calculate stats
      const stats = problemsData.reduce((acc, p) => {
        acc.total++;
        if (p.difficulty?.toLowerCase() === 'easy') acc.easy++;
        if (p.difficulty?.toLowerCase() === 'medium') acc.medium++;
        if (p.difficulty?.toLowerCase() === 'hard') acc.hard++;
        return acc;
      }, { total: 0, easy: 0, medium: 0, hard: 0 });
      
      setStats(stats);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (problemId) => {
    if (window.confirm('Are you sure you want to delete this problem?')) {
      try {
        await axiosClient.delete(`/problem/delete/${problemId}`);
        // Refetch problems to update list and stats
        fetchProblems();
      } catch (error) {
        console.error('Failed to delete problem:', error);
        alert('Could not delete the problem.');
      }
    }
  };

  const getDifficultyBadge = (difficulty) => {
    const classes = {
      easy: 'badge-success',
      medium: 'badge-warning',
      hard: 'badge-error'
    };
    return classes[difficulty?.toLowerCase()] || 'badge-neutral';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-white/90">Manage coding problems and monitor platform</p>
            </div>
            <button 
              onClick={() => navigate('/admin/create-problem')}
              className="btn btn-lg bg-white text-purple-600 border-none hover:bg-base-100 gap-2 shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Problem
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Problems</p>
                  <p className="text-4xl font-bold mt-2">{stats.total}</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Easy</p>
                  <p className="text-4xl font-bold mt-2">{stats.easy}</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Medium</p>
                  <p className="text-4xl font-bold mt-2">{stats.medium}</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Hard</p>
                  <p className="text-4xl font-bold mt-2">{stats.hard}</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.959-1.333-2.73 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Problems Table */}
        <div className="card bg-base-200 shadow-xl border border-base-300">
          <div className="card-body">
             <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Difficulty</th>
                    <th>Tags</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.length > 0 ? (
                    problems.map((problem) => (
                      <tr key={problem._id} className="hover">
                        <td className="font-medium">{problem.title}</td>
                        <td><span className={`badge ${getDifficultyBadge(problem.difficulty)}`}>{problem.difficulty}</span></td>
                        <td><span className="badge badge-outline">{problem.tags}</span></td>
                        <td className="text-right space-x-2">
                          <button
                            onClick={() => navigate(`/admin/edit-problem/${problem._id}`)}
                            className="btn btn-sm btn-ghost"
                          >Edit</button>
                          <button
                            onClick={() => handleDelete(problem._id)}
                            className="btn btn-sm btn-error btn-ghost"
                          >Delete</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-8">
                        <p className="text-base-content/60">No problems found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

