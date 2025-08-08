import { ChatCalendarContext, Event, Task } from '@/types';
import {
    getDateEvents,
    getNextXHoursEvents,
    findFreeTimeSlots,
    getTasksSummary,
    getUpcomingDeadlines,
    analyzeWorkload
} from './tools';

export class AgentUtils {
    private context: ChatCalendarContext;

    constructor(context: ChatCalendarContext) {
        this.context = context;
    }

    // Analyze user intent and provide relevant context
    public analyzeIntent(userMessage: string): {
        intent: string;
        contextualInfo: string;
        suggestions: string[];
    } {
        const message = userMessage.toLowerCase();

        // Intent detection patterns
        const patterns = {
            schedule: /\b(schedule|appointment|meeting|event|calendar|when|time)\b/,
            tasks: /\b(task|todo|deadline|complete|finish|pending)\b/,
            availability: /\b(free|available|busy|slot|time)\b/,
            summary: /\b(summary|overview|today|tomorrow|week|upcoming)\b/,
            create: /\b(create|add|new|make|schedule)\b/,
            search: /\b(find|search|look|where|what|which)\b/
        };

        let intent = 'general';
        let contextualInfo = '';
        const suggestions: string[] = [];

        // Determine primary intent
        if (patterns.create.test(message)) {
            intent = 'create';
            contextualInfo = this.getCreationContext();
            suggestions.push('¿Te ayudo a crear un nuevo evento o tarea?');
        } else if (patterns.availability.test(message)) {
            intent = 'availability';
            contextualInfo = this.getAvailabilityContext();
            suggestions.push('Puedo ayudarte a encontrar horarios libres');
        } else if (patterns.tasks.test(message)) {
            intent = 'tasks';
            contextualInfo = this.getTasksContext();
            suggestions.push('¿Quieres ver el resumen de tus tareas?');
        } else if (patterns.schedule.test(message)) {
            intent = 'schedule';
            contextualInfo = this.getScheduleContext();
            suggestions.push('¿Te muestro tu agenda?');
        } else if (patterns.summary.test(message)) {
            intent = 'summary';
            contextualInfo = this.getSummaryContext();
            suggestions.push('Te puedo dar un resumen de tu día o semana');
        }

        return { intent, contextualInfo, suggestions };
    }

    private getCreationContext(): string {
        const freeSlots = findFreeTimeSlots(this.context.events, new Date());
        return `Horarios libres disponibles hoy: ${freeSlots.length} slots encontrados`;
    }

    private getAvailabilityContext(): string {
        const today = new Date();
        const freeSlots = findFreeTimeSlots(this.context.events, today);
        const workload = analyzeWorkload(this.context.events, this.context.tasks, today);

        return `Disponibilidad hoy: ${freeSlots.length} horarios libres. Carga de trabajo: ${workload.workloadLevel}`;
    }

    private getTasksContext(): string {
        const summary = getTasksSummary(this.context.tasks);
        const upcoming = getUpcomingDeadlines(this.context.tasks);

        return `Tareas pendientes: ${summary.pending.length}, Completadas: ${summary.completed.length}, Próximos vencimientos: ${upcoming.length}`;
    }

    private getScheduleContext(): string {
        const todayEvents = getDateEvents(this.context.events, new Date());
        const tomorrowEvents = getDateEvents(this.context.events, new Date(Date.now() + 24 * 60 * 60 * 1000));

        return `Eventos hoy: ${todayEvents.length}, Eventos mañana: ${tomorrowEvents.length}`;
    }

    private getSummaryContext(): string {
        const workload = analyzeWorkload(this.context.events, this.context.tasks, new Date());
        return `Resumen del día: ${workload.eventsCount} eventos, ${workload.pendingTasks} tareas pendientes, ${workload.busyHours.toFixed(1)} horas ocupadas`;
    }

    // Generate smart suggestions based on current context
    public generateSmartSuggestions(): string[] {
        const suggestions: string[] = [];
        const now = new Date();

        // Check for upcoming events
        const nextEvents = getNextXHoursEvents(this.context.events, 2, now);
        if (nextEvents.length > 0) {
            suggestions.push(`Tienes ${nextEvents.length} evento(s) en las próximas 2 horas`);
        }

        // Check for overdue tasks
        const tasksSummary = getTasksSummary(this.context.tasks);
        if (tasksSummary.overdue.length > 0) {
            suggestions.push(`Tienes ${tasksSummary.overdue.length} tarea(s) vencida(s) que requieren atención`);
        }

        // Check for upcoming deadlines
        const upcomingDeadlines = getUpcomingDeadlines(this.context.tasks, 3);
        if (upcomingDeadlines.length > 0) {
            suggestions.push(`${upcomingDeadlines.length} tarea(s) vencen en los próximos 3 días`);
        }

        // Check for free time today
        const freeSlots = findFreeTimeSlots(this.context.events, now);
        if (freeSlots.length > 0) {
            suggestions.push(`Tienes ${freeSlots.length} horario(s) libre(s) disponible(s) hoy`);
        }

        return suggestions;
    }

    // Format time slots for display
    public formatTimeSlots(slots: Array<{ start: Date, end: Date }>): string {
        return slots.map(slot => {
            const startTime = slot.start.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const endTime = slot.end.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
            return `${startTime} - ${endTime}`;
        }).join(', ');
    }

    // Get priority insights
    public getPriorityInsights(): string {
        const insights: string[] = [];

        // Analyze workload
        const workload = analyzeWorkload(this.context.events, this.context.tasks, new Date());
        if (workload.workloadLevel === 'heavy') {
            insights.push('Tu carga de trabajo es alta hoy. Considera reprogramar tareas no urgentes.');
        }

        // Check for conflicts
        const todayEvents = getDateEvents(this.context.events, new Date());
        const conflicts = this.findEventConflicts(todayEvents);
        if (conflicts.length > 0) {
            insights.push(`Detecté ${conflicts.length} posible(s) conflicto(s) en tu agenda.`);
        }

        return insights.join(' ');
    }

    private findEventConflicts(events: Event[]): Array<{ event1: Event, event2: Event }> {
        const conflicts: Array<{ event1: Event, event2: Event }> = [];

        for (let i = 0; i < events.length; i++) {
            for (let j = i + 1; j < events.length; j++) {
                const event1 = events[i];
                const event2 = events[j];

                const start1 = new Date((event1.start.dateTime || event1.start.date) || '');
                const end1 = new Date((event1.end.dateTime || event1.end.date) || '');
                const start2 = new Date((event2.start.dateTime || event2.start.date) || '');
                const end2 = new Date((event2.end.dateTime || event2.end.date) || '');

                // Check for overlap
                if (start1 < end2 && start2 < end1) {
                    conflicts.push({ event1, event2 });
                }
            }
        }

        return conflicts;
    }
}
