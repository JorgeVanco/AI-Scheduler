import { ChatCalendarContext, Event, Task } from '@/types';
import {
    findFreeTimeSlots,
    getTasksSummary,
    getUpcomingDeadlines,
    analyzeWorkload,
    getDateEvents,
    getNextXHoursEvents
} from './tools';

export interface CommandResult {
    success: boolean;
    message: string;
    data?: any;
}

export class AgentCommands {
    private context: ChatCalendarContext;

    constructor(context: ChatCalendarContext) {
        this.context = context;
    }

    // Show today's schedule
    public showTodaySchedule(): CommandResult {
        const today = new Date();
        const todayEvents = getDateEvents(this.context.events, today);

        if (todayEvents.length === 0) {
            return {
                success: true,
                message: "No tienes eventos programados para hoy. ¡Perfecto para ponerte al día con tareas pendientes!",
                data: { events: [] }
            };
        }

        const eventsList = todayEvents
            .sort((a, b) => {
                const aTime = new Date((a.start.dateTime || a.start.date) || '');
                const bTime = new Date((b.start.dateTime || b.start.date) || '');
                return aTime.getTime() - bTime.getTime();
            })
            .map(event => {
                const startTime = event.start.dateTime
                    ? new Date(event.start.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                    : 'Todo el día';
                return `• ${startTime} - ${event.summary}${event.location ? ` (${event.location})` : ''}`;
            })
            .join('\n');

        return {
            success: true,
            message: `📅 **Tu agenda de hoy:**\n\n${eventsList}`,
            data: { events: todayEvents }
        };
    }

    // Find free time slots
    public findFreeTime(durationMinutes: number = 60, date?: Date): CommandResult {
        const targetDate = date || new Date();
        const freeSlots = findFreeTimeSlots(this.context.events, targetDate, durationMinutes);

        if (freeSlots.length === 0) {
            return {
                success: true,
                message: `⏰ No encontré horarios libres de ${durationMinutes} minutos para ${targetDate.toLocaleDateString('es-ES')}. ¿Te ayudo a buscar en otro día?`,
                data: { freeSlots: [] }
            };
        }

        const slotsList = freeSlots.map(slot => {
            const startTime = slot.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const endTime = slot.end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const duration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
            return `• ${startTime} - ${endTime} (${Math.floor(duration)} min disponibles)`;
        }).join('\n');

        return {
            success: true,
            message: `🕒 **Horarios libres disponibles:**\n\n${slotsList}`,
            data: { freeSlots }
        };
    }

    // Show tasks summary
    public showTasksSummary(): CommandResult {
        console.log('Showing tasks summary');
        const summary = getTasksSummary(this.context.tasks);
        const upcoming = getUpcomingDeadlines(this.context.tasks, 7);

        let message = `📋 **Resumen de tareas:**\n\n`;
        message += `• Pendientes: ${summary.pending.length}\n`;
        message += `• Completadas: ${summary.completed.length}\n`;
        message += `• Vencidas: ${summary.overdue.length}\n`;

        if (upcoming.length > 0) {
            message += `\n⚠️ **Próximos vencimientos (7 días):**\n`;
            message += upcoming.slice(0, 5).map(task => {
                const dueDate = task.due ? new Date(task.due).toLocaleDateString('es-ES') : 'Sin fecha';
                return `• ${task.title} - ${dueDate}`;
            }).join('\n');

            if (upcoming.length > 5) {
                message += `\n... y ${upcoming.length - 5} tareas más`;
            }
        }

        return {
            success: true,
            message,
            data: { summary, upcoming }
        };
    }

    // Analyze workload for a specific date
    public analyzeWorkloadForDate(date?: Date): CommandResult {
        const targetDate = date || new Date();
        const workload = analyzeWorkload(this.context.events, this.context.tasks, targetDate);

        let levelEmoji = '✅';
        let levelDescription = 'ligera';

        if (workload.workloadLevel === 'moderate') {
            levelEmoji = '⚠️';
            levelDescription = 'moderada';
        } else if (workload.workloadLevel === 'heavy') {
            levelEmoji = '🔴';
            levelDescription = 'alta';
        }

        let message = `${levelEmoji} **Análisis de carga de trabajo para ${targetDate.toLocaleDateString('es-ES')}:**\n\n`;
        message += `• Nivel de carga: ${levelDescription}\n`;
        message += `• Eventos programados: ${workload.eventsCount}\n`;
        message += `• Horas ocupadas: ${workload.busyHours.toFixed(1)}\n`;
        message += `• Tareas pendientes: ${workload.pendingTasks}\n`;
        message += `• Espacios libres: ${workload.freeSlots.length}`;

        if (workload.workloadLevel === 'heavy') {
            message += `\n\n💡 **Recomendación:** Considera reprogramar tareas no urgentes o delegar si es posible.`;
        }

        return {
            success: true,
            message,
            data: { workload }
        };
    }

    // Show next upcoming events
    public showUpcomingEvents(hours: number = 24): CommandResult {
        const upcoming = getNextXHoursEvents(this.context.events, hours, new Date());

        if (upcoming.length === 0) {
            return {
                success: true,
                message: `📅 No tienes eventos programados en las próximas ${hours} horas. ¡Tiempo perfecto para trabajar en tus tareas!`,
                data: { events: [] }
            };
        }

        const eventsList = upcoming
            .sort((a, b) => {
                const aTime = new Date((a.start.dateTime || a.start.date) || '');
                const bTime = new Date((b.start.dateTime || b.start.date) || '');
                return aTime.getTime() - bTime.getTime();
            })
            .map(event => {
                const startTime = event.start.dateTime
                    ? new Date(event.start.dateTime).toLocaleString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : new Date((event.start.date || '')).toLocaleDateString('es-ES', {
                        month: 'short',
                        day: 'numeric'
                    });
                return `• ${startTime} - ${event.summary}`;
            })
            .join('\n');

        return {
            success: true,
            message: `⏰ **Próximos eventos (${hours}h):**\n\n${eventsList}`,
            data: { events: upcoming }
        };
    }

    // Get weekly overview
    public getWeeklyOverview(): CommandResult {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        let weekSummary = `📊 **Resumen semanal:**\n\n`;

        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);

            const dayEvents = getDateEvents(this.context.events, day);
            const workload = analyzeWorkload(this.context.events, this.context.tasks, day);

            const dayName = day.toLocaleDateString('es-ES', { weekday: 'short' });
            const dayDate = day.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

            let dayEmoji = '✅';
            if (workload.workloadLevel === 'moderate') dayEmoji = '⚠️';
            if (workload.workloadLevel === 'heavy') dayEmoji = '🔴';

            weekSummary += `${dayEmoji} **${dayName} ${dayDate}**: ${dayEvents.length} eventos, ${workload.busyHours.toFixed(1)}h ocupadas\n`;
        }

        return {
            success: true,
            message: weekSummary,
            data: { weekStart, weekEnd }
        };
    }

    // Execute command based on user input
    public executeCommand(command: string, params?: any): CommandResult {
        const cmd = command.toLowerCase().trim();
        console.log(`Executing command: ${cmd} with params:`, params);
        switch (cmd) {
            case 'agenda':
            case 'today':
            case 'hoy':
                return this.showTodaySchedule();

            case 'tiempo-libre':
            case 'free-time':
            case 'horarios':
                return this.findFreeTime(params?.duration || 60, params?.date);

            case 'tareas':
            case 'tasks':
                return this.showTasksSummary();

            case 'carga':
            case 'workload':
                return this.analyzeWorkloadForDate(params?.date);

            case 'próximos':
            case 'upcoming':
                return this.showUpcomingEvents(params?.hours || 24);

            case 'semana':
            case 'week':
                return this.getWeeklyOverview();

            default:
                return {
                    success: false,
                    message: `Comando "${command}" no reconocido. Comandos disponibles: agenda, tiempo-libre, tareas, carga, próximos, semana`,
                    data: null
                };
        }
    }
}
