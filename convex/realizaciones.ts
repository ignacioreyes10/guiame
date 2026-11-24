import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  requireTutorOrAdmin,
  requireVeAlEstudianteOrAdmin,
  requireVerAgendaEstudiante,
} from "./lib/auth";

// RF2.5: asignar una actividad a uno o varios estudiantes, cada uno con su
// propio horario previsto y, si hace falta, una duración distinta de la
// común. No valida solapamientos (RF2.6): eso es de otro hito (HT6).
export const asignar = mutation({
  args: {
    actividadId: v.id("actividades"),
    asignaciones: v.array(
      v.object({
        estudianteId: v.id("estudiantes"),
        fInicioProgramada: v.number(),
        fFinProgramada: v.number(),
        duracionEstudiante: v.optional(v.number()),
      }),
    ),
  },
  returns: v.array(v.id("realizaciones")),
  handler: async (ctx, args) => {
    const current = await requireTutorOrAdmin(ctx);

    const actividad = await ctx.db.get("actividades", args.actividadId);
    if (actividad === null) {
      throw new Error("La actividad no existe");
    }
    if (actividad.creadoPor !== current.userId && !current.esAdministrador) {
      throw new Error(
        "No autorizado: solo quien creó la actividad o el administrador puede asignarla",
      );
    }

    if (args.asignaciones.length === 0) {
      throw new Error("Debes indicar al menos un estudiante");
    }

    const ahora = Date.now();
    const ids: Array<Id<"realizaciones">> = [];
    for (const asignacion of args.asignaciones) {
      if (
        !Number.isFinite(asignacion.fInicioProgramada) ||
        !Number.isFinite(asignacion.fFinProgramada)
      ) {
        throw new Error("La fecha y hora de inicio y fin deben ser válidas");
      }
      if (asignacion.fInicioProgramada < ahora) {
        throw new Error(
          "No se puede asignar una actividad con una fecha anterior a la actual",
        );
      }
      if (asignacion.fFinProgramada <= asignacion.fInicioProgramada) {
        throw new Error(
          "La hora de fin debe ser posterior a la hora de inicio",
        );
      }
      if (
        asignacion.duracionEstudiante !== undefined &&
        (!Number.isFinite(asignacion.duracionEstudiante) ||
          asignacion.duracionEstudiante <= 0)
      ) {
        throw new Error("La duración del estudiante debe ser un número positivo");
      }

      await requireVeAlEstudianteOrAdmin(ctx, asignacion.estudianteId);

      const realizacionId = await ctx.db.insert("realizaciones", {
        estudianteId: asignacion.estudianteId,
        actividadId: args.actividadId,
        asignadoPor: current.tutor._id,
        fInicioProgramada: asignacion.fInicioProgramada,
        fFinProgramada: asignacion.fFinProgramada,
        duracionEstudiante: asignacion.duracionEstudiante,
        cancelada: false,
      });
      ids.push(realizacionId);
    }

    return ids;
  },
});

