import * as React from "react"
import { CalendarGroup } from "./calendar-group"

export function Calendars({
    calendars,
}: {
    calendars: {
        name: string;
        id: string;
        backgroundColor: string;
        summaryOverride: string;
        summary: string;
        accessRole: string;
    }[];
}) {
    const myCalendars = calendars.filter(cal => cal.accessRole === 'owner')
    const otherCalendars = calendars.filter(cal => cal.accessRole !== 'owner')
    return (
        <>
            <CalendarGroup index={0} calendars={myCalendars} name="My Calendars" />
            <CalendarGroup index={1} calendars={otherCalendars} name="Other Calendars" />
        </>
    )
}
