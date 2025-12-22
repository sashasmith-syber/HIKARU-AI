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
                text: "Refactor the following code snippet for improved readability and maintainability withoutaltering its functionality. Add comments where necessary to clarify complex logic.\n\n[PASTE CODE HERE]"
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
        category: "Code Debugging & Testing",
        prompts: [
             {
                title: "Explain Error Message",
                text: "Explain this error message in simple terms. What is the likely cause, and what are the common steps to debug and resolve it?\n\n[PASTE ERROR MESSAGE AND STACK TRACE HERE]"
            },
            {
                title: "Debug a Function",
                text: "The following function is not working as expected. It's supposed to [DESCRIBE INTENDED BEHAVIOR] but instead it [DESCRIBE ACTUAL BEHAVIOR]. Identify the bug, explain why it's happening, and provide the corrected code.\n\n[PASTE BUGGY FUNCTION HERE]"
            },
             {
                title: "Root Cause Analysis from Logs",
                text: "Analyze the following log entries to perform a root cause analysis of the described issue. Identify the sequence of events, pinpoint the origin of the error, and suggest a fix.\n\n[PASTE LOG SNIPPET AND DESCRIBE THE ISSUE HERE]"
            },
            {
                title: "Generate Unit Tests",
                text: "Write a comprehensive suite of unit tests for the following function using the [SPECIFY FRAMEWORK, e.g., 'Jest'] testing framework. Cover edge cases, happy paths, and error conditions.\n\n[PASTE FUNCTION HERE]"
            },
            {
                title: "Generate Mocks for Testing",
                text: "Generate mock implementations for the following class/module using [SPECIFY FRAMEWORK, e.g., 'Jest' or 'Sinon']. The mocks should cover the primary methods and allow for testing dependent components in isolation.\n\n[PASTE CLASS/MODULE DEFINITION HERE]"
            },
            {
                title: "Write End-to-End Test Scenario",
                text: "Write an end-to-end (E2E) test scenario for the [SPECIFY USER FLOW, e.g., 'user checkout process']. Use Gherkin syntax (Given/When/Then) and specify the key user actions and expected assertions. Assume a testing framework like Cypress or Playwright."
            },
        ]
    },
    {
        category: "Data Analysis & Visualization",
        prompts: [
            {
                title: "Analyze Dataset with Python",
                text: "Write a Python script using pandas and matplotlib to analyze the provided CSV data. The script should load the data, calculate descriptive statistics for the numerical columns, and generate a histogram for [COLUMN_NAME] and a scatter plot of [COLUMN_A] vs [COLUMN_B].\n\n[PASTE CSV DATA HERE OR DESCRIBE THE FILE PATH]"
            },
            {
                title: "Write Analytical SQL Query",
                text: "Write a SQL query to find the [SPECIFY METRIC, e.g., 'top 5 customers by total spending'] from the following tables: 'customers' (columns: customer_id, name) and 'orders' (columns: order_id, customer_id, amount). Provide the complete query."
            },
             {
                title: "Propose Data Cleaning Strategy",
                text: "I have a dataset with potential issues like missing values, duplicates, and incorrect data types. Propose a data cleaning strategy using Python (pandas). Provide code examples for each step: identifying issues, handling missing data (e.g., imputation, removal), and correcting data types.\n\n[DESCRIBE THE DATASET'S COLUMNS AND ISSUES HERE]"
            },
            {
                title: "Generate Data Visualization Code",
                text: "Generate Python code using [SPECIFY LIBRARY, e.g., 'Seaborn' or 'Plotly'] to create a [SPECIFY CHART TYPE, e.g., 'heatmap of a correlation matrix' or 'interactive bar chart'] from a pandas DataFrame. Include comments explaining the code."
            },
            {
                title: "Interpret ML Model Results",
                text: "I have the following results from a machine learning model: [PASTE RESULTS, e.g., a confusion matrix, classification report, or regression metrics]. Explain what these metrics (e.g., precision, recall, F1-score, R-squared) mean in the context of my model's performance and suggest next steps for improvement."
            }
        ]
    },
    {
        category: "Creative Writing for Engineers",
        prompts: [
            {
                title: "Draft a Technical Blog Post",
                text: "Write a draft for a technical blog post (around 500 words) explaining [COMPLEX TOPIC, e.g., 'the basics of quantum computing']. The target audience is software developers with no prior knowledge of the subject. Use analogies and simple language."
            },
            {
                title: "Write Technical Documentation",
                text: "Generate user-friendly documentation for an API endpoint that [DESCRIBE ENDPOINT FUNCTIONALITY]. Include sections for the endpoint URL, HTTP method, request parameters, a sample request body, and examples of success and error responses."
            },
            {
                title: "Create a Project Post-Mortem",
                text: "Draft a blame-free post-mortem document for a recent project. Structure it with the following sections: 'What went well?', 'What could have gone better?', 'Key Learnings', and 'Action Items' to improve future projects."
            },
            {
                title: "Generate Release Notes",
                text: "Write clear and concise release notes for a new software version (v2.1.0). Include sections for 'New Features', 'Bug Fixes', and 'Breaking Changes'.\n\n[PROVIDE A BULLET LIST OF CHANGES HERE]"
            }
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