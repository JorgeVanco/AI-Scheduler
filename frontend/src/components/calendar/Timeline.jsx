"use client";

import React from 'react';

const Timeline = ({
    formatTime,
    generateHours,
    currentTime,
    isSelectedDateToday,
    getCurrentTimePosition
}) => {
    const hours = generateHours();

    return (
        <>
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
        </>
    );
};

export default Timeline;
