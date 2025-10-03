export interface Prompt {
    title: string;
    text: string;
}

export interface PromptCategory {
    category: string;
    prompts: Prompt[];
}

export const PROMPT_LIBRARY: PromptCategory[] = [
    {
        category: "Code Refactoring & Review",
        prompts: [
            {
                title: "Refactor for Readability",
                text: "Refactor the following code snippet for improved readability and maintainability without altering its functionality. Add comments where necessary to clarify complex logic.\n\n[PASTE CODE HERE]"
            },
            {
                title: "Identify Code Smells",
                text: "Analyze the following code for common code smells (e.g., long methods, large classes, duplicated code, feature envy) and suggest specific, actionable improvements with examples.\n\n[PASTE CODE HERE]"
            },
            {
                title: "Optimize for Performance",
                text: "Analyze the following code snippet for performance bottlenecks. Suggest optimizations, explaining the trade-offs of each proposed change (e.g., memory usage vs. CPU cycles).\n\n[PASTE CODE HERE]"
            }
        ]
    },
    {
        category: "System & API Design",
        prompts: [
            {
                title: "Design RESTful Endpoint",
                text: "Design a RESTful API endpoint for [SPECIFY ACTION, e.g., 'creating a new user profile']. Define the HTTP method, URL structure, request body schema (in JSON), and potential success (2xx) and error (4xx, 5xx) responses with status codes."
            },
            {
                title: "High-Level System Architecture",
                text: "Outline a high-level system architecture for a [SPECIFY APPLICATION, e.g., 'real-time chat application']. Describe the key components (e.g., frontend, backend, database, message queue), their responsibilities, and how they interact."
            },
            {
                title: "Database Schema Design",
                text: "Design a normalized database schema for a [SPECIFY FEATURE, e.g., 'blog with posts, comments, and tags']. Specify the tables, columns, data types, primary keys, and relationships (one-to-one, one-to-many, many-to-many)."
            }
        ]
    },
    {
        category: "Testing & Debugging",
        prompts: [
            {
                title: "Generate Unit Tests",
                text: "Write a comprehensive suite of unit tests for the following function using the [SPECIFY FRAMEWORK, e.g., 'Jest'] testing framework. Cover edge cases, happy paths, and error conditions.\n\n[PASTE FUNCTION HERE]"
            },
            {
                title: "Explain Error Message",
                text: "Explain this error message in simple terms. What is the likely cause, and what are the common steps to debug and resolve it?\n\n[PASTE ERROR MESSAGE AND STACK TRACE HERE]"
            },
        ]
    },
    {
        category: "Prompt Engineering",
        prompts: [
            {
                title: "Improve a Prompt",
                text: "Here is a prompt I'm using: \"[PASTE PROMPT HERE]\". The results are not ideal because [DESCRIBE THE PROBLEM]. Please rewrite the prompt to be more effective, incorporating principles like clear instructions, role-playing, and providing examples."
            },
        ]
    }
];