"use client";

import React from 'react';
import { CardContent } from '@/components/ui/card';

const MonthView = ({
    calendarDays,
    getEventsForDate,
    isToday,
    isSameMonth,
    handleDateClick,
    isMobile
}) => {
    const dayNames = isMobile
        ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] // Abreviaciones de una letra para móvil
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <CardContent className={`h-full flex flex-col overflow-hidden ${isMobile ? 'p-1' : ''}`}>
            {/* Day headers */}
            <div className={`grid grid-cols-7 ${isMobile ? 'gap-1 mb-1' : 'gap-2 mb-2'} flex-shrink-0`}>
                {dayNames.map(day => (
                    <div key={day} className={`text-center font-semibold text-gray-600 ${isMobile ? 'py-1 text-xs' : 'py-2'}`}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className={`grid grid-cols-7 ${isMobile ? 'gap-1' : 'gap-2'} flex-1 overflow-auto`}>
                {calendarDays.map((date, index) => {
                    const dayEvents = getEventsForDate(date);
                    const isCurrentDay = isToday(date);
                    const isCurrentMonth = isSameMonth(date);

                    return (
                        <div
                            key={index}
                            className={`
                                relative ${isMobile ? 'min-h-[60px] p-1' : 'min-h-[100px] p-2'} border rounded-lg cursor-pointer
                                hover:bg-gray-50 transition-colors
                                ${isCurrentMonth ? 'bg-white' : 'bg-gray-100 text-gray-400'}
                            `}
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
                            <div className={`${isMobile ? 'mt-0.5 space-y-0.5' : 'mt-1 space-y-1'}`}>
                                {dayEvents.slice(0, isMobile ? 3 : 2).map((event, eventIndex) => (
                                    <div
                                        key={`${event.id}-${eventIndex}`}
                                        style={{
                                            backgroundColor: `${event.backgroundColor}20`,
                                            border: `1px solid ${event.backgroundColor}`,
                                            color: event.backgroundColor
                                        }}
                                        className={`${isMobile ? 'text-[10px] px-0.5 py-0.5' : 'text-xs px-1 py-0.5'} rounded truncate ${event.isGoogleEvent ? 'text-white' : 'text-blue-800'
                                            }`}
                                    >
                                        {isMobile ? event.title.substring(0, 8) + (event.title.length > 8 ? '...' : '') : event.title}
                                    </div>
                                ))}
                                {dayEvents.length > (isMobile ? 3 : 2) && (
                                    <div className={`${isMobile ? 'text-[9px]' : 'text-xs'} text-gray-500 absolute bottom-1`}>
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
