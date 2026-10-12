export function verifyApiKey(request, env) {
  const expectedKey = env.API_SECRET_KEY;
  if (!expectedKey) {
    // If no key is configured, we reject by default for security, 
    // or we could allow it. Better to reject.
    console.warn("API_SECRET_KEY is not configured in the environment.");
    return false;
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.split(" ")[1];
  return token === expectedKey;
}

export function unauthorizedResponse(extraHeaders = {}) {
  return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
