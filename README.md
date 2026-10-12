# Voces en Equipo — prototipo en vivo

Juego web para una campaña escolar, con pantalla de facilitación y participantes desde celulares. La sala usa WebSockets y un Durable Object por código; no requiere cuentas ni una base de datos externa.

## Archivos

- `index.html`, `styles.css`, `app.js`: interfaz estática para Cloudflare Pages.
- `worker/`: API y salas en tiempo real para Cloudflare Workers + Durable Objects.

## Despliegue

La interfaz y las rutas `/create` y `/room/:code` se sirven desde el mismo dominio Pages. El Worker solo aloja Durable Objects; Pages Functions se conecta al binding `ROOMS` configurado en `wrangler.jsonc`.

1. Despliega primero el Worker de salas desde `worker/` con `npx wrangler deploy`. Su nombre debe ser `voces-en-equipo-realtime`, como figura en el binding Pages.
2. En Cloudflare Pages, conecta el repositorio `Ruben-arc3/Garlic-Phone`. La raíz del proyecto es la raíz del repositorio y el directorio de salida es `.`. La configuración Wrangler de Pages está en `wrangler.jsonc`.
3. Si Cloudflare ya tenía configurado el proyecto Pages, revisa que use el `wrangler.jsonc` actual o que tenga el binding Durable Object `ROOMS` con clase `Room` y Worker `voces-en-equipo-realtime`. Luego vuelve a desplegar Pages.
4. Abre el dominio Pages. El facilitador crea una sala; estudiantes escanean el QR o escriben el código.

## Local

Despliega el Worker con Wrangler. Pages Functions usa el mismo dominio y no requiere editar una URL del Worker en `app.js`.

## Controles incluidos

- Apodos, sin cuenta ni apellidos requeridos.
- Cuatro situaciones y respuestas predefinidas, sin chat ni texto libre del alumnado.
- Elección de equipo, respuesta individual y puntaje sincronizado.
- Mensajes que recuerdan no compartir experiencias personales y orientan a pedir apoyo en privado.

## Antes de usar con estudiantes

Este prototipo es una base funcional, no un sistema institucional de atención. Revisar lenguaje y situaciones con orientación escolar, ajustarlos a la edad y al protocolo local de protección. La versión inicial no debe usarse para recibir denuncias o recopilar relatos personales.
