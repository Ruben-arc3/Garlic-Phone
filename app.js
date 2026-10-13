/* Pantallas del juego. La API y los WebSockets comparten el dominio de Pages. */
const API = window.REALTIME_URL || location.origin;
const app = document.querySelector('#app');
const rounds = [
  { title: 'Secretos que incomodan', seed: 'Si un secreto te hace sentir inseguro, puedes contárselo a una persona adulta de confianza.' },
  { title: 'Límites y respeto', seed: 'Cuando alguien dice “no”, respetamos su límite y nos detenemos.' },
  { title: 'Apoyo entre compañeros', seed: 'Escucha sin juzgar y acompaña a tu amigo a buscar ayuda de una persona adulta segura.' },
  { title: 'Cuidado en internet', seed: 'No compartas una imagen por presión. Guarda evidencia si es seguro y pide apoyo.' },
];
let socket = null, state = null, room = '', role = '', timerInterval = null, boardRenderToken = 0, pictionaryHistory = [];
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
  pictionaryHistory = [];
  room = code.toUpperCase(); role = asHost ? 'host' : 'player';
  const url = new URL(`/room/${room}`, API);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('role', role); url.searchParams.set('playerId', playerId);
  if (token) url.searchParams.set('token', token);
  socket = new WebSocket(url);
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'state') {
      const previousPhase = state?.phase;
      if (previousPhase === 'pictionaryReveal' && ['pictionary', 'end'].includes(message.state.phase)) {
        const previousCanvas = document.querySelector('#drawing-board');
        if (state.pictionary?.result && previousCanvas) {
          try { pictionaryHistory.push({ ...state.pictionary.result, turn: state.pictionary.turnIndex + 1, cycle: Math.floor(state.pictionary.turnIndex / state.pictionary.teams.length) + 1, image: previousCanvas.toDataURL('image/jpeg', 0.78) }); }
          catch { /* Keep the reveal history moving if a browser cannot export the canvas. */ }
        }
      }
      state = message.state;
      if (previousPhase === 'pictionary' && state.phase === 'pictionary' && document.querySelector('#drawing-board')) {
        drawPictionaryBoard(state.pictionaryBoard);
        const count = document.querySelector('#guess-count'); if (count && state.pictionary) count.textContent = `${state.pictionary.guessCount} intentos`;
        const hint = document.querySelector('#pictionary-hint'); if (hint) hint.textContent = state.pictionaryHint ? `Pista: ${state.pictionaryHint}` : '';
        syncPictionaryGuessAvailability();
        return;
      }
      render();
    }
    if (message.type === 'pictionaryStroke') {
      if (state?.pictionaryBoard && message.stroke) state.pictionaryBoard.strokes.push(message.stroke);
      drawStrokeOnBoard(message.stroke);
      syncPictionaryGuessAvailability();
    }
    if (message.type === 'pictionaryStatus' && state?.pictionary) {
      state.pictionary.guessCount = message.guessCount;
      const count = document.querySelector('#guess-count'); if (count) count.textContent = `${message.guessCount} intentos`;
    }
    if (message.type === 'pictionaryGuessResult') setMessage(message.correct ? '¡Correcto! Tu equipo sumó puntos.' : 'Todavía no. Prueba otra respuesta.', '#guess-status');
    if (message.type === 'error') setMessage(message.message);
  };
  socket.onerror = () => setMessage('No se pudo conectar. Revisa que el Worker y Pages estén desplegados.');
  socket.onclose = () => { if (app.dataset.screen !== 'home') setMessage('Se perdió la conexión. Recarga para volver a entrar.'); };
}
function home() {
  socket?.close(); app.dataset.screen = 'home'; app.className = 'shell';
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Juego educativo en vivo</div></header>
    <section class="hero"><div class="eyebrow">Aprender jugando · cuidarnos en comunidad</div><h1>Las buenas respuestas<br>se construyen en equipo.</h1><p>Un teléfono descompuesto de dibujos e interpretaciones para conversar sobre límites y apoyo.</p></section>
    <section class="home-grid"><article class="card" id="host-card"><div class="eyebrow">Facilitador</div><h2>Crear una sala</h2><p>Proyecta el código y juega con el grupo.</p><label class="field-label" for="team-count">Cantidad de equipos</label><select class="input" id="team-count">${Array.from({length:14},(_,i)=>i+2).map(n=>`<option value="${n}" ${n===2?'selected':''}>${n} equipos</option>`).join('')}</select><label class="field-label" for="game-mode">Modo de juego</label><select class="input" id="game-mode"><option value="phrase">Knock-Off · misma frase educativa</option><option value="memory">Knock-Off · memorizar dibujo</option><option value="pictionary">Pinturillo · dibujar y adivinar</option></select><p class="note">En memorizar dibujo, cada equipo empieza con un modelo distinto, lo replica y pasa su copia al siguiente equipo.</p><label class="field-label" for="step-count">Aportes por equipo (modo frase)</label><select class="input" id="step-count">${[4,5,6,7,8,9,10].map(n=>`<option value="${n}" ${n===6?'selected':''}>${n} pasos</option>`).join('')}</select><label class="field-label" for="turn-seconds">Tiempo por turno (segundos)</label><input class="input" id="turn-seconds" type="number" min="15" max="300" step="5" value="60"><p class="note">Entre 15 segundos y 5 minutos; el turno avanza automáticamente.</p><button class="btn full" id="create">Crear sala en vivo</button><div class="status" id="host-status"></div></article>
    <article class="card"><div class="eyebrow">Estudiantes</div><h2 id="join-title">Unirse al juego</h2><p id="join-description">Entra desde el celular con el código de la pantalla.</p><label class="field-label" for="code">Código</label><input class="input" id="code" maxlength="5" placeholder="ABCDE" autocomplete="one-time-code"><label class="field-label" for="nickname">Elige tu apodo</label><input class="input" id="nickname" maxlength="18" placeholder="Apodo (sin apellidos)" autocomplete="nickname"><button class="btn secondary full" id="join">Entrar a la sala</button><div class="status" id="join-status"></div></article></section>
    <p class="footer">No compartas experiencias personales en el juego. Si necesitas hablar, acércate en privado al adulto designado por tu institución.</p>`;
  document.querySelector('#create').onclick = createRoom;
  document.querySelector('#join').onclick = joinRoom;
  const modeSelect = document.querySelector('#game-mode');
  const syncStepSetting = () => {
    const hidden = modeSelect.value !== 'phrase';
    document.querySelector('label[for="step-count"]').classList.toggle('hidden', hidden);
    document.querySelector('#step-count').classList.toggle('hidden', hidden);
  };
  modeSelect.onchange = syncStepSetting; syncStepSetting();
  const input = document.querySelector('#code');
  input.oninput = () => { input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
  const invitedCode = new URLSearchParams(location.search).get('code');
  if (invitedCode) {
    input.value = invitedCode.toUpperCase();
    document.querySelector('#host-card').classList.add('hidden');
    document.querySelector('#join-title').textContent = 'Elige tu apodo';
    document.querySelector('#join-description').textContent = 'Ya tienes el código de sala. Escribe un apodo para entrar.';
    document.querySelector('label[for="code"]').classList.add('hidden');
    input.classList.add('hidden');
    document.querySelector('#nickname').focus();
  }
}
async function createRoom() {
  const button = document.querySelector('#create'); button.disabled = true;
  try {
    const turnSeconds = Math.min(300, Math.max(15, Number(document.querySelector('#turn-seconds').value) || 60));
    const response = await fetch(`${API}/create`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ teamCount: Number(document.querySelector('#team-count').value), stepsCount: Number(document.querySelector('#step-count').value), turnSeconds, mode: document.querySelector('#game-mode').value }) });
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
  return `<div class="team"><h3>Equipo ${team + 1}</h3><div class="players">${players.length ? players.map((player) => `<span class="player-pill">${escapeHtml(player.name)}</span>`).join('') : 'Esperando participantes…'}</div>
    ${role === 'player' && state?.phase === 'lobby' ? `<button class="btn secondary" data-team="${team}" style="margin-top:12px">Elegir equipo ${team + 1}</button>` : ''}</div>`;
}
function render() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  app.dataset.screen = role === 'host' ? 'host' : 'player';
  app.className = role === 'host' && new URLSearchParams(location.search).has('proyector') ? 'projection' : 'shell';
  if (state.phase === 'lobby' && role === 'player') return renderTeamSelect();
  if (state.phase === 'lobby') return renderLobby();
  if (state.phase === 'relay') return renderRelay();
  if (state.phase === 'reveal') return renderReveal();
  if (state.phase === 'pictionary') return renderPictionary();
  if (state.phase === 'pictionaryReveal') return renderPictionaryReveal();
  renderEnd();
}
function startCountdowns() {
  const update = () => {
    document.querySelectorAll('.live-timer').forEach((element) => {
      const deadline = Number(element.dataset.deadline);
      if (!deadline) { element.textContent = 'Turno sin temporizador'; return; }
      const previewDeadline = Number(element.dataset.preview);
      if (previewDeadline && previewDeadline > Date.now()) {
        element.textContent = `Memoriza el dibujo: ${Math.ceil((previewDeadline - Date.now()) / 1000)} s`;
        return;
      }
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      element.textContent = left === 0 ? 'Tiempo agotado · avanzando…' : `Tiempo restante: ${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      element.classList.toggle('timer-urgent', left > 0 && left <= 10);
    });
  };
  update();
  timerInterval = setInterval(update, 250);
}
function bindTeamButtons() {
  app.querySelectorAll('[data-team]').forEach((button) => button.onclick = () => send('team', { team: Number(button.dataset.team), name: localStorage.getItem('voces-name') || 'Participante' }));
}
function renderTeamSelect() {
  app.className = 'shell';
  const teams = Array.from({ length: state.teamCount || 2 }, (_, index) => teamPanel(index)).join('');
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Sala ${escapeHtml(room)}</div></header><section class="hero"><div class="eyebrow">¡Ya estás dentro!</div><h1>Elige tu equipo</h1><p>Si juegas solo, elige Equipo 1. Harás los turnos sucesivos.</p></section><section class="team-list">${teams}</section><p class="footer">Puedes cambiar de equipo mientras la partida no haya iniciado.</p>`;
  bindTeamButtons();
}
function renderLobby() {
  const joinUrl = `${location.origin}${location.pathname}?code=${encodeURIComponent(room)}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl)}`;
  const count = state.players.length;
  const teams = Array.from({ length: state.teamCount || 2 }, (_, index) => teamPanel(index)).join('');
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Vista del facilitador</div></header>
    <div class="room-head"><div><div class="eyebrow">Escanea el QR o escribe el código</div><div class="room-code">${escapeHtml(room)}</div><p style="color:var(--muted)">Abre <b>${escapeHtml(location.origin)}</b> en el celular.</p></div>
    <div class="row"><img alt="QR para entrar a la sala" width="110" height="110" style="background:white;border:8px solid white;border-radius:10px" src="${qr}"><button class="btn secondary" id="project">Vista proyector</button><button class="btn" id="start" ${count ? '' : 'disabled'}>Iniciar teléfono</button></div></div>
    <div class="banner"><b>Acuerdo de cuidado:</b> usamos frases ficticias. No compartimos historias personales ni nombres. Si algo preocupa, hablen en privado con el adulto designado.</div>
    <div class="room-layout"><section class="card"><div class="kicker">Participantes · ${count}</div><div class="team-list" style="margin-top:15px">${teams}</div></section><section class="card"><div class="kicker">${state.mode === 'pictionary' ? 'Dibuja y adivina' : 'Teléfono descompuesto'}</div><h2 style="margin-top:14px">${state.teamCount} equipos · ${state.mode === 'memory' ? 'Memorizar dibujo' : state.mode === 'pictionary' ? 'Pinturillo de prevención' : `${state.stepsCount} pasos`}</h2><p>${state.mode === 'memory' ? 'Cada equipo recibe un dibujo distinto, lo memoriza, lo replica y pasa la copia al siguiente equipo hasta completar la rotación.' : state.mode === 'pictionary' ? 'Un equipo dibuja una palabra privada mientras los demás la escriben para adivinarla. Después pasa al siguiente equipo; el juego continúa hasta que el facilitador lo termine. Se revelan pistas con letras y el dibujo aparece en vivo en el proyector.' : 'Todos los equipos comienzan con la misma frase educativa y la cadena alterna dibujo e interpretación.'} Tiempo por turno: <b>${state.turnSeconds} segundos</b>.</p><div class="status">${count === 0 ? 'Conéctate con al menos una persona para empezar.' : count === 1 ? 'Puedes iniciar con un jugador; hará los turnos sucesivos. Para adivinar, se recomienda que haya otro equipo con participantes.' : 'Inicia cuando los equipos estén listos.'}</div></section></div>`;
  document.querySelector('#start').onclick = () => send('start');
  document.querySelector('#project').onclick = () => { const url = new URL(location.href); url.searchParams.set('proyector', '1'); window.open(url, '_blank'); };
}
function getMyTurn() {
  const team = state.mine?.team ?? 0;
  if (state.mode === 'memory') {
    const memory = state.memory;
    if (!memory || memory.doneTeams.includes(team)) return null;
    const teamPlayers = state.players.filter((player) => player.team === team);
    if (teamPlayers[memory.stage % (teamPlayers.length || 1)]?.id !== state.mine?.id) return null;
    return { team, chain: { deadlineAt: memory.deadlineAt, previewUntil: memory.previewUntil }, step: memory.stage, kind: 'image', clue: state.memoryClue };
  }
  const chain = state.chains?.[team];
  if (!chain || chain.step >= (state.stepsCount || 6)) return null;
  const teamPlayers = state.players.filter((player) => player.team === team);
  const nextIndex = chain.step % (teamPlayers.length || 1);
  if (state.mine?.index !== nextIndex) return null;
  return { team, chain, step: chain.step, kind: state.mode === 'memory' ? 'image' : (chain.step % 2 === 0 ? 'image' : 'text'), clue: chain.entries.at(-1) };
}
function renderRelay() {
  const round = rounds[state.roundIndex];
  if (role === 'host') {
    if (state.mode === 'memory') {
      const memory = state.memory;
      const teams = Array.from({ length: state.teamCount || 2 }, (_, team) => {
        const active = memory?.teams.includes(team);
        const done = memory?.doneTeams.includes(team);
        return `<section class="card"><div class="kicker">Equipo ${team + 1}</div><div class="room-code" style="font-size:42px">${done ? '✓' : active ? '…' : '—'}<span style="font-size:17px;color:var(--muted)">${done ? ' réplica lista' : active ? ' reproduciendo' : ' sin participantes'}</span></div>${active ? `<div class="timer live-timer" data-deadline="${memory.deadlineAt}" data-preview="${memory.previewUntil || ''}"></div>` : ''}</section>`;
      }).join('');
      app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Ronda ${state.roundIndex + 1} / ${rounds.length} · Paso ${memory.stage + 1} / ${memory.teams.length}</div></header><section class="hero"><div class="eyebrow">${escapeHtml(rounds[state.roundIndex].title)}</div><h1>Replica el dibujo que recibiste</h1><p>Cada equipo reproduce el modelo y pasa su dibujo al siguiente. En esta etapa van ${memory.doneTeams.length} de ${memory.teams.length} equipos.</p></section><div class="room-layout">${teams}</div><p class="footer">Las cadenas completas se revelan al terminar la rotación.</p>`;
      startCountdowns(); return;
    }
    const teams = Array.from({ length: state.teamCount || 2 }, (_, team) => `<section class="card"><div class="kicker">Equipo ${team + 1}</div><div class="room-code" style="font-size:52px">${state.chains?.[team]?.step || 0}<span style="font-size:24px;color:var(--muted)"> / ${state.mode === 'memory' ? 1 : state.stepsCount} ${state.mode === 'memory' ? 'réplica' : 'pasos'}</span></div><div class="timer live-timer" data-deadline="${state.chains?.[team]?.deadlineAt || ''}" data-preview="${state.chains?.[team]?.previewUntil || ''}"></div></section>`).join('');
    app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Ronda ${state.roundIndex + 1} / ${rounds.length}</div></header><section class="hero"><div class="eyebrow">${escapeHtml(round.title)}</div><h1>${state.mode === 'memory' ? '¡A memorizar el dibujo!' : 'El mensaje va pasando…'}</h1><p>${state.mode === 'memory' ? 'Cada equipo verá el mismo modelo por 8 segundos y lo reproducirá desde la memoria.' : 'Cada estudiante dibuja o interpreta el aporte anterior desde su celular.'}</p></section><div class="room-layout">${teams}</div><p class="footer">${state.mode === 'memory' ? 'Las réplicas se revelan juntas al terminar.' : 'La frase inicial y los aportes se revelan al completar la cadena.'}</p>`;
    startCountdowns(); return;
  }
  const turn = getMyTurn();
  if (!turn) {
    if (state.mode === 'memory') {
      const team = state.mine?.team ?? 0; const memory = state.memory;
      const alreadySent = memory?.doneTeams.includes(team);
      app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Equipo ${team + 1}</div></header><section class="hero"><div class="eyebrow">${escapeHtml(round.title)} · paso ${memory.stage + 1} / ${memory.teams.length}</div><h1>${alreadySent ? 'Réplica enviada' : 'Tu equipo está por recibir un dibujo'}</h1><p>${alreadySent ? 'Espera a que los demás equipos terminen para que el dibujo siga circulando.' : 'Cuando llegue el modelo, reprodúzcanlo en una hoja y suban la foto.'}</p></section><section class="card center"><div class="status">${memory.doneTeams.length} de ${memory.teams.length} equipos han enviado su réplica.</div><div class="timer live-timer" data-deadline="${memory.deadlineAt}" data-preview="${memory.previewUntil || ''}"></div><div class="score" style="margin-top:16px">${memory.stage + 1} / ${memory.teams.length} transferencias</div></section>`;
      startCountdowns(); return;
    }
    const team = state.mine?.team ?? 0; const step = state.chains?.[team]?.step || 0;
    app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Equipo ${team + 1}</div></header><section class="hero"><div class="eyebrow">${escapeHtml(round.title)}</div><h1>El teléfono está pasando por el equipo.</h1><p>Cuando llegue tu turno, verás el aporte anterior. No lo compartas con otros equipos.</p></section><section class="card center"><div class="status">Esperando el siguiente turno…</div><div class="timer live-timer" data-deadline="${state.chains?.[team]?.deadlineAt || ''}" data-preview="${state.chains?.[team]?.previewUntil || ''}"></div><div class="score" style="margin-top:16px">${step} / ${state.mode === 'memory' ? 1 : state.stepsCount}</div></section>`;
    startCountdowns(); return;
  }
  const memoryMode = state.mode === 'memory';
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Tu turno · Equipo ${turn.team + 1}</div></header><section class="card"><div class="eyebrow">${escapeHtml(round.title)}${memoryMode ? ' · replica de memoria' : ` · paso ${turn.step + 1} de ${state.stepsCount}`}</div><div class="timer live-timer" data-deadline="${turn.chain.deadlineAt || ''}" data-preview="${turn.chain.previewUntil || ''}"></div>${memoryMode ? `<div class="memory-preview" id="memory-preview"><div class="kicker">Memoriza el modelo · <span class="memory-seconds">8</span> segundos</div><img alt="Dibujo modelo para memorizar" src="${turn.clue?.content || ''}" style="display:block;max-width:100%;max-height:300px;margin:12px auto;border-radius:12px"></div><div class="feedback hidden" id="memory-hidden">¡Tiempo! Replica el dibujo en una hoja sin volver a mirar el modelo.</div>` : ''}<h1 class="prompt">${memoryMode ? 'Reproduzcan el dibujo en una hoja' : turn.kind === 'image' ? 'Dibujen en una hoja y suban una foto' : '¿Qué crees que representa el dibujo?'}</h1>${memoryMode ? '' : `<div class="feedback">${turn.clue?.kind === 'image' ? `<img alt="Dibujo anterior" src="${turn.clue.content}" style="display:block;max-width:100%;max-height:260px;margin:auto;border-radius:12px">` : `<b>Mensaje recibido:</b><br>${escapeHtml(turn.clue?.content || round.seed)}`}</div>`}
    ${turn.kind === 'image' ? `<label class="field-label" for="photo">Toma una foto o elige una imagen</label><input class="input" id="photo" type="file" accept="image/*" capture="environment"><p class="note">Fotografía solo la hoja. Evita que aparezcan caras, nombres, uniformes o datos personales.</p><img id="photo-preview" class="hidden" alt="Vista previa del dibujo" style="display:block;max-width:100%;max-height:300px;margin:14px auto;border-radius:12px"><button class="btn full" id="submit" disabled>Preparar foto…</button><div class="status" id="upload-status"></div>` : `<label class="field-label" for="guess">Tu interpretación (máximo 140 caracteres)</label><textarea id="guess" class="input" maxlength="140" rows="3" placeholder="Escribe una frase breve…"></textarea><button class="btn full" id="submit">Pasar frase</button>`}<p class="footer">No escribas nombres ni experiencias personales.</p></section>`;
  const submit = (kind, content) => send('submit', { content, kind, team: turn.team });
  if (memoryMode) {
    const previewUntil = turn.chain.previewUntil == null ? 0 : Number(turn.chain.previewUntil);
    const memoryInterval = setInterval(() => {
      const seconds = Math.max(0, Math.ceil((previewUntil - Date.now()) / 1000));
      const label = document.querySelector('.memory-seconds');
      if (label) label.textContent = String(seconds);
      if (seconds === 0) {
        clearInterval(memoryInterval);
        document.querySelector('#memory-preview')?.classList.add('hidden');
        document.querySelector('#memory-hidden')?.classList.remove('hidden');
      }
    }, 200);
    if (!previewUntil || previewUntil <= Date.now()) {
      document.querySelector('#memory-preview')?.classList.add('hidden');
      document.querySelector('#memory-hidden')?.classList.remove('hidden');
    }
  }
  if (turn.kind === 'image') {
    const photoInput = document.querySelector('#photo');
    const preview = document.querySelector('#photo-preview');
    const submitButton = document.querySelector('#submit');
    let compressedPhoto = '';
    photoInput.onchange = async () => {
      const file = photoInput.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { setMessage('Selecciona una foto o imagen válida.', '#upload-status'); return; }
      submitButton.disabled = true; submitButton.textContent = 'Comprimiendo foto…';
      setMessage('Reduciendo el tamaño para enviarla rápidamente.', '#upload-status');
      try {
        compressedPhoto = await compressPhoto(file);
        preview.src = compressedPhoto; preview.classList.remove('hidden');
        submitButton.disabled = false; submitButton.textContent = 'Pasar foto al siguiente jugador';
        setMessage(`Foto lista (${Math.max(1, Math.round(compressedPhoto.length / 1024))} KB aprox.).`, '#upload-status');
      } catch {
        compressedPhoto = ''; submitButton.disabled = true; submitButton.textContent = 'Elige una foto';
        setMessage('No se pudo preparar esa imagen. Prueba con otra foto.', '#upload-status');
      }
    };
    submitButton.onclick = () => { if (compressedPhoto) { submitButton.disabled = true; submit('image', compressedPhoto); } };
  } else {
    document.querySelector('#submit').onclick = () => { const text = document.querySelector('#guess').value.trim(); if (text) submit('text', text); };
  }
  startCountdowns();
}
function renderPictionary() {
  const game = state.pictionary;
  const isDrawer = role === 'player' && game.drawerTeam === state.mine?.team && state.pictionaryWord;
  const isArtistTeam = role === 'player' && game.drawerTeam === state.mine?.team;
  const artist = state.players.find((player) => player.id === game.drawerId);
  const cycle = Math.floor(game.turnIndex / game.teams.length) + 1;
  const header = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Pinturillo · vuelta ${cycle} · dibuja Equipo ${game.drawerTeam + 1}</div></header>`;
  const board = `<canvas id="drawing-board" width="900" height="560" aria-label="Tablero de dibujo" style="display:block;width:100%;max-height:62vh;aspect-ratio:900/560;background:white;border-radius:14px;touch-action:none"></canvas>`;
  const timer = `<div class="timer live-timer" data-deadline="${game.deadlineAt}"></div>`;
  let controls = '';
  if (role === 'player' && isDrawer) {
    controls = `<section class="card" style="margin-top:16px"><div class="eyebrow">Tu palabra</div><h1 class="prompt">${escapeHtml(state.pictionaryWord)}</h1><p>Dibújala sin escribir letras ni la palabra. Puedes subir una imagen como fondo y dibujar encima.</p><div class="drawing-tools"><label class="field-label" for="drawing-photo">Imagen de fondo (opcional)</label><input class="input" id="drawing-photo" type="file" accept="image/*" capture="environment"><p class="note">Usa una imagen sin caras, nombres ni datos personales.</p><div class="tool-row"><label>Color <input id="brush-color" type="color" value="#20233a"></label><label>Grosor <input id="brush-size" type="range" min="2" max="18" value="7"></label><button class="btn secondary" id="clear-drawing">Borrar trazos</button></div><div class="row"><button class="btn full" id="finish-drawing">Terminar turno</button></div><div class="status" id="drawing-status"></div></div></section>`;
  } else if (role === 'player' && !isArtistTeam) {
    controls = `<section class="card" style="margin-top:16px"><div class="eyebrow">Adivina en equipo</div><p>Escribe la palabra que representa el dibujo. Si cuesta adivinarla, se irán revelando letras como pista.</p><div class="row"><input id="guess-input" class="input" maxlength="50" placeholder="Escribe tu respuesta"><button class="btn" id="send-guess">Enviar</button></div><div class="status" id="guess-ready"></div><div class="status" id="guess-status"></div></section>`;
  } else if (role === 'player') {
    controls = `<section class="card center" style="margin-top:16px"><div class="status">${escapeHtml(artist?.name || 'Tu equipo')} está dibujando. Ayúdale con ideas, pero no envíes respuestas.</div></section>`;
  }
  const scoreboard = `<div class="team-list" style="margin-top:16px">${game.teams.map((team) => `<div class="team"><h3>Equipo ${team + 1}</h3><div class="score">${state.scores?.[team] || 0}</div></div>`).join('')}</div>`;
  app.innerHTML = `${header}<section class="hero"><div class="eyebrow">Dibuja una palabra de cuidado y prevención</div><h1>${role === 'host' ? `Equipo ${game.drawerTeam + 1} está dibujando` : isDrawer ? 'Dibuja para que los demás adivinen' : isArtistTeam ? 'Apoya a quien dibuja' : 'Mira el tablero y adivina'}</h1><p>${role === 'host' ? 'El proyector muestra el tablero en vivo; la palabra se revela al terminar.' : `Dibuja: ${escapeHtml(artist?.name || 'participante')}.`}</p>${timer}<div class="pictionary-hint" id="pictionary-hint" aria-live="polite">${state.pictionaryHint ? `Pista: ${escapeHtml(state.pictionaryHint)}` : ''}</div><div class="status" id="guess-count">${game.guessCount} intentos</div></section><section class="card">${board}</section>${controls}${role === 'host' ? scoreboard : ''}`;
  drawPictionaryBoard(state.pictionaryBoard);
  if (isDrawer) bindPictionaryDrawing();
  if (role === 'player' && !isArtistTeam) {
    const input = document.querySelector('#guess-input');
    const sendGuess = () => {
      const guess = input.value.trim(); if (!guess) return;
      send('pictionaryGuess', { guess }); input.value = '';
    };
    document.querySelector('#send-guess').onclick = sendGuess;
    input.onkeydown = (event) => { if (event.key === 'Enter') sendGuess(); };
    syncPictionaryGuessAvailability();
  }
  startCountdowns();
}
function syncPictionaryGuessAvailability() {
  const input = document.querySelector('#guess-input'); const button = document.querySelector('#send-guess');
  if (!input || !button) return;
  const board = state?.pictionaryBoard;
  const ready = Boolean(board?.background || board?.strokes?.length);
  input.disabled = !ready; button.disabled = !ready;
  const status = document.querySelector('#guess-ready');
  if (status) status.textContent = ready ? '¡Ya pueden adivinar! Gana el primer equipo que escriba la palabra.' : 'Esperando el primer trazo o la foto del equipo dibujante…';
}
function bindPictionaryDrawing() {
  const canvas = document.querySelector('#drawing-board'); const context = canvas.getContext('2d');
  const colorInput = document.querySelector('#brush-color'); const sizeInput = document.querySelector('#brush-size');
  let points = []; let active = false; let color = colorInput.value; let width = Number(sizeInput.value) / canvas.width;
  const pointFrom = (event) => { const rect = canvas.getBoundingClientRect(); return [Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))]; };
  const redrawSegment = (from, to) => {
    context.strokeStyle = color; context.lineWidth = width * canvas.width; context.lineCap = 'round'; context.lineJoin = 'round';
    context.beginPath(); context.moveTo(from[0] * canvas.width, from[1] * canvas.height); context.lineTo(to[0] * canvas.width, to[1] * canvas.height); context.stroke();
  };
  canvas.onpointerdown = (event) => { event.preventDefault(); canvas.setPointerCapture(event.pointerId); active = true; points = [pointFrom(event)]; };
  canvas.onpointermove = (event) => { if (!active) return; event.preventDefault(); const next = pointFrom(event); redrawSegment(points.at(-1), next); points.push(next); };
  const finishStroke = () => {
    if (!active) return; active = false;
    if (points.length === 1) points.push(points[0]);
    const stride = Math.max(1, Math.ceil(points.length / 80));
    let compact = points.filter((_, index) => index % stride === 0);
    if (compact.length > 80) compact = compact.slice(0, 80);
    if (compact.length === 1) compact.push(compact[0]);
    send('pictionaryStroke', { stroke: { points: compact, color, width } });
  };
  canvas.onpointerup = finishStroke; canvas.onpointercancel = finishStroke;
  colorInput.oninput = () => { color = colorInput.value; };
  sizeInput.oninput = () => { width = Number(sizeInput.value) / canvas.width; };
  document.querySelector('#clear-drawing').onclick = () => send('pictionaryClear');
  document.querySelector('#finish-drawing').onclick = () => send('pictionaryFinish');
  document.querySelector('#drawing-photo').onchange = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('Selecciona una imagen válida.', '#drawing-status'); return; }
    setMessage('Preparando imagen de fondo…', '#drawing-status');
    try { send('pictionaryBackground', { content: await compressPhoto(file) }); setMessage('Imagen de fondo enviada. Ya puedes dibujar encima.', '#drawing-status'); }
    catch { setMessage('No se pudo preparar esa imagen. Prueba con otra.', '#drawing-status'); }
  };
}
function drawPictionaryBoard(board = {}) {
  const canvas = document.querySelector('#drawing-board'); if (!canvas) return;
  const token = ++boardRenderToken; const context = canvas.getContext('2d');
  const paint = () => {
    if (token !== boardRenderToken) return;
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    const drawStrokes = () => (board.strokes || []).forEach(drawStrokeOnBoard);
    if (!board.background) { drawStrokes(); return; }
    const image = new Image();
    image.onload = () => {
      if (token !== boardRenderToken) return;
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
      const width = image.width * scale; const height = image.height * scale;
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      (state?.pictionaryBoard?.strokes || board.strokes || []).forEach(drawStrokeOnBoard);
    };
    image.src = board.background;
  };
  paint();
}
function drawStrokeOnBoard(stroke) {
  const canvas = document.querySelector('#drawing-board'); if (!canvas || !stroke?.points?.length) return;
  const context = canvas.getContext('2d'); const points = stroke.points;
  context.strokeStyle = stroke.color || '#20233a'; context.lineWidth = (stroke.width || 0.008) * canvas.width; context.lineCap = 'round'; context.lineJoin = 'round';
  context.beginPath(); context.moveTo(points[0][0] * canvas.width, points[0][1] * canvas.height);
  if (points.length === 1) context.lineTo(points[0][0] * canvas.width, points[0][1] * canvas.height);
  else for (const point of points.slice(1)) context.lineTo(point[0] * canvas.width, point[1] * canvas.height);
  context.stroke();
}
function renderPictionaryReveal() {
  const game = state.pictionary; const result = game.result || {};
  const cycle = Math.floor(game.turnIndex / game.teams.length) + 1;
  const won = result.winnerTeam !== null && result.winnerTeam !== undefined;
  const board = `<canvas id="drawing-board" width="900" height="560" aria-label="Dibujo de la ronda" class="drawing-board cascade-current"></canvas>`;
  const previousBoards = pictionaryHistory.map((item, index) => `<article class="cascade-card" style="--cascade-order:${index}"><div class="cascade-label">Vuelta ${item.cycle} · Equipo ${item.drawerTeam + 1}</div><img class="cascade-image" src="${item.image}" alt="Dibujo anterior: ${escapeHtml(item.word)}"><div class="cascade-caption">${escapeHtml(item.word)}</div></article>`).join('');
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Vuelta ${cycle} · palabra revelada</div></header><section class="hero"><div class="eyebrow">Dibujo de campaña</div><h1>${escapeHtml(result.word || '')}</h1><p>${won ? `¡Equipo ${result.winnerTeam + 1} adivinó! Equipo ${result.drawerTeam + 1} dibujó.` : `Dibujó el Equipo ${result.drawerTeam + 1}. ${result.reason === 'timeout' ? 'Se acabó el tiempo.' : 'No hubo respuesta correcta.'}`}</p></section><section class="cascade-section"><div class="cascade-heading">${pictionaryHistory.length ? 'Galería acumulada de dibujos' : 'Dibujo de este turno'} <span>${game.turnIndex + 1} dibujos</span></div><div class="cascade-gallery">${previousBoards}<article class="cascade-card cascade-card-current" style="--cascade-order:${pictionaryHistory.length}"><div class="cascade-label">Vuelta ${cycle} · Equipo ${result.drawerTeam + 1}</div>${board}<div class="cascade-caption">${escapeHtml(result.word || '')}</div></article></div></section><div class="team-list" style="margin-top:16px">${game.teams.map((team) => `<div class="team"><h3>Equipo ${team + 1}</h3><div class="score">${state.scores?.[team] || 0}</div></div>`).join('')}</div>${role === 'host' ? '<div class="center pictionary-actions"><button class="btn" id="pictionary-next">Siguiente equipo</button><button class="btn secondary" id="pictionary-end">Terminar partida</button></div>' : '<p class="footer">El facilitador dará paso al siguiente equipo.</p>'}`;
  drawPictionaryBoard(state.pictionaryBoard);
  document.querySelector('#pictionary-next')?.addEventListener('click', () => send('pictionaryNext'));
  document.querySelector('#pictionary-end')?.addEventListener('click', () => send('pictionaryEnd'));
}
async function compressPhoto(file) {
  let bitmap;
  try { bitmap = await createImageBitmap(file); }
  catch {
    bitmap = await new Promise((resolve, reject) => {
      const image = new Image(); const objectUrl = URL.createObjectURL(file);
      image.onload = () => { URL.revokeObjectURL(objectUrl); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Imagen inválida')); };
      image.src = objectUrl;
    });
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  let result = '';
  for (const maxSide of [1280, 960, 720, 540]) {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    result = canvas.toDataURL('image/jpeg', 0.58);
    if (result.length <= 480000) break;
  }
  if (bitmap.close) bitmap.close();
  if (result.length > 480000) throw new Error('Imagen demasiado grande');
  return result;
}
function renderReveal() {
  const entries = state.chains || [];
  const tile = (entry, index) => `<article class="cascade-card" style="--cascade-order:${index}"><div class="cascade-label">${state.mode === 'memory' ? (index === 0 ? 'Dibujo modelo' : `Réplica ${index}`) : (index === 0 ? 'Frase inicial' : `Paso ${index}`)}</div>${entry.kind === 'image' ? `<img class="cascade-image" alt="${state.mode === 'memory' ? `Dibujo de la cadena, paso ${index + 1}` : 'Dibujo de la cadena'}" src="${entry.content}">` : `<div class="cascade-text">${escapeHtml(entry.content)}</div>`}</article>`;
  const teamCount = state.teamCount || 2;
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Revelación · ronda ${state.roundIndex + 1}</div></header><section class="hero"><div class="eyebrow">${escapeHtml(rounds[state.roundIndex].title)}</div><h1>${state.mode === 'memory' ? '¿Qué tan parecidas quedaron las réplicas?' : '¿Cómo cambió el mensaje?'}</h1><p>${state.mode === 'memory' ? 'Comparen cada réplica con el modelo y conversen sobre qué detalles fueron fáciles de recordar.' : 'Comparen la idea inicial con las interpretaciones. La actividad sirve para conversar, no para evaluar experiencias personales.'}</p></section>
    ${Array.from({ length: teamCount }, (_, team) => `<section class="cascade-section"><div class="cascade-heading">Equipo ${team + 1}<span>${(entries[team]?.entries || []).filter((entry) => entry.kind === 'image').length} dibujos</span></div><div class="cascade-gallery">${(entries[team]?.entries || []).map((entry, index) => `${index ? '<div class="cascade-arrow" aria-hidden="true">→</div>' : ''}${tile(entry, index)}`).join('')}</div></section>`).join('')}
    <section class="banner"><b>Conversación final:</b> ¿qué parte de la idea se mantuvo? ¿Qué acción segura recuerdan y a qué adulto podrían acudir? No compartan experiencias personales en público.</section><div class="team-list">${Array.from({ length: teamCount }, (_, team) => `<div class="team"><h3>Equipo ${team + 1}</h3><div class="score">${state.scores?.[team] || 0}</div></div>`).join('')}</div>${role==='host'?'<div class="center" style="margin-top:22px"><button class="btn" id="next">Siguiente cadena</button></div>':''}`;
  document.querySelector('#next')?.addEventListener('click', () => send('next'));
}
function renderEnd() {
  const teamCount = state.teamCount || 2;
  const pictionaryGallery = state.mode === 'pictionary' && pictionaryHistory.length ? `<section class="cascade-section"><div class="cascade-heading">Dibujos de la partida<span>${pictionaryHistory.length} turnos</span></div><div class="cascade-gallery">${pictionaryHistory.map((item, index) => `<article class="cascade-card" style="--cascade-order:${index}"><div class="cascade-label">Vuelta ${item.cycle} · Equipo ${item.drawerTeam + 1}</div><img class="cascade-image" src="${item.image}" alt="Dibujo de ${escapeHtml(item.word)}"><div class="cascade-caption">${escapeHtml(item.word)}</div></article>`).join('')}</div></section>` : '';
  app.innerHTML = `<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Cierre</div></header><section class="hero"><div class="eyebrow">Gracias por participar</div><h1>Una comunidad que escucha y protege.</h1><p>Puedes poner límites, pedir ayuda y acompañar a alguien sin juzgar.</p></section>${pictionaryGallery}<section class="card center"><div class="team-list">${Array.from({ length: teamCount }, (_, team) => `<div class="team"><h3>Equipo ${team + 1}</h3><div class="score">${state.scores?.[team] || 0}</div></div>`).join('')}</div><p>Si necesitas apoyo, acércate en privado al orientador o adulto responsable de protección de tu institución.</p>${role==='host'?'<button class="btn" id="again">Reiniciar partida</button>':''}</section>`;
  document.querySelector('#again')?.addEventListener('click', () => {
    if (role !== 'host') return;
    if (window.confirm('¿Reiniciar la partida para todos? Se borrará el progreso y volverán a la sala de equipos.')) send('reset');
  });
}
home();
