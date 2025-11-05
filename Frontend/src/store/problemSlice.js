import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentProblemId: null,
    codeByLanguage: {
        cpp: '',
        java: '',
        javascript: '',
    },
    currentLanguage: 'cpp',
    chatMessages: [],
};

const problemSlice = createSlice({
    name: 'problem',
    initialState,
    reducers: {
        // Call this when the user lands on a problem page
        initializeProblemState: (state, action) => {
            const { problemId, starterCode } = action.payload;
            // If it's a new problem, reset the state
            if (state.currentProblemId !== problemId) {
                state.currentProblemId = problemId;
                state.chatMessages = [
                    // Add the initial greeting message
                    {
                        sender: 'ai',
                        parts: [
                            {
                                type: 'text',
                                // We need the title, but this action doesn't have it.
                                // We'll handle this in ProblemPage.jsx
                                content: `Hi there! I'm here to help.`
                            }
                        ]
                    }
                ];
                
                // Set starter code for all languages
                state.codeByLanguage = {
                    cpp: starterCode.find(sc => sc.language === 'c++')?.initialCode || '// C++ starter code',
                    java: starterCode.find(sc => sc.language === 'java')?.initialCode || '// Java starter code',
                    javascript: starterCode.find(sc => sc.language === 'javascript')?.initialCode || '// JavaScript starter code',
                };
                state.currentLanguage = 'cpp';
            }
        },
        // Update the greeting message once we have the problem title
        updateGreetingMessage: (state, action) => {
            const { title } = action.payload;
            if (state.chatMessages.length > 0) {
                 state.chatMessages[0].parts[0].content = `Hi there! I'm here to help with "${title}". What's on your mind? You can ask me to debug your code, explain a concept, or give you a hint.`;
            }
        },
        // Call this when the user types in the editor
        updateCode: (state, action) => {
            const { language, code } = action.payload;
            if (language in state.codeByLanguage) {
                state.codeByLanguage[language] = code;
            }
        },
        // Call this when the user changes the language dropdown
        setLanguage: (state, action) => {
            state.currentLanguage = action.payload;
        },
        // Call this to add a new chat message
        addChatMessage: (state, action) => {
            state.chatMessages.push(action.payload);
        },
        // Call this to replace the entire chat history (e.g., when adding user + AI response)
        setChatMessages: (state, action) => {
            state.chatMessages = action.payload;
        }
    },
});

export const {
    initializeProblemState,
    updateGreetingMessage,
    updateCode,
    setLanguage,
    addChatMessage,
    setChatMessages
} = problemSlice.actions;

export default problemSlice.reducer;