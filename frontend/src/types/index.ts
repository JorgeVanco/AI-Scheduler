// Tipos para la aplicación AI-Scheduler

export interface Calendar {
    id: string;
    summary: string;
    summaryOverride?: string;
    description?: string;
    timeZone?: string;
    backgroundColor: string;
    foregroundColor: string;
    colorId: string;
    conferenceProperties?: {
        allowedConferenceSolutionTypes: string[];
    };
    etag?: string;
    kind?: string;
    notificationSettings?: {
        notifications?: NotificationType[];
    };
    primary?: boolean;
    selected?: boolean;
    timezone?: string;
    accessRole: 'owner' | 'reader' | 'writer' | 'freeBusyReader';
    defaultReminders?: Reminder[];
}

export interface NotificationType {
    type: 'email' | 'popup';
    method: 'email' | 'popup';
}

export interface Event {
    id: string;
    etag?: string;
    kind?: string;
    iCalUID?: string;
    summary: string;
    description?: string;
    start: EventDateTime;
    originalStartTime?: EventDateTime;
    recurringEventId?: string;
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
    created?: string;
    sequence?: number;
    updated?: string;
    // Nuevas propiedades para eventos propuestos
    isProposed?: boolean;
    taskId?: string;
    isDragging?: boolean;
    // Propiedades adicionales para compatibilidad con EventItem
    title?: string; // Alias para summary
    date?: Date; // Fecha de inicio como objeto Date
    endDate?: Date; // Fecha de fin como objeto Date
    duration?: number; // Duración en minutos
    isAllDayEvent?: boolean; // Indica si es un evento de todo el día
    isGoogleEvent?: boolean; // Indica si viene de Google Calendar
}

export type EventDateTime =
    | {
        date: string; // Para eventos de día completo (formato YYYY-MM-DD)
        dateTime?: never;
        timeZone?: string;
    }
    | {
        date?: never;
        dateTime: string; // Para eventos con hora específica (formato RFC3339)
        timeZone?: string;
    };


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
    etag?: string;
    id: string;
    kind?: string;
    title: string;
    updated?: string;
    selfLink?: string;
}

export interface Task {
    id: string;
    etag?: string;
    kind?: string;
    links?: LinkType[];
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
    webViewLink?: string;
}

export interface LinkType {
    type: "generic";
    link: string;
    description: string;
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
    view: 'month' | 'day';
    setView: (view: 'month' | 'day') => void;
    selectedDate: Date | null;
    setSelectedDate: (date: Date | null) => void;
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    // Nuevas funciones optimizadas
    eventsCache: { [key: string]: Event[] };
    loadedRange: { start: Date | null, end: Date | null };
    isLoadingEvents: boolean;
    localEvents: Event[];
    setLocalEvents: (events: Event[]) => void;
    loadEventsForRange: (startDate: Date, endDate: Date) => Promise<{ [key: string]: Event[] }>;
    getEventsForDate: (date: Date) => Event[];
    needsEventLoading: (date: Date) => boolean;
    getOptimalRange: (centerDate?: Date) => { start: Date, end: Date };
    parseGoogleEvent: (googleEvent: Event) => Event | null;
}

// Tipos para el contexto del chat
export interface ChatCalendarContext {
    calendars: Calendar[];
    tasks: Task[];
    events: Event[];
}

// Tipos para la programación del día
export interface ScheduleEvent {
    id: string;
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
    isProposed: boolean;
    taskId?: string;
}

export interface ScheduleDayRequest {
    date: string;
    preferences?: {
        workingHours?: {
            start: string;
            end: string;
        };
        breakDuration?: number;
        taskPriority?: 'urgent' | 'important' | 'normal';
    };
}

export interface ScheduleDayResponse {
    success: boolean;
    date: string;
    proposedEvents: ScheduleEvent[];
    existingEvents: ScheduleEvent[];
    summary: {
        totalTasks: number;
        scheduledTasks: number;
        totalHours: number;
        freeHours: number;
    };
    recommendations?: string[];
}

export interface ScheduleSummary {
    totalTasks: number;
    scheduledTasks: number;
    totalHours: number;
    freeHours: number;
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
