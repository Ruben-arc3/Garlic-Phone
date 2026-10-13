# Voces en Equipo — prototipo en vivo

Juego web para una campaña escolar, con pantalla de facilitación y participantes desde celulares. La sala usa WebSockets y un Durable Object por código; no requiere cuentas ni una base de datos externa.

## Archivos

- `index.html`, `styles.css`, `app.js`: interfaz estática para Cloudflare Pages.
- `worker/`: API y salas en tiempo real para Cloudflare Workers + Durable Objects.

## Despliegue

La interfaz y las rutas `/create` y `/room/:code` se sirven desde el mismo dominio Pages. El Worker solo aloja Durable Objects; Pages Functions se conecta al binding `ROOMS` configurado en `wrangler.jsonc`.

1. Despliega primero el Worker de salas desde `worker/` con `npx wrangler deploy --config .\worker\wrangler.jsonc`. Su nombre debe ser `voces-en-equipo-realtime`, como figura en el binding Pages.
2. En Cloudflare Pages, conecta el repositorio `Ruben-arc3/Garlic-Phone`. La raíz del proyecto es la raíz del repositorio y el directorio de salida es `.`. La configuración Wrangler de Pages está en `wrangler.jsonc`.
3. Si Cloudflare ya tenía configurado el proyecto Pages, revisa que use el `wrangler.jsonc` actual o que tenga el binding Durable Object `ROOMS` con clase `Room` y Worker `voces-en-equipo-realtime`. Luego vuelve a desplegar Pages.
4. Abre el dominio Pages. El facilitador crea una sala; estudiantes escanean el QR o escriben el código.

## Local

Despliega el Worker con Wrangler. Pages Functions usa el mismo dominio y no requiere editar una URL del Worker en `app.js`.

## Mecánica del juego

- De 2 a 15 equipos configurables por el facilitador, conectados a una sala en vivo.
- El facilitador puede configurar entre 2 y 15 equipos, entre 4 y 10 pasos por cadena y entre 15 y 300 segundos para cada turno.
- El temporizador sincronizado aparece en el proyector y en los celulares; al agotarse, el equipo pasa automáticamente al siguiente turno.
- El QR lleva directo a la sala; el estudiante solo escribe un apodo antes de elegir equipo.
- El modo Knock-Off de frase inicia todos los equipos con la misma frase educativa, visible solo para quien tiene el turno.
- El modo Knock-Off de memoria visual asigna un dibujo modelo distinto a cada equipo. Lo muestra durante 8 segundos; luego cada equipo reproduce lo recibido, sube la foto y la copia pasa al siguiente equipo hasta completar la rotación. Al final se revela cada cadena.
- El modo Pinturillo de prevención asigna palabras aleatorias de una lista educativa, sin repetir hasta agotar el mazo. Quien dibuja recibe la palabra en privado; los demás la escriben en el chat para adivinar en vivo. La pantalla muestra marcador, tablero y chat. Solo se publican los intentos incorrectos; al acertar, el chat anuncia los puntos sin revelar la respuesta. Se puede subir una foto y quitar automáticamente el papel claro, conservando los trazos de colores; también se puede mantener la foto original. Hay un botón de pantalla completa para proyectar la partida.
- Cada turno de dibujo permite fotografiar una hoja o seleccionar la imagen desde el celular; la imagen se comprime y se guarda separada del estado de la sala. En los otros turnos, un jugador interpreta el dibujo por escrito.
- Al completar la cadena, la pantalla proyectada revela la frase original, los dibujos y las interpretaciones para conversar sobre cómo se transmitió el mensaje.
- Las frases tratan de límites, pedir ayuda y apoyo entre compañeros; no se solicita que nadie comparta experiencias personales. La pantalla recuerda fotografiar solo la hoja, sin caras ni datos identificables.
- Apodos sin cuenta ni apellidos requeridos.
- El facilitador puede reiniciar la partida desde la pantalla final.

## Antes de usar con estudiantes

Este prototipo debe probarse y revisarse con orientación escolar antes de usarlo con estudiantes. Ajustar el lenguaje a la edad y al protocolo local de protección. No está diseñado para recibir denuncias ni recopilar relatos personales.
