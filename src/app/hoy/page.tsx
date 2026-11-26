import Link from "next/link";
import AgendaHoy from "@/components/estudiante/AgendaHoy";

export default function HoyPage() {
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const today = `${formattedDate.charAt(0).toLocaleUpperCase("es-ES")}${formattedDate
    .slice(1)
    .replace(",", "")}`;

  return (
    <main className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#fbfaf7] px-8 py-6">
      <header className="mb-5 flex shrink-0 items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#242a27]">
            Hoy
          </h1>
          <p className="mt-1 text-lg text-[#66716c]">{today}</p>
        </div>
        <Link
          className="flex min-h-[76px] w-[270px] shrink-0 items-center justify-between gap-4 rounded-2xl border-2 border-[#e4e0d7] bg-[#fffefb] px-5 text-lg font-bold leading-tight text-[#242a27] transition hover:border-[#20615b] focus:outline-none focus:ring-4 focus:ring-[#c8dedb]"
          href="/estudiante/animo"
        >
          <span aria-hidden="true" className="text-3xl text-[#20615b]">
            ☺
          </span>
          <span>¿Cómo te sientes hoy?</span>
          <span aria-hidden="true" className="text-3xl text-[#20615b]">
            ›
          </span>
        </Link>
      </header>

      <AgendaHoy />
    </main>
  );
}
