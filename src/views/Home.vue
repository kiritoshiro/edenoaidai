<template>
    <div>
        <button type="button" class="update-button" @click="goToInstallPage">
            Atnaujinti duomenis
        </button>
        <List :songs="songs" />
    </div>
</template>

<script>
import List from '../components/List.vue';
import { reportError } from '../helpers/reportError';

export default {
    name: 'Home',
    components: {
        List,
    },
    data() {
        return {
            songs: [],
        };
    },
    created() {
        this.$songs
            .orderBy('id')
            // .offset(Math.round(Math.random() * 100))
            // .limit(10)
            .toArray()
            .then(songs => {
                this.songs = songs;
            })
            .catch(reportError);
    },
    methods: {
        goToInstallPage() {
            this.$router.push('/install');
        },
    },
};
</script>
<style>
.update-button {
    display: block;
    width: 100%; /* Make button span the whole width of the page */
    margin: 0 auto;
    padding: 10px 20px;
    font-size: 16px;
    background-color: rgba(217, 178, 111, 1); /* Goldish color */
    color: #2f2f2f;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    box-shadow: 2px 5px 10px 0 rgba(0, 0, 0, 0.1);
    text-decoration: none;
    text-align: center;
    transition: box-shadow ease-in-out 0.2s;
    margin-bottom: 10px;
}
.update-button:hover {
    background-color: beige;
    box-shadow: 2px 5px 10px 0 rgba(0, 0, 0, 0.3);
}
</style>
