import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Helper function to get the base URL
const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        // Browser environment
        return window.location.origin;
    }
    // Server environment
    return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

// Tool to get list of task lists
export const getTaskListsTool = tool(async ({ }, config) => {
    try {
        const accessToken = config?.configurable?.accessToken || config?.configurable?.userID;
        if (!accessToken) {
            throw new Error("Access token not provided");
        }

        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/agent/tasks`, {
            headers: {
                'x-access-token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch task lists: ${response.statusText}`);
        }

        const data = await response.json();
        return JSON.stringify(data, null, 2);
    } catch (error) {
        return `Error fetching task lists: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}, {
    name: "get_task_lists",
    description: "Get a list of all Google task lists for the authenticated user",
    schema: z.object({}),
});

// Tool to get tasks from a specific task list
export const getTasksTool = tool(async ({ taskListId }, config) => {
    try {
        const accessToken = config?.configurable?.accessToken || config?.configurable?.userID;
        if (!accessToken) {
            throw new Error("Access token not provided");
        }

        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/agent/tasks/${taskListId}`, {
            headers: {
                'x-access-token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch tasks: ${response.statusText}`);
        }

        const data = await response.json();
        return JSON.stringify(data, null, 2);
    } catch (error) {
        return `Error fetching tasks: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}, {
    name: "get_tasks",
    description: "Get tasks from a specific task list",
    schema: z.object({
        taskListId: z.string().describe("Task list ID to fetch tasks from"),
    }),
});

// Tool to create a new task
export const createTaskTool = tool(async ({ taskListId, title, notes, dueDate }, config) => {
    try {
        const accessToken = config?.configurable?.accessToken || config?.configurable?.userID;
        if (!accessToken) {
            throw new Error("Access token not provided");
        }

        const task: Record<string, unknown> = {
            title: title,
        };

        if (notes) {
            task.notes = notes;
        }

        if (dueDate) {
            task.due = dueDate;
        }

        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/agent/tasks/${taskListId}`, {
            method: 'POST',
            headers: {
                'x-access-token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task: task,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create task: ${response.statusText}`);
        }

        const data = await response.json();
        return JSON.stringify(data, null, 2);
    } catch (error) {
        return `Error creating task: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}, {
    name: "create_task",
    description: "Create a new task in a specific task list",
    schema: z.object({
        taskListId: z.string().describe("Task list ID where to create the task"),
        title: z.string().describe("Task title"),
        notes: z.string().optional().describe("Task notes/description"),
        dueDate: z.string().optional().describe("Due date in RFC 3339 format (e.g., '2023-12-25T10:00:00Z')"),
    }),
});
