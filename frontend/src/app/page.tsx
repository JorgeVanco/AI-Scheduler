"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Calendar from "@/components/Calendar";
import { useCalendarContext } from "@/context/calendarContext";
import CalendarList from "@/components/CalendarList";

import styles from "./styles.module.css";

export default function Home() {

  const { data: session } = useSession();
  const { calendars, tasks } = useCalendarContext();

  return (
    <div>
      {session ? (
        <>
          <p>Signed in as {session.user?.email}</p>
          <button onClick={() => signOut()}>Sign out</button>
        </>
      ) : (
        <button onClick={() => signIn('google')}>Sign in with Google</button>
      )}
      <main className={`p-4 ${styles.calendarGrid}`}>
        <aside>
          <CalendarList calendars={calendars} />
        </aside>
        <section>
          <Calendar />
        </section>
      </main>
      <footer>
      </footer>
    </div>
  );
}
