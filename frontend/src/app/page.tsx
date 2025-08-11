"use client";

import Calendar from "@/components/Calendar";
import ChatAssistant from "@/components/ChatAssistant";

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

export default function Home() {

  const { view, selectedDate } = useCalendarContext();
  const { currentDate } = useCalendarLogic();

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
            <ChatAssistant />
          </aside>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
