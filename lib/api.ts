// Adapter between the frontend and the Website-PersonalALbum backend.
//
// Backend model: users -> albums -> photos (normalized, one request per thing).
// Frontend model: one JSON "album document" (pages, text, photo layout).
// Mapping: the whole document is kept in the `description` of one dedicated
// backend album (ALBUM_TITLE); photos are real backend photos in that album.
// Auth is the backend's HttpOnly `session_token` cookie, carried by the /api proxy.
const BASE = '/api';
const ALBUM_TITLE = 'Our Love Story';
const DOC_PREFIX = 'OLS1:'; // marks a description that holds the album document

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request(path: string, init: RequestInit = {}, asJson = true): Promise<Response> {
  const headers = new Headers(init.headers);
  if (asJson && init.body) headers.set('Content-Type', 'application/json');
  let res: Response;
  try {
    res = await fetch(BASE + path, { ...init, headers, credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, 'Network error');
  }
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return res;
}

let albumId: string | null = null;
let albumPending: Promise<string | null> | null = null;

/** Finds the album that holds the document (optionally creating it). */
function resolveAlbum(create: boolean): Promise<string | null> {
  if (albumId) return Promise.resolve(albumId);
  if (!albumPending) {
    albumPending = (async () => {
      const { albums } = await (await request('/albums')).json();
      const hit = (albums || []).find((a: { title: string }) => a.title === ALBUM_TITLE);
      if (hit) return (albumId = hit.id as string);
      if (!create) return null;
      const res = await request('/albums', { method: 'POST', body: JSON.stringify({ title: ALBUM_TITLE }) });
      return (albumId = (await res.json()).album.id as string);
    })().finally(() => { albumPending = null; });
  }
  return albumPending.then((id) => id ?? (create ? resolveAlbum(true) : null));
}

export const api = {
  /** Turns a stored photo URL (e.g. "/photos/<id>") into something the browser can load. */
  mediaUrl: (u: string) => (/^(https?:|blob:)/.test(u) ? u : BASE + (u.startsWith('/') ? u : '/' + u)),

  /** POST /api/auth/login {username, password}; the backend sets the session cookie. */
  async login(name: string, password: string) {
    albumId = null;
    await request('/auth/login', { method: 'POST', body: JSON.stringify({ username: name, password }) });
  },

  /** GET /api/auth/me: true while the session cookie is valid. */
  async me() {
    try {
      await request('/auth/me');
      return true;
    } catch {
      return false;
    }
  },

  async logout() {
    albumId = null;
    await request('/auth/logout', { method: 'POST' });
  },

  /** The saved album document, or null if nothing has been saved yet. */
  async getAlbum() {
    const id = await resolveAlbum(false);
    if (!id) return null;
    const { album } = await (await request('/albums/' + id)).json();
    const d: string | null = album?.description ?? null;
    if (!d || !d.startsWith(DOC_PREFIX)) return null;
    try { return JSON.parse(d.slice(DOC_PREFIX.length)); } catch { return null; }
  },

  /** Saves the whole document (PATCH /api/albums/:id). */
  async saveAlbum(data: unknown, keepalive = false) {
    const id = await resolveAlbum(true);
    await request('/albums/' + id, {
      method: 'PATCH',
      body: JSON.stringify({ description: DOC_PREFIX + JSON.stringify(data) }),
      keepalive,
    });
  },

  /** POST /api/photos/upload/:albumId (multipart field "photo") -> "/photos/<id>". */
  async uploadPhoto(file: File) {
    const id = await resolveAlbum(true);
    const fd = new FormData();
    fd.append('photo', file, file.name || 'photo.jpg');
    const res = await request('/photos/upload/' + id, { method: 'POST', body: fd }, false);
    const d = await res.json();
    if (!d?.photo?.id) throw new ApiError(500, 'Upload returned no photo');
    return '/photos/' + d.photo.id;
  },
};
