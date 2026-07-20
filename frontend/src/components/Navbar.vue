<template>
    <footer class="footer">
        <nav aria-label="Pagrindinė navigacija">
            <ul class="menu">
            <li>
                <router-link
                    to="/"
                    class="menu__item"
                    active-class=""
                    exact-active-class="is-active"
                >
                    <svg class="icon">
                        <use href="#icon-home"></use>
                    </svg>
                    Titulinis
                </router-link>
            </li>
            <li>
                <router-link to="/search" class="menu__item">
                    <svg class="icon">
                        <use href="#icon-search"></use>
                    </svg>
                    Paieška
                </router-link>
            </li>
            <li>
                <router-link to="/favorites" class="menu__item">
                    <svg class="icon">
                        <use href="#icon-star-full"></use>
                    </svg>
                    Išsaugota
                </router-link>
            </li>
            <li>
                <button
                    type="button"
                    class="menu__item menu__theme"
                    :aria-label="isDark ? 'Įjungti šviesią temą' : 'Įjungti tamsią temą'"
                    :title="isDark ? 'Šviesi tema' : 'Tamsi tema'"
                    @click="toggleTheme"
                >
                    <span class="menu__theme-icon" aria-hidden="true">
                        {{ isDark ? '☀' : '☾' }}
                    </span>
                    {{ isDark ? 'Šviesi' : 'Tamsi' }}
                </button>
            </li>
            </ul>
        </nav>
    </footer>
</template>

<script>
import { appTheme, toggleAppTheme } from '../lib/theme';

export default {
    name: 'Navbar',
    computed: {
        isDark() {
            return appTheme.value === 'dark';
        },
    },
    methods: {
        toggleTheme() {
            toggleAppTheme();
        },
    },
};
</script>

<style lang="scss">
.footer {
    position: fixed;
    left: 50%;
    bottom: max(10px, env(safe-area-inset-bottom));
    z-index: 100;
    width: min(620px, calc(100% - 20px));
    transform: translateX(-50%);
    border: 1px solid var(--app-border);
    border-radius: 22px;
    background: var(--app-nav);
    box-shadow: var(--app-shadow);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);

    .menu {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 4px;
        margin: 0;
        padding: 6px;
        list-style: none;

        li {
            min-width: 0;
        }

        &__item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            width: 100%;
            min-height: 54px;
            box-sizing: border-box;
            padding: 7px 5px;
            border: 0;
            border-radius: 16px;
            color: var(--app-muted);
            background: transparent;
            text-decoration: none;
            font-size: 12px;
            line-height: 1.1;
            cursor: pointer;
            transition: color 0.18s ease, background-color 0.18s ease,
                transform 0.18s ease;

            .icon,
            .menu__theme-icon {
                width: 22px;
                height: 22px;
                font-size: 22px;
                line-height: 22px;
            }

            &.is-active {
                color: var(--app-accent-strong);
                background: var(--app-accent-soft);
                font-weight: 700;
            }

            &:hover {
                color: var(--app-text);
                background: var(--app-hover);
                transform: translateY(-1px);
            }
        }
    }
}

@media (max-width: 420px) {
    .footer {
        bottom: max(6px, env(safe-area-inset-bottom));
        width: calc(100% - 12px);
        border-radius: 18px;

        .menu {
            padding: 4px;

            &__item {
                min-height: 52px;
                border-radius: 14px;
                font-size: 11px;
            }
        }
    }
}
</style>
