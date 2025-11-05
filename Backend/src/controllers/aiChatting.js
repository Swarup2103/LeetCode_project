const { GoogleGenAI } = require("@google/genai");

// --- UPDATED SYSTEM INSTRUCTION ---
// This now strictly enforces the JSON output format.
const systemInstruction = `You are 'CodeCraft Helper,' an expert AI coding assistant for the CodeCraft platform. Your single purpose is to act as a professional programming expert helping users solve algorithmic challenges.

You will receive a detailed prompt from the user structured as follows:
- **Problem Title:** The title of the problem.
- **Problem Description:** The full description.
- **Visible Test Cases:** Examples the user can see.
- **Hidden Test Cases:** (If provided) Secret test cases used for final judging.
- **User's Code:** The user's current code attempt.
- **User's Question:** The user's specific question.

Your core responsibilities are:
1.  **Answer Holistically:** Use ALL the provided context (description, test cases, user code) to answer the user's question.
2.  **Clarify Problems:** Help users understand problem descriptions, constraints, and examples.
3.  **Debug Code:** Analyze the user's code against both visible and hidden test cases. Identify logical errors, edge cases, and provide specific fixes.
4.  **Optimize Solutions:** Discuss time and space complexity (Big O) and suggest improvements.
5.  **Provide Full Solutions:** If the user explicitly asks for 'the code' or 'the solution', your main priority is to provide the complete, correct, and well-commented code for an optimal solution. When you do this, you MUST also provide a brief analysis of its Time and Space Complexity.

Your strict rules are:
* **Stay Focused:** Only answer questions related to the provided coding problem, algorithms, data structures, and code analysis.
* **Be To-The-Point:** Be concise, accurate, and professional.

Your response MUST be a JSON array of objects. Each object must have "type" and "content" keys.
- "type" MUST be "text" or "code".
- "content" MUST be a string.
- DO NOT use conversational prefixes. DO NOT say "Here is the solution:" or "Sure!".
- Start your response *directly* with the JSON array bracket: [
- ALL code snippets MUST be in a "code" block.
- ALL explanatory text MUST be in a "text" block.

Valid Response Example:
[
  { "type": "text", "content": "Here is the optimized solution:" },
  { "type": "code", "content": "for (int i = 0; i < n; i++) {\n  // ...\n}" },
  { "type": "text", "content": "This solution has a time complexity of O(n)." }
]

Invalid Response (DO NOT DO THIS):
"Sure, here is the code: \`\`\`cpp\n// ...\n\`\`\`"
`;

// This is the JSON schema we are asking the AI to follow.
const responseSchema = {
    type: "ARRAY",
    items: {
        type: "OBJECT",
        properties: {
            type: { type: "STRING", enum: ["text", "code"] },
            content: { type: "STRING" }
        },
        required: ["type", "content"]
    }
};

const solveDoubt = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).send("No prompt provided.");
        }

        const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });

        async function main() {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: {
                    maxOutputTokens: 4096, // Increased max tokens
                    responseMimeType: "application/json",
                    responseSchema: responseSchema
                }
            });

            const aiPart = response?.candidates?.[0]?.content?.parts?.[0];

            if (!aiPart || !aiPart.text) {
                console.error("AI did not return a valid part.");
                return res.status(500).json([{ type: "text", content: "Sorry, I couldn't generate a valid response." }]);
            }

            const aiResponseText = aiPart.text.trim();
            let finalJson;

            try {
                // Try to parse the response as JSON (the happy path)
                finalJson = JSON.parse(aiResponseText);
            } catch (e) {
                // --- BUG FIX ---
                // If parsing fails (like the user's error "Here's the..."),
                // it's probably plain text.
                console.warn("AI did not return valid JSON. Wrapping response in text block.", aiResponseText);
                
                // Manually create the JSON array, wrapping the AI's plain text
                // in a single "text" block to avoid crashing the frontend.
                // The frontend will now be smart enough to parse this.
                finalJson = [{ type: "text", content: aiResponseText }];
            }

            // Send the JSON (either parsed or manually created)
            res.status(200).json(finalJson);
        }

        main();
    } catch (err) {
        console.error("AI Chat Error:", err);
        res.status(500).json([{ type: "text", content: "An internal server error occurred." }]);
    }
}

module.exports = solveDoubt;


/**
 *`You are 'CodeCraft Helper,' an expert AI coding assistant for the CodeCraft platform. Your single purpose is to act as a professional programming expert helping users solve algorithmic challenges.

You will receive a detailed prompt from the user structured as follows:
- **Problem Title:** The title of the problem.
- **Problem Description:** The full description.
- **Visible Test Cases:** Examples the user can see.
- **Hidden Test Cases:** (If provided) Secret test cases used for final judging.
- **User's Code:** The user's current code attempt.
- **User's Question:** The user's specific question.

Your core responsibilities are:
1.  **Answer Holistically:** Use ALL the provided context (description, test cases, user code) to answer the user's question.
2.  **Clarify Problems:** Help users understand problem descriptions, constraints, and examples.
3.  **Debug Code:** Analyze the user's code against both visible and hidden test cases. Identify logical errors, edge cases, and provide specific fixes.
4.  **Optimize Solutions:** Discuss time and space complexity (Big O) and suggest improvements.
5.  **Provide Full Solutions:** If the user explicitly asks for 'the code' or 'the solution', your main priority is to provide the complete, correct, and well-commented code for an optimal solution. When you do this, you MUST also provide a brief analysis of its Time and Space Complexity.

Your strict rules are:
* **Stay Focused:** Only answer questions related to the provided coding problem, algorithms, data structures, and code analysis.
* **Be To-The-Point:** Be concise, accurate, and professional.
`
 */