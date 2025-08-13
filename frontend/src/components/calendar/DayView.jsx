"use client";

import React from 'react';
import { CardContent } from '@/components/ui/card';
import Timeline from './Timeline';
import EventItem from './EventItem';

const DayView = ({
    selectedDate,
    dayEvents,
    isSelectedDateToday,
    currentTime,
    formatTime,
    generateHours,
    getPositionFromTime,
    getCurrentTimePosition,
    showEventForm,
    createEvent,
    handleDragOver,
    handleDrop,
    handleDragStart,
    deleteEvent,
    updateProposedEvent,
    isScheduleMode
}) => {
    // Separate all-day events from timed events
    const allDayEvents = dayEvents.filter(event => event.isAllDayEvent && event.date.getDate() === selectedDate.getDate());
    const timedEvents = dayEvents.filter(event => !event.isAllDayEvent);

    return (
        <CardContent>
            {/* All-day events section */}
            {allDayEvents.length > 0 && (
                <div>
                    <div className="pl-16 pr-4">
                        {allDayEvents.map((event, eventIndex) => (
                            <div
                                key={`allday-${event.id}-${eventIndex}`}
                                className="relative mb-1"
                            >
                                <EventItem
                                    event={event}
                                    eventIndex={eventIndex}
                                    selectedDate={selectedDate}
                                    getPositionFromTime={getPositionFromTime}
                                    handleDragStart={handleDragStart}
                                    deleteEvent={deleteEvent}
                                    formatTime={formatTime}
                                    updateProposedEvent={updateProposedEvent}
                                    isScheduleMode={isScheduleMode}
                                    style={{
                                        position: 'relative',
                                        height: '20px',
                                        left: 'auto',
                                        right: 'auto',
                                        width: '100%'
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timed events section */}
            <div className="relative border rounded-lg overflow-auto" style={{ height: '600px' }}>
                <div className="relative" style={{ height: '1000px' }}>
                    <Timeline
                        formatTime={formatTime}
                        generateHours={generateHours}
                        currentTime={currentTime}
                        isSelectedDateToday={isSelectedDateToday}
                        getCurrentTimePosition={getCurrentTimePosition}
                    />

                    {/* Event area */}
                    <div
                        className="absolute left-16 right-0 top-0 h-full"
                        onClick={(e) => {
                            if (!showEventForm) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const y = e.clientY - rect.top;
                            createEvent(y, rect.height);
                        }}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {/* Timed Events */}
                        {timedEvents.map((event, eventIndex) => (
                            <EventItem
                                key={`timed-${event.id}-${eventIndex}`}
                                event={event}
                                eventIndex={eventIndex}
                                selectedDate={selectedDate}
                                getPositionFromTime={getPositionFromTime}
                                handleDragStart={handleDragStart}
                                deleteEvent={deleteEvent}
                                formatTime={formatTime}
                                updateProposedEvent={updateProposedEvent}
                                isScheduleMode={isScheduleMode}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </CardContent>
    );
};

export default DayView;
