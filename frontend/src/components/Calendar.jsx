"use client";

import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { useCalendarLogic } from '@/hooks/useCalendarLogic';
import { useCalendarContext } from '@/context/calendarContext';
import { useScheduleDay } from '@/hooks/useScheduleDay';
import { toast } from 'sonner';
import {
    CalendarHeader,
    DayView,
    MonthView,
    EventForm,
} from './calendar';
import ScheduleSummaryPanel from './calendar/ScheduleSummaryPanel';

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

    const {
        proposedEvents,
        scheduleSummary,
        isScheduleMode,
        addProposedEvents,
        updateProposedEvent,
        removeProposedEvent,
        confirmSchedule,
        cancelSchedule,
        isConfirming
    } = useScheduleDay();

    const handleScheduleGenerated = (events, summary) => {
        addProposedEvents(events, summary);
        toast.success('¡Horario generado! Revisa y ajusta según necesites.');
    };

    const handleConfirmSchedule = async () => {
        const success = await confirmSchedule();
        if (success) {
            toast.success('¡Eventos creados exitosamente en tu calendario!');
        } else {
            toast.error('Error al crear los eventos. Inténtalo de nuevo.');
        }
    };

    const handleCancelSchedule = () => {
        cancelSchedule();
        toast.info('Propuesta de horario cancelada');
    };

    const handleDeleteProposedEvent = (eventId) => {
        removeProposedEvent(eventId);
        toast.success('Evento propuesto eliminado');
    };

    if (view === 'day' && selectedDate) {
        const dayEvents = getEventsForDate(selectedDate);
        const isSelectedDateToday = isToday(selectedDate);

        // Combinar eventos regulares con eventos propuestos
        const allDayEvents = [...dayEvents, ...proposedEvents];

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
                        onScheduleGenerated={handleScheduleGenerated}
                    >
                        <EventForm
                            showEventForm={showEventForm}
                            setShowEventForm={setShowEventForm}
                            newEventTitle={newEventTitle}
                            setNewEventTitle={setNewEventTitle}
                        />
                    </CalendarHeader>
                </CardHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Panel de resumen de programación */}
                    {isScheduleMode && scheduleSummary && (
                        <div className="px-4 py-2">
                            <ScheduleSummaryPanel
                                summary={scheduleSummary}
                                onConfirm={handleConfirmSchedule}
                                onCancel={handleCancelSchedule}
                                isConfirming={isConfirming}
                                proposedEventsCount={proposedEvents.length}
                            />
                        </div>
                    )}

                    <div className="flex-1 overflow-hidden">
                        <DayView
                            selectedDate={selectedDate}
                            dayEvents={allDayEvents}
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
                            deleteEvent={isScheduleMode ? handleDeleteProposedEvent : deleteEvent}
                            updateProposedEvent={updateProposedEvent}
                            isScheduleMode={isScheduleMode}
                        />
                    </div>
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