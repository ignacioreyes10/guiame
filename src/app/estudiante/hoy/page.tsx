import AgendaHoy from "@/components/estudiante/AgendaHoy";

export default function EstudianteHoyPage() {
  const today = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <header className="mb-8">
        <p className="text-base font-semibold capitalize text-[#66716c]">
          {today}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#242a27] sm:text-4xl">
          ¡Hola, Lucía!
        </h1>
        <p className="mt-2 text-lg text-[#59635f]">
          Estas son tus actividades de hoy.
        </p>
      </header>

      <AgendaHoy />
    </main>
  );
}
