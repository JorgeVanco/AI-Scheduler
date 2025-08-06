"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { useCalendarContext } from "@/context/calendarContext"

export default function CalendarList({ calendars }: { calendars: any[] }) {
    const { selectedCalendarIds, toggleCalendar } = useCalendarContext();

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <h3 className="text-base font-medium">Calendars</h3>
                <p className="text-sm text-muted-foreground">
                    Select the calendars you want to display.
                </p>
            </div>

            <div className="space-y-3">
                {calendars.map((calendar) => (
                    <div
                        key={calendar.id}
                        className="flex flex-row items-center gap-2"
                    >
                        <Checkbox
                            id={calendar.id}
                            style={{
                                '--primary': calendar.backgroundColor,
                                borderColor: calendar.backgroundColor,
                                accentColor: calendar.backgroundColor
                            } as React.CSSProperties}
                            className="border-2 cursor-pointer"
                            checked={selectedCalendarIds.has(calendar.id)}
                            onCheckedChange={() => toggleCalendar(calendar.id)}
                        />
                        <label
                            htmlFor={calendar.id}
                            className="text-sm font-normal cursor-pointer"
                        >
                            {calendar.summaryOverride || calendar.summary}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    )
}
