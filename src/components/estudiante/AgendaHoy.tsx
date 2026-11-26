"use client";

import { useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { fechaLarga, sumarDias } from "@/components/panel/fechas";
import NuevaTarea from "./NuevaTarea";
import { horaEnMadrid, rangoDiaMadrid, urlPictograma } from "./horario";
import CelebrationOverlay from "@/components/estudiante/CelebrationOverlay";

type ActivityStatus = "pending" | "in_progress" | "completed";
type Period = "morning" | "afternoon";

type Activity = {
  id: Id<"realizaciones">;
  startTime: string;
  title: string;
  completionText: string;
  pictogram?: string;
  status: ActivityStatus;
};

type Celebration = {
  completionText: string;
  next: Activity | null;
};

function areMorningActivitiesComplete(activities: Activity[]) {
  const morningActivities = activities.filter(
    (activity) => activity.startTime < "14:00",
  );
  return (
    morningActivities.every((activity) => activity.status === "completed")
  );
}

export default function AgendaHoy({ fechaInicial }: { fechaInicial: string }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [fecha, setFecha] = useState(fechaInicial);
  const rango = rangoDiaMadrid(fecha);
  const agenda = useQuery(api.realizaciones.miAgenda, isAuthenticated ? rango : "skip");
  const configuracion = useQuery(api.configuracionesVisuales.miConfiguracion, isAuthenticated ? {} : "skip");
  const empezar = useMutation(api.realizaciones.empezar);
  const terminar = useMutation(api.realizaciones.terminar);
  const [period, setPeriod] = useState<Period>("morning");
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const activities: Activity[] = (agenda ?? []).map(entrada => ({
    id: entrada.realizacionId,
    startTime: horaEnMadrid(entrada.fInicioProgramada),
    title: entrada.titulo,
    completionText: entrada.titulo,
    pictogram: configuracion?.mostrarPictograma !== false && entrada.arasaacId && /^\d+$/.test(entrada.arasaacId) ? urlPictograma(entrada.arasaacId) : undefined,
    status: entrada.hFinReal !== undefined ? "completed"
      : entrada.hInicioReal !== undefined ? "in_progress" : "pending",
  }));
  const morningActivitiesComplete =
    areMorningActivitiesComplete(activities);
  const orderedActivities = [...activities].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
  const hasActivityInProgress = orderedActivities.some(
    (activity) => activity.status === "in_progress",
  );
  const nextActivityId = hasActivityInProgress
    ? undefined
    : orderedActivities.find((activity) => activity.status === "pending")?.id;
  const visibleActivities = orderedActivities.filter((activity) =>
    period === "morning"
      ? activity.startTime < "14:00"
      : activity.startTime >= "14:00",
  );

  async function avanzar(actividad: Activity, accion: "empezar" | "terminar") {
    if (ocupado) return;
    setOcupado(true);
    setError("");
    try {
      if (accion === "empezar") {
        await empezar({ realizacionId: actividad.id });
      } else {
        await terminar({ realizacionId: actividad.id });
        setCelebration({
          completionText: actividad.completionText,
          next: orderedActivities.find(candidata => candidata.status === "pending") ?? null,
        });
      }
    } catch {
      setError("No se pudo actualizar la actividad. Inténtalo de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  if (isLoading) return <p role="status">Cargando agenda…</p>;
  if (!isAuthenticated) return <p>Inicia sesión para ver tu agenda.</p>;

  if (mostrarFormulario && configuracion?.permiteCrearTareas) {
    return (
      <div className="overflow-y-auto">
        <NuevaTarea fechaInicial={fecha} onCancelar={() => setMostrarFormulario(false)}
          onCreada={(dia, hora) => {
            setFecha(dia);
            setPeriod(hora < "14:00" ? "morning" : "afternoon");
            setMostrarFormulario(false);
            setMensaje("Tarea guardada en tu agenda.");
          }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 pb-2" aria-label="Elegir día de la agenda">
        <button type="button" aria-label="Día anterior" className="min-h-11 min-w-11 rounded-lg border px-3"
          onClick={() => setFecha(dia => sumarDias(dia, -1))}>←</button>
        <p aria-live="polite" className="font-bold">{fechaLarga(fecha)}</p>
        <button type="button" aria-label="Día siguiente" className="min-h-11 min-w-11 rounded-lg border px-3"
          onClick={() => setFecha(dia => sumarDias(dia, 1))}>→</button>
        {configuracion?.permiteCrearTareas && (
          <button type="button" className="ml-auto min-h-12 rounded-xl bg-[#20615b] px-4 font-bold text-white"
            onClick={() => { setMensaje(""); setMostrarFormulario(true); }}>Nueva tarea</button>
        )}
      </div>
      {mensaje && <p role="status" className="text-[#20615b]">{mensaje}</p>}
      {error && <p role="alert" className="text-[#9a3412]">{error}</p>}
      {agenda === undefined && <p role="status">Cargando actividades…</p>}
      {agenda !== undefined && visibleActivities.length === 0 && <p>No hay actividades en esta franja.</p>}
      {period === "afternoon" && !morningActivitiesComplete && (
        <p
          className="mb-2 shrink-0 rounded-xl bg-[#f2b640] px-4 py-2 text-center font-bold text-[#242a27]"
          id="afternoon-locked-message"
          role="status"
        >
          Completa primero todas las actividades de la mañana.
        </p>
      )}
      <ul
        aria-label={
          period === "morning"
            ? "Actividades de la mañana"
            : "Actividades de la tarde"
        }
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pt-2"
      >
        {visibleActivities.map((activity) => {
          const isCurrent = activity.status === "in_progress";
          const isNext =
            activity.status === "pending" && activity.id === nextActivityId;
          const isDone = activity.status === "completed";
          const isAfternoonLocked =
            activity.startTime >= "14:00" && !morningActivitiesComplete;

          return (
            <li
              className={`relative flex min-h-[88px] shrink-0 items-center gap-4 rounded-2xl border-2 bg-[#fffefb] px-4 sm:gap-5 sm:px-5 ${
                isCurrent
                  ? "border-[#20615b]"
                  : isNext
                    ? "border-[#20615b]/50"
                    : "border-[#e4e0d7]"
              }`}
              key={activity.id}
            >
              <span
                aria-hidden="true"
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl ${
                  isDone ? "bg-[#f1eee7] grayscale" : "bg-[#f4f0e7]"
                }`}
              >
                {activity.pictogram
                  ? <Image src={activity.pictogram} alt="" width={48} height={48} unoptimized />
                  : "📋"}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-lg font-bold sm:text-xl ${
                    isDone ? "text-[#77736c]" : "text-[#242a27]"
                  }`}
                >
                  {activity.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-[#77736c] sm:text-base">
                    {activity.startTime}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-[#f2b640] px-2.5 py-0.5 text-xs font-bold text-[#242a27]">
                      En curso
                    </span>
                  )}
                  {isNext && (
                    <span className="text-sm font-bold text-[#785500]">
                      Siguiente
                    </span>
                  )}
                </div>
              </div>
              {isDone && (
                <span className="flex shrink-0 items-center gap-2 text-lg font-bold text-[#20615b] sm:text-xl">
                  <span aria-hidden="true" className="text-2xl">
                    ✓
                  </span>
                  Hecho
                </span>
              )}
              {isCurrent && (
                <button
                  aria-label={`Terminar ${activity.title}`}
                  aria-describedby={
                    isAfternoonLocked ? "afternoon-locked-message" : undefined
                  }
                  className="flex min-h-14 shrink-0 items-center gap-3 rounded-xl bg-[#f2b640] px-5 text-lg font-bold text-[#242a27] transition hover:bg-[#e6a923] focus:outline-none focus:ring-4 focus:ring-[#f4dfa8] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isAfternoonLocked || ocupado}
                  onClick={() => void avanzar(activity, "terminar")}
                  type="button"
                >
                  Termino <span aria-hidden="true">✓</span>
                </button>
              )}
              {isNext && (
                <button
                  aria-label={`Empezar ${activity.title}`}
                  aria-describedby={
                    isAfternoonLocked ? "afternoon-locked-message" : undefined
                  }
                  className="flex min-h-14 shrink-0 items-center gap-3 rounded-xl bg-[#20615b] px-5 text-lg font-bold text-white transition hover:bg-[#184d48] focus:outline-none focus:ring-4 focus:ring-[#c8dedb] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isAfternoonLocked || ocupado}
                  onClick={() => void avanzar(activity, "empezar")}
                  type="button"
                >
                  Empiezo <span aria-hidden="true">→</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="flex shrink-0 justify-end pt-4">
        <div
          aria-label="Cambiar entre mañana y tarde"
          className="flex rounded-full bg-[#e9e3d6] p-1.5"
          role="group"
        >
          <button
            aria-pressed={period === "morning"}
            className={`flex min-h-14 min-w-40 items-center justify-center gap-3 rounded-full px-5 text-lg font-bold transition focus:outline-none focus:ring-4 focus:ring-[#c8dedb] ${
              period === "morning"
                ? "bg-[#20615b] text-white"
                : "text-[#343b38] hover:bg-[#ddd6c9]"
            }`}
            onClick={() => setPeriod("morning")}
            type="button"
          >
            <span aria-hidden="true" className="text-2xl">
              ☀
            </span>
            Ver la mañana
          </button>
          <button
            aria-pressed={period === "afternoon"}
            className={`flex min-h-14 min-w-40 items-center justify-center gap-3 rounded-full px-5 text-lg font-bold transition focus:outline-none focus:ring-4 focus:ring-[#c8dedb] ${
              period === "afternoon"
                ? "bg-[#20615b] text-white"
                : "text-[#343b38] hover:bg-[#ddd6c9]"
            }`}
            onClick={() => setPeriod("afternoon")}
            type="button"
          >
            <span aria-hidden="true" className="text-2xl">
              ☾
            </span>
            Ver la tarde
          </button>
        </div>
      </footer>
      {celebration && (
        <CelebrationOverlay
          completionText={celebration.completionText}
          next={celebration.next}
          onStartNext={() => {
            if (!celebration.next) return;
            setPeriod(
              celebration.next.startTime < "14:00" ? "morning" : "afternoon",
            );
            void avanzar(celebration.next, "empezar");
            setCelebration(null);
          }}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </div>
  );
}
