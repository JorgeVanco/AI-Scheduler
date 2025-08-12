// Calendar tools
export {
    getCalendarsTool,
    getEventsTool,
    createEventTool,
    createEventsTool,
    searchEventsTool,
    getFreeBusyTool,
} from './calendarTools';

// Task tools
export {
    getTaskListsTool,
    getTasksTool,
    createTaskTool,
} from './taskTools';

// Time utility tools
export {
    getCurrentTimeTool,
    calculateTimeDifferenceTool,
    formatDateTimeTool,
    addTimeTool,
} from './timeTools';

// Import tools for the array
import {
    getCalendarsTool,
    getEventsTool,
    createEventTool,
    searchEventsTool,
    getFreeBusyTool,
    createEventsTool,
} from './calendarTools';

import {
    getTaskListsTool,
    getTasksTool,
    createTaskTool,
} from './taskTools';

import {
    getCurrentTimeTool,
    calculateTimeDifferenceTool,
    formatDateTimeTool,
    addTimeTool,
} from './timeTools';

// All tools array for easy importing
export const allTools = [
    // Calendar tools
    getCalendarsTool,
    getEventsTool,
    createEventTool,
    createEventsTool,
    searchEventsTool,
    getFreeBusyTool,

    // Task tools
    getTaskListsTool,
    getTasksTool,
    createTaskTool,

    // Time utility tools
    getCurrentTimeTool,
    calculateTimeDifferenceTool,
    formatDateTimeTool,
    addTimeTool,
];
