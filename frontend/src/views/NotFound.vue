<template>
    <h4 class="not-found">Puslapis neegzistuoja...</h4>
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

<style>
.not-found {
    text-align: center;
}
</style>
