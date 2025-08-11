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

// Tool to get list of calendars
export const getCalendarsTool = tool(async ({ }, config) => {
    try {
        const accessToken = config?.configurable?.accessToken || config?.configurable?.userID;
        if (!accessToken) {
            throw new Error("Access token not provided");
        }

        const baseUrl = getBaseUrl();
        console.log("Fetching calendars in tool from:", baseUrl);
        const response = await fetch(`${baseUrl}/api/agent/calendars`, {
            headers: {
                'x-access-token': accessToken,
                'Content-Type': 'application/json',
            },
        });
        console.log("Calendars response status:", response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Failed to fetch calendars: ${response.statusText}`);
        }

        const data = await response.json();
        return JSON.stringify(data, null, 2);
    } catch (error) {
        return `Error fetching calendars: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}, {
    name: "get_calendars",
    description: "Get a comprehensive list of all Google calendars for the authenticated user. Use this first when user asks about calendars or wants to create events without specifying a calendar. Returns calendar IDs, names, and properties.",
    schema: z.object({}),
});

// Tool to get events from a specific calendar
export const getEventsTool = tool(async ({ calendarId, startDate, endDate }, config) => {
    try {
        const accessToken = config?.configurable?.accessToken || config?.configurable?.userID;
        if (!accessToken) {
            throw new Error("Access token not provided");
        }

        const params = new URLSearchParams();
        if (calendarId) params.append('calendarId', calendarId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/agent/events?${params.toString()}`, {
            headers: {
                'x-access-token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.statusText}`);
        }

        const data = await response.json();
        return JSON.stringify(data, null, 2);
    } catch (error) {
        return `Error fetching events: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}, {
    name: "get_events",
    description: "Get events from a specific calendar within a date range. Defaults to primary calendar and today's events if no parameters specified. Use this to check user's schedule or find existing events.",
    schema: z.object({
        calendarId: z.string().optional().describe("Calendar ID to fetch events from (defaults to 'primary')"),
        startDate: z.string().optional().describe("Start date in ISO format (defaults to today at midnight)"),
        endDate: z.string().optional().describe("End date in ISO format (defaults to tomorrow at midnight)"),
    }),
});

// Tool to create a new event
export const createEventTool = tool(async ({ calendarId = 'primary', title, description, startDateTime, endDateTime, location, attendees }, config) => {
    try {
        const accessToken = config?.configurable?.accessToken || config?.configurable?.userID;
        if (!accessToken) {
            throw new Error("Access token not provided");
        }

        const event = {
            summary: title,
            description: description,
            location: location,
            start: {
                dateTime: startDateTime,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: endDateTime,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            attendees: attendees?.map((email: string) => ({ email })) || [],
        };

        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/agent/events`, {
            method: 'POST',
            headers: {
                'x-access-token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                calendarId: calendarId || 'primary',
                event: event,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create event: ${response.statusText}`);
        }

        const data = await response.json();
        return JSON.stringify(data, null, 2);
    } catch (error) {
        return `Error creating event: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}, {
    name: "create_event",
    description: "Create a new calendar event. Use get_calendars first if user doesn't specify a calendar. Always use EXACT calendar IDs from get_calendars - never modify them.",
    schema: z.object({
        calendarId: z.string().optional().describe("EXACT Calendar ID from get_calendars where to create the event - DO NOT MODIFY. Defaults to 'primary' if not specified by user"),
        title: z.string().describe("Event title/summary"),
        description: z.string().optional().describe("Event description"),
        startDateTime: z.string().describe("Start date and time in ISO format (e.g., '2023-12-25T10:00:00')"),
        endDateTime: z.string().describe("End date and time in ISO format (e.g., '2023-12-25T11:00:00')"),
        location: z.string().optional().describe("Event location"),
        attendees: z.array(z.string()).optional().describe("Array of attendee email addresses"),
    }),
});

// Tool to search events by text
export const searchEventsTool = tool(async ({ query, calendarId, maxResults }, config) => {
    try {
        const accessToken = config?.configurable?.accessToken || config?.configurable?.userID;
        if (!accessToken) {
            throw new Error("Access token not provided");
        }

        const params = new URLSearchParams();
        params.append('q', query);
        if (calendarId) params.append('calendarId', calendarId);
        if (maxResults) params.append('maxResults', maxResults.toString());

        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/agent/events/search?${params.toString()}`, {
            headers: {
                'x-access-token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to search events: ${response.statusText}`);
        }

        const data = await response.json();
        return JSON.stringify(data, null, 2);
    } catch (error) {
        return `Error searching events: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}, {
    name: "search_events",
    description: "Search for events by text query across calendars. Use when user wants to find specific events by keywords.",
    schema: z.object({
        query: z.string().describe("Text to search for in event titles and descriptions"),
        calendarId: z.string().optional().describe("Calendar ID to search in (defaults to 'primary')"),
        maxResults: z.number().optional().describe("Maximum number of results to return (defaults to 50)"),
    }),
});

// Tool to check free/busy time for calendars
export const getFreeBusyTool = tool(async ({ calendars, startDateTime, endDateTime }, config) => {
    try {
        const accessToken = config?.configurable?.accessToken || config?.configurable?.userID;
        if (!accessToken) {
            throw new Error("Access token not provided");
        }

        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/agent/calendars/freebusy`, {
            method: 'POST',
            headers: {
                'x-access-token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                calendars: calendars,
                timeMin: startDateTime,
                timeMax: endDateTime,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to get free/busy information: ${response.statusText}`);
        }

        const data = await response.json();
        return JSON.stringify(data, null, 2);
    } catch (error) {
        return `Error getting free/busy information: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}, {
    name: "get_free_busy",
    description: "Check free/busy time for one or more calendars to find available time slots",
    schema: z.object({
        calendars: z.array(z.string()).describe("Array of calendar IDs to check (e.g., ['primary', 'calendar-id-2'])"),
        startDateTime: z.string().describe("Start date and time in ISO format"),
        endDateTime: z.string().describe("End date and time in ISO format"),
    }),
});
