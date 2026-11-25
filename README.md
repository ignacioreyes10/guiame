# GuiaMe

Agenda digital accesible y personalizable para el alumnado del CEE Fundación
Purísima Concepción (Granada). Proyecto de la asignatura Dirección y Gestión
de Proyectos, Universidad de Granada, curso 2026-2027.

## Estado actual

La rama principal contiene el acceso con Convex Auth y el esquema actualizado.
El Sprint 2 desarrolla la agenda del estudiante, la creación y asignación de
actividades, el seguimiento del tutor y la configuración visual en ramas de
revisión. El estado de cada función depende de la rama que se esté probando.

La Propuesta Técnica y el Manual de Coordinación se mantienen en la entrega
académica del equipo.

## Arquitectura

- **Next.js 16 y React 19** (App Router) para la aplicación web, con una única base de
  código para la vista del estudiante y el panel de tutores/administración.
- **Convex** como servidor y base de datos: el esquema y las funciones viven
  en `convex/`, se escriben en TypeScript y se despliegan con el mismo
  comando que empuja a producción.
- **Convex Auth** (proveedor `Password`) para el inicio y cierre de sesión.
  El identificador de acceso acepta tanto un email (tutores/administración)
  como un nombre de usuario simple (estudiantes, según el glosario de la
  Propuesta Técnica) — no se valida formato, solo se compara como texto.
- **Tailwind CSS v4** para los estilos.

Detalle de las tecnologías y su justificación: Propuesta Técnica, apartado
5.c.

### Modelo de datos

El esquema (`convex/schema.ts`) implementa el modelo entidad-relación de la
Propuesta Técnica (apartado 4.f):

| Tabla | Qué guarda |
| --- | --- |
| `users` | Cuenta base (Convex Auth) + `apellidos`, `roles`, `estadoCuenta` |
| `tutores` / `estudiantes` | Perfil específico de cada rol |
| `clases` | Grupos de estudiantes (no un espacio físico) |
| `supervisiones` | Qué tutor supervisa qué clase, por curso académico |
| `matriculas` | Qué estudiante está matriculado en qué clase, por curso |
| `vinculosDirectos` | Tutores (p. ej. familiares) vinculados a un estudiante sin pasar por una clase |
| `imagenes` | Pictogramas e imágenes (origen: ARASAAC) |
| `actividades` / `pasos` | Actividades y sus pasos ordenados |
| `realizaciones` | Una actividad asignada a un estudiante: horario, seguimiento y calificación |
| `estadosEmocionales` | Registro emocional diario por estudiante |
| `configuracionesVisuales` | Paleta, tamaño de letra y apoyo visual por estudiante |

La gestión administrativa de clases (RF7.1–RF7.3) requiere pantallas y
operaciones de creación, matrícula y asignación de tutores. Las tablas
anteriores son la base de datos para esas funciones.

### Directorios

| Ruta | Contenido |
| --- | --- |
| `src/app/` | Rutas, layouts y estilos globales de Next.js |
| `src/components/` | Componentes compartidos y proveedor de Convex |
| `convex/` | Esquema, autenticación y funciones de servidor |
| `convex/_generated/` | Tipos y referencias de API generados por Convex |
| `.github/workflows/` | Automatización del repositorio |

## Instalación y configuración

Requiere Node.js y una cuenta de Convex con acceso al team `guiame-team`
(pedirle acceso a quien administre el proyecto).

```sh
npm ci
npx convex dev --configure existing --team guiame-team --project guiame
```

El segundo comando enlaza tu CLI al proyecto `guiame` del team
`guiame-team` y genera `.env.local` (no se sube al repositorio) con las
variables de conexión a tu propio deployment de desarrollo. Comprueba
`CONVEX_DEPLOYMENT` para la CLI y `NEXT_PUBLIC_CONVEX_URL` para el cliente
web. Convex proporciona `CONVEX_SITE_URL`, que se usa como emisor de Convex
Auth. Los secretos de autenticación se configuran en el deployment. Consulta
a quien administra el proyecto para habilitar el proveedor en un entorno nuevo.

## Modo de ejecución

```sh
npm run dev
```

Arranca en paralelo `convex dev` (sincroniza el esquema y las funciones) y
`next dev` (la web en `http://localhost:3000`).

Otros comandos útiles:

```sh
npm run typecheck   # tipos de Convex y Next.js
npm run lint        # typecheck + eslint
git diff --check    # espacios sobrantes y marcadores de conflicto
npm run build       # build de producción de Next.js
npx convex dashboard # abre el dashboard de Convex
```

### Cuentas de acceso

No hay alta pública (RF6.1): las cuentas las crea el administrador (RF6.5,
iteración 3). Mientras tanto, para crear una cuenta de prueba en desarrollo:

```sh
npx convex run accounts:createTutor \
  '{"email":"usuario_o_email","password":"...","nombre":"...","apellidos":"..."}'
```

## Despliegue

- **Vercel**: cada push a `main` dispara un build de producción. El comando
  de build (`vercel.json`) es `npx convex deploy --cmd 'npm run build'`, que
  primero sincroniza `convex/` con el deployment de producción de Convex y
  después compila Next.js ya apuntando a esa URL.
- Un GitHub Action (`.github/workflows/pin-production-alias.yml`) repuntea
  automáticamente el alias **https://guiame-dgp.vercel.app** al deploy que
  acaba de quedar listo.

## Ramas y revisión

Crea una rama por tarea con su identificador, por ejemplo `GM-15-listar-estudiantes`.
El Pull Request explica los cambios, las pruebas y sus dependencias. Si depende
de un PR abierto, usa la rama de ese PR como base hasta que se integre. Solicita
revisión a Pablo y, para los cambios de backend, a Suliman. La integración en
`main` se realiza desde GitHub después de la revisión.
