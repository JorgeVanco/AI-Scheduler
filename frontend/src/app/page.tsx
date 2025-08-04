import Image from "next/image";
import Calendar from "@/components/Calendar";
export default function Home() {
  return (
    <div>
      <main className="p-4">
        <Calendar />
      </main>
      <footer>
      </footer>
    </div>
  );
}
