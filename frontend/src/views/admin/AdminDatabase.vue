<template>
    <div>
        <h2>Atsisiųsti</h2>
        <div class="adm-toolbar">
            <a :href="dbUrl" target="_blank" rel="noopener">
                <button class="adm-button adm-button--ghost">db.json (giesmės)</button>
            </a>
            <a :href="tracksUrl" target="_blank" rel="noopener">
                <button class="adm-button adm-button--ghost">
                    Įrašų indeksas (sugeneruotas iš aplankų)
                </button>
            </a>
        </div>

        <h2>Įkelti giesmių duomenis</h2>
        <p class="adm-file-note">
            Čia importuojami tik giesmių tekstai iš db.json. Audio kategorijos,
            ikonos ir giesmių priskyrimai automatiškai nustatomi pagal
            <b>server/files/audio/</b> aplankų struktūrą; details.json nebereikalingas.
        </p>

        <div class="adm-status-slot" aria-live="polite">
            <p v-if="error" class="adm-status adm-status--error">{{ error }}</p>
            <p v-else-if="message" class="adm-status adm-status--ok">{{ message }}</p>
        </div>

        <div class="adm-toolbar">
            <input
                class="adm-input"
                type="file"
                accept=".json,application/json"
                @change="dbFile = pick($event)"
            />
            <button class="adm-button" :disabled="!dbFile || busy" @click="importDb">
                Įkelti db.json
            </button>
        </div>

        <h2>Atsarginės kopijos</h2>
        <p v-if="!backups.length" class="adm-muted">Kol kas nėra.</p>
        <table v-else class="adm-table">
            <thead>
                <tr>
                    <th>Failas</th>
                    <th>Dydis</th>
                    <th>Data</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="backup in backups" :key="backup.file">
                    <td>{{ backup.file }}</td>
                    <td>{{ Math.round(backup.size / 1024) }} KB</td>
                    <td>{{ formatDate(backup.mtime) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import { api } from '../../lib/api';
import { config } from '../../lib/config';

export default {
    name: 'AdminDatabase',
    data() {
        return {
            dbFile: null,
            backups: [],
            busy: false,
            error: '',
            message: '',
            dbUrl: config.dbUrl,
            tracksUrl: config.tracksUrl,
        };
    },
    created() {
        this.loadBackups();
    },
    methods: {
        pick(event) {
            return (event.target.files && event.target.files[0]) || null;
        },
        formatDate(value) {
            try {
                return new Date(value).toLocaleString('lt-LT');
            } catch {
                return value;
            }
        },
        async loadBackups() {
            try {
                this.backups = (await api.backups()) || [];
            } catch (error) {
                console.error(error);
            }
        },
        async importDb() {
            if (!window.confirm('Pakeisti VISĄ giesmių duomenų bazę įkeltu failu?')) {
                return;
            }
            this.busy = true;
            this.error = '';
            try {
                const result = await api.importDb(this.dbFile);
                this.message = `Duomenų bazė pakeista (${result.count} giesmių). Programėlėje paspauskite „Atnaujinti duomenis“.`;
                this.dbFile = null;
                await this.loadBackups();
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
            }
        },
    },
};
</script>
