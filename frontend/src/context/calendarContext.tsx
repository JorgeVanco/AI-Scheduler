"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSession } from "next-auth/react";

interface CalendarContextType {
    calendars: any[];
    setCalendars: (calendars: any[]) => void;
    tasks: any[];
    setTasks: (tasks: any[]) => void;
    events: any[];
    setEvents: (events: any[]) => void;
    selectedCalendarIds: Set<string>;
    setSelectedCalendarIds: (ids: Set<string>) => void;
    toggleCalendar: (calendarId: string) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
    const [calendars, setCalendars] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [hasFetched, setHasFetched] = useState(false);
    const [selectedCalendarIds, setSelectedCalendarIds] = useState<Set<string>>(new Set());

    const { data: session } = useSession();

    useEffect(() => {
        if (session?.accessToken && !hasFetched) {
            setHasFetched(true);
            fetch('/api/google/calendars')
                .then((res) => res.json())
                .then((data) => {
                    if (data.items) {
                        const sortedCalendars = data.items.sort((a: any, b: any) => {
                            if (a.primary && !b.primary) return -1;
                            if (!a.primary && b.primary) return 1;
                            if (a.accessRole === 'owner' && b.accessRole !== 'owner') return -1;
                            if (b.accessRole === 'owner' && a.accessRole !== 'owner') return 1;
                            return a.summary.localeCompare(b.summary);
                        });
                        setCalendars(sortedCalendars);
                        setEvents([]);
                        sortedCalendars.forEach((calendar: any) => {
                            fetch(`/api/google/events?calendarId=${calendar.id}`)
                                .then((res) => res.json())
                                .then((data) => {
                                    if (data.items) {
                                        data.items.forEach((event: any) => {
                                            event.calendarId = calendar.id;
                                            event.backgroundColor = calendar.backgroundColor;
                                        });
                                        setEvents(prevEvents => [...prevEvents, ...data.items]);
                                    } else {
                                        console.error('Error fetching events:', data.error);
                                    }
                                });
                        });
                        console.log('Calendars:', sortedCalendars);
                    } else {
                        console.error('Error:', data.error);
                    }
                });
            fetch('/api/google/tasks')
                .then((res) => res.json())
                .then((data) => {
                    if (data.items) {
                        setTasks(data.items);
                        console.log('Tasks:', data.items);
                    } else {
                        console.error('Error:', data.error);
                    }
                });
        }
    }, [session, hasFetched]);

    useEffect(() => {
        if (calendars.length > 0 && selectedCalendarIds.size === 0) {
            const defaultSelected = calendars
                .filter(cal => cal.selected === true)
                .map(cal => cal.id);
            setSelectedCalendarIds(new Set(defaultSelected));
        }
    }, [calendars]);

    const toggleCalendar = (calendarId: string) => {
        setSelectedCalendarIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(calendarId)) {
                newSet.delete(calendarId);
            } else {
                newSet.add(calendarId);
            }
            return newSet;
        });
    }

    return (
        <CalendarContext.Provider value={{
            calendars,
            setCalendars,
            tasks,
            setTasks,
            events,
            setEvents,
            selectedCalendarIds,
            setSelectedCalendarIds,
            toggleCalendar
        }}>
            {children}
        </CalendarContext.Provider>
    );
};

export const useCalendarContext = () => {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error('useCalendarContext must be used within a CalendarProvider');
    }
    return context;
};

export default CalendarProvider;