import * as React from "react"
import { ChevronRight } from "lucide-react"

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
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { useCalendarContext } from "@/context/calendarContext";
import { Checkbox } from "@/components/ui/checkbox"
import { Task } from "@/types"
import TaskItem from "./task-item";

export function TaskGroup({
    tasks,
    name,
    index,
}: {
    tasks: Task[];
    name: string;
    index: number;
}) {

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
                            {name}{tasks.length > 0 ? ` (${tasks.length})` : ""}
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </CollapsibleTrigger>
                    </SidebarGroupLabel>
                    <CollapsibleContent>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {tasks.map((task: Task) => (
                                    <TaskItem task={task} key={task.id} />
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