// RF2.3: cancelar una actividad para uno o varios estudiantes. Marca las
// realizaciones correspondientes, no la actividad entera, para que siga
// visible para otros estudiantes a los que también se asignó.
export const cancelar = mutation({
  args: {
    actividadId: v.id("actividades"),
    estudianteIds: v.array(v.id("estudiantes")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const current = await requireTutorOrAdmin(ctx);

    const actividad = await ctx.db.get("actividades", args.actividadId);
    if (actividad === null) {
      throw new Error("La actividad no existe");
    }
    if (actividad.creadoPor !== current.userId && !current.esAdministrador) {
      throw new Error(
        "No autorizado: solo quien creó la actividad o el administrador puede cancelarla",
      );
    }

    if (args.estudianteIds.length === 0) {
      throw new Error("Debes indicar al menos un estudiante");
    }

    const realizacionesDeActividad = await ctx.db
      .query("realizaciones")
      .withIndex("by_actividad", (q) => q.eq("actividadId", args.actividadId))
      .collect();

    for (const estudianteId of args.estudianteIds) {
      await requireVeAlEstudianteOrAdmin(ctx, estudianteId);

      const coincidencias = realizacionesDeActividad.filter(
        (r) => r.estudianteId === estudianteId && !r.cancelada,
      );
      for (const realizacion of coincidencias) {
        await ctx.db.patch("realizaciones", realizacion._id, {
          cancelada: true,
        });
      }
    }

    return null;
  },
});

const entradaAgenda = v.object({
  realizacionId: v.id("realizaciones"),
  actividadId: v.id("actividades"),
  titulo: v.string(),
  tipoActividad: v.union(
    v.literal("academica"),
    v.literal("profesional"),
    v.literal("familiar"),
    v.literal("del_estudiante"),
  ),
  imagenId: v.id("imagenes"),
  fInicioProgramada: v.number(),
  fFinProgramada: v.number(),
  duracionEstudiante: v.optional(v.number()),
});

// RF1.1 / RF1.2: agenda de un estudiante entre dos instantes (día o
// semana, según lo que calcule el cliente a partir de la hora local). Ya
// viene ordenada ascendentemente por el índice usado.
export const listarAgenda = query({
  args: {
    estudianteId: v.id("estudiantes"),
    inicio: v.number(),
    fin: v.number(),
  },
  returns: v.array(entradaAgenda),
  handler: async (ctx, args) => {
    await requireVerAgendaEstudiante(ctx, args.estudianteId);

    if (!Number.isFinite(args.inicio) || !Number.isFinite(args.fin)) {
      throw new Error("El rango de fechas no es válido");
    }
    if (args.fin <= args.inicio) {
      throw new Error("El fin del rango debe ser posterior al inicio");
    }

    const realizaciones = await ctx.db
      .query("realizaciones")
      .withIndex("by_estudiante_and_inicio", (q) =>
        q
          .eq("estudianteId", args.estudianteId)
          .gte("fInicioProgramada", args.inicio)
          .lt("fInicioProgramada", args.fin),
      )
      .collect();

    const resultado = [];
    for (const realizacion of realizaciones) {
      if (realizacion.cancelada) continue;
      const actividad = await ctx.db.get("actividades", realizacion.actividadId);
      if (actividad === null || actividad.cancelada) continue;
      resultado.push({
        realizacionId: realizacion._id,
        actividadId: actividad._id,
        titulo: actividad.titulo,
        tipoActividad: actividad.tipoActividad,
        imagenId: actividad.imagenId,
        fInicioProgramada: realizacion.fInicioProgramada,
        fFinProgramada: realizacion.fFinProgramada,
        duracionEstudiante: realizacion.duracionEstudiante,
      });
    }
    return resultado;
  },
});

// RF1.3: detalle de una actividad asignada (una realización concreta),
// con sus pasos en orden.
export const obtenerDetalle = query({
  args: { realizacionId: v.id("realizaciones") },
  returns: v.union(
    v.null(),
    v.object({
      realizacionId: v.id("realizaciones"),
      titulo: v.string(),
      descripcion: v.optional(v.string()),
      imagenId: v.id("imagenes"),
      fInicioProgramada: v.number(),
      fFinProgramada: v.number(),
      pasos: v.array(
        v.object({
          orden: v.number(),
          texto: v.string(),
          tipoMedio: v.union(
            v.literal("pictograma"),
            v.literal("video"),
            v.literal("audio"),
          ),
          imagenId: v.optional(v.id("imagenes")),
          archivoId: v.optional(v.id("_storage")),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const realizacion = await ctx.db.get("realizaciones", args.realizacionId);
    if (realizacion === null) return null;

    await requireVerAgendaEstudiante(ctx, realizacion.estudianteId);

    const actividad = await ctx.db.get("actividades", realizacion.actividadId);
    if (actividad === null) return null;

    const pasos = await ctx.db
      .query("pasos")
      .withIndex("by_actividad_and_orden", (q) =>
        q.eq("actividadId", actividad._id),
      )
      .collect();

    return {
      realizacionId: realizacion._id,
      titulo: actividad.titulo,
      descripcion: actividad.descripcion,
      imagenId: actividad.imagenId,
      fInicioProgramada: realizacion.fInicioProgramada,
      fFinProgramada: realizacion.fFinProgramada,
      pasos: pasos.map((paso) => ({
        orden: paso.orden,
        texto: paso.texto,
        tipoMedio: paso.tipoMedio,
        imagenId: paso.imagenId,
        archivoId: paso.archivoId,
      })),
    };
  },
});
