"use client";

import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { useCalendarLogic } from '@/hooks/useCalendarLogic';
import { useCalendarContext } from '@/context/calendarContext';
import {
    CalendarHeader,
    DayView,
    MonthView,
    EventForm,
    EventLegend
} from './calendar';

const Calendar = () => {
    const { view, selectedDate } = useCalendarContext();
    const {
        currentDate,
        showEventForm,
        newEventTitle,
        currentTime,
        setShowEventForm,
        setNewEventTitle,
        generateCalendarDays,
        isToday,
        isSameMonth,
        formatTime,
        generateHours,
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
    } = useCalendarLogic();

    if (view === 'day' && selectedDate) {
        const dayEvents = getEventsForDate(selectedDate);
        const isSelectedDateToday = isToday(selectedDate);

        return (
            <Card className="w-full max-w-4xl mx-auto h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                    <CalendarHeader
                        view={view}
                        currentDate={currentDate}
                        selectedDate={selectedDate}
                        navigateMonth={navigateMonth}
                        navigateDay={navigateDay}
                        handleBackToMonth={handleBackToMonth}
                    >
                        <EventForm
                            showEventForm={showEventForm}
                            setShowEventForm={setShowEventForm}
                            newEventTitle={newEventTitle}
                            setNewEventTitle={setNewEventTitle}
                        />
                    </CalendarHeader>
                </CardHeader>

                <div className="flex-1 overflow-hidden">
                    <DayView
                        selectedDate={selectedDate}
                        dayEvents={dayEvents}
                        isSelectedDateToday={isSelectedDateToday}
                        currentTime={currentTime}
                        formatTime={formatTime}
                        generateHours={generateHours}
                        getPositionFromTime={getPositionFromTime}
                        getCurrentTimePosition={getCurrentTimePosition}
                        showEventForm={showEventForm}
                        setShowEventForm={setShowEventForm}
                        newEventTitle={newEventTitle}
                        setNewEventTitle={setNewEventTitle}
                        createEvent={createEvent}
                        handleDragOver={handleDragOver}
                        handleDrop={handleDrop}
                        handleDragStart={handleDragStart}
                        deleteEvent={deleteEvent}
                    />
                </div>
            </Card>
        );
    }

    const calendarDays = generateCalendarDays();

    return (
        <Card className="w-full max-w-4xl mx-auto h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
                <CalendarHeader
                    view={view}
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    navigateMonth={navigateMonth}
                    navigateDay={navigateDay}
                    handleBackToMonth={handleBackToMonth}
                >
                </CalendarHeader>
            </CardHeader>

            <div className="flex-1 overflow-hidden">
                <MonthView
                    calendarDays={calendarDays}
                    getEventsForDate={getEventsForDate}
                    isToday={isToday}
                    isSameMonth={isSameMonth}
                    handleDateClick={handleDateClick}
                />
            </div>
        </Card>
    );
};

export default Calendar;