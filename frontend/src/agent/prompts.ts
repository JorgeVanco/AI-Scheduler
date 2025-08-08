import { ChatCalendarContext } from "@/types";
import { getNextXHoursEvents } from "./tools";

export class PromptBuilder {
    private calendarContext: ChatCalendarContext;

    constructor(calendarContext: ChatCalendarContext) {
        this.calendarContext = calendarContext;
    }

    /**
     * Builds the system prompt with dynamic calendar context
     */
    buildSystemPrompt(intentAnalysis: any, smartSuggestions: string[], priorityInsights: string): string {
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
        return `You are an advanced AI assistant for an AI-Scheduler application. You help users organize, manage, and get information about their calendar events and tasks.

Your capabilities include:
- Analyzing and providing insights about events and schedules
- Helping users find free time slots
- Summarizing upcoming events and tasks
- Suggesting optimal scheduling
- Providing time management advice
- Answering questions about specific events or tasks

Current date and time: ${new Date().toISOString()}`;
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
    private buildDynamicContextPrompt(intentAnalysis: any, smartSuggestions: string[], priorityInsights: string): string {
        return `Respond in Spanish and be helpful, concise, and actionable in your responses.

USER INTENT ANALYSIS:
- Detected intent: ${intentAnalysis.intent}
- Context: ${intentAnalysis.contextualInfo}
- Suggestions: ${intentAnalysis.suggestions.join(', ')}

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

When users ask for these types of information, suggest they can use these commands or provide the information directly.`;
    }

    /**
     * Quick prompt for command responses (simpler version)
     */
    buildCommandPrompt(): string {
        return `You are an AI assistant for an AI-Scheduler application. Respond in Spanish and be helpful and concise.

Current date and time: ${new Date().toISOString()}

CALENDAR CONTEXT:
- Total calendars: ${this.calendarContext.calendars.length}
- Total events: ${this.calendarContext.events.length}
- Total tasks: ${this.calendarContext.tasks.length}`;
    }
}
