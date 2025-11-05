import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'; // <-- Import Redux hooks
import Editor from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import axiosClient from '../utils/axiosClient';
import ChatWithAI from './ChatWithAI';
import {
    initializeProblemState,
    updateGreetingMessage,
    updateCode,
    setLanguage,
    setChatMessages
} from '../store/problemSlice'; // <-- Import Redux actions

// --- Sub-Components (DescriptionPanel, etc.) remain unchanged ---
// (Omitted for brevity)
// Component to display the problem description
const DescriptionPanel = ({ problem, getDifficultyBg, getDifficultyColor }) => (
    <>
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-base-content">{problem.title}</h1>
                <span className={`badge ${getDifficultyBg(problem.difficulty)} ${getDifficultyColor(problem.difficulty)} badge-lg font-semibold border`}>
                    {problem.difficulty}
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {problem.tags && (<span className="badge badge-outline">{problem.tags}</span>)}
            </div>
        </div>
        <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-base-content/90 leading-relaxed">
                {problem.description}
            </div>
        </div>
        <div className="mt-8">
            <h3 className="text-xl font-bold text-base-content mb-4">Examples</h3>
            <div className="space-y-4">
                {problem.visibleTestCases.map((example, index) => (
                    <div key={index} className="card bg-base-200 border border-base-300">
                        <div className="card-body p-4">
                            <h4 className="font-semibold text-base-content mb-3">Example {index + 1}</h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-base-content/70">Input:</span>
                                    <pre className="mt-1 p-3 bg-base-300 rounded-lg text-sm overflow-x-auto">{example.input}</pre>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-base-content/70">Output:</span>
                                    <pre className="mt-1 p-3 bg-base-300 rounded-lg text-sm overflow-x-auto">{example.output}</pre>
                                </div>
                                {example.explanation && (
                                    <div>
                                        <span className="text-sm font-medium text-base-content/70">Explanation:</span>
                                        <p className="mt-1 text-sm text-base-content/80">{example.explanation}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </>
);

// Component to display reference solutions
const SolutionsPanel = ({ solutions }) => (
    <div>
        <h1 className="text-3xl font-bold text-base-content mb-6">Reference Solutions</h1>
        {solutions && solutions.length > 0 ? (
            <div className="space-y-6">
                {solutions.map((sol, index) => (
                    <div key={index} className="card bg-base-200 border border-base-300">
                        <div className="card-body p-4">
                            <h3 className="card-title text-lg capitalize">{sol.language} Solution</h3>
                            <div className="mt-2 bg-base-300 rounded-lg overflow-hidden">
                                <Editor
                                    height="200px"
                                    language={sol.language === 'c++' ? 'cpp' : sol.language}
                                    value={sol.completeCode}
                                    theme="vs-dark"
                                    options={{ readOnly: true, minimap: { enabled: false } }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-base-content/70 text-center py-10">No reference solutions available for this problem.</p>
        )}
    </div>
);

// Component to display user's past submissions
const SubmissionsPanel = ({ submissions, loading, onSubmissionClick }) => {
    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'accepted': return 'text-success';
            case 'wrong': return 'text-error';
            case 'error': return 'text-error';
            default: return 'text-warning';
        }
    };

    if (loading) {
        return <div className="text-center py-10"><span className="loading loading-dots loading-md"></span></div>;
    }

    if (!submissions || submissions.length === 0) {
        return <p className="text-base-content/70 text-center py-10">You have no submissions for this problem yet.</p>;
    }

    return (
         <div>
            <h1 className="text-3xl font-bold text-base-content mb-6">Your Submissions</h1>
            <div className="space-y-3">
                {submissions.map((sub) => (
                    <div key={sub._id} className="card bg-base-200 border border-base-300 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSubmissionClick(sub)}>
                        <div className="card-body p-4 flex-row items-center justify-between">
                            <div>
                                <p className={`font-bold text-lg capitalize ${getStatusClass(sub.status)}`}>
                                    {sub.status === 'wrong' ? 'Wrong Answer' : sub.status}
                                </p>
                                <p className="text-xs text-base-content/60 mt-1">
                                    {new Date(sub.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="badge badge-outline capitalize">{sub.language}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Modal to show the code of a specific submission
const SubmissionDetailModal = ({ submission, onClose }) => {
    if (!submission) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-4xl">
                <h3 className="font-bold text-lg">Submission Details ({submission.language})</h3>
                 <div className="mt-4 bg-base-300 rounded-lg overflow-hidden h-96">
                    <Editor
                        height="100%"
                        language={submission.language === 'c++' ? 'cpp' : submission.language}
                        value={submission.code}
                        theme="vs-dark"
                        options={{ readOnly: true, minimap: { enabled: false } }}
                    />
                </div>
                <div className="modal-action">
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};


// --- Main Problem Page Component ---
export default function ProblemPage() {
    const { id } = useParams();
    const dispatch = useDispatch();

    // --- Get State from Redux ---
    const {
        currentProblemId,
        codeByLanguage,
        currentLanguage,
        chatMessages
    } = useSelector((state) => state.problem);

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI State
    const [activeTab, setActiveTab] = useState('description');
    const [activeConsoleTab, setActiveConsoleTab] = useState('testcase');

    // Data for other tabs
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    // --- Editor State (Local) ---
    const [fontSize, setFontSize] = useState(14);

    // --- Chat State (Local) ---
    const [currentChatMessage, setCurrentChatMessage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    // --- Execution State (Local) ---
    const [runResult, setRunResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- Get code for the current language from Redux ---
    const code = codeByLanguage[currentLanguage] || '';

    useEffect(() => {
        const fetchProblemData = async () => {
            try {
                setLoading(true);
                const response = await axiosClient.get(`/problem/problemById/${id}?full=true`);
                setProblem(response.data);

                // --- Initialize Redux state for this problem ---
                // This will only run if the problemId is different from the one in the store
                dispatch(initializeProblemState({
                    problemId: id,
                    starterCode: response.data.startCode || []
                }));
                // Update the greeting message with the problem title
                dispatch(updateGreetingMessage({ title: response.data.title }));

            } catch (err) {
                setError("Failed to load problem data.");
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProblemData();
    }, [id, dispatch]);

    const fetchSubmissions = async () => {
        // (Logic unchanged)
        if (submissions.length > 0 && activeTab === 'submissions') return;
        try {
            setSubmissionsLoading(true);
            const response = await axiosClient.get(`/problem/submittedProblem/${id}`);
            if (Array.isArray(response.data)) {
                const sortedSubmissions = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setSubmissions(sortedSubmissions);
            } else {
                 setSubmissions([]);
            }
        } catch (err) {
            console.error("Failed to fetch submissions:", err);
            setSubmissions([]);
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        if (tab === 'submissions') {
            fetchSubmissions();
        }
    };

    // --- Redux-powered handlers ---
    const handleLanguageChange = (newLang) => {
        dispatch(setLanguage(newLang));
    };

    const handleCodeChange = (newCode) => {
        dispatch(updateCode({ language: currentLanguage, code: newCode || '' }));
    };

    // --- Chat Submit Logic (Moved from ChatWithAI) ---
    const formatTestCases = (testCases) => {
        if (!testCases || testCases.length === 0) return "N/A";
        return testCases.map((tc, i) =>
            `Case ${i + 1}:\nInput: ${tc.input}\nOutput: ${tc.output}${tc.explanation ? `\nExplanation: ${tc.explanation}` : ''}`
        ).join('\n\n');
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        const userMessage = currentChatMessage.trim();
        if (!userMessage || isChatLoading) return;

        const newUserMessage = { sender: 'user', text: userMessage };
        const newMessages = [...chatMessages, newUserMessage];
        
        dispatch(setChatMessages(newMessages)); // Update Redux state
        setCurrentChatMessage('');
        setIsChatLoading(true);

        try {
            const historyString = chatMessages.map(msg => {
                if (msg.sender === 'ai') {
                    if (!msg.parts) return "AI: ...";
                    const aiContent = msg.parts.map(part => part.type === 'code' ? `\`\`\`\n${part.content}\n\`\`\`` : part.content).join('\n');
                    if (aiContent.startsWith("Hi there! I'm here to help")) return null;
                    return `AI: ${aiContent}`;
                } else {
                    return `User: ${msg.text}`;
                }
            }).filter(Boolean).join('\n\n');
            
            const prompt = `
---
**Problem Title:**
${problem.title}
---
**Problem Description:**
${problem.description}
---
**Visible Test Cases:**
${formatTestCases(problem.visibleTestCases)}
---
**Hidden Test Cases:**
${formatTestCases(problem.hiddenTestCases || [])}
---
**User's Code:**
\`\`\`
${code || "// No code provided yet."}
\`\`\`
---
**Previous Conversation:**
${historyString.length > 0 ? historyString : "No previous conversation."}
---
**User's NEW Question:**
${userMessage}
---
            `;

            const response = await axiosClient.post('/ai/chat', { prompt });
            // Add the new AI message with the 'parts' array
            dispatch(setChatMessages([...newMessages, { sender: 'ai', parts: response.data }]));

        } catch (error) {
            console.error("Error chatting with AI:", error);
            const errorMsg = error.response?.data?.[0]?.content || "Sorry, I ran into an error. Please check the console or try again.";
            dispatch(setChatMessages([...newMessages, { 
                sender: 'ai', 
                parts: [{ type: 'text', content: errorMsg }] 
            }]));
        } finally {
            setIsChatLoading(false);
        }
    };

    // --- Run/Submit Logic (Unchanged, but uses 'code' from Redux) ---
    const handleRun = async () => {
        setIsProcessing(true);
        setActiveConsoleTab('result');
        setRunResult(null);
        try {
            const langForApi = currentLanguage === 'cpp' ? 'cpp' : currentLanguage;
            const response = await axiosClient.post(`/submission/runCode/${id}`, { code, language: langForApi });
            setRunResult(response.data);
        } catch (err) {
            console.error("Run failed:", err);
            setRunResult([{ status_id: -1, stderr: err.response?.data || "An unexpected error occurred." }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async () => {
        setIsProcessing(true);
        setActiveConsoleTab('result');
        try {
            const langForApi = currentLanguage === 'cpp' ? 'cpp' : currentLanguage;
            await axiosClient.post(`/submission/submit/${id}`, { code, language: langForApi });
            alert('Submission successful! Your solution has been recorded.');
            setSubmissions([]); 
        } catch (err) {
            console.error("Submission failed:", err);
            alert('Submission failed: ' + (err.response?.data || "An error occurred."));
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Helper Functions (Unchanged) ---
    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'text-success';
            case 'medium': return 'text-warning';
            case 'hard': return 'text-error';
            default: return 'text-base-content';
        }
    };

    const getDifficultyBg = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'bg-success/10 border-success/20';
            case 'medium': return 'bg-warning/10 border-warning/20';
            case 'hard': return 'bg-error/10 border-error/20';
            default: return 'bg-base-content/10 border-base-content/20';
        }
    };

    const getTabLabel = (tab) => {
        if (tab === 'chat') return 'Chat AI';
        return tab.charAt(0).toUpperCase() + tab.slice(1);
    }

    // --- Render Logic ---
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-base-100">
                <div className="text-center"><span className="loading loading-spinner loading-lg text-primary"></span><p className="mt-4 text-base-content/70">Loading problem...</p></div>
            </div>
        );
    }

    if (error || !problem) {
        return (<div className="flex h-screen items-center justify-center bg-base-100"><div className="alert alert-error shadow-lg max-w-md"><span>Error: {error || "Problem not found."}</span></div></div>)
    }

    return (
        <div className="flex h-screen flex-col bg-base-100">
            <SubmissionDetailModal submission={selectedSubmission} onClose={() => setSelectedSubmission(null)} />
            <header className="sticky top-0 z-50 bg-base-200 border-b border-base-300 shadow-sm">
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center space-x-1">
                        {['description', 'solutions', 'submissions', 'chat'].map((tab) => (
                            <button
                                key={tab}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'text-base-content/70 hover:text-base-content hover:bg-base-300'}`}
                                onClick={() => handleTabClick(tab)}
                            >
                                {getTabLabel(tab)}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* --- Language select now uses Redux state/dispatch --- */}
                        <select className="select select-bordered select-sm bg-base-100" value={currentLanguage} onChange={(e) => handleLanguageChange(e.target.value)}>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                            <option value="javascript">JavaScript</option>
                        </select>
                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-sm btn-ghost gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Settings
                            </label>
                            <ul tabIndex={0} className="dropdown-content menu p-2 shadow-xl bg-base-200 rounded-box w-52 mt-2 border border-base-300">
                                <li><div className="flex items-center justify-between"><span>Font Size</span><div className="flex gap-1"><button className="btn btn-xs" onClick={() => setFontSize(f => Math.max(10, f - 2))}>-</button><span className="text-xs px-2 py-1">{fontSize}</span><button className="btn btn-xs" onClick={() => setFontSize(f => Math.min(24, f + 2))}>+</button></div></div></li>
                            </ul>
                        </div>
                        
                        <button
                            onClick={() => handleTabClick('solutions')}
                            className="btn btn-sm btn-outline btn-info gap-2"
                            aria-label="Show solution"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Solution
                        </button>

                        <button onClick={handleRun} disabled={isProcessing} className="btn btn-sm btn-outline gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Run
                        </button>
                        <button onClick={handleSubmit} disabled={isProcessing} className="btn btn-sm bg-gradient-to-r from-success to-success/80 text-white border-none gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Submit
                        </button>
                    </div>
                </div>
            </header>
            <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
                <Panel defaultSize={50} minSize={30}>
                    <div className={`h-full overflow-y-auto ${activeTab === 'chat' ? 'p-0' : 'p-6'} bg-base-100`}>
                        {activeTab === 'description' && <DescriptionPanel problem={problem} getDifficultyBg={getDifficultyBg} getDifficultyColor={getDifficultyColor} />}
                        {activeTab === 'solutions' && <SolutionsPanel solutions={problem.referenceSolution} />}
                        {activeTab === 'submissions' && <SubmissionsPanel submissions={submissions} loading={submissionsLoading} onSubmissionClick={setSelectedSubmission} />}
                        {activeTab === 'chat' && (
                            // --- Pass Redux state and handlers down to ChatWithAI ---
                            <ChatWithAI
                                messages={chatMessages}
                                isLoading={isChatLoading}
                                currentMessage={currentChatMessage}
                                onMessageChange={setCurrentChatMessage}
                                onSubmit={handleChatSubmit}
                            />
                        )}
                    </div>
                </Panel>
                <PanelResizeHandle className="w-2 bg-base-300 hover:bg-primary transition-colors" />
                <Panel defaultSize={50} minSize={30} className="flex flex-col">
                    <div className="flex-1 bg-base-300">
                        {/* --- Editor now uses Redux state and dispatch --- */}
                        <Editor
                            height="100%"
                            language={currentLanguage}
                            value={code}
                            onChange={handleCodeChange}
                            theme="vs-dark"
                            options={{
                                fontSize: `${fontSize}px`,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true
                            }}
                        />
                    </div>
                    <div className="h-64 bg-base-200 border-t border-base-300">
                        <div className="flex border-b border-base-300">
                            <button className={`px-4 py-3 text-sm font-medium ${activeConsoleTab === 'testcase' ? 'text-primary border-b-2 border-primary' : 'text-base-content/60 hover:text-base-content'}`} onClick={() => setActiveConsoleTab('testcase')}>Test Cases</button>
                            <button className={`px-4 py-3 text-sm font-medium ${activeConsoleTab === 'result' ? 'text-primary border-b-2 border-primary' : 'text-base-content/60 hover:text-base-content'}`} onClick={() => setActiveConsoleTab('result')}>Results</button>
                        </div>
                        <div className="p-4 h-[calc(100%-49px)] overflow-y-auto">
                            {/* --- Console tabs remain unchanged --- */}
                            {activeConsoleTab === 'testcase' ? (<div className="space-y-3">{problem.visibleTestCases?.map((testCase, index) => (<div key={index} className="card bg-base-300 border border-base-content/10"><div className="card-body p-3"><span className="text-sm font-semibold">Test Case {index + 1}</span><div className="text-xs font-medium text-base-content/60 mt-2">Input</div><pre className="mt-1 p-2 bg-base-100 rounded text-xs overflow-x-auto">{testCase.input}</pre></div></div>))}</div>) : isProcessing ? (<div className="flex items-center justify-center h-full"><span className="loading loading-spinner text-primary"></span></div>) : runResult ? (<div className="space-y-3">{runResult.map((result, index) => { const isAccepted = result.status_id === 3; return (<div key={index} className={`card border-l-4 ${isAccepted ? 'border-success bg-success/5' : 'border-error bg-error/5'}`}><div className="card-body p-3"><div className="flex items-center justify-between mb-2"><span className={`text-sm font-semibold ${isAccepted ? 'text-success' : 'text-error'}`}>Test Case {index + 1} - {isAccepted ? 'Passed' : 'Failed'}</span>{result.time && <span className="text-xs text-base-content/60">Runtime: {result.time}</span>}</div><div className="grid grid-cols-3 gap-2 text-xs"><div><span className="font-medium text-base-content/60">Input</span><pre className="mt-1 p-2 bg-base-200 rounded overflow-x-auto">{result.stdin}</pre></div><div><span className="font-medium text-base-content/60">Your Output</span><pre className="mt-1 p-2 bg-base-200 rounded overflow-x-auto">{result.stdout || "N/A"}</pre></div><div><span className="font-medium text-base-content/60">Expected</span><pre className="mt-1 p-2 bg-base-200 rounded overflow-x-auto">{result.expected_output}</pre></div></div>{result.stderr && <div className="mt-2 text-error text-xs"><span className="font-bold">Error:</span><pre className="mt-1 p-2 bg-error/10 rounded">{result.stderr}</pre></div>}</div></div>); })}</div>) : (<div className="flex items-center justify-center h-full text-base-content/50"><p>Run your code to see results</p></div>)}
                        </div>
                    </div>
                </Panel>
            </PanelGroup>
        </div>
    );
}