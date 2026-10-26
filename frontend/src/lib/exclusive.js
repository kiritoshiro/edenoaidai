// Runs async tasks one at a time: a task started while another runs waits
// for it to settle (resolve or reject) first.
export function createExclusive() {
    let running = null;

    async function run(task) {
        while (running) {
            await running.catch(() => {});
        }
        const current = task();
        running = current;
        try {
            return await current;
        } finally {
            if (running === current) running = null;
        }
    }
    run.busy = () => running !== null;
    return run;
}
