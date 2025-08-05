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

    const { events: googleEvents } = useCalendarContext();

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

    // Combine Google events with local events
    const getAllEvents = () => {
        const parsedGoogleEvents = googleEvents.map(parseGoogleEvent);
        return [...parsedGoogleEvents, ...localEvents];
    };

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

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

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
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

    const getEventsForDate = (date) => {
        const allEvents = getAllEvents();
        return allEvents.filter(event =>
            event.date.toDateString() === date.toDateString() || 
            event.endDate?.toDateString() === date.toDateString()
        );
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
        getEventsForDate,
        deleteEvent
    };
};
