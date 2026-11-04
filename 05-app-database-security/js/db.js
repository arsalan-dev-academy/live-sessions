const SESSION_KEY = "tbd.session";

class DbError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function setSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

function storeAuth(data) {
  setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + data.expires_in,
    user: { id: data.user.id, email: data.user.email }
  });
}

async function authRequest(path, body, token) {
  const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;

  const res = await fetch(SUPABASE_URL + "/auth/v1/" + path, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new DbError(data.msg || data.error_description || data.message || "Something went wrong.", res.status);
  }
  return data;
}

async function signIn(email, password) {
  const data = await authRequest("token?grant_type=password", { email, password });
  storeAuth(data);
  return data;
}

async function signUp(email, password, fullName) {
  const data = await authRequest("signup", { email, password, data: { full_name: fullName } });
  if (data.access_token) storeAuth(data);
  return data;
}

async function signOut() {
  const session = getSession();
  setSession(null);
  if (session) {
    try {
      await authRequest("logout", {}, session.access_token);
    } catch {}
  }
}

async function currentToken() {
  const session = getSession();
  if (!session) return null;
  if (session.expires_at - 60 > Date.now() / 1000) return session.access_token;

  try {
    const data = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
    storeAuth(data);
    return data.access_token;
  } catch {
    setSession(null);
    return null;
  }
}

function friendlyError(status, body) {
  const code = body && body.code;
  if (code === "23503") return "This item is linked to existing orders. Take it off the menu instead.";
  if (code === "23514" || code === "22P02") return "Please check the values and try again.";
  if (status === 401 || status === 403 || code === "42501") return "You don't have permission to do that.";
  return "Something went wrong. Please try again.";
}

async function db(path, options = {}) {
  const token = await currentToken();
  const headers = { apikey: SUPABASE_KEY };
  if (token) headers.Authorization = "Bearer " + token;
  if (options.body) headers["Content-Type"] = "application/json";
  if (options.prefer) headers.Prefer = options.prefer;

  const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) throw new DbError(friendlyError(res.status, data), res.status, data && data.code);
  return data;
}

async function dbWrite(path, options) {
  const rows = await db(path, { ...options, prefer: "return=representation" });
  if (!rows || rows.length === 0) throw new DbError("You don't have permission to do that.", 403, "42501");
  return rows;
}
