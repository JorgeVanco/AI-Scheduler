import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Event, ScheduleEvent, ScheduleSummary } from '@/types';

export interface UseScheduleDayReturn {
    proposedEvents: Event[];
    scheduleSummary: ScheduleSummary | null;
    isScheduleMode: boolean;
    addProposedEvents: (events: ScheduleEvent[], summary: ScheduleSummary) => void;
    updateProposedEvent: (eventId: string, updates: Partial<Event>) => void;
    removeProposedEvent: (eventId: string) => void;
    confirmSchedule: () => Promise<boolean>;
    cancelSchedule: () => void;
    isConfirming: boolean;
}

export const useScheduleDay = (): UseScheduleDayReturn => {
    const { data: session } = useSession();
    const [proposedEvents, setProposedEvents] = useState<Event[]>([]);
    const [scheduleSummary, setScheduleSummary] = useState<ScheduleSummary | null>(null);
    const [isScheduleMode, setIsScheduleMode] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const convertScheduleEventToEvent = (scheduleEvent: ScheduleEvent): Event => {
        const startDateTime = new Date(scheduleEvent.startDateTime);
        const endDateTime = new Date(scheduleEvent.endDateTime);

        // Determinar si es un evento de todo el día
        const isAllDay = scheduleEvent.startDateTime.includes('T00:00:00') &&
            scheduleEvent.endDateTime.includes('T23:59:59');

        return {
            id: scheduleEvent.id,
            summary: scheduleEvent.title,
            title: scheduleEvent.title, // Add title property for EventItem
            description: scheduleEvent.description,
            date: startDateTime, // Add date property for EventItem
            endDate: endDateTime, // Add endDate property for EventItem
            duration: Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)), // Duration in minutes
            isAllDayEvent: isAllDay,
            isGoogleEvent: false, // Eventos propuestos no son de Google inicialmente
            start: {
                dateTime: scheduleEvent.startDateTime,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: scheduleEvent.endDateTime,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            location: scheduleEvent.location,
            isProposed: scheduleEvent.isProposed,
            taskId: scheduleEvent.taskId,
            backgroundColor: '#3b82f6',
            colorId: '1',
            status: 'tentative'
        };
    };

    const addProposedEvents = (events: ScheduleEvent[], summary: ScheduleSummary) => {
        const convertedEvents = events.map(convertScheduleEventToEvent);
        setProposedEvents(convertedEvents);
        setScheduleSummary(summary);
        setIsScheduleMode(true);
    };

    const updateProposedEvent = (eventId: string, updates: Partial<Event>) => {
        setProposedEvents(prev => prev.map(event =>
            event.id === eventId ? { ...event, ...updates } : event
        ));
    };

    const removeProposedEvent = (eventId: string) => {
        setProposedEvents(prev => prev.filter(event => event.id !== eventId));

        // Actualizar el resumen
        if (scheduleSummary) {
            setScheduleSummary({
                ...scheduleSummary,
                scheduledTasks: scheduleSummary.scheduledTasks - 1
            });
        }
    };

    const confirmSchedule = async (): Promise<boolean> => {
        setIsConfirming(true);

        try {
            // Crear eventos uno por uno usando la herramienta de crear eventos
            const creationPromises = proposedEvents.map(async (event) => {
                const eventData = {
                    calendarId: 'primary',
                    title: event.summary,
                    description: event.description,
                    startDateTime: event.start.dateTime!,
                    endDateTime: event.end.dateTime!,
                    location: event.location
                };

                const response = await fetch('/api/agent/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': session?.accessToken || '',
                    },
                    body: JSON.stringify({
                        calendarId: eventData.calendarId,
                        event: {
                            summary: eventData.title,
                            description: eventData.description,
                            start: {
                                dateTime: eventData.startDateTime,
                                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                            },
                            end: {
                                dateTime: eventData.endDateTime,
                                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                            },
                            location: eventData.location
                        }
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Error al crear evento: ${event.summary}`);
                }

                return response.json();
            });

            await Promise.all(creationPromises);

            // Limpiar el estado de propuestas
            setProposedEvents([]);
            setScheduleSummary(null);
            setIsScheduleMode(false);

            return true;
        } catch (error) {
            console.error('Error confirming schedule:', error);
            return false;
        } finally {
            setIsConfirming(false);
        }
    };

    const cancelSchedule = () => {
        setProposedEvents([]);
        setScheduleSummary(null);
        setIsScheduleMode(false);
    };

    return {
        proposedEvents,
        scheduleSummary,
        isScheduleMode,
        addProposedEvents,
        updateProposedEvent,
        removeProposedEvent,
        confirmSchedule,
        cancelSchedule,
        isConfirming
    };
};
