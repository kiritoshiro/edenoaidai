// Turns the public db.json and tracks.json into what the app stores:
// IndexedDB song rows and the recording types kept in localStorage.

export function buildSongRows(songs, trackLists, favoriteIds = new Set()) {
    return songs.map(song => {
        const {
            songId,
            title,
            verse,
            body,
            slides,
            copyright,
            pages,
            notePages,
            noteVersions,
        } = song;
        const lists = trackLists
            .filter(
                type =>
                    Array.isArray(type.tracks) && type.tracks.includes(songId),
            )
            .map(type => type.name);

        return {
            songId,
            title,
            verse,
            body,
            slides: Array.isArray(slides) ? slides : [],
            copyright,
            pages: pages || null,
            notePages: notePages || null,
            noteVersions: noteVersions || null,
            favorited: favoriteIds.has(songId) ? 1 : 0,
            lists,
        };
    });
}

export function buildTrackTypes(trackLists) {
    return trackLists.map(({ name, label, icon, versions }) => ({
        name,
        label: label || name,
        icon: icon || null,
        versions: versions && typeof versions === 'object' ? versions : {},
    }));
}

// { <type>: { <songId>: <mtime> } } for the audio URLs of one song view
export function audioVersionsByType(trackTypes) {
    return Object.fromEntries(
        (Array.isArray(trackTypes) ? trackTypes : [])
            .filter(type => type?.name)
            .map(type => [type.name, type.versions || {}]),
    );
}
