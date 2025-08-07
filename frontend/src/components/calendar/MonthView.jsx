"use client";

import React from 'react';
import { CardContent } from '@/components/ui/card';

const MonthView = ({
    calendarDays,
    getEventsForDate,
    isToday,
    isSameMonth,
    handleDateClick
}) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <CardContent className="h-full flex flex-col overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 flex-shrink-0">
                {dayNames.map(day => (
                    <div key={day} className="text-center font-semibold text-gray-600 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2 flex-1 overflow-auto">
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
                                        style={{
                                            backgroundColor: `${event.backgroundColor}20`,
                                            border: `1px solid ${event.backgroundColor}`,
                                            color: event.backgroundColor
                                        }}
                                        className={`text-xs px-1 py-0.5 rounded truncate ${event.isGoogleEvent ? 'text-white' : 'text-blue-800'
                                            }`}
                                    >
                                        {event.title}
                                    </div>
                                ))}
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
    );
};

export default MonthView;
