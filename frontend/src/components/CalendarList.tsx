import {
    Accordion,
} from "@/components/ui/accordion"
import CalendarListItem from "./CalendarListItem";

export default function CalendarList({ calendars }: { calendars: any[] }) {
    const myCalendars = calendars.filter(cal => cal.accessRole === 'owner')
    const otherCalendars = calendars.filter(cal => cal.accessRole !== 'owner')

    return (
        <div className="space-y-4">
            <Accordion
                type="multiple"
                className="w-full"
                defaultValue={["My Calendars"]}
            >
                <CalendarListItem calendars={myCalendars} name="My Calendars" />
                <CalendarListItem calendars={otherCalendars} name="Other Calendars" />
            </Accordion>
        </div >
    )
}
