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
    children
}) => {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (view === 'day' && selectedDate) {
        return (
            <div className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleBackToMonth}>
                        ← Month
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateDay(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle>
                        {selectedDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => navigateDay(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                {children}
                <ScheduleDayButton
                    selectedDate={selectedDate}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            {children}
            <ScheduleDayButton
                selectedDate={selectedDate}
            />
        </div>
    );
};

export default CalendarHeader;
