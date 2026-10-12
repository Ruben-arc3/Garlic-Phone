/* Pantallas del juego. La API y los WebSockets comparten el dominio de Pages. */
const API = window.REALTIME_URL || location.origin;
const app = document.querySelector('#app');
const rounds = [
  { title: 'Secretos que incomodan', seed: 'Si un secreto te hace sentir inseguro, puedes contárselo a una persona adulta de confianza.' },
  { title: 'Límites y respeto', seed: 'Cuando alguien dice “no”, respetamos su límite y nos detenemos.' },
  { title: 'Apoyo entre compañeros', seed: 'Escucha sin juzgar y acompaña a tu amigo a buscar ayuda de una persona adulta segura.' },
  { title: 'Cuidado en internet', seed: 'No compartas una imagen por presión. Guarda evidencia si es seguro y pide apoyo.' },
];
let socket = null, state = null, room = '', role = '';
const playerId = localStorage.getItem('voces-player') || crypto.randomUUID();
localStorage.setItem('voces-player', playerId);
const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

function send(type, data = {}) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, ...data, playerId }));
}
function setMessage(text, selector = '.status') {
  const element = document.querySelector(selector);
  if (element) element.textContent = text;
}
function connect(code, asHost, token = '') {
  room = code.toUpperCase(); role = asHost ? 'host' : 'player';
  const url = new URL(`/room/${room}`, API);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('role', role); url.searchParams.set('playerId', playerId);
  if (token) url.searchParams.set('token', token);
  socket = new WebSocket(url);
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'state') { state = message.state; render(); }
    if (message.type === 'error') setMessage(message.message);
  };
  socket.onerror = () => setMessage('No se pudo conectar. Revisa que el Worker y Pages estén desplegados.');
  socket.onclose = () => { if (app.dataset.screen !== 'home') setMessage('Se perdió la conexión. Recarga para volver a entrar.'); };
}
function home() {
  socket?.close(); app.dataset.screen = 'home'; app.className = 'shell';
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Juego educativo en vivo</div></header>
    <section class="hero"><div class="eyebrow">Aprender jugando · cuidarnos en comunidad</div><h1>Las buenas respuestas<br>se construyen en equipo.</h1><p>Un teléfono descompuesto de dibujos e interpretaciones para conversar sobre límites y apoyo.</p></section>
    <section class="home-grid"><article class="card"><div class="eyebrow">Facilitador</div><h2>Crear una sala</h2><p>Proyecta el código y juega con el grupo.</p><button class="btn full" id="create">Crear sala en vivo</button><div class="status" id="host-status"></div></article>
    <article class="card"><div class="eyebrow">Estudiantes</div><h2>Unirse al juego</h2><p>Entra desde el celular con el código de la pantalla.</p><label class="field-label" for="code">Código</label><input class="input" id="code" maxlength="5" placeholder="ABCDE" autocomplete="one-time-code"><label class="field-label" for="nickname">Apodo (sin apellidos)</label><input class="input" id="nickname" maxlength="18" placeholder="Apodo"><button class="btn secondary full" id="join">Unirme a la sala</button><div class="status" id="join-status"></div></article></section>
    <p class="footer">No compartas experiencias personales en el juego. Si necesitas hablar, acércate en privado al adulto designado por tu institución.</p>`;
  document.querySelector('#create').onclick = createRoom;
  document.querySelector('#join').onclick = joinRoom;
  const input = document.querySelector('#code');
  input.oninput = () => { input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
  const invitedCode = new URLSearchParams(location.search).get('code');
  if (invitedCode) input.value = invitedCode.toUpperCase();
}
async function createRoom() {
  const button = document.querySelector('#create'); button.disabled = true;
  try {
    const response = await fetch(`${API}/create`, { method: 'POST' });
    if (!response.ok) throw new Error(`Error al crear sala (${response.status}).`);
    const result = await response.json(); connect(result.code, true, result.token);
  } catch (error) { setMessage(error.message, '#host-status'); button.disabled = false; }
}
function joinRoom() {
  const code = document.querySelector('#code').value.trim();
  const nickname = document.querySelector('#nickname').value.trim();
  if (code.length !== 5) return setMessage('Escribe el código de cinco caracteres.', '#join-status');
  if (!nickname) return setMessage('Escribe un apodo.', '#join-status');
  localStorage.setItem('voces-name', nickname); connect(code, false);
}
function teamPanel(team) {
  const players = state?.players?.filter((player) => player.team === team) || [];
  return `<div class="team"><h3>Equipo ${team ? 'B' : 'A'}</h3><div class="players">${players.length ? players.map((player) => `<span class="player-pill">${escapeHtml(player.name)}</span>`).join('') : 'Esperando participantes…'}</div>
    ${role === 'player' && state?.phase === 'lobby' ? `<button class="btn secondary" data-team="${team}" style="margin-top:12px">Elegir equipo ${team ? 'B' : 'A'}</button>` : ''}</div>`;
}
function render() {
  app.dataset.screen = role === 'host' ? 'host' : 'player';
  app.className = role === 'host' && new URLSearchParams(location.search).has('proyector') ? 'projection' : 'shell';
  if (state.phase === 'lobby' && role === 'player') return renderTeamSelect();
  if (state.phase === 'lobby') return renderLobby();
  if (state.phase === 'relay') return renderRelay();
  if (state.phase === 'reveal') return renderReveal();
  renderEnd();
}
function bindTeamButtons() {
  app.querySelectorAll('[data-team]').forEach((button) => button.onclick = () => send('team', { team: Number(button.dataset.team), name: localStorage.getItem('voces-name') || 'Participante' }));
}
function renderTeamSelect() {
  app.className = 'shell';
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Sala ${escapeHtml(room)}</div></header><section class="hero"><div class="eyebrow">¡Ya estás dentro!</div><h1>Elige tu equipo</h1><p>Si juegas solo, elige Equipo A. Harás los turnos sucesivos.</p></section><section class="team-list">${teamPanel(0)}${teamPanel(1)}</section><p class="footer">Puedes cambiar de equipo mientras la partida no haya iniciado.</p>`;
  bindTeamButtons();
}
function renderLobby() {
  const joinUrl = `${location.origin}${location.pathname}?code=${encodeURIComponent(room)}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl)}`;
  const count = state.players.length;
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Vista del facilitador</div></header>
    <div class="room-head"><div><div class="eyebrow">Escanea el QR o escribe el código</div><div class="room-code">${escapeHtml(room)}</div><p style="color:var(--muted)">Abre <b>${escapeHtml(location.origin)}</b> en el celular.</p></div>
    <div class="row"><img alt="QR para entrar a la sala" width="110" height="110" style="background:white;border:8px solid white;border-radius:10px" src="${qr}"><button class="btn secondary" id="project">Vista proyector</button><button class="btn" id="start" ${count ? '' : 'disabled'}>Iniciar teléfono</button></div></div>
    <div class="banner"><b>Acuerdo de cuidado:</b> usamos frases ficticias. No compartimos historias personales ni nombres. Si algo preocupa, hablen en privado con el adulto designado.</div>
    <div class="room-layout"><section class="card"><div class="kicker">Participantes · ${count}</div><div class="team-list" style="margin-top:15px">${teamPanel(0)}${teamPanel(1)}</div></section><section class="card"><div class="kicker">Teléfono descompuesto</div><h2 style="margin-top:14px">Dibuja · interpreta · pasa</h2><p>Una frase pasa de persona a dibujo y de dibujo a interpretación. Al final se revela cómo cambió.</p><div class="status">${count === 0 ? 'Conéctate con al menos una persona para empezar.' : count === 1 ? 'Puedes iniciar con un jugador; hará la cadena por turnos.' : 'Inicia cuando los equipos estén listos.'}</div></section></div>`;
  document.querySelector('#start').onclick = () => send('start');
  document.querySelector('#project').onclick = () => { const url = new URL(location.href); url.searchParams.set('proyector', '1'); window.open(url, '_blank'); };
}
function getMyTurn() {
  const team = state.mine?.team ?? 0;
  const chain = state.chains?.[team];
  if (!chain || chain.step >= 4) return null;
  const teamPlayers = state.players.filter((player) => player.team === team);
  const nextIndex = chain.step % (teamPlayers.length || 1);
  if (state.mine?.index !== nextIndex) return null;
  return { team, chain, step: chain.step, kind: chain.step % 2 === 0 ? 'image' : 'text', clue: chain.entries.at(-1) };
}
function renderRelay() {
  const round = rounds[state.roundIndex];
  if (role === 'host') {
    app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Ronda ${state.roundIndex + 1} / ${rounds.length}</div></header><section class="hero"><div class="eyebrow">${escapeHtml(round.title)}</div><h1>El mensaje va pasando…</h1><p>Cada estudiante dibuja o interpreta el aporte anterior desde su celular.</p></section><div class="room-layout">${[0,1].map((team) => `<section class="card"><div class="kicker">Equipo ${team ? 'B' : 'A'}</div><div class="room-code" style="font-size:52px">${state.chains?.[team]?.step || 0}<span style="font-size:24px;color:var(--muted)"> / 4 pasos</span></div></section>`).join('')}</div><p class="footer">La frase inicial y los aportes se revelan al completar la cadena.</p>`;
    return;
  }
  const turn = getMyTurn();
  if (!turn) {
    const team = state.mine?.team ?? 0; const step = state.chains?.[team]?.step || 0;
    app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Equipo ${team ? 'B' : 'A'}</div></header><section class="hero"><div class="eyebrow">${escapeHtml(round.title)}</div><h1>El teléfono está pasando por el equipo.</h1><p>Cuando llegue tu turno, verás el aporte anterior. No lo compartas con el otro equipo.</p></section><section class="card center"><div class="status">Esperando el siguiente turno…</div><div class="score" style="margin-top:16px">${step} / 4</div></section>`;
    return;
  }
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Tu turno · Equipo ${turn.team ? 'B' : 'A'}</div></header><section class="card"><div class="eyebrow">${escapeHtml(round.title)} · paso ${turn.step + 1} de 4</div><h1 class="prompt">${turn.kind === 'image' ? 'Dibuja lo que entiendes' : '¿Qué crees que representa el dibujo?'}</h1><div class="feedback">${turn.clue?.kind === 'image' ? `<img alt="Dibujo anterior" src="${turn.clue.content}" style="display:block;max-width:100%;max-height:260px;margin:auto;border-radius:12px">` : `<b>Mensaje recibido:</b><br>${escapeHtml(turn.clue?.content || round.seed)}`}</div>
    ${turn.kind === 'image' ? `<canvas id="canvas" width="600" height="360" style="width:100%;max-width:600px;height:auto;touch-action:none;background:white;border-radius:14px;margin-top:16px"></canvas><div class="row" style="margin-top:10px"><button class="btn secondary" id="clear">Borrar</button><button class="btn" id="submit">Pasar dibujo</button></div>` : `<label class="field-label" for="guess">Tu interpretación (máximo 140 caracteres)</label><textarea id="guess" class="input" maxlength="140" rows="3" placeholder="Escribe una frase breve…"></textarea><button class="btn full" id="submit">Pasar frase</button>`}<p class="footer">No escribas nombres ni experiencias personales.</p></section>`;
  const submit = (kind, content) => send('submit', { content, kind, team: turn.team });
  if (turn.kind === 'image') {
    const canvas = document.querySelector('#canvas'); const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = '#222';
    let drawing = false;
    const point = (event) => { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }; };
    canvas.onpointerdown = (event) => { drawing = true; canvas.setPointerCapture(event.pointerId); const p = point(event); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    canvas.onpointermove = (event) => { if (drawing) { const p = point(event); ctx.lineTo(p.x, p.y); ctx.stroke(); } };
    canvas.onpointerup = () => { drawing = false; };
    document.querySelector('#clear').onclick = () => { ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height); };
    document.querySelector('#submit').onclick = () => submit('image', canvas.toDataURL('image/jpeg', 0.5));
  } else {
    document.querySelector('#submit').onclick = () => { const text = document.querySelector('#guess').value.trim(); if (text) submit('text', text); };
  }
}
function renderReveal() {
  const entries = state.chains || [];
  const tile = (entry, index) => `<div class="card" style="min-width:190px;max-width:240px"><div class="kicker">${index === 0 ? 'Frase inicial' : `Paso ${index}`}</div>${entry.kind === 'image' ? `<img alt="Dibujo de la cadena" src="${entry.content}" style="width:100%;border-radius:10px;margin-top:10px">` : `<p style="margin-top:12px;color:white">${escapeHtml(entry.content)}</p>`}</div>`;
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Revelación · ronda ${state.roundIndex + 1}</div></header><section class="hero"><div class="eyebrow">${escapeHtml(rounds[state.roundIndex].title)}</div><h1>¿Cómo cambió el mensaje?</h1><p>Comparen la idea inicial con las interpretaciones. La actividad sirve para conversar, no para evaluar experiencias personales.</p></section>
    ${[0,1].map((team) => `<section class="card" style="margin-bottom:18px"><div class="kicker" style="margin-bottom:14px">Equipo ${team ? 'B' : 'A'}</div><div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;align-items:stretch">${(entries[team]?.entries || []).map(tile).join('<div style="align-self:center;color:var(--lime);font-size:28px">→</div>')}</div></section>`).join('')}
    <section class="banner"><b>Conversación final:</b> ¿qué parte de la idea se mantuvo? ¿Qué acción segura recuerdan y a qué adulto podrían acudir? No compartan experiencias personales en público.</section><div class="team-list"><div class="team"><h3>Equipo A</h3><div class="score">${state.scores?.[0] || 0}</div></div><div class="team"><h3>Equipo B</h3><div class="score">${state.scores?.[1] || 0}</div></div></div><div class="center" style="margin-top:22px"><button class="btn" id="next">${state.roundIndex + 1 === rounds.length ? 'Ver cierre' : 'Siguiente cadena'}</button></div>`;
  document.querySelector('#next').onclick = () => send('next');
}
function renderEnd() {
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Cierre</div></header><section class="hero"><div class="eyebrow">Gracias por participar</div><h1>Una comunidad que escucha y protege.</h1><p>Puedes poner límites, pedir ayuda y acompañar a alguien sin juzgar.</p></section><section class="card center"><p>Si necesitas apoyo, acércate en privado al orientador o adulto responsable de protección de tu institución.</p><button class="btn secondary" id="again">Volver a la sala</button></section>`;
  document.querySelector('#again').onclick = () => send('reset');
}
home();
