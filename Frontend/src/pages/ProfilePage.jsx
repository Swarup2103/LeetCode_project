import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import Navbar from '../components/NavBar';

// ✨ REBUILT HELPER COMPONENT FOR SUBMISSION HEAT MAP ✨
const SubmissionHeatMap = ({ submissions }) => {
    // Data processing
    const submissionsByDate = new Map();
    submissions.forEach(sub => {
        const subDate = new Date(sub.createdAt).toDateString();
        submissionsByDate.set(subDate, (submissionsByDate.get(subDate) || 0) + 1);
    });

    const getBgColor = (count) => {
        if (count > 4) return 'bg-green-600';
        if (count > 2) return 'bg-green-500';
        if (count > 1) return 'bg-green-400';
        if (count > 0) return 'bg-green-300';
        return 'bg-base-300'; // Represents the dark empty squares in the screenshot
    };

    const months = [];
    const today = new Date();
    // FIX: Start from 11 months before the current month to get a full 12-month range including the current month.
    const startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1);


    for (let i = 0; i < 12; i++) {
        const currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + i);

        const year = currentDate.getFullYear();
        const monthIndex = currentDate.getMonth();
        const monthName = currentDate.toLocaleString('default', { month: 'short' });
        
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
        
        const monthDays = Array.from({ length: daysInMonth }, (_, dayIndex) => {
            const date = new Date(year, monthIndex, dayIndex + 1);
            const count = submissionsByDate.get(date.toDateString()) || 0;
            return { date, count };
        });

        months.push({ name: monthName, days: monthDays, padding: firstDayOfWeek });
    }
    
    return (
        
        <div className="flex gap-x-3 overflow-x-auto p-2">
            {months.map((month, index) => (
                <div key={index} className="flex flex-col items-center flex-shrink-0">
                    <div className="grid grid-flow-col grid-rows-7 gap-1 h-[105px]"> {/* Fixed height for alignment */}
                        {/* Add padding for the first day */}
                        {Array.from({ length: month.padding }).map((_, i) => <div key={`pad-${i}`} className="w-3.5 h-3.5" />)}
                        {month.days.map((day, i) => (
                            <div
                                key={i}
                                className={`w-3.5 h-3.5 rounded-sm ${getBgColor(day.count)}`}
                                title={`${day.count} submissions on ${day.date.toLocaleDateString()}`}
                            />
                        ))}
                    </div>
                    <div className="text-xs text-base-content/60 mt-1">{month.name}</div>
                </div>
            ))}
        </div>
    );
};


// NEW HELPER COMPONENT FOR BADGES
const BadgesPanel = ({ submissions }) => {
    // ... existing BadgesPanel code ...
    const uniqueSubmissionDays = new Set(
        submissions.map(sub => new Date(sub.createdAt).toDateString())
    ).size;

    const badges = [
        { days: 10, title: '10 Days Badge', color: 'a7a7a7' },
        { days: 50, title: '50 Days Badge', color: 'fbbf24' },
        { days: 100, title: '100 Days Badge', color: '34d399' },
        { days: 150, title: '150 Days Badge', color: '818cf8' },
    ];

    const earnedBadges = badges.filter(badge => uniqueSubmissionDays >= badge.days);
    const mostRecentBadge = earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : null;

    return (
        <div className="card bg-base-200 shadow-xl p-6 flex flex-col items-center justify-center text-center">
            {mostRecentBadge ? (
                <>
                    <img 
                        src={`https://placehold.co/100x100/${mostRecentBadge.color}/ffffff?text=🏆`} 
                        alt="Recent Badge" 
                        className="w-24 h-24 rounded-lg"
                    />
                    <h4 className="font-semibold mt-2">{mostRecentBadge.title}</h4>
                    <p className="text-xs text-base-content/60">Most Recent Badge</p>
                </>
            ) : (
                <>
                    <img 
                        src="https://placehold.co/100x100/374151/a7a7a7?text=🔒" 
                        alt="No Badge" 
                        className="w-24 h-24 rounded-lg"
                    />
                    <h4 className="font-semibold mt-2">No Badge Earned</h4>
                    <p className="text-xs text-base-content/60">Solve problems on 10 unique days to earn your first badge!</p>
                </>
            )}
        </div>
    );
};


