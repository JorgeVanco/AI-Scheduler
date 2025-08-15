"use client";

import React from 'react';
import { CardContent } from '@/components/ui/card';
import { useScreenSize } from '@/hooks/use-screen-size';

const MonthView = ({
    calendarDays,
    getEventsForDate,
    isToday,
    isSameMonth,
    handleDateClick,
    isMobile
}) => {
    const { isSmallMobile, isMediumMobile, height } = useScreenSize();

    const dayNames = isMobile
        ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] // Abreviaciones de una letra para móvil
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Calcular dinámicamente cuántos eventos pueden caber usando medidas relativas
    const getMaxEventsToShow = () => {
        // if (!isMobile) {
        //     return 2;
        // }
        // Altura de cada evento en rem (convertimos a px para el cálculo)
        const eventHeightRem = isMobile ? 1 : 1.25; // 1rem ≈ 16px, 1.25rem ≈ 20px
        const eventSpacingRem = isMobile ? 0.125 : 0.25; // spacing entre eventos
        const dayNumberHeightRem = isMobile ? 1.25 : 1.5; // altura del número del día
        const paddingRem = isMobile ? 0.5 : 0.5; // padding de la celda

        // Convertir rem a px (asumiendo 1rem = 16px)
        const remToPx = 16;
        const eventHeight = eventHeightRem * remToPx;
        const eventSpacing = eventSpacingRem * remToPx;
        const dayNumberHeight = dayNumberHeightRem * remToPx;
        const padding = paddingRem * remToPx;

        // Calcular altura disponible por celda
        let cellHeight;
        if (isMobile) {
            // Para móvil, usar viewport height
            const headerHeight = 3.75 * remToPx; // ~60px en rem
            const dayNamesHeight = 2.5 * remToPx; // ~40px en rem
            const totalPadding = 2.5 * remToPx; // padding general
            const availableHeight = height - headerHeight - dayNamesHeight - totalPadding;
            cellHeight = Math.floor(availableHeight / 6); // 6 filas
        } else {
            cellHeight = 6.25 * remToPx; // ~100px en rem
        }

        // Espacio disponible para eventos
        const availableEventSpace = cellHeight - dayNumberHeight - (padding * 2);

        // Calcular cuántos eventos caben
        const maxEvents = Math.floor(availableEventSpace / (eventHeight + eventSpacing));
        console.log({ maxEvents, })

        // Limitar entre 1 y un máximo razonable
        return Math.max(1, Math.min(maxEvents, isMobile ? 4 : 6));
    };

    const maxEventsToShow = getMaxEventsToShow();

    return (
        <CardContent className={`h-full flex flex-col overflow-hidden p-0`}>
            {/* Day headers */}
            <div className={`grid grid-cols-7 ${isMobile ? 'gap-1 mb-1' : 'gap-2 mb-2'} flex-shrink-0`}>
                {dayNames.map(day => (
                    <div key={day} className={`text-center font-semibold text-gray-600 ${isMobile ? 'py-1 text-xs' : 'py-2'}`}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className={`grid grid-cols-7 ${isMobile ? 'gap-0' : 'gap-2'} flex-1 overflow-auto`}>
                {calendarDays.map((date, index) => {
                    const dayEvents = getEventsForDate(date);
                    const isCurrentDay = isToday(date);
                    const isCurrentMonth = isSameMonth(date);

                    return (
                        <div
                            key={index}
                            className={`
                                relative ${isMobile ? 'p-1' : 'p-2 rounded-lg'} border cursor-pointer
                                hover:bg-gray-50 transition-colors
                                ${isCurrentMonth ? 'bg-white' : 'bg-gray-100 text-gray-400'}
                                ${isMobile && index === 0 ? 'rounded-tl-lg' : ''}
                                ${isMobile && index === 6 ? 'rounded-tr-lg' : ''}
                                ${isMobile && index === calendarDays.length - 7 ? 'rounded-bl-lg' : ''}
                                ${isMobile && index === calendarDays.length - 1 ? 'rounded-br-lg' : ''}
                            `}
                            style={{
                                minHeight: isMobile
                                    ? `${1.25 + 0.5 + (maxEventsToShow * 1.125)}rem` // dayNumber + padding + (events * eventHeight)
                                    : `${1.5 + 1 + (maxEventsToShow * 1.5)}rem`
                            }}
                            onClick={() => handleDateClick(date)}
                        >
                            <div className="grid grid-cols-1 place-items-center mb-1">
                                <span className={`
                                    ${isMobile ? 'text-xs' : 'text-sm'} font-medium z-10 col-start-1 row-start-1
                                    ${isCurrentDay ? 'text-blue-500' : ''}
                                `}>
                                    {date.getDate()}
                                </span>
                                {isCurrentDay && (
                                    <div className={`col-start-1 row-start-1 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded-full bg-blue-200 flex items-center justify-center`}>
                                    </div>
                                )}
                            </div>

                            {/* Event indicators */}
                            <div className={`${isMobile ? 'mt-1 space-y-0.5' : 'mt-2 space-y-1'}`}>
                                {dayEvents.slice(0, maxEventsToShow).map((event, eventIndex) => (
                                    <div
                                        key={`${event.id}-${eventIndex}`}
                                        style={{
                                            backgroundColor: `${event.backgroundColor}20`,
                                            border: `1px solid ${event.backgroundColor}`,
                                            color: event.backgroundColor,
                                            height: isMobile ? '1rem' : '1.25rem'
                                        }}
                                        className={`${isMobile ? 'text-[10px] px-0.5 py-0.5' : 'text-xs px-1 py-1'} rounded flex items-center ${event.isGoogleEvent ? 'text-white' : 'text-blue-800'}`}
                                    >
                                        <span className="overflow-hidden text-nowrap">
                                            {event.title}
                                        </span>
                                    </div>
                                ))}
                                {dayEvents.length > (isMobile ? 2 : 2) && (
                                    <div className={`${isMobile ? 'text-[8px]' : 'text-xs'} text-gray-500 absolute bottom-1`}>
                                        +{dayEvents.length - (isMobile ? 1 : 2)} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </CardContent>
    );
};

export default MonthView;
