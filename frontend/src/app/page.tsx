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
import { Toaster } from "@/components/ui/sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import styles from "./styles.module.css";

import { useCalendarLogic } from "@/hooks/useCalendarLogic";
import { useCalendarContext } from "@/context/calendarContext";
import { useScheduleContext } from "@/context/scheduleContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { CalendarDays, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import GoogleSignInButton from "@/components/ui/google-signin";

export default function Home() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("calendar");
  const { data: session } = useSession();

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
      <Toaster />
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
        <main className={`flex-1 min-h-0 overflow-hidden ${isMobile ? '' : 'p-2'}`}>
          {isMobile ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="flex flex-col h-full">
                <TabsContent value="calendar" className="flex-1 m-0 overflow-hidden p-1">
                  <Calendar />
                </TabsContent>
                <TabsContent value="chat" className="flex-1 m-0 overflow-hidden p-1">
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
                </TabsContent>

                {/* Fixed bottom tabs for mobile */}
                <div className="bg-background/95 backdrop-blur-sm border-t px-2 py-2 safe-area-pb">
                  {session?.user ?
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                      <TabsTrigger value="calendar" className="flex flex-col items-center gap-1 h-full px-3 py-1 data-[state=active]:bg-background">
                        <CalendarDays className="h-5 w-5" />
                      </TabsTrigger>
                      <TabsTrigger value="chat" className="flex flex-col items-center gap-1 h-full px-3 py-1 data-[state=active]:bg-background">
                        <MessageSquare className="h-5 w-5" />
                      </TabsTrigger>
                    </TabsList> :
                    <GoogleSignInButton />}
                </div>
              </div>
            </Tabs>
          ) : (
            <div className={`${styles.calendarGrid} h-full`}>
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
            </div>
          )}
        </main>
      </SidebarInset >
    </SidebarProvider >
  );
}
