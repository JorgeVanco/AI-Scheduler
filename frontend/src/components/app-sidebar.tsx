import * as React from "react"
import { Plus } from "lucide-react"

import { Calendars } from "@/components/calendars"
import { Tasks } from "@/components/tasks"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { useCalendarContext } from "@/context/calendarContext"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

    const { calendars, taskLists, tasks } = useCalendarContext();

    return (
        <Sidebar {...props}>
            <SidebarHeader className="border-sidebar-border h-16 border-b">
                <NavUser />
            </SidebarHeader>
            <SidebarContent>
                {/* <DatePicker /> */}
                <SidebarSeparator className="mx-0" />
                <Calendars calendars={calendars} />
                <SidebarSeparator className="mx-0" />
                <Tasks taskLists={taskLists} tasks={tasks} />
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton>
                            <Plus />
                            <span>New Task</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
