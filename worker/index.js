const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SEEDS = [
  'Si un secreto te hace sentir inseguro, puedes contárselo a una persona adulta de confianza.',
  'Cuando alguien dice “no”, respetamos su límite y nos detenemos.',
  'Escucha sin juzgar y acompaña a tu amigo a buscar ayuda de una persona adulta segura.',
  'No compartas una imagen por presión. Guarda evidencia si es seguro y pide apoyo.',
];
const randomCode = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (byte) => CODE_CHARS[byte % CODE_CHARS.length]).join('');
const randomToken = () => `${crypto.randomUUID()}${crypto.randomUUID()}`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/create' && request.method === 'POST') {
      const settings = await request.json().catch(() => ({}));
      const teamCount = Math.min(8, Math.max(2, Number(settings.teamCount) || 2));
      const stepsCount = Math.min(10, Math.max(4, Number(settings.stepsCount) || 6));
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = randomCode();
        const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
        const token = randomToken();
        const response = await stub.fetch('https://room/init', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code, token, teamCount, stepsCount, createOnly: true }),
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
      phase: 'lobby', code: '', hostToken: '', teamCount: 2, stepsCount: 6,
      players: [], roundIndex: 0, scores: [0, 0], chains: [],
    };
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
        this.state.teamCount = Math.min(8, Math.max(2, Number(data.teamCount) || 2));
        this.state.stepsCount = Math.min(10, Math.max(4, Number(data.stepsCount) || 6));
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
      this.state.phase = 'relay'; this.state.roundIndex = 0; this.startChains();
    } else if (message.type === 'submit' && !isHost && this.state.phase === 'relay') {
      await this.acceptContribution(meta.playerId, message);
    } else if (message.type === 'next' && isHost && this.state.phase === 'reveal') {
      await this.clearPhotos(); this.state.roundIndex++;
      if (this.state.roundIndex >= SEEDS.length) this.state.phase = 'end';
      else { this.state.phase = 'relay'; this.startChains(); }
    } else if (message.type === 'reset' && isHost) {
      await this.clearPhotos(); this.state.phase = 'lobby'; this.state.roundIndex = 0;
      this.state.scores = Array(this.state.teamCount).fill(0); this.state.chains = [];
    }
    await this.save(); await this.broadcast();
  }
  async acceptContribution(playerId, message) {
    const player = this.state.players.find((item) => item.id === playerId); const chain = player && this.state.chains[player.team];
    if (!player || !chain || chain.step >= this.state.stepsCount || Number(message.team) !== player.team) return;
    const teamPlayers = this.state.players.filter((item) => item.team === player.team);
    const expectedPlayer = teamPlayers[chain.step % teamPlayers.length]; const expectedKind = chain.step % 2 === 0 ? 'image' : 'text';
    const content = typeof message.content === 'string' ? message.content.trim() : '';
    const validImage = message.kind !== 'image' || (/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(content) && content.length <= 480000);
    const validText = message.kind !== 'text' || content.length <= 140;
    if (expectedPlayer?.id !== playerId || message.kind !== expectedKind || !content || !validImage || !validText) return;
    if (expectedKind === 'image') {
      const photoKey = `photo:${this.state.roundIndex}:${player.team}:${chain.step}`;
      await this.ctx.storage.put(photoKey, content); chain.entries.push({ kind: 'image', photoKey });
    } else chain.entries.push({ kind: 'text', content });
    chain.step++;
    if (this.state.chains.every((item) => item.step >= this.state.stepsCount)) {
      this.state.phase = 'reveal';
      this.state.scores = this.state.scores.map((score, team) => score + (this.state.players.some((item) => item.team === team) ? 1 : 0));
    }
  }
  startChains() {
    this.state.chains = Array.from({ length: this.state.teamCount }, (_, team) => {
      if (!this.state.players.some((player) => player.team === team)) return { step: this.state.stepsCount, entries: [] };
      return { step: 0, entries: [{ kind: 'text', content: SEEDS[this.state.roundIndex % SEEDS.length] }] };
    });
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
    if (entry.kind !== 'image') return entry;
    return { kind: 'image', content: await this.ctx.storage.get(entry.photoKey) || '' };
  }
  async hydrateChains(chains) {
    return Promise.all(chains.map(async (chain) => ({ step: chain.step, entries: await Promise.all(chain.entries.map((entry) => this.hydrateEntry(entry))) })));
  }
  async broadcast() {
    const players = this.state.players;
    for (const ws of this.ctx.getWebSockets()) {
      const meta = ws.deserializeAttachment(); const mine = meta?.role === 'player' ? players.find((player) => player.id === meta.playerId) : null;
      const teamPlayers = mine ? players.filter((player) => player.team === mine.team) : [];
      const playerIndex = mine ? teamPlayers.findIndex((player) => player.id === mine.id) : -1;
      let chains = this.state.chains.map((chain) => ({ step: chain.step, entries: [] }));
      if (this.state.phase === 'reveal') chains = await this.hydrateChains(this.state.chains);
      else if (mine && this.state.phase === 'relay') {
        const chain = this.state.chains[mine.team]; const clue = chain.entries.at(-1);
        chains[mine.team] = { step: chain.step, entries: clue ? [await this.hydrateEntry(clue)] : [] };
      }
      const payload = {
        type: 'state', state: {
          phase: this.state.phase, players, roundIndex: this.state.roundIndex, scores: this.state.scores,
          chains, teamCount: this.state.teamCount, stepsCount: this.state.stepsCount,
          mine: mine ? { id: mine.id, team: mine.team, index: playerIndex } : null,
        },
      };
      try { ws.send(JSON.stringify(payload)); } catch { /* socket already closed */ }
    }
  }
}
