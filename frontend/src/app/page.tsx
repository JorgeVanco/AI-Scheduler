"use client";

import Calendar from "@/components/Calendar";
import ChatAssistant from "@/components/ChatAssistant";
import ScheduleSummaryPanel from "@/components/calendar/ScheduleSummaryPanel";

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import styles from "./styles.module.css";

import { useCalendarLogic } from "@/hooks/useCalendarLogic";
import { useCalendarContext } from "@/context/calendarContext";
import { useScheduleContext } from "@/context/scheduleContext";

export default function Home() {

  const { view, selectedDate } = useCalendarContext();
  const { currentDate } = useCalendarLogic();
  const {
    scheduleSummary,
    isScheduleMode,
    confirmSchedule,
    cancelSchedule,
    isConfirming,
    proposedEvents
  } = useScheduleContext();

  const handleConfirmSchedule = async () => {
    const success = await confirmSchedule();
    // Toast notifications will be handled in Calendar component
  };

  const handleCancelSchedule = () => {
    cancelSchedule();
    // Toast notifications will be handled in Calendar component
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{view === 'day' && selectedDate ? (selectedDate as Date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : currentDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className={`p-4 ${styles.calendarGrid} flex-1 min-h-0 overflow-hidden`}>
          <section className="h-full overflow-hidden">
            <Calendar />
          </section>
          <aside className="h-full overflow-hidden">
            {/* Mostrar panel de resumen si estamos en modo programación en vista de día */}
            {isScheduleMode && scheduleSummary && view === 'day' ? (
              <ScheduleSummaryPanel
                summary={scheduleSummary}
                onConfirm={handleConfirmSchedule}
                onCancel={handleCancelSchedule}
                isConfirming={isConfirming}
                proposedEventsCount={proposedEvents.length}
                isCompact={true}
              />
            ) : (
              <ChatAssistant />
            )}
          </aside>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
