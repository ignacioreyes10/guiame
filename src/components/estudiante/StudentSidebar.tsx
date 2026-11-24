"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/estudiante/hoy", label: "Hoy", icon: "sun" },
  { href: "/estudiante/semana", label: "Mi semana", icon: "calendar" },
  {
    href: "/estudiante/animo",
    label: "Mi estado de ánimo",
    icon: "smile",
  },
  { href: "/estudiante/colores", label: "Mis colores", icon: "palette" },
] as const;

type IconName = (typeof navigation)[number]["icon"] | "calendarCheck";

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {name === "sun" && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </>
      )}
      {name === "calendar" && (
        <>
          <rect height="17" rx="2.5" width="18" x="3" y="5" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </>
      )}
      {name === "smile" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
        </>
      )}
      {name === "palette" && (
        <>
          <path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.4-3.4 1.8 1.8 0 0 1 1.3-3.1H18a3 3 0 0 0 3-3c0-4.7-4-8.5-9-8.5Z" />
          <path d="M7.5 11h.01M10 7.5h.01M14 7.5h.01M17 10h.01" />
        </>
      )}
      {name === "calendarCheck" && (
        <>
          <rect height="17" rx="2.5" width="18" x="3" y="5" />
          <path d="M16 3v4M8 3v4M3 10h18M8 14l2.5 2.5L16 11" />
        </>
      )}
    </svg>
  );
}

export default function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 bg-[#f7f3eb] p-4 sm:min-h-screen sm:w-56 sm:border-r sm:border-[#e2ddd2] sm:p-5">
      <Link
        aria-label="GuiaMe, ir a Hoy"
        className="mb-4 flex min-h-12 items-center gap-3 px-2 sm:mb-8"
        href="/estudiante/hoy"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#20615b] text-white">
          <Icon name="calendarCheck" />
        </span>
        <span className="text-2xl font-bold tracking-tight text-[#20615b]">
          GuiaMe
        </span>
      </Link>

      <nav aria-label="Navegación del estudiante">
        <ul className="flex gap-2 overflow-x-auto sm:flex-col">
          {navigation.map(({ href, label, icon }) => {
            const active = pathname === href;

            return (
              <li className="shrink-0 sm:shrink" key={href}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[#20615b] text-white"
                      : "text-[#343b38] hover:bg-[#e9e4da]"
                  }`}
                  href={href}
                >
                  <Icon name={icon} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-8 hidden rounded-2xl border border-dashed border-[#b8b2a7] px-4 py-5 text-center text-sm text-[#706e68] sm:block">
        Logo del centro
      </div>
    </aside>
  );
}
