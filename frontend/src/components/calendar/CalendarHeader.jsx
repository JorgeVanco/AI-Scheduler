"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ScheduleDayButton from './ScheduleDayButton';

const CalendarHeader = ({
    view,
    currentDate,
    selectedDate,
    navigateMonth,
    navigateDay,
    handleBackToMonth,
    children,
    isMobile
}) => {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (view === 'day' && selectedDate) {
        return (
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row'} items-center justify-between`}>
                <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                    <Button variant="outline" size={isMobile ? "xs" : "sm"} onClick={handleBackToMonth}>
                        {isMobile ? '←' : '← Month'}
                    </Button>
                    <Button variant="outline" size={isMobile ? "xs" : "sm"} onClick={() => navigateDay(-1)}>
                        <ChevronLeft className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    </Button>
                    <CardTitle className={isMobile ? 'text-sm' : ''}>
                        {selectedDate.toLocaleDateString(isMobile ? 'es-ES' : 'en-US', {
                            weekday: isMobile ? 'short' : 'long',
                            year: 'numeric',
                            month: isMobile ? 'short' : 'long',
                            day: 'numeric'
                        })}
                    </CardTitle>
                    <Button variant="outline" size={isMobile ? "xs" : "sm"} onClick={() => navigateDay(1)}>
                        <ChevronRight className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    </Button>
                </div>
                {children}
                {!isMobile && (
                    <ScheduleDayButton
                        selectedDate={selectedDate}
                    />
                )}
            </div>
        );
    }

    return (
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row'} items-center justify-between`}>
            <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                <Button variant="outline" size={isMobile ? "xs" : "sm"} onClick={() => navigateMonth(-1)}>
                    <ChevronLeft className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
                <CardTitle className={isMobile ? 'text-sm' : ''}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <Button variant="outline" size={isMobile ? "xs" : "sm"} onClick={() => navigateMonth(1)}>
                    <ChevronRight className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
            </div>
            {children}
            {!isMobile && (
                <ScheduleDayButton
                    selectedDate={selectedDate}
                />
            )}
        </div>
    );
};

export default CalendarHeader;
