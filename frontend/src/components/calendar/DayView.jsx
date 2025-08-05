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
    deleteEvent
}) => {
    return (
        <CardContent>
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
                        {dayEvents.map((event, eventIndex) => (
                            <EventItem
                                key={`${event.id}-${eventIndex}`}
                                event={event}
                                eventIndex={eventIndex}
                                selectedDate={selectedDate}
                                getPositionFromTime={getPositionFromTime}
                                handleDragStart={handleDragStart}
                                deleteEvent={deleteEvent}
                                formatTime={formatTime}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </CardContent>
    );
};

export default DayView;
