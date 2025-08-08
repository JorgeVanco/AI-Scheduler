import { Event, Task, Calendar } from '@/types';

const getDateEvents = (events: Event[], date: Date): Event[] => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return events.filter(event => {
        const eventStart = new Date((event.start.dateTime || event.start.date) || '');
        const eventEnd = new Date((event.end.dateTime || event.end.date) || '');
        return eventStart >= startOfDay && eventEnd <= endOfDay;
    });
};

const getNextXHoursEvents = (events: Event[], hours: number, date: Date): Event[] => {
    const now = new Date(date);
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return events.filter(event => {
        const eventStart = new Date((event.start.dateTime || event.start.date) || '');
        const eventEnd = new Date((event.end.dateTime || event.end.date) || '');
        return (eventStart >= now && eventStart <= endTime) || (eventEnd >= now && eventEnd <= endTime);
    });
};

const getEventsInRange = (events: Event[], startDate: Date, endDate: Date): Event[] => {
    return events.filter(event => {
        const eventStart = new Date((event.start.dateTime || event.start.date) || '');
        const eventEnd = new Date((event.end.dateTime || event.end.date) || '');
        return eventStart >= startDate && eventEnd <= endDate;
    });
};

const findFreeTimeSlots = (events: Event[], date: Date, durationMinutes: number = 60): Array<{ start: Date, end: Date }> => {
    const startOfDay = new Date(date);
    startOfDay.setHours(6, 0, 0, 0); // Start at 6 AM
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999); // End at 23:59 PM

    const dayEvents = getDateEvents(events, date).sort((a, b) => {
        const aStart = new Date((a.start.dateTime || a.start.date) || '');
        const bStart = new Date((b.start.dateTime || b.start.date) || '');
        return aStart.getTime() - bStart.getTime();
    });

    const freeSlots: Array<{ start: Date, end: Date }> = [];
    let currentTime = new Date(startOfDay);

    for (const event of dayEvents) {
        const eventStart = new Date((event.start.dateTime || event.start.date) || '');
        const eventEnd = new Date((event.end.dateTime || event.end.date) || '');

        // Check if there's a gap before this event
        if (eventStart.getTime() - currentTime.getTime() >= durationMinutes * 60 * 1000) {
            freeSlots.push({
                start: new Date(currentTime),
                end: new Date(eventStart)
            });
        }

        // Move current time to after this event
        if (eventEnd > currentTime) {
            currentTime = new Date(eventEnd);
        }
    }

    // Check for free time after the last event
    if (endOfDay.getTime() - currentTime.getTime() >= durationMinutes * 60 * 1000) {
        freeSlots.push({
            start: new Date(currentTime),
            end: new Date(endOfDay)
        });
    }

    return freeSlots;
};

const getTasksSummary = (tasks: Task[]): { pending: Task[], completed: Task[], overdue: Task[] } => {
    const now = new Date();
    const pending = tasks.filter(task => task.status === 'needsAction');
    const completed = tasks.filter(task => task.status === 'completed');
    const overdue = tasks.filter(task =>
        task.status === 'needsAction' &&
        task.due &&
        new Date(task.due) < now
    );

    return { pending, completed, overdue };
};

const getUpcomingDeadlines = (tasks: Task[], days: number = 7): Task[] => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return tasks
        .filter(task =>
            task.status === 'needsAction' &&
            task.due &&
            new Date(task.due) >= now &&
            new Date(task.due) <= futureDate
        )
        .sort((a, b) => {
            const aDate = new Date(a.due || '');
            const bDate = new Date(b.due || '');
            return aDate.getTime() - bDate.getTime();
        });
};

const analyzeWorkload = (events: Event[], tasks: Task[], date: Date): {
    eventsCount: number;
    pendingTasks: number;
    busyHours: number;
    freeSlots: Array<{ start: Date, end: Date }>;
    workloadLevel: 'light' | 'moderate' | 'heavy';
} => {
    const dayEvents = getDateEvents(events, date);
    const freeSlots = findFreeTimeSlots(events, date);
    const pendingTasks = tasks.filter(task => task.status === 'needsAction').length;

    // Calculate busy hours
    const busyHours = dayEvents.reduce((total, event) => {
        const start = new Date((event.start.dateTime || event.start.date) || '');
        const end = new Date((event.end.dateTime || event.end.date) || '');
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    let workloadLevel: 'light' | 'moderate' | 'heavy' = 'light';
    if (busyHours > 6 || pendingTasks > 10) {
        workloadLevel = 'heavy';
    } else if (busyHours > 3 || pendingTasks > 5) {
        workloadLevel = 'moderate';
    }

    return {
        eventsCount: dayEvents.length,
        pendingTasks,
        busyHours,
        freeSlots,
        workloadLevel
    };
};

export {
    getDateEvents,
    getNextXHoursEvents,
    getEventsInRange,
    findFreeTimeSlots,
    getTasksSummary,
    getUpcomingDeadlines,
    analyzeWorkload
};