import * as React from "react"
import { Check, ChevronRight } from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { useCalendarContext } from "@/context/calendarContext";
import { Checkbox } from "@/components/ui/checkbox"

export function CalendarGroup({
    calendars,
    name,
    index,
}: {
    calendars: {
        name: string;
        id: string;
        backgroundColor: string;
        summaryOverride: string;
        summary: string;
        accessRole: string;
    }[];
    name: string;
    index: number;
}) {

    const { selectedCalendarIds, toggleCalendar } = useCalendarContext();

    return (
        <React.Fragment key={name}>
            <SidebarGroup key={name} className="py-0">
                <Collapsible
                    defaultOpen={index === 0}
                    className="group/collapsible"
                >
                    <SidebarGroupLabel
                        asChild
                        className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-sm"
                    >
                        <CollapsibleTrigger>
                            {name}{" "}
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </CollapsibleTrigger>
                    </SidebarGroupLabel>
                    <CollapsibleContent>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {calendars.map((calendar: { id: string; name: string; backgroundColor: string, summaryOverride: string, summary: string, accessRole: string }) => (
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
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </CollapsibleContent>
                </Collapsible>
            </SidebarGroup>
            <SidebarSeparator className="mx-0" />
        </React.Fragment>
    );
}
