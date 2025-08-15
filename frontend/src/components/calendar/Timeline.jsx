"use client";

import React from 'react';

const Timeline = ({
    formatTime,
    generateHours,
    currentTime,
    isSelectedDateToday,
    getCurrentTimePosition,
    isMobile
}) => {
    const hours = generateHours();

    return (
        <>
            {/* Time labels */}
            <div className={`absolute left-0 top-0 ${isMobile ? 'w-8' : 'w-16'} h-full bg-gray-50 border-r`}>
                {hours.map((hour) => {
                    return (
                        hour != 0 && <div
                            key={hour}
                            className={`absolute left-0 right-0 ${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-600 text-right ${isMobile ? 'pr-1' : 'pr-2'}`}
                            style={{ top: `${(hour / 24) * 100}%`, transform: 'translateY(-50%)' }}
                        >
                            {isMobile ? `${hour}` : formatTime(hour, 0)}
                        </div>
                    )
                })}
            </div>

            {/* Hour lines */}
            <div className={`absolute ${isMobile ? 'left-8' : 'left-16'} right-0 top-0 h-full`}>
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
                    className={`absolute ${isMobile ? 'left-8' : 'left-16'} right-0 border-t-2 border-red-500 z-20 pointer-events-none`}
                    style={{ top: `${getCurrentTimePosition()}%` }}
                >
                    <div className={`absolute ${isMobile ? '-left-8 w-8 text-[10px] px-0.5 pr-1' : '-left-16 w-16 text-xs px-1 pr-2'} -top-2 text-red-500 bg-gray-50 border-r border-gray-200 text-right`}>
                        {isMobile ? `${currentTime.getHours()}:${String(currentTime.getMinutes()).padStart(2, '0')}` : formatTime(currentTime.getHours(), currentTime.getMinutes())}
                    </div>
                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
            )}
        </>
    );
};

export default Timeline;
