const trim = value => String(value || '').replace(/\/+$/, '');

// Tuščias VITE_API_URL = tas pats serveris (viskas viename Virtualmin serveryje)
const API = trim(import.meta.env.VITE_API_URL || '');

export const config = {
    apiUrl: API,
    dbUrl: import.meta.env.VITE_DB_URL || `${API}/api/public/db.json`,
    tracksUrl: import.meta.env.VITE_TRACKS_URL || `${API}/api/public/tracks.json`,
    filesBase: trim(import.meta.env.VITE_FILES_BASE || `${API}/files`),
    audioBase: trim(import.meta.env.VITE_AUDIO_BASE || `${API}/files/audio`),
    notesBase: trim(import.meta.env.VITE_NOTES_BASE || `${API}/files/notes`),
    iconsBase: trim(import.meta.env.VITE_ICONS_BASE || `${API}/files/icons`),
};
