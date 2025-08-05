import { useState, useEffect } from 'react';
import { useCalendarContext } from '@/context/calendarContext';

export const useCalendarLogic = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [view, setView] = useState('month'); // 'month' or 'day'
    const [localEvents, setLocalEvents] = useState([]);
    const [showEventForm, setShowEventForm] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [draggedEvent, setDraggedEvent] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [eventsCache, setEventsCache] = useState({}); // All events indexed by date
    const [loadedRange, setLoadedRange] = useState({ start: null, end: null });
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);

    const { calendars, events: googleEvents } = useCalendarContext();

    // Get date key for indexing (YYYY-MM-DD format)
    const getDateKey = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Index events by date for fast lookup
    const indexEventsByDate = (events) => {
        const indexed = {};
        events.forEach(event => {
            const startDate = new Date(event.start.dateTime || event.start.date);
            const endDate = new Date(event.end.dateTime || event.end.date);
            
            // Ensure we have valid dates
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.warn('Invalid date in event:', event);
                return;
            }
            
            // Add event to all dates it spans
            const current = new Date(startDate);
            while (current <= endDate) {
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
                
                // Prevent infinite loop for all-day events
                if (current.getTime() - startDate.getTime() > 365 * 24 * 60 * 60 * 1000) {
                    console.warn('Event spans more than a year, breaking loop:', event);
                    break;
                }
            }
        });
        return indexed;
    };

    // Load events for a date range (optimized bulk loading)
    const loadEventsForRange = async (startDate, endDate) => {
        
        setIsLoadingEvents(true);
        
        try {
            const allEvents = [];
            
            // Load events from all calendars for the entire range
            const loadPromises = calendars.map(async (calendar) => {
                
                let allCalendarEvents = [];
                let nextPageToken = null;
                
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
                        const eventsWithCalendarInfo = data.items.map(event => ({
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
            
            // Update loaded range
            setLoadedRange({ start: startDate, end: endDate });
            
            setIsLoadingEvents(false);
            return indexed;
            
        } catch (error) {
            console.error('Error loading events for range:', error);
            setIsLoadingEvents(false);
            return {};
        }
    };

    // Get the optimal date range to load (current month ± 3 months)
    const getOptimalRange = (centerDate = currentDate) => {
        const start = new Date(centerDate);
        start.setMonth(start.getMonth() - 3);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(centerDate);
        end.setMonth(end.getMonth() + 4, 0); // Last day of +3 months
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
    };

    // Check if we need to load more events
    const needsEventLoading = (date) => {
        if (!loadedRange.start || !loadedRange.end) return true;
        
        const checkDate = new Date(date);
        const startWithMargin = new Date(loadedRange.start);
        startWithMargin.setMonth(startWithMargin.getMonth() + 1);
        
        const endWithMargin = new Date(loadedRange.end);
        endWithMargin.setMonth(endWithMargin.getMonth() - 1);
        
        return checkDate < startWithMargin || checkDate > endWithMargin;
    };

    // Get events for a specific date (fast lookup)
    const getEventsForDate = (date) => {
        const dateKey = getDateKey(date);
        const googleEvents = eventsCache[dateKey] || [];
        
        // Parse google events but use stored original dates
        const parsedGoogleEvents = googleEvents.map(googleEvent => parseGoogleEvent(googleEvent));
        
        // Add local events for the same date
        const localEventsForDate = localEvents.filter(event =>
            event.date.toDateString() === date.toDateString() || 
            event.endDate?.toDateString() === date.toDateString()
        );
        
        return [...parsedGoogleEvents, ...localEventsForDate];
    };

    // Convert Google Calendar events to internal format
    const parseGoogleEvent = (googleEvent) => {
        const startDate = new Date(googleEvent.start.dateTime || googleEvent.start.date);
        const endDate = new Date(googleEvent.end.dateTime || googleEvent.end.date);
        const duration = (endDate - startDate) / (1000 * 60); // duration in minutes
        return {
            id: googleEvent.id,
            title: googleEvent.summary || 'No title',
            date: startDate,
            endDate: endDate,
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
    };

    // Combine Google events with local events (now optimized)
    const getAllEvents = () => {
        // Get all dates in the current month view
        const days = generateCalendarDays();
        const allEvents = [];
        
        days.forEach(date => {
            const eventsForDate = getEventsForDate(date);
            allEvents.push(...eventsForDate);
        });
        
        // Remove duplicates by event ID
        const uniqueEvents = allEvents.filter((event, index, self) => 
            index === self.findIndex(e => e.id === event.id)
        );
        
        return uniqueEvents;
    };

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Load events when current date changes or calendars are loaded
    useEffect(() => {
        if (calendars.length > 0) {
            const { start, end } = getOptimalRange(currentDate);
            
            // Only load if we don't have the required range
            if (needsEventLoading(currentDate)) {
                loadEventsForRange(start, end);
            }
        }
    }, [currentDate, calendars]);

    // Initial load when calendars are first available
    useEffect(() => {
        if (calendars.length > 0 && !loadedRange.start) {
            const { start, end } = getOptimalRange(currentDate);
            loadEventsForRange(start, end);
        }
    }, [calendars]);

    // Generate calendar days for month view
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - (firstDay.getDay() - 1 + 7) % 7);

        const days = [];
        const current = new Date(startDate);

        const numDays = Math.ceil((daysInMonth + ((firstDay.getDay() - 1 + 7) % 7)) / 7) * 7;
        for (let i = 0; i < numDays; i++) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return days;
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSameMonth = (date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    const formatTime = (hour, minute = 0) => {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    const generateHours = () => {
        const hours = [];
        for (let hour = 0; hour < 24; hour++) {
            hours.push(hour);
        }
        return hours;
    };

    const getTimeFromPosition = (y, containerHeight) => {
        const percentage = y / containerHeight;
        const totalMinutes = percentage * 24 * 60;
        const hour = Math.floor(totalMinutes / 60);
        const minute = Math.round((totalMinutes % 60) / 30) * 30; // Snap to 30-minute intervals
        return { hour: Math.min(23, Math.max(0, hour)), minute: minute === 60 ? 0 : minute };
    };

    const getPositionFromTime = (hour, minute) => {
        const totalMinutes = hour * 60 + minute;
        return (totalMinutes / (24 * 60)) * 100;
    };

    const getCurrentTimePosition = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const totalMinutes = hours * 60 + minutes;
        return (totalMinutes / (24 * 60)) * 100;
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        setView('day');
    };

    const handleBackToMonth = () => {
        setView('month');
        setSelectedDate(null);
    };

    const navigateMonth = async (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
        
        // Check if we need to load more events for the new date
        if (needsEventLoading(newDate)) {
            const { start, end } = getOptimalRange(newDate);
            await loadEventsForRange(start, end);
        }
    };

    const navigateDay = (direction) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + direction);
        setSelectedDate(newDate);
    };

    const createEvent = (clickY, containerHeight) => {
        if (!newEventTitle.trim()) return;

        const { hour, minute } = getTimeFromPosition(clickY, containerHeight);
        const eventDate = new Date(selectedDate);
        eventDate.setHours(hour, minute, 0, 0);

        const newEvent = {
            id: Date.now(),
            title: newEventTitle,
            date: eventDate,
            duration: 60, // minutes
            isGoogleEvent: false
        };

        setLocalEvents([...localEvents, newEvent]);
        setNewEventTitle('');
        setShowEventForm(false);
    };

    const handleDragStart = (e, event) => {
        // Only allow dragging of local events, not Google events
        if (event.isGoogleEvent) {
            e.preventDefault();
            return;
        }
        setDraggedEvent(event);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (!draggedEvent || draggedEvent.isGoogleEvent) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const { hour, minute } = getTimeFromPosition(y, rect.height);

        const updatedEvents = localEvents.map(event => {
            if (event.id === draggedEvent.id) {
                const newDate = new Date(selectedDate);
                newDate.setHours(hour, minute, 0, 0);
                return { ...event, date: newDate };
            }
            return event;
        });

        setLocalEvents(updatedEvents);
        setDraggedEvent(null);
    };

    const deleteEvent = (eventId) => {
        // Only allow deleting local events
        setLocalEvents(localEvents.filter(event => event.id !== eventId));
    };

    return {
        // State
        currentDate,
        selectedDate,
        view,
        localEvents,
        showEventForm,
        newEventTitle,
        draggedEvent,
        currentTime,
        eventsCache,
        loadedRange,
        isLoadingEvents,
        
        // Setters
        setCurrentDate,
        setSelectedDate,
        setView,
        setLocalEvents,
        setShowEventForm,
        setNewEventTitle,
        setDraggedEvent,
        setCurrentTime,
        
        // Functions
        parseGoogleEvent,
        getAllEvents,
        loadEventsForRange,
        getEventsForDate,
        needsEventLoading,
        generateCalendarDays,
        isToday,
        isSameMonth,
        formatTime,
        generateHours,
        getTimeFromPosition,
        getPositionFromTime,
        getCurrentTimePosition,
        handleDateClick,
        handleBackToMonth,
        navigateMonth,
        navigateDay,
        createEvent,
        handleDragStart,
        handleDragOver,
        handleDrop,
        deleteEvent
    };
};
