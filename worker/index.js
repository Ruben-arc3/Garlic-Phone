const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SEEDS = [
  'Si un secreto te hace sentir inseguro, puedes contárselo a una persona adulta de confianza.',
  'Cuando alguien dice “no”, respetamos su límite y nos detenemos.',
  'Escucha sin juzgar y acompaña a tu amigo a buscar ayuda de una persona adulta segura.',
  'No compartas una imagen por presión. Guarda evidencia si es seguro y pide apoyo.',
];
const MEMORY_DRAWINGS = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><path d="M160 35 238 65v55c0 42-34 67-78 84-44-17-78-42-78-84V65z" fill="#7ddcff" stroke="#26334a" stroke-width="8"/><path d="M160 72c-20-24-53 2-34 23l34 35 34-35c19-21-14-47-34-23z" fill="#ff7395" stroke="#26334a" stroke-width="6"/><circle cx="80" cy="170" r="10" fill="#c8f36a"/><circle cx="240" cy="170" r="10" fill="#c8f36a"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><path d="M110 182V95c0-12 18-13 18 0V65c0-13 19-13 19 0V51c0-13 19-13 19 0v15c0-13 19-13 19 0v42l15-18c9-10 24 1 17 12l-31 54c-9 16-22 26-42 26z" fill="#ffcf9f" stroke="#26334a" stroke-width="7" stroke-linejoin="round"/><path d="m232 60 8 17 18 2-14 12 4 18-16-9-16 9 4-18-14-12 18-2z" fill="#c8f36a" stroke="#26334a" stroke-width="4"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><circle cx="105" cy="80" r="25" fill="#ffcf9f" stroke="#26334a" stroke-width="6"/><circle cx="215" cy="80" r="25" fill="#ffcf9f" stroke="#26334a" stroke-width="6"/><path d="M55 175c4-42 21-63 50-63s46 21 50 63M165 175c4-42 21-63 50-63s46 21 50 63" fill="#7ddcff" stroke="#26334a" stroke-width="7" stroke-linecap="round"/><path d="m134 140 18 18 36-42" fill="none" stroke="#58a85b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><rect x="112" y="28" width="96" height="164" rx="18" fill="#7ddcff" stroke="#26334a" stroke-width="8"/><rect x="124" y="48" width="72" height="112" rx="5" fill="#fff"/><path d="M145 97v-9a15 15 0 0 1 30 0v9m-35 0h40v32h-40z" fill="#c8f36a" stroke="#26334a" stroke-width="6" stroke-linejoin="round"/><circle cx="160" cy="176" r="5" fill="#26334a"/><path d="M65 73c12-12 27-18 43-18m104 0c16 0 31 6 43 18" fill="none" stroke="#ff7395" stroke-width="8" stroke-linecap="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><path d="M75 70h170v100H75z" rx="25" fill="#fff" stroke="#26334a" stroke-width="7"/><path d="M75 145 47 171v-53" fill="#fff" stroke="#26334a" stroke-width="7" stroke-linejoin="round"/><path d="M150 101c-15-20-42 0-27 17l27 26 27-26c15-17-12-37-27-17z" fill="#ff7395"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><path d="M70 112a90 70 0 0 1 180 0z" fill="#c8f36a" stroke="#26334a" stroke-width="8"/><path d="M160 112v67m-40 0h80" stroke="#26334a" stroke-width="9" stroke-linecap="round"/><path d="m95 55-9 18m139-18 9 18" stroke="#7ddcff" stroke-width="8" stroke-linecap="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><path d="m160 35 78 60-20 92H102l-20-92z" fill="#ffcf9f" stroke="#26334a" stroke-width="8" stroke-linejoin="round"/><rect x="140" y="112" width="40" height="75" rx="18" fill="#7ddcff" stroke="#26334a" stroke-width="6"/><circle cx="160" cy="83" r="13" fill="#ff7395"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><path d="M160 35 238 65v55c0 42-34 67-78 84-44-17-78-42-78-84V65z" fill="#c8f36a" stroke="#26334a" stroke-width="8"/><path d="m122 111 25 25 53-59" fill="none" stroke="#26334a" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><circle cx="115" cy="80" r="25" fill="#ffcf9f" stroke="#26334a" stroke-width="6"/><circle cx="205" cy="80" r="25" fill="#ffcf9f" stroke="#26334a" stroke-width="6"/><path d="M65 178c5-43 20-62 50-62 20 0 35 12 43 38 8-26 23-38 47-38 30 0 45 19 50 62" fill="#ff7395" stroke="#26334a" stroke-width="7" stroke-linecap="round"/><path d="M137 145h46" stroke="#c8f36a" stroke-width="10" stroke-linecap="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><rect x="80" y="35" width="160" height="150" rx="15" fill="#fff" stroke="#26334a" stroke-width="7"/><path d="M110 80h100m-100 35h100m-100 35h52" stroke="#7ddcff" stroke-width="10" stroke-linecap="round"/><path d="m180 147 15 14 29-34" fill="none" stroke="#58a85b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><path d="M160 35v150M85 70h150M100 70l-40 65h80zm120 0-40 65h80z" fill="#7ddcff" stroke="#26334a" stroke-width="7" stroke-linejoin="round"/><path d="M115 185h90" stroke="#26334a" stroke-width="9" stroke-linecap="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><circle cx="160" cy="110" r="18" fill="#ff7395"/><circle cx="160" cy="58" r="24" fill="#c8f36a"/><circle cx="160" cy="162" r="24" fill="#c8f36a"/><circle cx="108" cy="110" r="24" fill="#7ddcff"/><circle cx="212" cy="110" r="24" fill="#7ddcff"/><path d="M160 80v12m0 36v10m-28-28h12m32 0h12" stroke="#26334a" stroke-width="6"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><path d="M90 45h140v140H90z" fill="#ffcf9f" stroke="#26334a" stroke-width="8"/><path d="M115 80h90m-90 30h90m-90 30h54" stroke="#26334a" stroke-width="7" stroke-linecap="round"/><circle cx="205" cy="160" r="16" fill="#c8f36a" stroke="#26334a" stroke-width="5"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><path d="M90 160 150 75l40 48 32-39 30 76z" fill="#7ddcff" stroke="#26334a" stroke-width="7" stroke-linejoin="round"/><circle cx="105" cy="65" r="18" fill="#c8f36a"/><path d="M60 185h200" stroke="#26334a" stroke-width="8" stroke-linecap="round"/><path d="m160 132 8 17 19 2-14 13 4 18-17-9-17 9 4-18-14-13 19-2z" fill="#ff7395" stroke="#26334a" stroke-width="4"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><circle cx="160" cy="73" r="27" fill="#ffcf9f" stroke="#26334a" stroke-width="6"/><path d="M105 184c5-58 23-84 55-84s50 26 55 84" fill="#ff7395" stroke="#26334a" stroke-width="7"/><path d="M82 120h50m56 0h50" stroke="#7ddcff" stroke-width="9" stroke-linecap="round"/><path d="m68 112 14 8-14 8m170-16 14 8-14 8" fill="none" stroke="#26334a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><path d="M75 170 160 55l85 115z" fill="#c8f36a" stroke="#26334a" stroke-width="8" stroke-linejoin="round"/><circle cx="160" cy="126" r="27" fill="#7ddcff" stroke="#26334a" stroke-width="6"/><path d="M160 108v20l14 10" fill="none" stroke="#26334a" stroke-width="6" stroke-linecap="round"/><path d="M105 184h110" stroke="#26334a" stroke-width="8" stroke-linecap="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><path d="M100 55h120v130H100z" fill="#fff" stroke="#26334a" stroke-width="7"/><path d="M160 55v130" stroke="#26334a" stroke-width="5"/><path d="M125 95h20m50 35h20" stroke="#ff7395" stroke-width="9" stroke-linecap="round"/><path d="m120 145 12 12 22-25m47 13 10 10 18-20" fill="none" stroke="#58a85b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"><rect width="320" height="220" rx="24" fill="#f8f5e8"/><path d="M72 145c27-55 57-55 88 0 31-55 61-55 88 0" fill="none" stroke="#7ddcff" stroke-width="13" stroke-linecap="round"/><circle cx="72" cy="145" r="20" fill="#ffcf9f" stroke="#26334a" stroke-width="5"/><circle cx="248" cy="145" r="20" fill="#ffcf9f" stroke="#26334a" stroke-width="5"/><circle cx="160" cy="82" r="23" fill="#ff7395" stroke="#26334a" stroke-width="5"/><path d="M160 106v36" stroke="#26334a" stroke-width="7" stroke-linecap="round"/></svg>',
];
const CAMPAIGN_WORDS = ['Policía', 'Teléfono', 'Familia', 'Colegio', 'Profesor', 'Amigo', 'Ayuda', 'Decir NO', 'Abrazo', 'Respeto', 'Cuerpo', 'Puerta', 'Alarma', 'Silbato', 'Alejarse', 'Hablar', 'Escuchar'];
const memoryDrawing = (index) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(MEMORY_DRAWINGS[index % MEMORY_DRAWINGS.length])}`;
const randomCode = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (byte) => CODE_CHARS[byte % CODE_CHARS.length]).join('');
const randomToken = () => `${crypto.randomUUID()}${crypto.randomUUID()}`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/create' && request.method === 'POST') {
      const settings = await request.json().catch(() => ({}));
      const teamCount = Math.min(15, Math.max(2, Number(settings.teamCount) || 2));
      const stepsCount = Math.min(10, Math.max(4, Number(settings.stepsCount) || 6));
      const turnSeconds = Math.min(300, Math.max(15, Number(settings.turnSeconds) || 60));
      const pictionaryRounds = Math.min(10, Math.max(1, Number(settings.pictionaryRounds) || 1));
      const mode = ['memory', 'pictionary'].includes(settings.mode) ? settings.mode : 'phrase';
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = randomCode();
        const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
        const token = randomToken();
        const response = await stub.fetch('https://room/init', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code, token, teamCount, stepsCount, pictionaryRounds, turnSeconds, mode, createOnly: true }),
        });
        if ((await response.json()).created) return Response.json({ code, token });
      }
      return Response.json({ error: 'No fue posible crear la sala. Intenta de nuevo.' }, { status: 503 });
    }
    if (url.pathname === '/health') return Response.json({ ok: true });
    if (url.pathname.startsWith('/room/')) {
      const code = url.pathname.split('/')[2]?.toUpperCase();
      if (!code || !/^[A-Z0-9]{5}$/.test(code)) return new Response('Código inválido', { status: 400 });
      return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
    }
    return new Response('Garlic Phone realtime API');
  },
};

export class Room {
  constructor(ctx) { this.ctx = ctx; this.state = null; this.ready = this.load(); }
  async load() {
    this.state = await this.ctx.storage.get('game') || {
      phase: 'lobby', code: '', hostToken: '', teamCount: 2, stepsCount: 6, pictionaryRounds: 1, turnSeconds: 60, mode: 'phrase',
      players: [], roundIndex: 0, scores: [0, 0], chains: [], memory: null, pictionary: null,
    };
    let migrated = false;
    if (!Number.isFinite(this.state.turnSeconds)) { this.state.turnSeconds = 60; migrated = true; }
    if (this.state.phase === 'relay') {
      for (const chain of this.state.chains) {
        if (chain.step < this.state.stepsCount && !Number.isFinite(chain.deadlineAt)) {
          chain.deadlineAt = Date.now() + this.state.turnSeconds * 1000; migrated = true;
        }
      }
    }
    if (migrated) await this.save();
  }
  async save() { await this.ctx.storage.put('game', this.state); }
  async fetch(request) {
    await this.ready;
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/init') {
      const data = await request.json();
      if (data.createOnly) {
        if (this.state.hostToken) return Response.json({ created: false });
        this.state.code = data.code; this.state.hostToken = data.token;
        this.state.teamCount = Math.min(15, Math.max(2, Number(data.teamCount) || 2));
        this.state.stepsCount = Math.min(10, Math.max(4, Number(data.stepsCount) || 6));
        this.state.turnSeconds = Math.min(300, Math.max(15, Number(data.turnSeconds) || 60));
        this.state.pictionaryRounds = Math.min(10, Math.max(1, Number(data.pictionaryRounds) || 1));
        this.state.mode = ['memory', 'pictionary'].includes(data.mode) ? data.mode : 'phrase';
        this.state.scores = Array(this.state.teamCount).fill(0);
        await this.save(); return Response.json({ created: true });
      }
      return Response.json({ ok: true });
    }
    if (url.pathname !== `/room/${this.state.code}` || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('No encontrado', { status: 404 });
    const role = url.searchParams.get('role'); const playerId = url.searchParams.get('playerId');
    if (!playerId || !['host', 'player'].includes(role)) return new Response('No autorizado', { status: 401 });
    if (role === 'host' && url.searchParams.get('token') !== this.state.hostToken) return new Response('Token incorrecto', { status: 403 });
    const exists = this.state.players.some((player) => player.id === playerId);
    if (role === 'player' && this.state.phase !== 'lobby' && !exists) return new Response('La partida ya comenzó', { status: 409 });
    const pair = new WebSocketPair(); this.ctx.acceptWebSocket(pair[1]); pair[1].serializeAttachment({ role, playerId });
    if (role === 'player' && !exists) { this.state.players.push({ id: playerId, name: 'Participante', team: 0 }); await this.save(); }
    await this.syncAlarm();
    await this.broadcast();
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  async webSocketMessage(ws, rawMessage) {
    await this.ready;
    let message; try { message = JSON.parse(rawMessage); } catch { return; }
    const meta = ws.deserializeAttachment(); if (!meta) return;
    const isHost = meta.role === 'host';
    if (message.type === 'team' && !isHost && this.state.phase === 'lobby') {
      const player = this.state.players.find((item) => item.id === meta.playerId); const team = Number(message.team);
      if (player && Number.isInteger(team) && team >= 0 && team < this.state.teamCount) {
        player.team = team; player.name = String(message.name || 'Participante').replace(/[<>]/g, '').slice(0, 18) || 'Participante';
      }
    } else if (message.type === 'start' && isHost && this.state.phase === 'lobby' && this.state.players.length) {
      this.state.roundIndex = 0;
      if (this.state.mode === 'pictionary') { this.state.phase = 'pictionary'; this.startPictionary(); }
      else { this.state.phase = 'relay'; this.startChains(); }
    } else if (message.type === 'submit' && !isHost && this.state.phase === 'relay') {
      await this.acceptContribution(meta.playerId, message);
    } else if (message.type === 'pictionaryBackground' && !isHost && this.state.phase === 'pictionary') {
      const accepted = await this.acceptPictionaryBackground(meta.playerId, message.content);
      try { ws.send(JSON.stringify({ type: 'pictionaryBackgroundResult', accepted })); } catch { /* socket already closed */ }
      if (!accepted) return;
    } else if (message.type === 'pictionaryStroke' && !isHost && this.state.phase === 'pictionary') {
      const stroke = this.acceptPictionaryStroke(meta.playerId, message.stroke);
      if (!stroke) return;
      await this.syncAlarm(); await this.save();
      for (const peer of this.ctx.getWebSockets()) { try { peer.send(JSON.stringify({ type: 'pictionaryStroke', stroke })); } catch { /* socket already closed */ } }
      return;
    } else if (message.type === 'pictionaryClear' && !isHost && this.state.phase === 'pictionary') {
      this.clearPictionaryStrokes(meta.playerId);
    } else if (message.type === 'pictionaryGuess' && !isHost && this.state.phase === 'pictionary') {
      const result = this.acceptPictionaryGuess(meta.playerId, message.guess);
      const correct = result?.correct === true;
      try { ws.send(JSON.stringify({ type: 'pictionaryGuessResult', correct })); } catch { /* socket already closed */ }
      if (result?.entry) {
        for (const peer of this.ctx.getWebSockets()) { try { peer.send(JSON.stringify({ type: 'pictionaryChat', entry: result.entry })); } catch { /* socket already closed */ } }
      }
      if (this.state.phase === 'pictionary') {
        await this.save();
        for (const peer of this.ctx.getWebSockets()) { try { peer.send(JSON.stringify({ type: 'pictionaryStatus', guessCount: this.state.pictionary.guessCount })); } catch { /* socket already closed */ } }
        return;
      }
    } else if (message.type === 'pictionaryFinish' && !isHost && this.state.phase === 'pictionary') {
      this.finishPictionaryTurn('finished', meta.playerId);
    } else if (message.type === 'pictionaryNext' && isHost && this.state.phase === 'pictionaryReveal') {
      await this.clearPictionaryBackground();
      const game = this.state.pictionary; game.turnIndex++;
      if (game.turnIndex >= game.teams.length * (game.roundLimit || this.state.pictionaryRounds || 1)) this.state.phase = 'end';
      else { this.state.phase = 'pictionary'; this.beginPictionaryTurn(); }
    } else if (message.type === 'pictionaryEnd' && isHost && this.state.phase === 'pictionaryReveal') {
      this.state.phase = 'end';
    } else if (message.type === 'pictionaryTieBreak' && isHost && this.state.phase === 'end' && this.state.mode === 'pictionary') {
      const teams = this.state.pictionary?.teams || [];
      const highestScore = Math.max(...teams.map((team) => this.state.scores[team] || 0));
      const tiedTeams = teams.filter((team) => (this.state.scores[team] || 0) === highestScore);
      if (tiedTeams.length > 1) {
        await this.clearPictionaryBackground();
        this.state.phase = 'pictionary';
        this.startPictionary(tiedTeams);
      }
    } else if (message.type === 'next' && isHost && this.state.phase === 'reveal') {
      await this.clearPhotos(); this.state.roundIndex++;
      if (this.state.roundIndex >= SEEDS.length) this.state.phase = 'end';
      else { this.state.phase = 'relay'; this.startChains(); }
    } else if (message.type === 'reset' && isHost && this.state.phase === 'end') {
      await this.clearPhotos(); this.state.phase = 'lobby'; this.state.roundIndex = 0;
      await this.clearPictionaryBackground();
      this.state.scores = Array(this.state.teamCount).fill(0); this.state.chains = []; this.state.memory = null; this.state.pictionary = null;
    }
    await this.syncAlarm(); await this.save(); await this.broadcast();
  }
  async acceptContribution(playerId, message) {
    const player = this.state.players.find((item) => item.id === playerId); const chain = player && this.state.chains[player.team];
    if (this.state.mode === 'memory') return this.acceptMemoryContribution(player, message);
    if (!player || !chain || chain.step >= this.chainLength() || Number(message.team) !== player.team) return;
    if (chain.deadlineAt && chain.deadlineAt <= Date.now()) {
      await this.advanceExpiredTurns();
      return;
    }
    if (this.state.mode === 'memory' && chain.previewUntil && chain.previewUntil > Date.now()) return;
    const teamPlayers = this.state.players.filter((item) => item.team === player.team);
    const expectedPlayer = teamPlayers[chain.step % teamPlayers.length]; const expectedKind = this.state.mode === 'memory' ? 'image' : (chain.step % 2 === 0 ? 'image' : 'text');
    const content = typeof message.content === 'string' ? message.content.trim() : '';
    const validImage = message.kind !== 'image' || (/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(content) && content.length <= 480000);
    const validText = message.kind !== 'text' || content.length <= 140;
    if (expectedPlayer?.id !== playerId || message.kind !== expectedKind || !content || !validImage || !validText) return;
    if (expectedKind === 'image') {
      const photoKey = `photo:${this.state.roundIndex}:${player.team}:${chain.step}`;
      await this.ctx.storage.put(photoKey, content); chain.entries.push({ kind: 'image', photoKey });
    } else chain.entries.push({ kind: 'text', content });
    chain.step++;
    chain.previewUntil = null;
    chain.deadlineAt = chain.step < this.chainLength() ? Date.now() + this.state.turnSeconds * 1000 : null;
    this.finishRoundIfComplete();
  }
  startChains() {
    if (this.state.mode === 'memory') {
      const teams = [...new Set(this.state.players.map((player) => player.team))].sort((a, b) => a - b);
      const previewUntil = Date.now() + 8000;
      const chains = Array.from({ length: this.state.teamCount }, () => ({ step: 0, entries: [] }));
      teams.forEach((team, index) => {
        chains[team] = { step: 0, entries: [{ kind: 'image', content: memoryDrawing((index + this.state.roundIndex) % MEMORY_DRAWINGS.length) }] };
      });
      this.state.memory = {
        teams, stage: 0, doneTeams: [], chains,
        previewUntil, deadlineAt: previewUntil + this.state.turnSeconds * 1000,
      };
      this.state.chains = [];
      return;
    }
    const deadlineAt = Date.now() + this.state.turnSeconds * 1000;
    const previewUntil = this.state.mode === 'memory' ? Date.now() + 8000 : null;
    const actionDeadlineAt = previewUntil ? previewUntil + this.state.turnSeconds * 1000 : deadlineAt;
    const chainLength = this.chainLength();
    this.state.chains = Array.from({ length: this.state.teamCount }, (_, team) => {
      if (!this.state.players.some((player) => player.team === team)) return { step: chainLength, entries: [], deadlineAt: null, previewUntil: null };
      const seed = this.state.mode === 'memory'
        ? { kind: 'image', content: memoryDrawing(this.state.roundIndex) }
        : { kind: 'text', content: SEEDS[this.state.roundIndex % SEEDS.length] };
      return { step: 0, entries: [seed], deadlineAt: actionDeadlineAt, previewUntil };
    });
  }
  chainLength() { return this.state.mode === 'memory' ? 1 : this.state.stepsCount; }
  startPictionary(eligibleTeams = null) {
    const activeTeams = eligibleTeams || this.state.players.map((player) => player.team);
    const teams = [...new Set(activeTeams)].sort((a, b) => a - b);
    this.state.pictionary = { teams, tieBreak: Boolean(eligibleTeams), roundLimit: eligibleTeams ? 1 : (this.state.pictionaryRounds || 1), turnIndex: 0, drawerTeam: null, drawerId: null, word: '', wordDeck: [], deadlineAt: null, backgroundKey: null, strokes: [], guessedTeams: [], guessCount: 0, result: null, chat: [] };
    this.beginPictionaryTurn();
  }
  shuffleCampaignWords() {
    const words = [...CAMPAIGN_WORDS];
    for (let index = words.length - 1; index > 0; index--) {
      const random = new Uint32Array(1); crypto.getRandomValues(random);
      const swapIndex = random[0] % (index + 1);
      [words[index], words[swapIndex]] = [words[swapIndex], words[index]];
    }
    return words;
  }
  shuffleHintPositions(positions) {
    const shuffled = [...positions];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const random = new Uint32Array(1); crypto.getRandomValues(random);
      const swapIndex = random[0] % (index + 1);
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }
  beginPictionaryTurn() {
    const game = this.state.pictionary;
    const drawerTeam = game.teams[game.turnIndex % game.teams.length];
    const players = this.state.players.filter((player) => player.team === drawerTeam);
    game.drawerTeam = drawerTeam;
    game.drawerId = players[game.turnIndex % players.length]?.id;
    if (!game.wordDeck?.length) game.wordDeck = this.shuffleCampaignWords();
    game.word = game.wordDeck.pop();
    game.hintOrder = this.shuffleHintPositions([...game.word].map((char, index) => /[\p{L}\p{N}]/u.test(char) ? index : -1).filter((index) => index >= 0));
    const now = Date.now();
    game.deadlineAt = now + this.state.turnSeconds * 1000;
    game.hintLevel = 0;
    game.hintStartedAt = null; game.nextHintAt = null;
    game.backgroundKey = null; game.strokes = []; game.guessedTeams = []; game.guessCount = 0; game.result = null;
  }
  startPictionaryHints(game) {
    if (game.hintStartedAt) return;
    game.hintStartedAt = Date.now();
    game.nextHintAt = game.hintStartedAt + Math.max(1000, Math.floor(this.state.turnSeconds * 1000 / 6));
  }
  pictionaryHint(word, level, hintOrder) {
    const letters = [...word].map((char, index) => /[\p{L}\p{N}]/u.test(char) ? index : -1).filter((index) => index >= 0);
    const revealCount = Math.min(Math.max(0, letters.length - 1), Math.floor(letters.length * level / 6));
    const revealed = new Set((hintOrder?.length ? hintOrder : letters).slice(0, revealCount));
    return [...word].map((char, index) => /[\p{L}\p{N}]/u.test(char) ? (revealed.has(index) ? char.toLocaleUpperCase('es') : '＿') : char).join(' ');
  }
  async acceptPictionaryBackground(playerId, content) {
    const game = this.state.pictionary;
    if (!game || game.drawerId !== playerId || game.deadlineAt <= Date.now()) return false;
    if (typeof content !== 'string' || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(content) || content.length > 480000) return false;
    game.backgroundKey = `pictionary:background:${game.turnIndex}`;
    await this.ctx.storage.put(game.backgroundKey, content);
    this.startPictionaryHints(game);
    return true;
  }
  acceptPictionaryStroke(playerId, stroke) {
    const game = this.state.pictionary;
    if (!game || game.drawerId !== playerId || game.deadlineAt <= Date.now() || game.strokes.length >= 250) return;
    if (!stroke || !/^#[0-9a-f]{6}$/i.test(stroke.color) || !Number.isFinite(stroke.width) || stroke.width < 0.001 || stroke.width > 0.04) return;
    if (!Array.isArray(stroke.points) || stroke.points.length < 2 || stroke.points.length > 80) return;
    if (!stroke.points.every((point) => Array.isArray(point) && point.length === 2 && point.every((value) => Number.isFinite(value) && value >= 0 && value <= 1))) return;
    this.startPictionaryHints(game);
    game.strokes.push({ color: stroke.color, width: stroke.width, points: stroke.points });
    return game.strokes.at(-1);
  }
  clearPictionaryStrokes(playerId) {
    const game = this.state.pictionary;
    if (game?.drawerId === playerId) game.strokes = [];
  }
  acceptPictionaryGuess(playerId, guess) {
    const game = this.state.pictionary;
    const player = this.state.players.find((item) => item.id === playerId);
    if (!game || !player || !game.teams.includes(player.team) || player.team === game.drawerTeam || game.deadlineAt <= Date.now() || (!game.backgroundKey && !game.strokes.length)) return null;
    game.chat ||= [];
    const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanGuess = String(guess || '').trim().slice(0, 50);
    if (!normalize(cleanGuess)) return null;
    game.guessCount++;
    if (normalize(cleanGuess) !== normalize(game.word)) {
      const entry = { kind: 'guess', team: player.team, playerName: player.name, text: cleanGuess, at: Date.now() };
      game.chat.push(entry); if (game.chat.length > 80) game.chat.shift();
      return { correct: false, entry };
    }
    game.guessedTeams.push(player.team);
    this.finishPictionaryTurn('guessed', null, player.team);
    return { correct: true };
  }
  finishPictionaryTurn(reason, playerId = null, winnerTeam = null) {
    const game = this.state.pictionary;
    if (!game || this.state.phase !== 'pictionary' || (playerId && game.drawerId !== playerId)) return false;
    game.chat ||= [];
    game.result = { drawerTeam: game.drawerTeam, winnerTeam, reason };
    if (winnerTeam !== null) {
      this.state.scores[winnerTeam] = (this.state.scores[winnerTeam] || 0) + 2;
      this.state.scores[game.drawerTeam] = (this.state.scores[game.drawerTeam] || 0) + 1;
      game.chat.push({ kind: 'correct', team: winnerTeam, text: `¡Equipo ${winnerTeam + 1} adivinó! +2 puntos`, at: Date.now() });
      game.chat.push({ kind: 'system', team: game.drawerTeam, text: `Equipo ${game.drawerTeam + 1} suma 1 punto por dibujar`, at: Date.now() });
    } else {
      game.chat.push({ kind: 'system', team: game.drawerTeam, text: `Terminó el turno del Equipo ${game.drawerTeam + 1} sin aciertos`, at: Date.now() });
    }
    if (game.chat.length > 80) game.chat = game.chat.slice(-80);
    this.state.phase = 'pictionaryReveal';
    return true;
  }
  async clearPictionaryBackground() {
    const key = this.state.pictionary?.backgroundKey;
    if (key) await this.ctx.storage.delete(key);
    if (this.state.pictionary) this.state.pictionary.backgroundKey = null;
  }
  async acceptMemoryContribution(player, message) {
    const memory = this.state.memory;
    if (!player || !memory || Number(message.team) !== player.team || memory.doneTeams.includes(player.team)) return;
    const teamIndex = memory.teams.indexOf(player.team);
    if (teamIndex < 0) return;
    if (memory.deadlineAt <= Date.now()) { await this.advanceExpiredTurns(); return; }
    if (memory.previewUntil && memory.previewUntil > Date.now()) return;
    const players = this.state.players.filter((item) => item.team === player.team);
    const expectedPlayer = players[memory.stage % players.length];
    const content = typeof message.content === 'string' ? message.content.trim() : '';
    if (expectedPlayer?.id !== player.id || message.kind !== 'image' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(content) || content.length > 480000) return;
    const originIndex = (teamIndex - memory.stage + memory.teams.length) % memory.teams.length;
    const originTeam = memory.teams[originIndex];
    const photoKey = `photo:${this.state.roundIndex}:memory:${memory.stage}:${player.team}`;
    await this.ctx.storage.put(photoKey, content);
    memory.chains[originTeam].entries.push({ kind: 'image', photoKey });
    memory.doneTeams.push(player.team);
    if (memory.doneTeams.length === memory.teams.length) this.advanceMemoryStage();
  }
  advanceMemoryStage() {
    const memory = this.state.memory;
    if (!memory || memory.doneTeams.length < memory.teams.length) return;
    if (memory.stage + 1 >= memory.teams.length) {
      this.state.phase = 'reveal';
      this.state.scores = this.state.scores.map((score, team) => score + (this.state.players.some((item) => item.team === team) ? 1 : 0));
      return;
    }
    memory.stage++;
    memory.doneTeams = [];
    memory.previewUntil = Date.now() + 8000;
    memory.deadlineAt = memory.previewUntil + this.state.turnSeconds * 1000;
  }
  async syncAlarm() {
    if (this.state.phase === 'pictionary' && this.state.pictionary?.deadlineAt) {
      const game = this.state.pictionary;
      const nextAlarm = game.nextHintAt ? Math.min(game.deadlineAt, game.nextHintAt) : game.deadlineAt;
      await this.ctx.storage.setAlarm(nextAlarm); return;
    }
    if (this.state.phase !== 'relay') { await this.ctx.storage.deleteAlarm(); return; }
    if (this.state.mode === 'memory' && this.state.memory) {
      const deadlines = [this.state.memory.previewUntil, this.state.memory.deadlineAt].filter(Number.isFinite);
      if (deadlines.length) await this.ctx.storage.setAlarm(Math.min(...deadlines));
      else await this.ctx.storage.deleteAlarm();
      return;
    }
    const deadlines = this.state.chains.flatMap((chain) => [chain.deadlineAt, chain.previewUntil]).filter((deadline) => Number.isFinite(deadline));
    if (deadlines.length) await this.ctx.storage.setAlarm(Math.min(...deadlines));
    else await this.ctx.storage.deleteAlarm();
  }
  finishRoundIfComplete() {
    if (!this.state.chains.length || !this.state.chains.every((chain) => chain.step >= this.chainLength())) return;
    this.state.phase = 'reveal';
    this.state.scores = this.state.scores.map((score, team) => score + (this.state.players.some((player) => player.team === team) ? 1 : 0));
  }
  async advanceExpiredTurns() {
    const now = Date.now();
    if (this.state.mode === 'memory' && this.state.memory) {
      const memory = this.state.memory;
      if (memory.previewUntil && memory.previewUntil <= now) memory.previewUntil = null;
      if (memory.deadlineAt <= now && this.state.phase === 'relay') {
        for (const team of memory.teams) {
          if (memory.doneTeams.includes(team)) continue;
          const teamIndex = memory.teams.indexOf(team);
          const originIndex = (teamIndex - memory.stage + memory.teams.length) % memory.teams.length;
          const originTeam = memory.teams[originIndex];
          memory.chains[originTeam].entries.push({ kind: 'text', content: 'Este equipo no alcanzó a enviar una réplica en este turno.' });
          memory.doneTeams.push(team);
        }
        this.advanceMemoryStage();
      }
      await this.syncAlarm(); await this.save(); await this.broadcast();
      return;
    }
    let previewExpired = false;
    for (const chain of this.state.chains) {
      if (chain.previewUntil && chain.previewUntil <= now) { chain.previewUntil = null; previewExpired = true; }
      if (chain.step < this.chainLength() && chain.deadlineAt && chain.deadlineAt <= now) {
        chain.entries.push({ kind: 'text', content: 'El tiempo terminó; el equipo continúa al siguiente turno.' });
        chain.step++;
        chain.deadlineAt = chain.step < this.chainLength() ? now + this.state.turnSeconds * 1000 : null;
        chain.previewUntil = null;
      }
    }
    this.finishRoundIfComplete();
    await this.syncAlarm(); await this.save();
    if (previewExpired || this.state.phase !== 'relay' || this.ctx.getWebSockets().length) await this.broadcast();
  }
  async alarm() {
    await this.ready;
    if (this.state.phase === 'pictionary' && this.state.pictionary) {
      const game = this.state.pictionary; const now = Date.now();
      if (game.deadlineAt <= now) {
        this.finishPictionaryTurn('timeout'); await this.syncAlarm(); await this.save(); await this.broadcast(); return;
      }
      if (game.hintLevel < 6 && game.nextHintAt && game.nextHintAt <= now) {
        game.hintLevel++;
        game.nextHintAt = game.hintLevel < 6 ? Math.min(game.deadlineAt, now + Math.max(1000, Math.floor(this.state.turnSeconds * 1000 / 6))) : null;
        await this.syncAlarm(); await this.save(); await this.broadcast(); return;
      }
    }
    if (this.state.phase === 'relay') await this.advanceExpiredTurns();
  }
  async clearPhotos() {
    const photos = await this.ctx.storage.list({ prefix: 'photo:' });
    if (photos.size) await this.ctx.storage.delete([...photos.keys()]);
  }
  async webSocketClose(ws) {
    const meta = ws.deserializeAttachment(); if (meta?.role !== 'player') return;
    await this.ready; await this.broadcast();
  }
  async hydrateEntry(entry) {
    if (entry.kind !== 'image' || entry.content) return entry;
    return { kind: 'image', content: await this.ctx.storage.get(entry.photoKey) || '' };
  }
  async hydrateChains(chains) {
    return Promise.all(chains.map(async (chain) => ({ step: chain.step, deadlineAt: chain.deadlineAt || null, entries: await Promise.all(chain.entries.map((entry) => this.hydrateEntry(entry))) })));
  }
  async broadcast() {
    const players = this.state.players;
    for (const ws of this.ctx.getWebSockets()) {
      const meta = ws.deserializeAttachment(); const mine = meta?.role === 'player' ? players.find((player) => player.id === meta.playerId) : null;
      const teamPlayers = mine ? players.filter((player) => player.team === mine.team) : [];
      const playerIndex = mine ? teamPlayers.findIndex((player) => player.id === mine.id) : -1;
      let chains = this.state.chains.map((chain) => ({ step: chain.step, deadlineAt: chain.deadlineAt || null, previewUntil: chain.previewUntil || null, entries: [] }));
      let memoryClue = null;
      let pictionaryState = null; let pictionaryWord = null; let pictionaryHint = null; let pictionaryBoard = null;
      const memory = this.state.memory;
      const pictionary = this.state.pictionary;
      if (pictionary && ['pictionary', 'pictionaryReveal'].includes(this.state.phase)) {
        const isReveal = this.state.phase === 'pictionaryReveal';
        const publicResult = pictionary.result ? { drawerTeam: pictionary.result.drawerTeam, winnerTeam: pictionary.result.winnerTeam, reason: pictionary.result.reason } : null;
        pictionaryState = isReveal
          ? { teams: pictionary.teams, tieBreak: Boolean(pictionary.tieBreak), roundLimit: pictionary.roundLimit, turnIndex: pictionary.turnIndex, drawerTeam: pictionary.drawerTeam, deadlineAt: pictionary.deadlineAt, guessCount: pictionary.guessCount, result: publicResult, chat: pictionary.chat || [] }
          : { teams: pictionary.teams, tieBreak: Boolean(pictionary.tieBreak), roundLimit: pictionary.roundLimit, turnIndex: pictionary.turnIndex, drawerTeam: pictionary.drawerTeam, deadlineAt: pictionary.deadlineAt, guessCount: pictionary.guessCount, result: null, chat: pictionary.chat || [] };
        if (!isReveal && meta?.role === 'player' && meta.playerId === pictionary.drawerId) pictionaryWord = pictionary.word;
        const hasDrawing = Boolean(pictionary.backgroundKey || pictionary.strokes.length);
        if (!pictionary.hintOrder) pictionary.hintOrder = this.shuffleHintPositions([...pictionary.word].map((char, index) => /[\p{L}\p{N}]/u.test(char) ? index : -1).filter((index) => index >= 0));
        if (!isReveal && hasDrawing && (meta?.role === 'host' || (mine && mine.team !== pictionary.drawerTeam))) pictionaryHint = this.pictionaryHint(pictionary.word, pictionary.hintLevel || 0, pictionary.hintOrder);
        pictionaryBoard = {
          background: pictionary.backgroundKey ? await this.ctx.storage.get(pictionary.backgroundKey) || '' : '',
          strokes: pictionary.strokes,
        };
      }
      if (this.state.phase === 'reveal') {
        chains = await this.hydrateChains(this.state.mode === 'memory' && memory ? memory.chains : this.state.chains);
      }
      else if (this.state.mode === 'memory' && memory) {
        if (mine) {
          const teamIndex = memory.teams.indexOf(mine.team);
          const teamIsPending = teamIndex >= 0 && !memory.doneTeams.includes(mine.team);
          const expectedPlayer = teamIsPending ? teamPlayers[memory.stage % Math.max(teamPlayers.length, 1)] : null;
          if (expectedPlayer?.id === mine.id && memory.previewUntil && memory.previewUntil > Date.now()) {
            const originIndex = (teamIndex - memory.stage + memory.teams.length) % memory.teams.length;
            const originTeam = memory.teams[originIndex];
            const entries = memory.chains[originTeam].entries;
            const latestDrawing = [...entries].reverse().find((entry) => entry.kind === 'image');
            if (latestDrawing) memoryClue = await this.hydrateEntry(latestDrawing);
          }
        }
      }
      else if (mine && this.state.phase === 'relay') {
        const chain = this.state.chains[mine.team]; const clue = chain.entries.at(-1);
        const teamPlayers = players.filter((player) => player.team === mine.team);
        const isCurrentPlayer = teamPlayers[chain.step % Math.max(teamPlayers.length, 1)]?.id === mine.id;
        const memoryHidden = this.state.mode === 'memory' && chain.step === 0 && (!chain.previewUntil || chain.previewUntil <= Date.now());
        const visibleClue = isCurrentPlayer && !memoryHidden ? clue : null;
        chains[mine.team] = { step: chain.step, deadlineAt: chain.deadlineAt || null, previewUntil: chain.previewUntil || null, entries: visibleClue ? [await this.hydrateEntry(visibleClue)] : [] };
      }
      const payload = {
        type: 'state', state: {
          phase: this.state.phase, players, roundIndex: this.state.roundIndex, scores: this.state.scores,
          chains, teamCount: this.state.teamCount, stepsCount: this.state.stepsCount, pictionaryRounds: this.state.pictionaryRounds || 1, turnSeconds: this.state.turnSeconds, mode: this.state.mode,
          memory: this.state.mode === 'memory' && memory ? { teams: memory.teams, stage: memory.stage, doneTeams: memory.doneTeams, deadlineAt: memory.deadlineAt, previewUntil: memory.previewUntil } : null,
          memoryClue,
          pictionary: pictionaryState, pictionaryWord, pictionaryHint, pictionaryBoard,
          mine: mine ? { id: mine.id, team: mine.team, index: playerIndex } : null,
        },
      };
      try { ws.send(JSON.stringify(payload)); } catch { /* socket already closed */ }
    }
  }
}
