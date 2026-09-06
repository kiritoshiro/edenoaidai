import { config } from './config';

async function request(path, { method = 'GET', body } = {}) {
    const options = { method, credentials: 'include', headers: {} };

    if (body !== undefined) {
        if (body instanceof FormData) {
            options.body = body;
        } else {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
    }

    const response = await fetch(`${config.apiUrl}${path}`, options);

    if (!response.ok) {
        let message = `Klaida (${response.status})`;
        try {
            const data = await response.json();
            if (data && data.error) message = data.error;
        } catch {
            /* not JSON */
        }
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

const id = value => encodeURIComponent(value);

async function downloadResponse(path, fallbackFilename) {
    const response = await fetch(`${config.apiUrl}${path}`, {
        credentials: 'include',
    });

    if (!response.ok) {
        let message = `Klaida (${response.status})`;
        try {
            const data = await response.json();
            if (data && data.error) message = data.error;
        } catch {
            /* not JSON */
        }
        throw new Error(message);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const filename =
        disposition.match(/filename="([^"]+)"/i)?.[1] || fallbackFilename;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function mediaQuery(kind, values) {
    const query = new URLSearchParams({ kind });
    query.set(kind === 'audio' ? 'types' : 'formats', values.join(','));
    return query.toString();
}

export const api = {
    login: password => request('/api/login', { method: 'POST', body: { password } }),
    logout: () => request('/api/logout', { method: 'POST' }),
    me: () => request('/api/me'),

    songs: () => request('/api/songs'),
    song: songId => request(`/api/songs/${id(songId)}`),
    createSong: song => request('/api/songs', { method: 'POST', body: song }),
    updateSong: (songId, song) =>
        request(`/api/songs/${id(songId)}`, { method: 'PUT', body: song }),
    deleteSong: songId => request(`/api/songs/${id(songId)}`, { method: 'DELETE' }),
    songFiles: songId => request(`/api/songs/${id(songId)}/files`),

    tracks: () => request('/api/tracks'),
    createTrack: track => request('/api/tracks', { method: 'POST', body: track }),
    updateTrack: (name, track) =>
        request(`/api/tracks/${id(name)}`, { method: 'PUT', body: track }),
    deleteTrack: name => request(`/api/tracks/${id(name)}`, { method: 'DELETE' }),
    uploadTrackIcon: (name, file) => {
        const form = new FormData();
        form.append('file', file);
        return request(`/api/tracks/${id(name)}/icon`, { method: 'POST', body: form });
    },

    uploadAudio: (type, songId, file) => {
        const form = new FormData();
        form.append('file', file);
        return request(`/api/files/audio/${id(type)}/${id(songId)}`, {
            method: 'POST',
            body: form,
        });
    },
    deleteAudio: (type, songId) =>
        request(`/api/files/audio/${id(type)}/${id(songId)}`, { method: 'DELETE' }),

    uploadNotes: (format, songId, page, file) => {
        const form = new FormData();
        form.append('file', file);
        return request(`/api/files/notes/${id(format)}/${id(songId)}?page=${page}`, {
            method: 'POST',
            body: form,
        });
    },
    deleteNotes: (format, songId, page) =>
        request(`/api/files/notes/${id(format)}/${id(songId)}?page=${page}`, {
            method: 'DELETE',
        }),

    importDb: file => {
        const form = new FormData();
        form.append('file', file);
        return request('/api/import/db', { method: 'POST', body: form });
    },
    exportDatabase: async () => {
        const response = await fetch(`${config.apiUrl}/api/export/database`, {
            credentials: 'include',
        });

        if (!response.ok) {
            let message = `Klaida (${response.status})`;
            try {
                const data = await response.json();
                if (data && data.error) message = data.error;
            } catch {
                /* not JSON */
            }
            throw new Error(message);
        }

        const blob = await response.blob();
        const disposition = response.headers.get('Content-Disposition') || '';
        const filename =
            disposition.match(/filename="([^"]+)"/i)?.[1] ||
            'edeno-aidai-database.json';
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    githubCurrent: () => request('/api/github/current'),
    githubCommits: () => request('/api/github/commits'),
    githubReleases: () => request('/api/github/releases'),
    updateFromGithub: (source, ref) =>
        request('/api/update', { method: 'POST', body: { source, ref } }),
    mediaOptions: () => request('/api/media/options'),
    downloadMedia: (kind, values) =>
        downloadResponse(
            `/api/media/export?${mediaQuery(kind, values)}`,
            `edeno-aidai-${kind}.zip`,
        ),
    importMedia: (kind, values, file) => {
        const form = new FormData();
        form.append('file', file);
        return request(`/api/media/import?${mediaQuery(kind, values)}`, {
            method: 'POST',
            body: form,
        });
    },
    backups: () => request('/api/backups'),
};
