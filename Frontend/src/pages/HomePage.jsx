import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { logoutUser } from "../authSlice";

function HomePage() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    // FIX 1: Correctly destructure useState, which returns an array [value, setter]
    const [problems, setProblems] = useState([]);
    const [solvedProblems, setSolvedProblems] = useState([]);
    const [filters, setFilters] = useState({
        difficulty: 'all',
        tag: 'all',
        status: 'all'
    });

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                // Assuming the data returned is an array of problems
                const response = await axiosClient.get('/problem/getAllProblems');
                setProblems(response.data.problems || []); // Safely handle if data isn't as expected
            } catch (error) {
                console.error('Error fetching problems: ', error);
            }
        };

        const fetchSolvedProblems = async () => {
            try {
                // Assuming the data returned is an array of solved problem IDs or objects
                const response = await axiosClient.get('/problem/problemSolvedByUser');
                setSolvedProblems(response.data.solvedProblems || []);
            } catch (error) {
                console.error('Error fetching solved Problems: ', error);
            }
        };

        fetchProblems();
        if (user) {
            fetchSolvedProblems();
        }
    }, [user]);

    const handleLogout = () => {
        dispatch(logoutUser());
        setSolvedProblems([]); // Clear solved problems on logout
    };

    // Derived state for filtered problems
    const filteredProblems = problems.filter(problem => {
        // FIX 2: Compare with the 'filters' state object, not the 'filteredProblems' array
        const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
        const tagMatch = filters.tag === 'all' || problem.tags.includes(filters.tag);

        // FIX 3: Expanded logic to handle "solved" and "unsolved" status
        const isSolved = solvedProblems.some(sp => sp === problem._id);
        const statusMatch = filters.status === 'all' 
            || (filters.status === 'solved' && isSolved)
            || (filters.status === 'unsolved' && !isSolved);
            
        return difficultyMatch && tagMatch && statusMatch;
    });

    return (
        <div className="min-h-screen bg-base-200" data-theme="cupcake">
            {/* Navigation Bar */}
            <nav className="navbar bg-base-100 shadow-lg px-4">
                <div className="flex-1">
                    <NavLink to='/' className='btn btn-ghost text-xl'>LeetCode</NavLink>
                </div>
                <div className="flex-none gap-4">
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost">
                            {user?.firstName || 'Guest'}
                        </div>
                        <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                            <li><button onClick={handleLogout}>Logout</button></li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto p-4">
                {/* Filter options */}
                <div className="flex flex-wrap gap-4 mb-6">
                    {/* Status filter */}
                    <select
                        className="select select-bordered"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value='all'>All Statuses</option>
                        <option value='solved'>Solved</option>
                        <option value='unsolved'>Unsolved</option>
                    </select>

                    <select
                        className="select select-bordered"
                        value={filters.difficulty}
                        onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    >
                        <option value='all'>All Difficulties</option>
                        <option value='Easy'>Easy</option>
                        <option value='Medium'>Medium</option>
                        <option value='Hard'>Hard</option>
                    </select>

                    <select
                        className="select select-bordered"
                        value={filters.tag}
                        onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                    >
                        <option value='all'>All Tags</option>
                        <option value='Array'>Array</option>
                        <option value='String'>String</option>
                        <option value='Linked List'>Linked List</option>
                    </select>
                </div>

                {/* Problems list */}
                <div className="overflow-x-auto">
                    <table className="table bg-base-100 shadow-lg">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Title</th>
                                <th>Difficulty</th>
                                <th>Tags</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProblems.map(problem => (
                                <tr key={problem._id} className="hover">
                                    <td>
                                        {solvedProblems.some(sp => sp === problem._id) && (
                                            <div className="text-green-500 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <Link to={`/problem/${problem._id}`} className="link link-hover">{problem.title}</Link>
                                    </td>
                                    <td>
                                        {/* FIX 4: Correct syntax for function call */}
                                        <div className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}>
                                            {problem.difficulty}
                                        </div>
                                    </td>
                                    <td>
                                        {/* FIX 5: Safely join tags if it's an array */}
                                        {Array.isArray(problem.tags) ? problem.tags.join(', ') : problem.tags}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const getDifficultyBadgeColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
        case 'easy': return 'badge-success';
        case 'medium': return 'badge-warning';
        case 'hard': return 'badge-error';
        default: return 'badge-neutral';
    }
};

export default HomePage;
