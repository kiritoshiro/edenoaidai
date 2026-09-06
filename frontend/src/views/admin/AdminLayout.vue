<template>
    <div class="adm">
        <header class="adm-header">
            <h1 class="adm-header__title">Edeno Aidai · administravimas</h1>
            <nav class="adm-nav">
                <router-link :to="{ name: 'admin-songs' }" class="adm-nav__link">
                    Giesmės
                </router-link>
                <router-link :to="{ name: 'admin-tracks' }" class="adm-nav__link">
                    Įrašų tipai
                </router-link>
                <router-link :to="{ name: 'admin-database' }" class="adm-nav__link">
                    Duomenų bazė
                </router-link>
                <router-link :to="{ name: 'admin-updates' }" class="adm-nav__link">
                    Atnaujinimas
                </router-link>
                <a href="/" class="adm-nav__link">Giesmynas ↗</a>
                <button class="adm-nav__theme" @click="toggleTheme">
                    <span aria-hidden="true">{{ isDark ? '☀' : '☾' }}</span>
                    {{ isDark ? 'Šviesi tema' : 'Tamsi tema' }}
                </button>
                <button class="adm-nav__logout" @click="logout">Atsijungti</button>
            </nav>
        </header>
        <router-view />
    </div>
</template>

<script>
import { api } from '../../lib/api';
import { appTheme, toggleAppTheme } from '../../lib/theme';

export default {
    name: 'AdminLayout',
    computed: {
        isDark() {
            return appTheme.value === 'dark';
        },
    },
    methods: {
        toggleTheme() {
            toggleAppTheme();
        },
        async logout() {
            try {
                await api.logout();
            } catch (error) {
                console.error(error);
            }
            this.$router.push({ name: 'admin-login' });
        },
    },
};
</script>

<style lang="scss">
/* Shared admin styles (adm-*) */
.adm {
    --adm-text: #2f2f2f;
    --adm-muted: rgba(0, 0, 0, 0.58);
    --adm-border: rgba(0, 0, 0, 0.2);
    --adm-input: #fff;
    --adm-surface: #f5f5f5;
    --adm-card: #fff;
    --adm-card-chorus: #fffaf0;
    --adm-card-chorus-part: #fffdf6;
    --adm-card-edge: #b5b5b5;
    --adm-card-chorus-edge: #d9b26f;
    --adm-card-chorus-part-edge: #c8a86c;
    --adm-option: #f2f2f2;
    --adm-hover: #f5f5dc;
    --adm-row-separator: #fff;
    --adm-danger-text: #a5243d;
    --adm-danger-soft: rgba(165, 36, 61, 0.1);
    --adm-success-soft: rgba(120, 170, 100, 0.15);

    max-width: 960px;
    margin: 0 auto;
    color: var(--adm-text);
}

:root[data-theme='dark'] .adm {
    --adm-text: #f3eee6;
    --adm-muted: #b9b0a4;
    --adm-border: rgba(255, 255, 255, 0.2);
    --adm-input: #18212c;
    --adm-surface: #1c2632;
    --adm-card: #1c2632;
    --adm-card-chorus: #29261f;
    --adm-card-chorus-part: #24271f;
    --adm-card-edge: #687585;
    --adm-card-chorus-edge: #e0b66c;
    --adm-card-chorus-part-edge: #b99a63;
    --adm-option: #27313d;
    --adm-hover: #303a47;
    --adm-row-separator: #10161e;
    --adm-danger-text: #ff9aad;
    --adm-danger-soft: rgba(221, 80, 107, 0.2);
    --adm-success-soft: rgba(113, 190, 112, 0.2);
}

.adm-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 12px;
    margin-bottom: 20px;
    border-bottom: 3px solid rgba(217, 178, 111, 1);

    &__title {
        font-size: 20px;
        margin: 0;
    }
}

.adm-nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;

    &__link {
        color: var(--adm-text);
        text-decoration: none;
        padding: 6px 12px;
        border-radius: 99px;

        &:hover {
            background-color: var(--adm-hover);
        }

        &.router-link-active:not([href='/']) {
            background-color: rgba(217, 178, 111, 1);
        }
    }

    &__theme,
    &__logout {
        border: none;
        background: none;
        padding: 6px 12px;
        border-radius: 99px;
        cursor: pointer;
        color: var(--adm-text);
        font-size: inherit;

        &:hover {
            background-color: var(--adm-hover);
        }
    }

    &__logout {
        color: var(--adm-danger-text);

        &:hover {
            background-color: var(--adm-danger-soft);
        }
    }
}

.adm h2 {
    font-size: 18px;
    margin: 25px 0 10px;
}

.adm-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    margin-bottom: 15px;
}

.adm-input,
.adm textarea,
.adm select {
    font: inherit;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid var(--adm-border);
    border-radius: 8px;
    color: var(--adm-text);
    background: var(--adm-input);

    &:focus {
        outline: 2px solid rgba(217, 178, 111, 0.9);
        outline-offset: 0;
    }
}

.adm textarea {
    width: 100%;
    resize: vertical;
}

.adm-button {
    font: inherit;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    background-color: rgba(217, 178, 111, 1);
    color: #2f2f2f;
    box-shadow: 2px 2px 5px 0 rgba(0, 0, 0, 0.15);

    &:hover:not([disabled]) {
        background-color: var(--adm-hover);
    }

    &[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &--danger {
        background-color: var(--adm-input);
        color: var(--adm-danger-text);
        box-shadow: inset 0 0 0 1px var(--adm-danger-text);

        &:hover:not([disabled]) {
            background-color: var(--adm-danger-soft);
        }
    }

    &--ghost {
        color: var(--adm-text);
        background-color: var(--adm-input);
        box-shadow: inset 0 0 0 1px var(--adm-border);
    }
}

.adm-table {
    width: 100%;
    border-collapse: collapse;

    th {
        text-align: left;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--adm-muted);
        padding: 6px 10px;
    }

    td {
        padding: 8px 10px;
        background-color: var(--adm-surface);
        border-bottom: 2px solid var(--adm-row-separator);
        vertical-align: middle;
    }

    tr:hover td {
        background-color: var(--adm-hover);
    }
}

.adm-pill {
    display: inline-block;
    min-width: 34px;
    text-align: center;
    padding: 3px 10px;
    border-radius: 99px;
    background-color: rgba(217, 178, 111, 1);
}

.adm-field {
    display: block;
    margin-bottom: 14px;

    > span {
        display: block;
        font-size: 13px;
        margin-bottom: 4px;
        color: var(--adm-muted);
    }

    .adm-input {
        width: 100%;
    }
}

.adm-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;

    label {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--adm-surface);
        border-radius: 8px;
        padding: 6px 10px;
        cursor: pointer;
    }
}

.adm-status-slot {
    position: relative;
    min-height: 52px;
    margin: 8px 0;
}

.adm-status {
    position: absolute;
    inset: 0 0 auto;
    max-height: 52px;
    overflow: auto;
    margin: 0;
    padding: 10px 12px;
    box-sizing: border-box;
    border-radius: 8px;
    color: var(--adm-text);
    background-color: var(--adm-surface);

    &--error {
        background-color: var(--adm-danger-soft);
        color: var(--adm-danger-text);
    }

    &--ok {
        background-color: var(--adm-success-soft);
    }
}

.adm-muted {
    color: var(--adm-muted);
}

.adm-file-note {
    font-size: 13px;
    color: var(--adm-muted);
    margin: 4px 0 12px;
}
</style>
