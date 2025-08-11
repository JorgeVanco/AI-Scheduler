import { ChatCalendarContext } from "@/types";
import { getNextXHoursEvents } from "./tools";

export interface IntentAnalysis {
    intent?: string;
    contextualInfo?: string;
    suggestions?: string[];
}

export class PromptBuilder {
    private calendarContext: ChatCalendarContext;

    constructor(calendarContext: ChatCalendarContext) {
        this.calendarContext = calendarContext;
    }

    /**
     * Builds the system prompt with dynamic calendar context
     */
    buildSystemPrompt(intentAnalysis: IntentAnalysis, smartSuggestions: string[], priorityInsights: string): string {
        const basePrompt = this.getBaseSystemPrompt();
        const calendarContextPrompt = this.buildCalendarContextPrompt();
        const upcomingEventsPrompt = this.buildUpcomingEventsPrompt();
        const pendingTasksPrompt = this.buildPendingTasksPrompt();
        const dynamicContextPrompt = this.buildDynamicContextPrompt(intentAnalysis, smartSuggestions, priorityInsights);
        const commandsPrompt = this.getAvailableCommandsPrompt();

        return [
            basePrompt,
            calendarContextPrompt,
            upcomingEventsPrompt,
            pendingTasksPrompt,
            dynamicContextPrompt,
            commandsPrompt
        ].join('\n\n');
    }

    /**
     * Base system prompt template
     */
    private getBaseSystemPrompt(): string {
        return `You are an advanced AI assistant for calendar and task management. You MUST respond in the same language the user is using in their messages.

LANGUAGE RULES:
- If user writes in Spanish, respond in Spanish
- If user writes in English, respond in English
- If user writes in any other language, respond in that language
- Always maintain a helpful, professional tone regardless of language

TOOL USAGE STRATEGY:
1. Always use tools when you need current information
2. Use get_calendars before creating events if user doesn't specify a calendar
3. Use get_task_lists before creating tasks if user doesn't specify a task list
4. Use get_current_time when you need to know the current date/time
5. Use add_time to calculate future/past dates for scheduling

AVAILABLE TOOLS:

CALENDAR MANAGEMENT:
- get_calendars: Retrieve all user's Google calendars with their IDs and names
- get_events: Fetch events from specific calendars within date ranges (defaults to primary calendar and today)
- create_event: Create new calendar events with title, description, datetime, location, attendees
- search_events: Search for events by text query across calendars
- get_free_busy: Check availability and find free time slots

TASK MANAGEMENT:
- get_task_lists: Get all user's task lists with IDs and names
- get_tasks: Retrieve tasks from specific task lists
- create_task: Create new tasks with title, notes, and due dates

TIME UTILITIES:
- get_current_time: Get current date/time in any timezone
- add_time: Calculate future/past dates (add/subtract time)
- format_datetime: Format dates in various formats
- calculate_time_difference: Calculate duration between two dates

CRITICAL INSTRUCTIONS:
1. ALWAYS use tools when you need current information (calendars, events, tasks)
2. NEVER modify calendar IDs, task list IDs, or event IDs - use them EXACTLY as provided
3. When creating events, get calendar list first if user doesn't specify a calendar
4. When creating tasks, get task lists first if user doesn't specify a task list
5. Use proper ISO datetime format for all date/time operations
6. Be proactive - suggest relevant actions based on user's calendar context
7. Provide clear, actionable responses with specific next steps
8. NEVER give the tool output to the user directly - always format it into a user-friendly response and process it to extract relevant information.
9. NEVER show IDs of calendars, tasks, or events to the user - always use names or titles.

Current date: ${new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })} at ${new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    }

    /**
     * Builds calendar context section
     */
    private buildCalendarContextPrompt(): string {
        return `CALENDAR CONTEXT:
- Total calendars: ${this.calendarContext.calendars.length}
- Total events: ${this.calendarContext.events.length}
- Total tasks: ${this.calendarContext.tasks.length}`;
    }

    /**
     * Builds upcoming events section
     */
    private buildUpcomingEventsPrompt(): string {
        let prompt = "UPCOMING EVENTS (Next 24 hours):";

        const next24HoursEvents = getNextXHoursEvents(this.calendarContext.events, 24, new Date());
        if (next24HoursEvents.length > 0) {
            prompt += `\n${next24HoursEvents.map(event =>
                `- ${event.summary} (${event.start.dateTime || event.start.date})${event.location ? ` at ${event.location}` : ''}`
            ).join('\n')}`;
        } else {
            prompt += "\nNo events scheduled for the next 24 hours.";
        }

        return prompt;
    }

    /**
     * Builds pending tasks section
     */
    private buildPendingTasksPrompt(): string {
        const pendingTasks = this.calendarContext.tasks.filter(task => task.status === 'needsAction');
        let prompt = `PENDING TASKS (${pendingTasks.length} total):`;

        if (pendingTasks.length > 0) {
            prompt += `\n${pendingTasks.slice(0, 10).map(task =>
                `- ${task.title}${task.due ? ` (due: ${task.due})` : ''}`
            ).join('\n')}`;
            if (pendingTasks.length > 10) {
                prompt += `\n... and ${pendingTasks.length - 10} more tasks`;
            }
        } else {
            prompt += "\nNo pending tasks.";
        }

        return prompt;
    }

    /**
     * Builds dynamic context section with user intent analysis
     */
    private buildDynamicContextPrompt(intentAnalysis: IntentAnalysis, smartSuggestions: string[], priorityInsights: string): string {
        return `Be helpful, concise, and actionable in your responses.

USER INTENT ANALYSIS:
- Detected intent: ${intentAnalysis.intent}
- Context: ${intentAnalysis.contextualInfo}
- Suggestions: ${intentAnalysis.suggestions?.join(', ') || 'None'}

SMART INSIGHTS:
${smartSuggestions.length > 0 ? smartSuggestions.join('\n') : 'No immediate insights available.'}

PRIORITY ALERTS:
${priorityInsights || 'No priority alerts at this time.'}`;
    }

    /**
     * Available commands section
     */
    private getAvailableCommandsPrompt(): string {
        return `AVAILABLE COMMANDS:
You can help users execute specific commands:
- /agenda or /hoy - Show today's schedule
- /tiempo-libre - Find free time slots
- /tareas - Show tasks summary
- /carga - Analyze workload
- /próximos - Show upcoming events
- /semana - Show weekly overview

When users ask for these types of information, provide the information directly if you can or suggest they can use these commands.`;
    }
}