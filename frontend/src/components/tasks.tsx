import * as React from "react"
import { TaskGroup } from "./task-group";
import { TaskList, Task } from "@/types"

import {
    SidebarGroupLabel,
} from "@/components/ui/sidebar"

export function Tasks({
    taskLists,
    tasks,
}: {
    taskLists: TaskList[];
    tasks: Task[];
}) {
    // const otherTaskLists = taskLists.filter(list => list.accessRole !== 'owner')

    return (
        <>
            <SidebarGroupLabel>Tasks</SidebarGroupLabel>
            {

                taskLists && taskLists.map((list, index) => (
                    <TaskGroup
                        key={list.id}
                        tasks={tasks.filter(task => task.taskListId === list.id)}
                        name={list.title}
                        index={index}
                    />
                ))
            }
            {/* <CalendarGroup index={0} calendars={myTaskLists} name="My Task Lists" /> */}
            {/* <CalendarGroup index={1} calendars={otherTaskLists} name="Other Task Lists" /> */}
        </>
    )
}