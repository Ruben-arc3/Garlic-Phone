export async function onRequest({ request, env, params }) {
  const code = String(params.code || '').toUpperCase();
  if (!/^[A-Z0-9]{5}$/.test(code)) {
    return new Response('Código inválido', { status: 400 });
  }
  const id = env.ROOMS.idFromName(code);
  return env.ROOMS.get(id).fetch(request);
}
