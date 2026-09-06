<template>
    <svg v-if="inSprite" class="icon-audio">
        <use :href="`#icon-${name}`"></use>
    </svg>
    <img
        v-else-if="iconUrl"
        class="icon-audio icon-audio--img"
        :src="iconUrl"
        alt=""
    />
    <span v-else class="icon-audio icon-audio--letter">{{ letter }}</span>
</template>

<script>
import { config } from '../lib/config';
import { getTrackTypes } from '../db';

export default {
    name: 'SongIcon',
    props: {
        name: {
            type: String,
            required: true,
        },
    },
    computed: {
        inSprite() {
            return (
                typeof document !== 'undefined' &&
                !!document.getElementById(`icon-${this.name}`)
            );
        },
        iconUrl() {
            const type = getTrackTypes().find(t => t.name === this.name);
            if (!type || !type.icon) return null;
            if (/^(https?:)?\/\//i.test(type.icon) || type.icon.startsWith('/')) {
                return type.icon;
            }
            // Naujas formatas: audio/<kategorija>/icon.svg.
            // Senas formatas (tik failo vardas) vis dar palaikomas.
            return type.icon.includes('/')
                ? `${config.filesBase}/${type.icon}`
                : `${config.iconsBase}/${type.icon}`;
        },
        letter() {
            return this.name.charAt(0).toUpperCase();
        },
    },
};
</script>
