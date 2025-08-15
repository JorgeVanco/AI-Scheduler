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
    isScheduleMode,
    isMobile
}) => {
    // Separate all-day events from timed events
    const allDayEvents = dayEvents.filter(event => event.isAllDayEvent && event.date.getDate() === selectedDate.getDate());
    const timedEvents = dayEvents.filter(event => !event.isAllDayEvent);

    // Calculate the height for all-day events section
    const allDayEventsHeight = allDayEvents.length > 0 ?
        (allDayEvents.length * (isMobile ? 20 : 24)) + 16 : 0; // height per event + margin

    // Calculate remaining height for timed events
    const timedEventsHeight = `calc(100% - ${allDayEventsHeight}px)`;

    return (
        <CardContent className={`${isMobile ? 'p-1' : ''} relative h-full flex flex-col`}>
            {/* All-day events section */}
            {allDayEvents.length > 0 && (
                <div className="flex-shrink-0 mb-4">
                    <div className={isMobile ? 'pl-8 pr-2' : 'pl-16 pr-4'}>
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
                                    isMobile={isMobile}
                                    style={{
                                        position: 'relative',
                                        height: isMobile ? '16px' : '20px',
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
            <div
                className="relative border rounded-lg overflow-auto flex-1"
                style={{
                    minHeight: isMobile ? '600px' : '550px'
                }}
            >
                <div className="relative" style={{ height: isMobile ? '1000px' : '1000px' }}>
                    <Timeline
                        formatTime={formatTime}
                        generateHours={generateHours}
                        currentTime={currentTime}
                        isSelectedDateToday={isSelectedDateToday}
                        getCurrentTimePosition={getCurrentTimePosition}
                        isMobile={isMobile}
                    />

                    {/* Event area */}
                    <div
                        className={`absolute ${isMobile ? 'left-8' : 'left-16'} right-0 top-0 h-full`}
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
                                isMobile={isMobile}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </CardContent>
    );
};

export default DayView;