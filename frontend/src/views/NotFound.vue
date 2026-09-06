<template>
    <div class="public-page not-found-page">
        <section class="empty-state not-found">
            <div>
                <span class="not-found__number">404</span>
                <h2>Puslapis nerastas</h2>
                <p>Šio adreso nėra. Grįžkite į giesmių sąrašą.</p>
                <router-link to="/">Grįžti į titulinį</router-link>
            </div>
        </section>
    </div>
</template>

<script>
export default {
    name: 'NotFound',
    created() {
        if (!document.querySelector('meta[name="robots"]')) {
            const meta = document.createElement('meta');
            meta.name = 'robots';
            meta.content = 'noindex';
            document.head.appendChild(meta);
            this.meta = meta;
        }
    },
    unmounted() {
        if (this.meta) this.meta.remove();
    },
};
</script>

<style lang="scss">
.not-found-page {
    display: grid;
    min-height: calc(100vh - 160px);
    place-items: center;
}

.not-found {
    width: 100%;

    &__number {
        display: block;
        margin-bottom: 8px;
        color: var(--app-accent-strong);
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 58px;
        line-height: 1;
    }

    a {
        display: inline-flex;
        min-height: 44px;
        align-items: center;
        margin-top: 20px;
        padding: 0 16px;
        border-radius: 12px;
        color: #251a0a;
        background: var(--app-accent);
        font-weight: 750;
        text-decoration: none;
    }
}
</style>
