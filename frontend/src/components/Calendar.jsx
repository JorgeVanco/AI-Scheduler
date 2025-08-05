"use client";

import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { useCalendarLogic } from '@/hooks/useCalendarLogic';
import {
    CalendarHeader,
    DayView,
    MonthView,
    EventForm,
    EventLegend
} from './calendar';

const Calendar = () => {
    const {
        currentDate,
        selectedDate,
        view,
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
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
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
            </Card>
        );
    }

    const calendarDays = generateCalendarDays();

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CalendarHeader
                    view={view}
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    navigateMonth={navigateMonth}
                    navigateDay={navigateDay}
                    handleBackToMonth={handleBackToMonth}
                >
                    <EventLegend />
                </CalendarHeader>
            </CardHeader>

            <MonthView
                calendarDays={calendarDays}
                getEventsForDate={getEventsForDate}
                isToday={isToday}
                isSameMonth={isSameMonth}
                handleDateClick={handleDateClick}
            />
        </Card>
    );
};

export default Calendar;