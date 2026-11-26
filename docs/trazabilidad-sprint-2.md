# Trazabilidad del Sprint 2

Corte del 26 de noviembre de 2026. Fuente de requisitos: Propuesta Técnica de
la Iteración 1, §4.c y §5.d, y plan de Yusuf del 22 de noviembre. El estado
indica el alcance funcional completo. Comprobar tipos o ejecutar un handler
con datos simulados aporta evidencia parcial. La aceptación del centro
queda para la revisión del sprint. Los PR #13 y #15 aportan backend a
`main`. El PR #14 se integró en `GM-04-permisos`. Los PR propios de
GM-14, GM-15, GM-16 y GM-17 siguen en revisión.

| Requisito | Historia de usuario | Pantalla | Función backend | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- |
| RF1.1 | Alumno consulta su día | Hoy | `realizaciones.miAgenda` | En desarrollo | Backend en main. Hoy se conecta en la rama de GM-49 |
| RF1.2 | Alumno consulta su semana | Mi semana | `realizaciones.listarAgenda` | En desarrollo | PR #13 acepta rangos. Falta probar pantalla y permiso |
| RF1.3 | Alumno sigue los pasos | 3a–3c | `realizaciones.obtenerDetalle` | En desarrollo | PR #13 devuelve pasos |
| RF2.1 | Tutor crea una actividad | W4a | `actividades.crear` | En desarrollo | Backend en main. W4 conectado en la rama GM-15-16-panel-conectado |
| RF2.2 | Tutor modifica una actividad y su horario | W3 / W4 | `actividades.modificar`, `realizaciones.reprogramar` | En desarrollo | PR #15 integrado en main. Pendiente prueba del flujo en pantalla |
| RF2.3 | Tutor cancela una asignación | W3 | `realizaciones.cancelar` | En desarrollo | PR #13 cubre la mutación |
| RF2.4 | Tutor elige un pictograma | W4a | `actividades.crear`, catálogo `imagenes` | En desarrollo | GM-14 puebla el catálogo. W4 usa un catálogo de prueba |
| RF2.5 | Tutor asigna una actividad a alumnos | W4c | `realizaciones.asignar` | En desarrollo | Backend en main. W4 real en GM-15-16-panel-conectado, pendiente de validación |
| RF2.6 | Tutor recibe aviso de colisión horaria | W4c | `realizaciones.asignar` | En desarrollo | PR #13 valida intervalos. Pendiente de prueba con el asistente real |
| RF2.7 | Tutor prepara pasos comprensibles | W4b | `actividades.crear` | En desarrollo | PR #13 y pasos en el asistente de prueba |
| RF3.1 | Alumno pulsa Empiezo | Hoy | `realizaciones.empezar` | En desarrollo | PR #13 guarda la hora. Hoy lo consume en la rama de GM-49. Pendiente prueba real |
| RF3.2 | Alumno pulsa Termino | Hoy | `realizaciones.terminar` | En desarrollo | PR #13 exige inicio y guarda fin. Hoy lo consume en la rama de GM-49. Pendiente prueba real |
| RF3.3 | Alumno registra cómo se siente ese día | Mi estado de ánimo | Tabla `estadosEmocionales` | En desarrollo | Esquema y catálogo. Falta validar el registro diario |
| RF3.4 | Tutor consulta la emoción registrada | W3 | Tabla `estadosEmocionales` | En desarrollo | Sin consulta conectada a W3 |
| RF4.1 | Tutor elige la paleta | W5 / Hoy | `configuracionesVisuales.obtener/actualizar` | En desarrollo | PR #14. Pendiente de comprobar el cambio en la tablet |
| RF4.2 | Tutor ajusta el tamaño de letra | W5 / Hoy | `configuracionesVisuales.obtener/actualizar` | En desarrollo | PR #14 |
| RF4.3 | Tutor configura los formatos | W5 / Hoy | `configuracionesVisuales.obtener/actualizar` | En desarrollo | PR #14 guarda cuatro formatos y exige texto o pictograma |
| RF5.1 | Tutor consulta pendientes y retrasos | W2 / W3 | `panel.misEstudiantes`, `realizaciones.agendaDeEstudiante` | Implementado, pendiente de pruebas | GM-15/16 y `tests/panel.sh` en la rama de integración. Estados y retrasos comprobados con datos en memoria |
| RF5.2 | Tutor ve completadas y horas reales | W3 | `realizaciones.agendaDeEstudiante` | Implementado, pendiente de pruebas | GM-16 devuelve las horas y permite consultar días anteriores. La integración muestra la duración informada. Pendiente de validación en navegador con datos reales del entorno de desarrollo |
| RF5.3 | Tutor califica una realización | W3 | Campo de calificación en `realizaciones` | No iniciado | Esquema |
| RF6.1 | Usuario inicia sesión | Login | Convex Auth `signIn` | Implementado, pendiente de pruebas | `src/app/login/page.tsx`. Sin prueba propia de sesión |
| RF6.2 | Usuario accede solo a datos permitidos | Panel / Hoy | `convex/lib/auth.ts` | Implementado, pendiente de pruebas | PR #6 y #13. Pendiente prueba de sesiones reales |
| RF6.3 | Tutor consulta alumnos asignados | W2 | `panel.misEstudiantes` | Implementado, pendiente de pruebas | GM-15 y `tests/panel.sh`: tutor, alumno, deduplicación, matrícula y vínculo. Pendiente sesión de Marta en desarrollo |
| RF6.4 | Usuario cierra sesión | Panel / Hoy | Convex Auth `signOut` | Implementado, pendiente de pruebas | `src/components/SignOutButton.tsx`. Sin prueba propia de sesión |
| RF6.5 | Administrador gestiona cuentas | Administración | `accounts.createTutor` (CLI) | En desarrollo | Alta interna del tutor. Falta gestión administrativa completa |
| RF7.1 | Administrador crea una clase | Administración | Tabla `clases` | No iniciado | Esquema y seed. Sin flujo administrativo |
| RF7.2 | Administrador matricula al alumno | Administración | Tabla `matriculas` | No iniciado | Esquema y seed. Sin flujo administrativo |
| RF7.3 | Administrador asigna tutor a una clase | Administración | Tabla `supervisiones` | No iniciado | Esquema y seed. Sin flujo administrativo |
| GM-49, sin RF asignado | Alumno autorizado crea una tarea propia | Hoy | `tareasAlumno.crear`, `configuracionesVisuales.miConfiguracion` | Implementado, pendiente de aprobación y prueba real | 6 pruebas locales con datos en memoria. La rama de modelo propone `origen: "propia"` y espera revisión del equipo |

## Cambios propuestos para la siguiente Propuesta Técnica

- Mantener Supabase como experiencia previa y alternativa comparada (secciones
  2 y 5.c). En la Propuesta de Iteración 1 consultada, la arquitectura figura
  como Next.js, Convex y Vercel. Revisar el cronograma de la entrega siguiente
  con ese stack y documentar el control de acceso de Convex Auth y los helpers.
- Conservar RF2.1 para profesionales y añadir el requisito de tareas propias de
  GM-49 tras la aprobación del modelo y de su alcance.
- Alinear RF4.3 con los cuatro botones independientes y RF3.3 con el registro
  diario. Documentar el rango de 3 o 6 emociones como configuración del tutor.
- Mantener RF7.1–RF7.3 como alcance administrativo pendiente. Registrar el
  feedback de la profesora como tal y reservar la validación del cliente para
  la revisión con el CEE.
