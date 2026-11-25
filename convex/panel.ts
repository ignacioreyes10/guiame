import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireTutorOrAdmin } from "./lib/auth";

const fechaMadrid = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const maxEstudiantes = 60;
const maxActividadesDiarias = 48;
const maxRelaciones = 200;

function comprobarLimite(registros: unknown[], limite: number) {
  if (registros.length > limite) {
    throw new Error("El panel supera el límite de registros de esta consulta");
  }
}

export const misEstudiantes = query({
  args: { inicio: v.number(), fin: v.number(), ahora: v.number() },
  returns: v.array(v.object({
    id: v.id("estudiantes"),
    nombre: v.string(),
    inicialApellido: v.string(),
    clase: v.string(),
    actividadActual: v.union(v.null(), v.object({
      titulo: v.string(),
      momento: v.union(v.literal("ahora"), v.literal("siguiente")),
    })),
    hechas: v.number(),
    total: v.number(),
    retraso: v.union(v.null(), v.object({
      actividad: v.string(),
      minutos: v.number(),
    })),
  })),
  handler: async (ctx, { inicio, fin, ahora }) => {
    const current = await requireTutorOrAdmin(ctx);
    const cuenta = await ctx.db.get("users", current.userId);
    if (!cuenta || cuenta.estadoCuenta === "inactivo") {
      throw new Error("No autorizado: cuenta inactiva");
    }

    if (![inicio, fin, ahora].every(t => Number.isSafeInteger(t) && Math.abs(t) < 8.64e15)
      || ahora < inicio || ahora >= fin || fin - inicio > 25 * 3600000) {
      throw new Error("Se requiere el rango del día actual en Madrid");
    }
    const fecha = fechaMadrid.format(inicio);
    if (fechaMadrid.format(inicio - 1) === fecha ||
        fechaMadrid.format(fin - 1) !== fecha ||
        fechaMadrid.format(fin) === fecha) {
      throw new Error("Se requiere el rango del día actual en Madrid");
    }
    const [anio, mes] = fecha.split("-").map(Number);
    const inicioCurso = mes >= 9 ? anio : anio - 1;
    const curso = `${inicioCurso}-${inicioCurso + 1}`;

    const estudiantes = new Map<Id<"estudiantes">, string>();
    const [supervisiones, vinculos] = await Promise.all([
      ctx.db.query("supervisiones").withIndex("by_tutor", q => q.eq("tutorId", current.tutor._id))
        .take(maxRelaciones + 1),
      ctx.db.query("vinculosDirectos").withIndex("by_tutor", q => q.eq("tutorId", current.tutor._id))
        .take(maxEstudiantes + 1),
    ]);
    comprobarLimite(supervisiones, maxRelaciones);
    comprobarLimite(vinculos, maxEstudiantes);

    const clases = new Set(supervisiones
      .filter(supervision => supervision.anioCursoAcademico === curso)
      .map(supervision => supervision.claseId));

    for (const claseId of clases) {
      const clase = await ctx.db.get("clases", claseId);
      if (!clase) continue;
      const matriculas = await ctx.db.query("matriculas")
        .withIndex("by_clase_and_anio", q => q.eq("claseId", claseId).eq("anioCursoAcademico", curso))
        .take(maxEstudiantes + 1);
      comprobarLimite(matriculas, maxEstudiantes);
      for (const matricula of matriculas) {
        const anterior = estudiantes.get(matricula.estudianteId);
        if (anterior === undefined || clase.nombre.localeCompare(anterior, "es") < 0) {
          estudiantes.set(matricula.estudianteId, clase.nombre);
        }
      }
      comprobarLimite([...estudiantes.keys()], maxEstudiantes);
    }

    for (const vinculo of vinculos) {
      if (!estudiantes.has(vinculo.estudianteId)) {
        estudiantes.set(vinculo.estudianteId, "Sin clase asignada");
      }
    }
    comprobarLimite([...estudiantes.keys()], maxEstudiantes);

    const resultado = [];
    for (const [id, clase] of estudiantes) {
      const estudiante = await ctx.db.get("estudiantes", id);
      if (!estudiante) continue;
      const usuario = await ctx.db.get("users", estudiante.userId);
      if (!usuario || usuario.estadoCuenta === "inactivo") continue;

      const realizaciones = await ctx.db.query("realizaciones")
        .withIndex("by_estudiante_and_inicio", q => q.eq("estudianteId", id)
          .gte("fInicioProgramada", inicio).lt("fInicioProgramada", fin))
        .take(maxActividadesDiarias + 1);
      comprobarLimite(realizaciones, maxActividadesDiarias);

      let hechas = 0;
      let total = 0;
      let enCurso: string | null = null;
      let siguiente: string | null = null;
      let retraso: { actividad: string; minutos: number } | null = null;

      for (const realizacion of realizaciones) {
        if (realizacion.cancelada) continue;
        const actividad = await ctx.db.get("actividades", realizacion.actividadId);
        if (!actividad || actividad.cancelada) continue;
        total++;
        if (realizacion.hFinReal !== undefined) {
          hechas++;
          continue;
        }
        if (realizacion.hInicioReal !== undefined) {
          enCurso ??= actividad.titulo;
        } else if (realizacion.fInicioProgramada > ahora) {
          siguiente ??= actividad.titulo;
        } else if (ahora < realizacion.fFinProgramada) {
          enCurso ??= actividad.titulo;
        }

        const limite = realizacion.hInicioReal === undefined
          ? realizacion.fInicioProgramada : realizacion.fFinProgramada;
        if (limite < ahora) {
          const minutos = Math.ceil((ahora - limite) / 60000);
          if (retraso === null || minutos > retraso.minutos) {
            retraso = { actividad: actividad.titulo, minutos };
          }
        }
      }

      const actividadActual = enCurso !== null
        ? { titulo: enCurso, momento: "ahora" as const }
        : siguiente !== null ? { titulo: siguiente, momento: "siguiente" as const } : null;

      resultado.push({
        id,
        nombre: usuario.name ?? "Sin nombre",
        inicialApellido: usuario.apellidos?.trim().charAt(0).toLocaleUpperCase("es") ?? "",
        clase,
        actividadActual,
        hechas,
        total,
        retraso,
      });
    }

    return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  },
});
