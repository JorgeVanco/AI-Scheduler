import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Tool to get current date and time
export const getCurrentTimeTool = tool(async ({ timezone }) => {
    try {
        const now = new Date();
        const timeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        const formatted = now.toLocaleString('en-US', {
            timeZone: timeZone,
            weekday: 'long',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });

        return `Current date and time: ${formatted} (${timeZone})`;
    } catch (error) {
        return `Error getting current time: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}, {
    name: "get_current_time",
    description: "Get the current date and time in a specific timezone",
    schema: z.object({
        timezone: z.string().optional().describe("Timezone (e.g., 'America/New_York', 'Europe/Madrid'). Defaults to user's local timezone"),
    }),
});

// Tool to calculate time differences
export const calculateTimeDifferenceTool = tool(async ({ startTime, endTime }) => {
    try {
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error("Invalid date format");
        }

        const diffMs = end.getTime() - start.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        let result = `Time difference between ${start.toISOString()} and ${end.toISOString()}:\n`;
        result += `- ${Math.abs(diffMs)} milliseconds\n`;
        result += `- ${Math.abs(diffMinutes)} minutes\n`;
        result += `- ${Math.abs(diffHours)} hours\n`;
        result += `- ${Math.abs(diffDays)} days\n`;

        if (diffMs < 0) {
            result += "\nNote: End time is before start time (negative duration)";
        }

        return result;
    } catch (error) {
        return `Error calculating time difference: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}, {
    name: "calculate_time_difference",
    description: "Calculate the time difference between two dates/times",
    schema: z.object({
        startTime: z.string().describe("Start date/time in ISO format (e.g., '2023-12-25T10:00:00Z')"),
        endTime: z.string().describe("End date/time in ISO format (e.g., '2023-12-25T11:30:00Z')"),
    }),
});

// Tool to format dates and times
export const formatDateTimeTool = tool(async ({ dateTime, format, timezone }) => {
    try {
        const date = new Date(dateTime);

        if (isNaN(date.getTime())) {
            throw new Error("Invalid date format");
        }

        const timeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        let formattedDate: string;

        switch (format) {
            case 'iso':
                formattedDate = date.toISOString();
                break;
            case 'short':
                formattedDate = date.toLocaleDateString('en-US', { timeZone });
                break;
            case 'long':
                formattedDate = date.toLocaleDateString('en-US', {
                    timeZone,
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                break;
            case 'time':
                formattedDate = date.toLocaleTimeString('en-US', { timeZone });
                break;
            case 'datetime':
            default:
                formattedDate = date.toLocaleString('en-US', { timeZone });
                break;
        }

        return `Formatted date/time: ${formattedDate} (${timeZone})`;
    } catch (error) {
        return `Error formatting date/time: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}, {
    name: "format_datetime",
    description: "Format a date/time string in various formats",
    schema: z.object({
        dateTime: z.string().describe("Date/time to format in ISO format"),
        format: z.enum(['iso', 'short', 'long', 'time', 'datetime']).optional().describe("Format type (defaults to 'datetime')"),
        timezone: z.string().optional().describe("Timezone for formatting (defaults to user's local timezone)"),
    }),
});

// Tool to add time to a date
export const addTimeTool = tool(async ({ dateTime, amount, unit }) => {
    try {
        const date = new Date(dateTime);

        if (isNaN(date.getTime())) {
            throw new Error("Invalid date format");
        }

        switch (unit) {
            case 'minutes':
                date.setMinutes(date.getMinutes() + amount);
                break;
            case 'hours':
                date.setHours(date.getHours() + amount);
                break;
            case 'days':
                date.setDate(date.getDate() + amount);
                break;
            case 'weeks':
                date.setDate(date.getDate() + (amount * 7));
                break;
            case 'months':
                date.setMonth(date.getMonth() + amount);
                break;
            case 'years':
                date.setFullYear(date.getFullYear() + amount);
                break;
            default:
                throw new Error("Invalid time unit");
        }

        return `Result: ${date.toISOString()}`;
    } catch (error) {
        return `Error adding time: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}, {
    name: "add_time",
    description: "Add a specific amount of time to a date/time",
    schema: z.object({
        dateTime: z.string().describe("Base date/time in ISO format"),
        amount: z.number().describe("Amount to add (can be negative to subtract)"),
        unit: z.enum(['minutes', 'hours', 'days', 'weeks', 'months', 'years']).describe("Unit of time to add"),
    }),
});
