/* Realtime API is served from this Pages origin through Pages Functions. */
const REALTIME_URL = window.REALTIME_URL || location.origin;
const app=document.querySelector('#app');

// --- SISTEMA DE CATEGORÍAS DINÁMICAS ---
const CATEGORIES = {
  secretos: [
    "Un amigo te pide guardar un secreto que te hace sentir inseguro",
    "Alguien te muestra algo en el celular y te pide no decir nada a tus padres",
    "Te piden compartir una foto tuya y te sientes incómodo"
  ],
  limites: [
    "Una persona te toca el hombro sin permiso mientras juegan",
    "Te invaden el espacio personal en el banco del escuela",
    "Alguien te pide que hagas algo que no te parece bien"
  ],
  apoyo: [
    "Tu compañero dice que se siente triste y nadie más nota",
    "Alguien en tu equipo quiere hablar con un adulto pero tiene miedo",
    "Ves a alguien siendo excluido y no sabes qué hacer"
  ]
};

function getRandomRound() {
  const keys = Object.keys(CATEGORIES);
  const categoryKey = keys[Math.floor(Math.random() * keys.length)];
  const phrases = CATEGORIES[categoryKey];
  const seed = phrases[Math.floor(Math.random() * phrases.length)];
  return {title: categoryKey[0].toUpperCase() + categoryKey.slice(1), seed};
}

// Seleccionar ronda inicial de forma dinámica
let currentRound = getRandomRound();
const rounds = [currentRound];
// ----------------------

// --- TIMER POR TURNO ---
const TURN_TIME = 45; // segundos que tiene cada equipo por turno
let turnTimer = null;
let turnTimerSeconds = TURN_TIME;

function startTurnTimer() {
  if (turnTimer) clearInterval(turnTimer);
  turnTimerSeconds = TURN_TIME;
  const timerEl = document.createElement('div');
  timerEl.className = 'turn-timer';
  timerEl.innerHTML = `<span>${turnTimerSeconds}</span>`;
  const hero = app.querySelector('.hero');
  if (hero && !document.querySelector('.turn-timer')) {
    hero.appendChild(timerEl);
  }
  
  turnTimer = setInterval(() => {
    turnTimerSeconds--;
    timerEl.querySelector('span').textContent = turnTimerSeconds;
    if (turnTimerSeconds <= 5) {
      timerEl.style.color = '#ff7395';
    }
    if (turnTimerSeconds <= 0) {
      clearInterval(turnTimer);
      timerEl.remove();
      message('⏰ Tiempo agotado! Pasando el turno automáticamente.');
      send('next-turn');
    }
  }, 1000);
}

function stopTurnTimer() {
  if (turnTimer) {
    clearInterval(turnTimer);
    turnTimer = null;
    const el = document.querySelector('.turn-timer');
    if (el) el.remove();
  }
}
// ----------------------

let socket=null, state=null, room='', playerId=localStorage.getItem('voces-player')||crypto.randomUUID(), role='';
localStorage.setItem('voces-player',playerId);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
function send(type,data={}){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type,...data,playerId}));}
function connect(code,as,token=''){room=code.toUpperCase();role=as;const url=new URL(`/room/${room}`,REALTIME_URL);url.protocol=url.protocol==='https:'?'wss:':'ws:';url.searchParams.set('role',as);url.searchParams.set('playerId',playerId);if(token)url.searchParams.set('token',token);socket=new WebSocket(url);socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='state'){state=m.state;render();}if(m.type==='error')message(m.message);};socket.onclose=()=>{if(app.dataset.screen!=='home')message('Se perdió la conexión. Recarga para volver a entrar.');};socket.onerror=()=>message('No se pudo conectar con la sala. Revisa la dirección del servidor.');}
function message(s){const n=document.querySelector('.status');if(n)n.textContent=s;}
function home(){socket?.close();app.dataset.screen='home';app.className='shell';app.innerHTML=`<header class="top"><div class="brand">VOCES <span>EN EQUIPO</span></div><div class="tag">Juego educativo en vivo</div></header><section class="hero"><div class="eyebrow">Aprender jugando · cuidarnos en comunidad</div><h1>Las buenas respuestas<br>se construyen en equipo.</h1><p>Una dinámica de situaciones ficticias para practicar límites, apoyo y decisiones seguras.</p></section><section class="home-grid"><article class="card"><div class="eyebrow">Para el facilitador</div><h2>Crear una sala</h2><p>Proyecta el código y juega con el grupo desde el computador.</p><label class="field-label" for="host-name">Nombre visible</label><input class="input" id="host-name" maxlength="24" placeholder="Facilitador/a" value="Facilitador/a"><button class="btn full" id="create">Crear sala en vivo</button><div class="status" id="host-status"></div></article><article class="card"><div class="eyebrow">Para estudiantes</div><h2>Unirse al juego</h2><p>Entra desde tu celular con el código que ves en la pantalla.</p><label class="field-label" for="code">Código de sala</label><input class="input" id="code" maxlength="5" placeholder="ABCDE" autocomplete="one-time-code"><label class="field-label" for="nickname">Apodo (sin apellidos)</label><input class="input" id="nickname" maxlength="18" placeholder="Nombre o apodo"><button class="btn secondary full" id="join">Unirme a la sala</button><div class="status" id="join-status"></div></article></section><p class="footer">No compartas experiencias personales en el juego. Si necesitas hablar, acércate en privado al adulto designado por tu institución.</p>`;
document.querySelector('#create').onclick=create;document.querySelector('#join').onclick=join;const codeInput=document.querySelector('#code');codeInput.oninput=e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'');const invited=new URLSearchParams(location.search).get('code');if(invited)codeInput.value=invited.toUpperCase();