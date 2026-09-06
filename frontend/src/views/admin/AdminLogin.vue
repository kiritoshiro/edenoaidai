<template>
    <div class="adm-login">
        <button class="adm-login__theme" type="button" @click="toggleTheme">
            <span aria-hidden="true">{{ isDark ? '☀' : '☾' }}</span>
            {{ isDark ? 'Šviesi tema' : 'Tamsi tema' }}
        </button>
        <form class="adm-login__card" @submit.prevent="submit">
            <h1 class="adm-login__title">Edeno Aidai</h1>
            <p class="adm-login__subtitle">Administravimo prisijungimas</p>

            <label class="adm-field">
                <span>Slaptažodis</span>
                <input
                    v-model="password"
                    class="adm-input"
                    type="password"
                    autocomplete="current-password"
                    autofocus
                    required
                />
            </label>

            <div class="adm-status-slot" aria-live="polite">
                <p v-if="error" class="adm-status adm-status--error">{{ error }}</p>
            </div>

            <button class="adm-button adm-login__submit" :disabled="busy">
                {{ busy ? 'Jungiamasi…' : 'Prisijungti' }}
            </button>
        </form>
    </div>
</template>

<script>
import { api } from '../../lib/api';
import { appTheme, toggleAppTheme } from '../../lib/theme';

export default {
    name: 'AdminLogin',
    data() {
        return {
            password: '',
            error: '',
            busy: false,
        };
    },
    computed: {
        isDark() {
            return appTheme.value === 'dark';
        },
    },
    methods: {
        toggleTheme() {
            toggleAppTheme();
        },
        async submit() {
            this.busy = true;
            this.error = '';
            try {
                await api.login(this.password);
                const redirect = this.$route.query.redirect;
                this.$router.push(
                    typeof redirect === 'string' && redirect.startsWith('/admin')
                        ? redirect
                        : { name: 'admin-songs' },
                );
            } catch (error) {
                this.error = error.message || 'Nepavyko prisijungti';
            } finally {
                this.busy = false;
            }
        },
    },
};
</script>

<style lang="scss">
.adm-login {
    --adm-login-text: #2f2f2f;
    --adm-login-muted: rgba(0, 0, 0, 0.58);
    --adm-login-border: rgba(0, 0, 0, 0.2);
    --adm-login-card: #f5f5f5;
    --adm-login-input: #fff;

    display: flex;
    justify-content: center;
    padding-top: 10vh;
    color: var(--adm-login-text);

    &__theme {
        position: fixed;
        top: 18px;
        right: 18px;
        padding: 8px 13px;
        border: 1px solid var(--adm-login-border);
        border-radius: 999px;
        color: var(--adm-login-text);
        background: var(--adm-login-card);
        font: inherit;
        cursor: pointer;
    }

    &__card {
        width: 100%;
        max-width: 360px;
        padding: 30px 25px;
        background: var(--adm-login-card);
        border-radius: 12px;
        border-top: 6px solid rgba(217, 178, 111, 1);
        box-shadow: 2px 5px 15px 0 rgba(0, 0, 0, 0.1);
    }

    &__title {
        margin: 0;
        font-size: 24px;
        text-align: center;
    }

    &__subtitle {
        margin: 4px 0 20px;
        text-align: center;
        color: var(--adm-login-muted);
    }

    &__submit {
        width: 100%;
        margin-top: 5px;
    }

    .adm-field {
        display: block;
        margin-bottom: 14px;

        > span {
            display: block;
            margin-bottom: 5px;
            color: var(--adm-login-muted);
            font-size: 13px;
        }
    }

    .adm-input {
        width: 100%;
        box-sizing: border-box;
        padding: 9px 11px;
        border: 1px solid var(--adm-login-border);
        border-radius: 8px;
        outline: none;
        color: var(--adm-login-text);
        background: var(--adm-login-input);
        font: inherit;

        &:focus {
            border-color: #d9b26f;
            box-shadow: 0 0 0 3px rgba(217, 178, 111, 0.22);
        }
    }

    .adm-button {
        padding: 9px 16px;
        border: 0;
        border-radius: 8px;
        color: #2f2f2f;
        background: #d9b26f;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
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
        color: #ff9aad;
        background: rgba(165, 36, 61, 0.16);
    }
}

:root[data-theme='dark'] .adm-login {
    --adm-login-text: #f3eee6;
    --adm-login-muted: #b9b0a4;
    --adm-login-border: rgba(255, 255, 255, 0.2);
    --adm-login-card: #1c2632;
    --adm-login-input: #111923;
}
</style>
