"use client";
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
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

    // Nueva funcionalidad de caché optimizado
    const [eventsCache, setEventsCache] = useState<{ [key: string]: Event[] }>({});
    const [loadedRange, setLoadedRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [localEvents, setLocalEvents] = useState<Event[]>([]);

    const { data: session } = useSession();

    // Get date key for indexing (YYYY-MM-DD format)
    const getDateKey = useCallback((date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    // Index events by date for fast lookup
    const indexEventsByDate = useCallback((events: Event[]) => {
        const indexed: { [key: string]: Event[] } = {};
        events.forEach(event => {
            const startDateStr = event.start?.dateTime || event.start?.date;
            const endDateStr = event.end?.dateTime || event.end?.date;

            if (!startDateStr || !endDateStr) {
                console.warn('Event missing start or end date:', event);
                return;
            }

            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);

            // Ensure we have valid dates
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.warn('Invalid date in event:', event);
                return;
            }
            // Add event to all dates it spans
            const current = new Date(startDate);
            while (current <= endDate) {
                if (event.summary === "Dormir 🛏️💤") {
                    console.log({ current, startDate, endDate })
                }
                const dateKey = getDateKey(current);
                if (!indexed[dateKey]) {
                    indexed[dateKey] = [];
                }
                // Store the original event with proper date information
                indexed[dateKey].push({
                    ...event,
                    calendarId: event.calendarId,
                    backgroundColor: event.backgroundColor,
                });
                current.setDate(current.getDate() + 1);
                current.setHours(0, 0, 0, 0)

                // Prevent infinite loop for all-day events
                if (event.start.dateTime === undefined && event.end.dateTime === undefined) {
                    break;
                }
                if (current.getTime() - startDate.getTime() > 365 * 24 * 60 * 60 * 1000) {
                    console.warn('Event spans more than a year, breaking loop:', event);
                    break;
                }
            }
        });
        return indexed;
    }, [getDateKey]);

    // Load events for a date range (optimized bulk loading)
    const loadEventsForRange = useCallback(async (startDate: Date, endDate: Date) => {
        if (calendars.length === 0) return {};

        setIsLoadingEvents(true);

        try {
            const allEvents: Event[] = [];

            // Load events from all calendars for the entire range
            const loadPromises = calendars.map(async (calendar) => {
                const allCalendarEvents: Event[] = [];
                let nextPageToken: string | null = null;

                do {
                    const url = new URL('/api/google/events', window.location.origin);
                    url.searchParams.set('calendarId', calendar.id);
                    url.searchParams.set('startDate', startDate.toISOString());
                    url.searchParams.set('endDate', endDate.toISOString());
                    if (nextPageToken) {
                        url.searchParams.set('pageToken', nextPageToken);
                    }

                    const response = await fetch(url.toString());
                    const data = await response.json();

                    if (data.items) {
                        const eventsWithCalendarInfo = data.items.map((event: Event) => ({
                            ...event,
                            calendarId: calendar.id,
                            backgroundColor: calendar.backgroundColor
                        }));
                        allCalendarEvents.push(...eventsWithCalendarInfo);
                    }

                    nextPageToken = data.nextPageToken;

                } while (nextPageToken);

                return allCalendarEvents;
            });

            const results = await Promise.all(loadPromises);
            results.forEach(events => allEvents.push(...events));

            // Index events by date for fast access
            const indexed = indexEventsByDate(allEvents);

            // Merge with existing cache
            setEventsCache(prev => ({
                ...prev,
                ...indexed
            }));

            // Update events array (for backward compatibility)
            setEvents(allEvents);

            // Update loaded range
            setLoadedRange({ start: startDate, end: endDate });

            setIsLoadingEvents(false);
            return indexed;

        } catch (error) {
            console.error('Error loading events for range:', error);
            setIsLoadingEvents(false);
            return {};
        }
    }, [calendars, indexEventsByDate]);

    // Get the optimal date range to load (current month ± 3 months)
    const getOptimalRange = useCallback((centerDate: Date = currentDate) => {
        const start = new Date(centerDate);
        start.setMonth(start.getMonth() - 3);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);

        const end = new Date(centerDate);
        end.setMonth(end.getMonth() + 4, 0); // Last day of +3 months
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }, [currentDate]);

    // Check if we need to load more events
    const needsEventLoading = useCallback((date: Date) => {
        if (!loadedRange.start || !loadedRange.end) return true;

        const checkDate = new Date(date);
        const startWithMargin = new Date(loadedRange.start);
        startWithMargin.setMonth(startWithMargin.getMonth() + 1);

        const endWithMargin = new Date(loadedRange.end);
        endWithMargin.setMonth(endWithMargin.getMonth() - 1);

        return checkDate < startWithMargin || checkDate > endWithMargin;
    }, [loadedRange.start, loadedRange.end]);

    // Convert Google Calendar events to internal format
    const parseGoogleEvent = useCallback((googleEvent: Event) => {
        const startDateStr = googleEvent.start?.dateTime || googleEvent.start?.date;
        const endDateStr = googleEvent.end?.dateTime || googleEvent.end?.date;

        if (!startDateStr || !endDateStr) {
            console.warn('Event missing start or end date:', googleEvent);
            return null;
        }

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        const isAllDayEvent = googleEvent.start?.dateTime === undefined && googleEvent.end?.dateTime === undefined;
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60); // duration in minutes

        return {
            ...googleEvent,
            id: googleEvent.id,
            title: googleEvent.summary || 'No title',
            date: startDate,
            endDate: endDate,
            isAllDayEvent: isAllDayEvent,
            duration: duration,
            isGoogleEvent: true,
            htmlLink: googleEvent.htmlLink,
            status: googleEvent.status,
            creator: googleEvent.creator,
            organizer: googleEvent.organizer,
            description: googleEvent.description,
            location: googleEvent.location,
            backgroundColor: googleEvent.backgroundColor,
            calendarId: googleEvent.calendarId || 'primary',
        };
    }, []);

    // Get events for a specific date (fast lookup)
    const getEventsForDate = useCallback((date: Date, filter: boolean = true) => {
        const dateKey = getDateKey(date);
        const googleEvents = eventsCache[dateKey] || [];

        let filteredGoogleEvents = googleEvents;
        if (filter) {
            filteredGoogleEvents = googleEvents.filter(event =>
                selectedCalendarIds.has(event.calendarId || 'primary')
            );
        }


        // Parse google events to add the expected date properties
        const parsedGoogleEvents = filteredGoogleEvents
            .map(googleEvent => parseGoogleEvent(googleEvent))
            .filter(event => event !== null); // Remove null events

        // Add local events for the same date
        const localEventsForDate = localEvents.filter(event => {
            const eventDate = event.date || new Date(event.start?.dateTime || event.start?.date || '');
            const eventEndDate = event.endDate || new Date(event.end?.dateTime || event.end?.date || '');
            return eventDate.toDateString() === date.toDateString() ||
                eventEndDate?.toDateString() === date.toDateString();
        });

        return [...parsedGoogleEvents, ...localEventsForDate];
    }, [eventsCache, selectedCalendarIds, localEvents, getDateKey, parseGoogleEvent]);

    useEffect(() => {
        if (session?.accessToken && !hasFetched) {
            setHasFetched(true);
            // Cargar calendarios y task lists
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
                        // No cargar eventos aquí - se cargarán con loadEventsForRange cuando sea necesario
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
                                });
                        });
                    } else {
                        console.error('Error:', data);
                    }
                });
        }
    }, [session, hasFetched]);

    // Load events when current date changes or calendars are loaded
    useEffect(() => {
        if (calendars.length > 0) {
            const { start, end } = getOptimalRange(currentDate);

            // Only load if we don't have the required range
            if (needsEventLoading(currentDate)) {
                loadEventsForRange(start, end);
            }
        }
    }, [currentDate, calendars, getOptimalRange, loadEventsForRange, needsEventLoading]);

    // Initial load when calendars are first available
    useEffect(() => {
        if (calendars.length > 0 && !loadedRange.start) {
            const { start, end } = getOptimalRange(currentDate);
            loadEventsForRange(start, end);
        }
    }, [calendars, currentDate, getOptimalRange, loadEventsForRange, loadedRange.start]);

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
            setCurrentDate,
            // Nuevas funciones optimizadas
            eventsCache,
            loadedRange,
            isLoadingEvents,
            localEvents,
            setLocalEvents,
            loadEventsForRange,
            getEventsForDate,
            needsEventLoading,
            getOptimalRange,
            parseGoogleEvent
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