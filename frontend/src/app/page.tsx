"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Calendar from "@/components/Calendar";
export default function Home() {

  const { data: session } = useSession();

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
      <main className="p-4">
        <Calendar />
      </main>
      <footer>
      </footer>
    </div>
  );
}
