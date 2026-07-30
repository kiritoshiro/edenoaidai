<template>
    <h4 class="not-found">Puslapis neegzistuoja...</h4>
</template>

<script>
export default {
    name: 'NotFound',
    data() {
        return {
            metaNoIndex: null,
        };
    },
    mounted() {
        this.metaNoIndex = document.createElement('meta');
        this.metaNoIndex.name = 'robots';
        this.metaNoIndex.content = 'noindex';
        this.metaNoIndex.dataset.edenoAidai = 'not-found';
        document.head.appendChild(this.metaNoIndex);
    },
    beforeUnmount() {
        this.metaNoIndex?.remove();
    },
};
</script>

<style scoped>
.not-found {
    text-align: center;
}
</style>
