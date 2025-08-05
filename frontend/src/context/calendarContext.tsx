"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSession } from "next-auth/react";

interface CalendarContextType {
    calendars: any[];
    setCalendars: (calendars: any[]) => void;
    tasks: any[];
    setTasks: (tasks: any[]) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
    const [calendars, setCalendars] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);

    const { data: session } = useSession();

    useEffect(() => {
        if (session?.accessToken) {
            fetch('/api/google/calendars')
                .then((res) => res.json())
                .then((data) => {
                    if (data.items) {
                        setCalendars(data.items);
                        console.log('Calendars:', data.items);
                    } else {
                        console.error('Error:', data.error);
                    }
                });
            fetch('/api/google/tasks')
                .then((res) => res.json())
                .then((data) => {
                    if (data.items) {
                        setTasks(data.items);
                        console.log('Tasks:', data.items);
                    } else {
                        console.error('Error:', data.error);
                    }
                });
        }
    }, [session]);

    return (
        <CalendarContext.Provider value={{ calendars, setCalendars, tasks, setTasks }}>
            {children}
        </CalendarContext.Provider>
    );
};

export const useCalendarContext = () => {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error('useCalendarContext must be used within a CalendarProvider');
    }
    return context;
};

export default CalendarProvider;