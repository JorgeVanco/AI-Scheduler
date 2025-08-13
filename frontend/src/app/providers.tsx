// providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";
import { CalendarProvider } from "@/context/calendarContext";
import { ScheduleProvider } from "@/context/scheduleContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <CalendarProvider>
                <ScheduleProvider>
                    {children}
                </ScheduleProvider>
            </CalendarProvider>
        </SessionProvider>
    );
}