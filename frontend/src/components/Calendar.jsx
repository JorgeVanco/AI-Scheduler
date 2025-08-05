"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Plus, X, ExternalLink } from 'lucide-react';
import { useCalendarContext } from '@/context/calendarContext';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [view, setView] = useState('month'); // 'month' or 'day'
    const [localEvents, setLocalEvents] = useState([]);
    const [showEventForm, setShowEventForm] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [draggedEvent, setDraggedEvent] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const dayViewRef = useRef(null);

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
            event.date.toDateString() === date.toDateString()
        );
    };

    const deleteEvent = (eventId) => {
        // Only allow deleting local events
        setLocalEvents(localEvents.filter(event => event.id !== eventId));
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    if (view === 'day' && selectedDate) {
        const hours = generateHours();
        const dayEvents = getEventsForDate(selectedDate);
        const isSelectedDateToday = isToday(selectedDate);

        const getCurrentTimePosition = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const totalMinutes = hours * 60 + minutes;
            return (totalMinutes / (24 * 60)) * 100;
        };

        return (
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleBackToMonth}>
                            ← Month
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigateDay(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <CardTitle>
                            {selectedDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => navigateDay(1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setShowEventForm(!showEventForm)}
                        className="flex items-center gap-1"
                    >
                        <Plus className="h-4 w-4" />
                        Local Event
                    </Button>
                </CardHeader>

                <CardContent>
                    {showEventForm && (
                        <div className="mb-4 p-3 border rounded-lg bg-gray-50">
                            <Input
                                placeholder="Event title..."
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                className="mb-2"
                            />
                            <div className="text-sm text-gray-600 mb-2">
                                Click anywhere on the timeline to create the event
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowEventForm(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}

                    <div className="relative border rounded-lg overflow-auto" style={{ height: '600px' }}>
                        <div className="relative" style={{ height: '1000px' }}>
                            {/* Time labels */}
                            <div className="absolute left-0 top-0 w-16 h-full bg-gray-50 border-r">
                                {hours.map((hour) => {
                                    return (
                                        hour != 0 && <div
                                            key={hour}
                                            className="absolute left-0 right-0 text-xs text-gray-600 text-right pr-2"
                                            style={{ top: `${(hour / 24) * 100}%`, transform: 'translateY(-50%)' }}
                                        >
                                            {formatTime(hour, 0)}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Hour lines */}
                            <div className="absolute left-16 right-0 top-0 h-full">
                                {hours.map((hour) => (
                                    <div
                                        key={hour}
                                        className="absolute left-0 right-0 border-t border-gray-200"
                                        style={{ top: `${(hour / 24) * 100}%` }}
                                    />
                                ))}
                            </div>

                            {/* Current time line */}
                            {isSelectedDateToday && (
                                <div
                                    className="absolute left-16 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                                    style={{ top: `${getCurrentTimePosition()}%` }}
                                >
                                    <div className="absolute -left-16 -top-2 w-16 text-xs text-red-500 bg-gray-50 border-r border-gray-200 px-1 text-right pr-2">
                                        {formatTime(currentTime.getHours(), currentTime.getMinutes())}
                                    </div>
                                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                                </div>
                            )}

                            {/* Event area */}
                            <div
                                className="absolute left-16 right-0 top-0 h-full cursor-pointer"
                                onClick={(e) => {
                                    if (!showEventForm) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const y = e.clientY - rect.top;
                                    createEvent(y, rect.height);
                                }}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                {/* Events */}
                                {dayEvents.map((event, eventIndex) => {
                                    const eventTop = getPositionFromTime(event.date.getHours(), event.date.getMinutes());
                                    const eventHeight = (event.duration / (24 * 60)) * 100;
                                    const isGoogleEvent = event.isGoogleEvent;

                                    return (
                                        <div
                                            key={`${event.id}-${eventIndex}`}
                                            style={{
                                                top: `${eventTop}%`,
                                                height: `${Math.max(eventHeight, 2)}%`,
                                                minHeight: '24px',
                                                backgroundColor: `${event.backgroundColor}20`,
                                                border: `1px solid ${event.backgroundColor}`,
                                                color: event.backgroundColor
                                            }}
                                            className={`
                                                absolute left-1 right-1 border rounded px-2 py-1 z-10 transition-colors
                                                ${isGoogleEvent
                                                    ? 'bg-green-100'
                                                    : 'bg-blue-100 border-blue-300 hover:bg-blue-200 cursor-move'
                                                }
                                            `}

                                            draggable={!isGoogleEvent}
                                            onDragStart={(e) => handleDragStart(e, event)}
                                        >
                                            <div className="flex items-center justify-between h-full">
                                                <div className="flex-1 min-w-0">
                                                    <div className={`font-medium text-sm truncate`}>
                                                        {event.title}
                                                    </div>
                                                    <div className={`text-xs`}>
                                                        {formatTime(event.date.getHours(), event.date.getMinutes())}
                                                        {event.endDate && ` - ${formatTime(event.endDate.getHours(), event.endDate.getMinutes())}`}
                                                    </div>
                                                    {event.location && (
                                                        <div className="text-xs text-gray-500 truncate">
                                                            📍 {event.location}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 ml-1">
                                                    {isGoogleEvent && event.htmlLink && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-4 w-4 p-0 hover:bg-green-200"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(event.htmlLink, '_blank');
                                                            }}
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {!isGoogleEvent && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-4 w-4 p-0 hover:bg-red-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteEvent(event.id);
                                                            }}
                                                        >
                                                            <X className="h-3 w-3 text-red-600" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const calendarDays = generateCalendarDays();

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle>
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span>Google Events</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                        <span>Local Events</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {dayNames.map(day => (
                        <div key={day} className="text-center font-semibold text-gray-600 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((date, index) => {
                        const dayEvents = getEventsForDate(date);
                        const isCurrentDay = isToday(date);
                        const isCurrentMonth = isSameMonth(date);

                        return (
                            <div
                                key={index}
                                className={`
                                    relative min-h-[100px] p-2 border rounded-lg cursor-pointer
                                    hover:bg-gray-50 transition-colors
                                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-100 text-gray-400'}
                                `}
                                onClick={() => handleDateClick(date)}
                            >
                                <div className="grid grid-cols-1 place-items-center mb-2">
                                    <span className={`
                                        text-sm font-medium z-10 col-start-1 row-start-1
                                        ${isCurrentDay ? 'text-blue-500' : ''}
                                    `}>
                                        {date.getDate()}
                                    </span>
                                    {isCurrentDay && (
                                        <div className="col-start-1 row-start-1 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center">
                                        </div>
                                    )}
                                </div>

                                {/* Event indicators */}
                                <div className="mt-1 space-y-1">
                                    {dayEvents.slice(0, 2).map((event, eventIndex) => (
                                        <div
                                            key={`${event.id}-${eventIndex}`}
                                            style={{ backgroundColor: `${event.backgroundColor}20`, border: `1px solid ${event.backgroundColor}`, color: event.backgroundColor }}

                                            className={`text-xs px-1 py-0.5 rounded truncate ${event.isGoogleEvent
                                                ? 'text-white'
                                                : 'text-blue-800'
                                                }`}
                                        >
                                            {event.title}
                                        </div>
                                    )
                                    )}
                                    {dayEvents.length > 2 && (
                                        <div className="text-xs text-gray-500">
                                            +{dayEvents.length - 2} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default Calendar;