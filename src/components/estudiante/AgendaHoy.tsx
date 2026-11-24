"use client";

import { useState } from "react";

type ActivityStatus = "pending" | "in_progress" | "completed";

type Activity = {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  pictogram: string;
  status: ActivityStatus;
};

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "desayuno",
    startTime: "09:00",
    endTime: "09:30",
    title: "Desayuno",
    pictogram: "🥣",
    status: "completed",
  },
  {
    id: "mochila",
    startTime: "10:00",
    endTime: "10:20",
    title: "Preparar la mochila",
    pictogram: "🎒",
    status: "completed",
  },
  {
    id: "taller-cocina",
    startTime: "11:30",
    endTime: "12:30",
    title: "Taller de cocina",
    pictogram: "🍳",
    status: "in_progress",
  },
  {
    id: "merienda",
    startTime: "16:00",
    endTime: "16:15",
    title: "Merienda",
    pictogram: "🍎",
    status: "pending",
  },
  {
    id: "recoger-aula",
    startTime: "17:00",
    endTime: "17:15",
    title: "Recoger el aula",
    pictogram: "🧹",
    status: "pending",
  },
];

const DAY_PARTS = [
  { title: "Mañana", startsBefore: "14:00" },
  { title: "Tarde", startsBefore: null },
] as const;

export default function AgendaHoy() {
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const orderedActivities = [...activities].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
  const nextActivityId = orderedActivities.find(
    (activity) => activity.status === "pending",
  )?.id;

  function startActivity(id: string) {
    setActivities((current) =>
      current.map((activity) =>
        activity.id === id && activity.status === "pending"
          ? { ...activity, status: "in_progress" }
          : activity,
      ),
    );
  }

  function completeActivity(id: string) {
    setActivities((current) =>
      current.map((activity) =>
        activity.id === id && activity.status === "in_progress"
          ? { ...activity, status: "completed" }
          : activity,
      ),
    );
  }

  return (
    <div className="space-y-8">
      {DAY_PARTS.map(({ title, startsBefore }) => {
        const partActivities = orderedActivities.filter((activity) =>
          startsBefore
            ? activity.startTime < startsBefore
            : activity.startTime >= "14:00",
        );

        return (
          <section aria-labelledby={`schedule-${title}`} key={title}>
            <h2
              className="mb-4 text-2xl font-bold text-[#242a27]"
              id={`schedule-${title}`}
            >
              {title}
            </h2>
            <ul className="space-y-3">
              {partActivities.map((activity) => {
                const isCurrent = activity.status === "in_progress";
                const isNext =
                  activity.status === "pending" &&
                  activity.id === nextActivityId;
                const isDone = activity.status === "completed";

                return (
                  <li
                    className={`flex min-h-24 flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-6 sm:px-6 ${
                      isCurrent
                        ? "border-[#20615b]"
                        : isNext
                          ? "border-[#20615b]/50"
                          : "border-[#e4e0d7]"
                    }`}
                    key={activity.id}
                  >
                    <span className="w-24 shrink-0 text-lg font-bold tabular-nums text-[#4c5752] sm:text-xl">
                      {activity.startTime}–{activity.endTime}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f4f0e7] text-3xl sm:h-16 sm:w-16"
                    >
                      {activity.pictogram}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold text-[#242a27] sm:text-xl">
                        {activity.title}
                      </p>
                      {(isCurrent || isNext || isDone) && (
                        <p
                          aria-live="polite"
                          className={`mt-1 text-sm font-bold ${
                            isDone ? "text-[#20615b]" : "text-[#785500]"
                          }`}
                        >
                          {isCurrent ? "Ahora" : isNext ? "Siguiente" : "Hecho"}
                        </p>
                      )}
                    </div>
                    {isCurrent && (
                      <button
                        aria-label={`Terminar ${activity.title}`}
                        className="min-h-12 shrink-0 rounded-xl bg-[#e6a923] px-6 font-bold text-[#272a28] transition hover:bg-[#d99b12] focus:outline-none focus:ring-4 focus:ring-[#f4dfa8]"
                        onClick={() => completeActivity(activity.id)}
                        type="button"
                      >
                        Termino
                      </button>
                    )}
                    {isNext && (
                      <button
                        aria-label={`Empezar ${activity.title}`}
                        className="min-h-12 shrink-0 rounded-xl bg-[#20615b] px-6 font-bold text-white transition hover:bg-[#184d48] focus:outline-none focus:ring-4 focus:ring-[#c8dedb]"
                        onClick={() => startActivity(activity.id)}
                        type="button"
                      >
                        Empiezo
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
