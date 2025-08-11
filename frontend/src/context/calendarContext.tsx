"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSession } from "next-auth/react";
import {
    Calendar,
    Task,
    TaskList,
    Event,
    CalendarContextType,
    GoogleCalendarListResponse,
    GoogleEventListResponse,
    GoogleTaskListResponse,
    GoogleTaskResponse
} from '@/types';
import { id } from 'zod/v4/locales';

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [taskLists, setTaskLists] = useState<TaskList[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [hasFetched, setHasFetched] = useState(false);
    const [selectedCalendarIds, setSelectedCalendarIds] = useState<Set<string>>(new Set());
    const [view, setView] = useState<'month' | 'day'>('month');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data: session } = useSession();

    useEffect(() => {
        if (session?.accessToken && !hasFetched) {
            setHasFetched(true);
            fetch('/api/google/calendars')
                .then((res) => res.json())
                .then((data: GoogleCalendarListResponse) => {
                    if (data.items) {
                        const sortedCalendars = data.items.sort((a: Calendar, b: Calendar) => {
                            if (a.primary && !b.primary) return -1;
                            if (!a.primary && b.primary) return 1;
                            if (a.accessRole === 'owner' && b.accessRole !== 'owner') return -1;
                            if (b.accessRole === 'owner' && a.accessRole !== 'owner') return 1;
                            return a.summary.localeCompare(b.summary);
                        });
                        setCalendars(sortedCalendars);
                        setEvents([]);
                        sortedCalendars.forEach((calendar: Calendar) => {
                            fetch(`/api/google/events?calendarId=${calendar.id}`)
                                .then((res) => res.json())
                                .then((data: GoogleEventListResponse) => {
                                    if (data.items) {
                                        data.items.forEach((event: Event) => {
                                            event.calendarId = calendar.id;
                                            event.backgroundColor = calendar.backgroundColor;
                                        });
                                        setEvents(prevEvents => [...prevEvents, ...data.items]);
                                    } else {
                                        console.error('Error fetching events:', data);
                                    }
                                    console.log(data.items)
                                });
                        });
                        console.log('Calendars:', sortedCalendars);
                    } else {
                        console.error('Error:', data);
                    }
                });
            fetch('/api/google/tasks')
                .then((res) => res.json())
                .then((data: GoogleTaskListResponse) => {
                    if (data.items) {
                        setTaskLists(data.items);
                        data.items.forEach((taskList: TaskList) => {
                            fetch(`/api/google/tasks/${taskList.id}`)
                                .then((res) => res.json())
                                .then((data: GoogleTaskResponse) => {
                                    if (data.items) {
                                        setTasks(prevTasks => [...prevTasks, ...data.items.map((task) => ({ taskListId: taskList.id, ...task }))]);
                                    }
                                    console.log("tasks:", data.items);
                                });
                        });
                        console.log('Task Lists:', data.items);
                    } else {
                        console.error('Error:', data);
                    }
                });
        }
    }, [session, hasFetched]);

    useEffect(() => {
        if (calendars.length > 0 && selectedCalendarIds.size === 0) {
            const defaultSelected = calendars
                .filter((cal: Calendar) => cal.selected === true)
                .map((cal: Calendar) => cal.id);
            setSelectedCalendarIds(new Set(defaultSelected));
        }
    }, [calendars, selectedCalendarIds.size]);

    const updateCalendarSelected = async (calendarId: string, selected: boolean) => {
        try {
            const response = await fetch(`/api/google/calendars/${calendarId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ selected })
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('Failed to update calendar selected state:', responseData);
            }

        } catch (error) {
            console.error('Error updating calendar:', error);
        }
    };

    const toggleCalendar = async (calendarId: string) => {
        const wasSelected = selectedCalendarIds.has(calendarId);
        const willBeSelected = !wasSelected;

        // Actualizar el estado local primero para una mejor UX
        setSelectedCalendarIds(prev => {
            const newSet = new Set(prev);
            if (wasSelected) {
                newSet.delete(calendarId);
            } else {
                newSet.add(calendarId);
            }
            return newSet;
        });

        await updateCalendarSelected(calendarId, willBeSelected);

    }

    return (
        <CalendarContext.Provider value={{
            calendars,
            setCalendars,
            tasks,
            setTasks,
            taskLists,
            setTaskLists,
            events,
            setEvents,
            selectedCalendarIds,
            setSelectedCalendarIds,
            toggleCalendar,
            updateCalendarSelected,
            view,
            setView,
            selectedDate,
            setSelectedDate,
            currentDate,
            setCurrentDate
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