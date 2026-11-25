"use client";

import { useState } from "react";
import CelebrationOverlay from "@/components/estudiante/CelebrationOverlay";

type ActivityStatus = "pending" | "in_progress" | "completed";
type Period = "morning" | "afternoon";

type Activity = {
  id: string;
  startTime: string;
  title: string;
  completionText: string;
  pictogram: string;
  status: ActivityStatus;
};

type Celebration = {
  completionText: string;
  next: Activity | null;
};

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "entrar-clase",
    startTime: "09:00",
    title: "Entrar a clase",
    completionText: "de entrar a clase",
    pictogram: "📋",
    status: "pending",
  },
  {
    id: "descanso",
    startTime: "11:00",
    title: "Descanso",
    completionText: "el descanso",
    pictogram: "🛋️",
    status: "pending",
  },
  {
    id: "taller-cocina",
    startTime: "11:30",
    title: "Taller de cocina",
    completionText: "el taller de cocina",
    pictogram: "🍲",
    status: "pending",
  },
  {
    id: "comida",
    startTime: "14:30",
    title: "Comida",
    completionText: "la comida",
    pictogram: "🍽️",
    status: "pending",
  },
  {
    id: "merienda",
    startTime: "16:00",
    title: "Merienda",
    completionText: "la merienda",
    pictogram: "🍎",
    status: "pending",
  },
  {
    id: "recoger-aula",
    startTime: "17:00",
    title: "Recoger el aula",
    completionText: "de recoger el aula",
    pictogram: "🧹",
    status: "pending",
  },
];

function areMorningActivitiesComplete(activities: Activity[]) {
  const morningActivities = activities.filter(
    (activity) => activity.startTime < "14:00",
  );
  return (
    morningActivities.length > 0 &&
    morningActivities.every((activity) => activity.status === "completed")
  );
}

export default function AgendaHoy() {
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [period, setPeriod] = useState<Period>("morning");
  const [celebration, setCelebration] = useState<Celebration | null>(null);
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

  function startActivity(id: string) {
    setActivities((current) => {
      const currentActivity = current.find(
        (activity) => activity.status === "in_progress",
      );
      const nextActivity = [...current]
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .find((activity) => activity.status === "pending");

      if (
        currentActivity ||
        nextActivity?.id !== id ||
        (nextActivity.startTime >= "14:00" &&
          !areMorningActivitiesComplete(current))
      ) {
        return current;
      }

      return current.map((activity) =>
        activity.id === id ? { ...activity, status: "in_progress" } : activity,
      );
    });
  }

  function completeActivity(id: string) {
    const activityIndex = orderedActivities.findIndex(
      (activity) => activity.id === id,
    );
    const activity = orderedActivities[activityIndex];
    const nextUncompletedActivity = orderedActivities.find(
      (candidate) => candidate.status !== "completed",
    );

    if (
      !activity ||
      nextUncompletedActivity?.id !== id ||
      activity.status !== "in_progress" ||
      (activity.startTime >= "14:00" && !morningActivitiesComplete)
    ) {
      return;
    }

    const nextActivity =
      orderedActivities
        .slice(activityIndex + 1)
        .find((candidate) => candidate.status === "pending") ?? null;

    setActivities((current) =>
      current.map((candidate) =>
        candidate.id === id
          ? { ...candidate, status: "completed" }
          : candidate,
      ),
    );
    setCelebration({
      completionText: activity.completionText,
      next: nextActivity
        ? nextActivity
        : null,
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden pt-2"
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
                {activity.pictogram}
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
                  disabled={isAfternoonLocked}
                  onClick={() => completeActivity(activity.id)}
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
                  disabled={isAfternoonLocked}
                  onClick={() => startActivity(activity.id)}
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
            startActivity(celebration.next.id);
            setCelebration(null);
          }}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </div>
  );
}
