export async function onRequestPost({ request, env }) {
  let settings = {};
  try { settings = await request.json(); } catch { /* Defaults below are safe. */ }
  const teamCount = Math.min(15, Math.max(2, Number(settings.teamCount) || 2));
  const stepsCount = Math.min(10, Math.max(4, Number(settings.stepsCount) || 6));
  const turnSeconds = Math.min(300, Math.max(15, Number(settings.turnSeconds) || 60));
  let code;
  let id;
  let stub;
  // Avoid returning the same room code if an existing room has already been initialized.
  for (let attempt = 0; attempt < 8; attempt++) {
    code = randomCode();
    id = env.ROOMS.idFromName(code);
    stub = env.ROOMS.get(id);
    const token = randomToken();
    const response = await stub.fetch('https://room/init', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, token, teamCount, stepsCount, turnSeconds, createOnly: true }),
    });
    const result = await response.json();
    if (result.created) return Response.json({ code, token });
  }
  return Response.json({ error: 'No fue posible crear una sala. Intenta de nuevo.' }, { status: 503 });
}

function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('');
}

function randomToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`;
}
