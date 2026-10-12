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

## Mecánica del juego

- Dos equipos conectados a una sala en vivo.
- Cada cadena empieza con una frase educativa, que solo ve el primer participante de ese equipo.
- En los turnos de dibujo, el equipo dibuja en papel y un jugador toma/sube una foto comprimida desde el celular; en los otros turnos, otro jugador interpreta el dibujo por escrito.
- Al completar la cadena, la pantalla proyectada revela la frase original, los dibujos y las interpretaciones para conversar sobre cómo se transmitió el mensaje.
- Las frases tratan de límites, pedir ayuda y apoyo entre compañeros; no se solicita que nadie comparta experiencias personales. La pantalla recuerda fotografiar solo la hoja, sin caras ni datos identificables.
- Apodos sin cuenta ni apellidos requeridos.

## Antes de usar con estudiantes

Este prototipo debe probarse y revisarse con orientación escolar antes de usarlo con estudiantes. Ajustar el lenguaje a la edad y al protocolo local de protección. No está diseñado para recibir denuncias ni recopilar relatos personales.