export default function ProfilePage() {
    const { user } = useSelector((state) => state.auth);
    const [solvedStats, setSolvedStats] = useState({ easy: 0, medium: 0, hard: 0, total: 0 });
    const [totalStats, setTotalStats] = useState({ easy: 0, medium: 0, hard: 0, total: 0 });
    const [allSubmissions, setAllSubmissions] = useState([]);
    const [streaks, setStreaks] = useState({ totalActiveDays: 0, maxStreak: 0, currentStreak: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ✨ NEW HELPER FUNCTION TO CALCULATE STREAKS ✨
        const calculateStreaks = (submissions) => {
            if (!submissions || submissions.length === 0) {
                return { totalActiveDays: 0, maxStreak: 0, currentStreak: 0 };
            }

            const submissionDates = [...new Set(submissions.map(s => new Date(s.createdAt).toDateString()))]
                .map(d => new Date(d))
                .sort((a, b) => a - b);

            if (submissionDates.length === 0) {
                return { totalActiveDays: 0, maxStreak: 0, currentStreak: 0 };
            }

            let maxStreak = 1;
            let currentStreak = 1;

            for (let i = 1; i < submissionDates.length; i++) {
                const diff = (submissionDates[i] - submissionDates[i - 1]) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    currentStreak++;
                } else {
                    maxStreak = Math.max(maxStreak, currentStreak);
                    currentStreak = 1;
                }
            }
            maxStreak = Math.max(maxStreak, currentStreak);

            const today = new Date();
            const lastSubmissionDate = submissionDates[submissionDates.length - 1];
            const diffFromToday = (new Date(today.toDateString()) - lastSubmissionDate) / (1000 * 60 * 60 * 24);

            if (diffFromToday > 1) {
                currentStreak = 0;
            }

            return {
                totalActiveDays: submissionDates.length,
                maxStreak,
                currentStreak
            };
        };

        const fetchData = async () => {
            try {
                setLoading(true);
                const [problemsRes, solvedRes, submissionsRes] = await Promise.all([
                    axiosClient.get('/problem/getAllProblems'),
                    axiosClient.get('/problem/problemSolvedByUser'),
                    axiosClient.get('/problem/userSubmissions')
                ]);

                const allProblems = problemsRes.data.problems || [];
                const solvedProblemIds = new Set(solvedRes.data.solvedProblems || []);

                const solvedData = allProblems.reduce((acc, prob) => {
                    if (solvedProblemIds.has(prob._id)) {
                        acc.total++;
                        const difficulty = prob.difficulty?.toLowerCase();
                        if (difficulty === 'easy') acc.easy++;
                        else if (difficulty === 'medium') acc.medium++;
                        else if (difficulty === 'hard') acc.hard++;
                    }
                    return acc;
                }, { easy: 0, medium: 0, hard: 0, total: 0 });
                setSolvedStats(solvedData);

                const totalData = allProblems.reduce((acc, prob) => {
                    acc.total++;
                    const difficulty = prob.difficulty?.toLowerCase();
                    if (difficulty === 'easy') acc.easy++;
                    else if (difficulty === 'medium') acc.medium++;
                    else if (difficulty === 'hard') acc.hard++;
                    return acc;
                }, { easy: 0, medium: 0, hard: 0, total: 0 });
                setTotalStats(totalData);

                const subs = Array.isArray(submissionsRes.data) ? submissionsRes.data : [];
                setAllSubmissions(subs);
                setStreaks(calculateStreaks(subs)); // ✨ Calculate and set streaks
            } catch (error) {
                console.error("Failed to fetch profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const solvedPercentage = totalStats.total > 0 ? (solvedStats.total / totalStats.total) * 100 : 0;
    const recentSubmissions = allSubmissions.slice(0, 5);

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-base-100"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-base-100 text-base-content p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Sidebar */}
                    <aside className="lg:col-span-1 space-y-6">
                        {/* ... existing aside code ... */}
                        <div className="card bg-base-200 shadow-xl p-6 flex flex-col items-center text-center">
                            <div className="avatar mb-4">
                                <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                    <div className="w-24 h-24 flex items-center justify-center bg-primary/20 text-primary text-5xl font-bold">
                                        {user?.firstName?.charAt(0)}
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold">{user?.firstName}</h2>
                            <p className="text-base-content/60">{user?.emailId}</p>
                            <button className="btn btn-outline btn-primary btn-sm mt-4">Edit Profile</button>
                        </div>

                        <div className="card bg-base-200 shadow-xl p-6">
                            <h3 className="text-lg font-semibold mb-4">Community Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm"><span className="text-base-content/70">Views</span><span className="font-medium">0</span></div>
                                <div className="flex justify-between items-center text-sm"><span className="text-base-content/70">Solutions</span><span className="font-medium">0</span></div>
                                <div className="flex justify-between items-center text-sm"><span className="text-base-content/70">Reputation</span><span className="font-medium">0</span></div>
                            </div>
                        </div>

                        <div className="card bg-base-200 shadow-xl p-6">
                            <h3 className="text-lg font-semibold mb-4">Languages</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">C++</span>
                                    <progress className="progress progress-success w-2/3" value={solvedStats.total > 0 ? "70" : "0"} max="100"></progress>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-sm">Java</span>
                                    <progress className="progress progress-info w-2/3" value={solvedStats.total > 0 ? "20" : "0"} max="100"></progress>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">JavaScript</span>
                                    <progress className="progress progress-warning w-2/3" value={solvedStats.total > 0 ? "10" : "0"} max="100"></progress>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-2 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="card bg-base-200 shadow-xl p-6 flex flex-col justify-center items-center text-center">
                                <div
                                    className="radial-progress text-primary"
                                    style={{"--value": solvedPercentage, "--size": "8rem", "--thickness": "0.5rem"}}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-bold">{solvedStats.total}</span>
                                        <span className="text-xs text-base-content/60">Solved</span>
                                    </div>
                                </div>
                                <p className="text-sm mt-2 text-base-content/70">Out of {totalStats.total} problems</p>
                            </div>
                            <div className="card bg-base-200 shadow-xl p-6 space-y-3">
                                <div className="flex justify-between items-baseline"><span className="text-success font-medium">Easy</span><span className="text-xl font-bold">{solvedStats.easy} / {totalStats.easy}</span></div>
                                <progress className="progress progress-success w-full" value={solvedStats.easy} max={totalStats.easy}></progress>

                                <div className="flex justify-between items-baseline"><span className="text-warning font-medium">Medium</span><span className="text-xl font-bold">{solvedStats.medium} / {totalStats.medium}</span></div>
                                <progress className="progress progress-warning w-full" value={solvedStats.medium} max={totalStats.medium}></progress>

                                <div className="flex justify-between items-baseline"><span className="text-error font-medium">Hard</span><span className="text-xl font-bold">{solvedStats.hard} / {totalStats.hard}</span></div>
                                <progress className="progress progress-error w-full" value={solvedStats.hard} max={totalStats.hard}></progress>
                            </div>
                            <BadgesPanel submissions={allSubmissions} />
                        </div>

                        <div className="card bg-base-200 shadow-xl p-6">
                             {/* ✨ NEW HEADER FOR STREAK STATS ✨ */}
                            <div className="flex flex-wrap items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">{allSubmissions.length} submissions in the last year</h3>
                                <div className="flex items-center gap-4 text-sm text-base-content/80">
                                    <span>Total active days: <span className="font-bold text-base-content">{streaks.totalActiveDays}</span></span>
                                    <span>Max streak: <span className="font-bold text-base-content">{streaks.maxStreak}</span></span>
                                    <span>Current: <span className="font-bold text-base-content">{streaks.currentStreak}</span></span>
                                </div>
                            </div>
                            <SubmissionHeatMap submissions={allSubmissions} />
                        </div>

                        <div className="card bg-base-200 shadow-xl p-6">
                             <h3 className="text-lg font-semibold mb-4">Recent Submissions</h3>
                             <div className="space-y-2">
                                {recentSubmissions.length > 0 ? recentSubmissions.map(sub => (
                                    <div key={sub._id} className="p-3 rounded-lg bg-base-300 grid grid-cols-5 gap-4 items-center text-sm">
                                        <Link to={`/problem/${sub.problemId?._id}`} className="col-span-3 link link-hover font-medium truncate">
                                            {sub.problemId?.title || 'Problem Title'}
                                        </Link>
                                        <span className={`col-span-1 text-center font-semibold capitalize ${sub.status === 'accepted' ? 'text-success' : 'text-error'}`}>
                                            {sub.status}
                                        </span>
                                        <span className="col-span-1 text-right text-base-content/60">
                                            {new Date(sub.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-center text-base-content/60 py-4">No recent submissions found.</p>
                                )}
                             </div>
                        </div>

                    </main>
                </div>
            </div>
        </>
    );
}

