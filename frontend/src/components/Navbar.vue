<template>
    <footer class="footer">
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
        </ul>
    </footer>
</template>

<script>
export default {
    name: 'Navbar',
};
</script>

<style lang="scss">
.footer {
    display: block;
    position: fixed;

    left: 0;
    bottom: 0;

    width: 100%;
    z-index: 10;

    border-top: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 0 3px 0px rgba(0, 0, 0, 0.1);

    background-color: white;

    .menu {
        display: flex;

        justify-content: space-around;

        margin: 0;
        padding: 0;
        list-style: none;

        &__item {
            display: flex;
            flex-direction: column;

            align-items: center;

            color: rgba(0, 0, 0, 0.8);
            text-decoration: none;

            padding: 10px;

            :first-child {
                margin-bottom: 5px;
                font-size: 20px;
            }

            &.is-active {
                color: rgba(165, 36, 61, 1);
            }

            &:hover {
                color: rgba(165, 36, 61, 0.8);
            }
        }
    }
}
</style>
