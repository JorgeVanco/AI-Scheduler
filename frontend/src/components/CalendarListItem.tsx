"use client";

import { useCalendarContext } from "@/context/calendarContext";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"

export default function CalendarListItem({ calendars, name }: { calendars: any[], name: string }) {
    const { selectedCalendarIds, toggleCalendar } = useCalendarContext();
    return <AccordionItem value={name}>
        <AccordionTrigger>{name}</AccordionTrigger>
        <AccordionContent className="space-y-2">
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
        </AccordionContent>
    </AccordionItem>
}