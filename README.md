# Voces en Equipo — prototipo en vivo

Juego web para una campaña escolar, con pantalla de facilitación y participantes desde celulares. La sala usa WebSockets y un Durable Object por código; no requiere cuentas ni una base de datos externa.

## Archivos

- `index.html`, `styles.css`, `app.js`: interfaz estática para Cloudflare Pages.
- `worker/`: API y salas en tiempo real para Cloudflare Workers + Durable Objects.

## Despliegue

1. Sube esta carpeta a un repositorio Git.
2. Desde `worker/`, ejecuta `npx wrangler deploy`. En una cuenta Cloudflare gratuita esto crea el Worker y el namespace Durable Object SQLite.
3. Copia la URL publicada del Worker (por ejemplo `https://voces-en-equipo-realtime.<tu-subdominio>.workers.dev`).
4. En `app.js`, sustituye `const REALTIME_URL = window.REALTIME_URL || '';` por la URL, sin `/` final.
5. Importa el repositorio en Cloudflare Pages. Como el sitio es estático, usa Build command vacío y directorio de salida `.` (o configura un directorio raíz del proyecto acorde a tu repositorio).
6. Abre la URL Pages en el computador. Crea una sala y proyecta el QR/código. Para generar un QR, se puede añadir después; en esta versión el código se comparte en pantalla y los estudiantes abren el enlace del sitio.

## Local

Despliega el Worker con Wrangler y sirve el directorio raíz con cualquier servidor estático local. Configura `REALTIME_URL` en `app.js` con la URL del Worker. Usa `wrangler dev` para ejecutar localmente el backend; para Durable Objects locales, consulta la guía vigente de Wrangler.

## Controles incluidos

- Apodos, sin cuenta ni apellidos requeridos.
- Cuatro situaciones y respuestas predefinidas, sin chat ni texto libre del alumnado.
- Elección de equipo, respuesta individual y puntaje sincronizado.
- Mensajes que recuerdan no compartir experiencias personales y orientan a pedir apoyo en privado.

## Antes de usar con estudiantes

Este prototipo es una base funcional, no un sistema institucional de atención. Revisar lenguaje y situaciones con orientación escolar, ajustarlos a la edad y al protocolo local de protección. La versión inicial no debe usarse para recibir denuncias o recopilar relatos personales.
