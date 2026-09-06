<template>
    <div>
        <h2>Atsisiųsti</h2>
        <div class="adm-toolbar">
            <button class="adm-button" :disabled="busy" @click="exportDb">
                Atsisiųsti visą duomenų bazę
            </button>
        </div>
        <p class="adm-file-note">
            Faile bus giesmių tekstai, skaidrių išdėstymas, įrašų kategorijos ir
            jų priskyrimai giesmėms. MP3 ir natų failai į JSON neįtraukiami.
        </p>

        <h2>Atkurti duomenų bazę</h2>
        <p class="adm-file-note">
            Galima įkelti šio puslapio atsisiųstą pilną atsarginę kopiją arba seną
            giesmių masyvą. Pilna kopija atkuria tekstus, skaidres, kategorijas
            ir priskyrimus; fiziniai garso bei natų failai turi likti serveryje.
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
                Įkelti JSON atsarginę kopiją
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

export default {
    name: 'AdminDatabase',
    data() {
        return {
            dbFile: null,
            backups: [],
            busy: false,
            error: '',
            message: '',
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
        async exportDb() {
            this.busy = true;
            this.error = '';
            this.message = '';
            try {
                await api.exportDatabase();
                this.message = 'Visa duomenų bazė atsisiųsta.';
            } catch (error) {
                this.error = error.message;
            } finally {
                this.busy = false;
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
                const details = result.format === 'edeno-aidai-database'
                    ? `, ${result.trackTypes} įrašų kategorijų`
                    : '';
                this.message = `Duomenų bazė pakeista (${result.count} giesmių${details}). Programėlėje paspauskite „Atnaujinti duomenis“.`;
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
