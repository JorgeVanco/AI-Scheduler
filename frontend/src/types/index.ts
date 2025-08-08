// Tipos para la aplicación AI-Scheduler

export interface Calendar {
    id: string;
    summary: string;
    description?: string;
    timeZone?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    selected?: boolean;
    primary?: boolean;
    accessRole: 'owner' | 'reader' | 'writer' | 'freeBusyReader';
    defaultReminders?: Reminder[];
}

export interface Event {
    id: string;
    summary: string;
    description?: string;
    start: EventDateTime;
    end: EventDateTime;
    location?: string;
    status?: 'confirmed' | 'tentative' | 'cancelled';
    visibility?: 'default' | 'public' | 'private' | 'confidential';
    attendees?: Attendee[];
    creator?: Person;
    organizer?: Person;
    reminders?: EventReminders;
    recurrence?: string[];
    htmlLink?: string;
    calendarId?: string;
    backgroundColor?: string;
    colorId?: string;
}

export interface EventDateTime {
    date?: string; // Para eventos de día completo (formato YYYY-MM-DD)
    dateTime?: string; // Para eventos con hora específica (formato RFC3339)
    timeZone?: string;
}

export interface Attendee {
    id?: string;
    email: string;
    displayName?: string;
    organizer?: boolean;
    self?: boolean;
    resource?: boolean;
    optional?: boolean;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    comment?: string;
    additionalGuests?: number;
}

export interface Person {
    id?: string;
    email?: string;
    displayName?: string;
    self?: boolean;
}

export interface EventReminders {
    useDefault?: boolean;
    overrides?: Reminder[];
}

export interface Reminder {
    method: 'email' | 'popup';
    minutes: number;
}

export interface TaskList {
    id: string;
    title: string;
    updated?: string;
    selfLink?: string;
}

export interface Task {
    id: string;
    title: string;
    notes?: string;
    status: 'needsAction' | 'completed';
    due?: string; // Formato RFC3339
    completed?: string; // Formato RFC3339
    deleted?: boolean;
    hidden?: boolean;
    parent?: string; // ID de la tarea padre para subtareas
    position?: string;
    updated?: string; // Formato RFC3339
    selfLink?: string;
    taskListId?: string; // Para asociar con la lista de tareas
}

// Tipos para el contexto
export interface CalendarContextType {
    calendars: Calendar[];
    setCalendars: (calendars: Calendar[]) => void;
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
    taskLists: TaskList[];
    setTaskLists: (taskLists: TaskList[]) => void;
    events: Event[];
    setEvents: (events: Event[]) => void;
    selectedCalendarIds: Set<string>;
    setSelectedCalendarIds: (ids: Set<string>) => void;
    toggleCalendar: (calendarId: string) => Promise<void>;
    updateCalendarSelected: (calendarId: string, selected: boolean) => Promise<void>;
}

// Tipos para las respuestas de la API de Google
export interface GoogleCalendarListResponse {
    kind: string;
    etag: string;
    nextPageToken?: string;
    nextSyncToken?: string;
    items: Calendar[];
}

export interface GoogleEventListResponse {
    kind: string;
    etag: string;
    summary: string;
    description?: string;
    updated: string;
    timeZone: string;
    accessRole: string;
    defaultReminders: Reminder[];
    nextPageToken?: string;
    nextSyncToken?: string;
    items: Event[];
}

export interface GoogleTaskListResponse {
    kind: string;
    etag: string;
    nextPageToken?: string;
    items: TaskList[];
}

export interface GoogleTaskResponse {
    kind: string;
    etag: string;
    nextPageToken?: string;
    items: Task[];
}
