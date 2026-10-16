<template>
    <div class="search-box">
        <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
        </svg>
        <input
            ref="input"
            type="search"
            enterkeyhint="search"
            autocomplete="off"
            :placeholder="placeholder"
            :value="modelValue"
            :aria-label="label"
            @input="$emit('update:modelValue', $event.target.value)"
            @keydown.esc="clear"
        />
        <button
            v-if="modelValue"
            type="button"
            class="search-box__clear"
            aria-label="Išvalyti paiešką"
            title="Išvalyti"
            @click="clear"
        >
            <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6 6 18" />
            </svg>
        </button>
    </div>
</template>

<script>
export default {
    name: 'SearchBox',
    props: {
        modelValue: {
            type: String,
            default: '',
        },
        placeholder: {
            type: String,
            default: 'Giesmės numeris, pavadinimas ar žodžiai',
        },
        label: {
            type: String,
            default: 'Ieškoti giesmės',
        },
    },
    emits: ['update:modelValue'],
    methods: {
        clear() {
            this.$emit('update:modelValue', '');
            this.$refs.input.focus();
        },
    },
};
</script>

<style lang="scss">
.search-box {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    min-height: 58px;
    margin-bottom: 18px;
    padding: 0 8px 0 16px;
    border: 1px solid var(--app-border);
    border-radius: 17px;
    color: var(--app-muted);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-small);

    &:focus-within {
        border-color: var(--app-accent);
        box-shadow: 0 0 0 3px var(--app-accent-soft);
    }

    svg {
        width: 22px;
        height: 22px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    input {
        width: 100%;
        min-height: 56px;
        padding: 0;
        border: 0;
        outline: 0;
        color: var(--app-text);
        background: transparent;
        font-size: 16px;
        appearance: none;

        &::placeholder {
            color: var(--app-muted);
        }

        // The component draws its own clear button
        &::-webkit-search-cancel-button {
            appearance: none;
        }
    }

    &__clear {
        display: grid;
        width: 40px;
        height: 40px;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 12px;
        color: var(--app-muted);
        background: transparent;
        cursor: pointer;

        svg {
            width: 18px;
            height: 18px;
        }

        &:hover {
            color: var(--app-text);
            background: var(--app-hover);
        }
    }
}
</style>
