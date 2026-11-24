import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// Datos de demostración (dev y previews). Nunca pública: solo se ejecuta por
// CLI (`npx convex run seed:seedDemoData`) o automáticamente en cada preview
// de Vercel vía `--preview-run seed:seedDemoData`. Cada preview nace con su
// propio deployment de Convex vacío, así que esta función crea desde cero
// una tutora, una clase y varios estudiantes con los que poder iniciar
// sesión para revisar el panel.
//
// Pendiente (GM-14): actividades, pasos y estados emocionales de ejemplo se
// añaden aparte cuando esté el contenido real; esta función ya deja creadas
// las cuentas, la clase y la configuración visual por defecto de cada
// estudiante para que eso se pueda enchufar sin tocar lo de aquí.

const ANIO_CURSO = "2026-2027";

const TUTOR = {
  email: "marta.ruiz@centro-demo.es",
  password: "Demo1234!",
  nombre: "Marta",
  apellidos: "Ruiz",
};

const ESTUDIANTES = [
  { usuario: "lucia", password: "Demo1234!", nombre: "Lucía", apellidos: "Martín" },
  { usuario: "pablo", password: "Demo1234!", nombre: "Pablo", apellidos: "García" },
  { usuario: "ana", password: "Demo1234!", nombre: "Ana", apellidos: "Fernández" },
  { usuario: "javier", password: "Demo1234!", nombre: "Javier", apellidos: "López" },
];

// Catálogo fijo de 6 emociones (desajuste #6 del esquema). La imagen es un
// placeholder hasta que se cargue el pictograma ARASAAC real de cada una.
const EMOCIONES = [
  "feliz",
  "triste",
  "enfadado",
  "sorprendido",
  "asustado",
  "tranquilo",
];

export const seedDemoData = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { user: tutorUser } = await createAccount(ctx, {
      provider: "password",
      account: { id: TUTOR.email, secret: TUTOR.password },
      profile: {
        email: TUTOR.email,
        name: TUTOR.nombre,
        apellidos: TUTOR.apellidos,
        roles: ["tutor"],
        estadoCuenta: "activo",
      },
    });

    const estudianteIds: Id<"estudiantes">[] = [];
    for (const est of ESTUDIANTES) {
      const { user: estUser } = await createAccount(ctx, {
        provider: "password",
        account: { id: est.usuario, secret: est.password },
        profile: {
          name: est.nombre,
          apellidos: est.apellidos,
          roles: ["estudiante"],
          estadoCuenta: "activo",
        },
      });
      const estudianteId: Id<"estudiantes"> = await ctx.runMutation(
        internal.seed.insertEstudiante,
        { userId: estUser._id },
      );
      estudianteIds.push(estudianteId);
    }

    await ctx.runMutation(internal.seed.insertClaseYRelaciones, {
      tutorUserId: tutorUser._id,
      estudianteIds,
    });

    return null;
  },
});

export const insertEstudiante = internalMutation({
  args: { userId: v.id("users") },
  returns: v.id("estudiantes"),
  handler: async (ctx, args) => {
    const estudianteId = await ctx.db.insert("estudiantes", {
      userId: args.userId,
    });
    await ctx.db.insert("configuracionesVisuales", {
      estudianteId,
      paletaColor: "crema",
      escalaLetra: "normal",
      mostrarPictograma: true,
      mostrarTexto: true,
      mostrarVideo: false,
      mostrarAudio: false,
      rangoEmociones: "basico",
      permiteVerSemana: true,
      permiteCambiarColores: false,
      permiteDecirComoSeSiente: true,
      permiteCrearTareas: false,
    });
    return estudianteId;
  },
});

export const insertClaseYRelaciones = internalMutation({
  args: {
    tutorUserId: v.id("users"),
    estudianteIds: v.array(v.id("estudiantes")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tutorId = await ctx.db.insert("tutores", {
      userId: args.tutorUserId,
      esFamiliar: false,
    });

    const claseId = await ctx.db.insert("clases", { nombre: "Aula 3" });

    await ctx.db.insert("supervisiones", {
      tutorId,
      claseId,
      anioCursoAcademico: ANIO_CURSO,
    });

    for (const estudianteId of args.estudianteIds) {
      await ctx.db.insert("matriculas", {
        estudianteId,
        claseId,
        anioCursoAcademico: ANIO_CURSO,
      });
    }

    for (let i = 0; i < EMOCIONES.length; i++) {
      const imagenId = await ctx.db.insert("imagenes", {
        ubicacionArchivo: `/placeholder/emociones/${EMOCIONES[i]}.svg`,
        textoAlternativo: EMOCIONES[i],
      });
      await ctx.db.insert("catalogoEmociones", {
        nombre: EMOCIONES[i],
        orden: i,
        imagenId,
      });
    }

    return null;
  },
});
