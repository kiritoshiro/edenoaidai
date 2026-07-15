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
                <a href="/" class="adm-nav__link">Giesmynas ↗</a>
                <button class="adm-nav__logout" @click="logout">Atsijungti</button>
            </nav>
        </header>
        <router-view />
    </div>
</template>

<script>
import { api } from '../../lib/api';

export default {
    name: 'AdminLayout',
    methods: {
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
    max-width: 960px;
    margin: 0 auto;
    color: #2f2f2f;
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
        color: #2f2f2f;
        text-decoration: none;
        padding: 6px 12px;
        border-radius: 99px;

        &:hover {
            background-color: beige;
        }

        &.router-link-active:not([href='/']) {
            background-color: rgba(217, 178, 111, 1);
        }
    }

    &__logout {
        border: none;
        background: none;
        padding: 6px 12px;
        border-radius: 99px;
        cursor: pointer;
        color: rgba(165, 36, 61, 1);
        font-size: inherit;

        &:hover {
            background-color: rgba(165, 36, 61, 0.1);
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
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    background: white;

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
        background-color: beige;
    }

    &[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &--danger {
        background-color: white;
        color: rgba(165, 36, 61, 1);
        box-shadow: inset 0 0 0 1px rgba(165, 36, 61, 0.6);

        &:hover:not([disabled]) {
            background-color: rgba(165, 36, 61, 0.08);
        }
    }

    &--ghost {
        background-color: white;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
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
        color: rgba(0, 0, 0, 0.55);
        padding: 6px 10px;
    }

    td {
        padding: 8px 10px;
        background-color: whitesmoke;
        border-bottom: 2px solid white;
        vertical-align: middle;
    }

    tr:hover td {
        background-color: beige;
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
        color: rgba(0, 0, 0, 0.6);
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
        background: whitesmoke;
        border-radius: 8px;
        padding: 6px 10px;
        cursor: pointer;
    }
}

.adm-status {
    margin: 12px 0;
    padding: 10px 12px;
    border-radius: 8px;
    background-color: whitesmoke;

    &--error {
        background-color: rgba(165, 36, 61, 0.1);
        color: rgba(120, 20, 40, 1);
    }

    &--ok {
        background-color: rgba(120, 170, 100, 0.15);
    }
}

.adm-muted {
    color: rgba(0, 0, 0, 0.5);
}

.adm-file-note {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.55);
    margin: 4px 0 12px;
}
</style>
