<template>
    <div class="adm-login">
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

export default {
    name: 'AdminLogin',
    data() {
        return {
            password: '',
            error: '',
            busy: false,
        };
    },
    methods: {
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
    display: flex;
    justify-content: center;
    padding-top: 10vh;

    &__card {
        width: 100%;
        max-width: 360px;
        padding: 30px 25px;
        background: whitesmoke;
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
        color: rgba(0, 0, 0, 0.55);
    }

    &__submit {
        width: 100%;
        margin-top: 5px;
    }
}
</style>
