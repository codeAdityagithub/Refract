import { computed, createSignal } from "../signals/signal";

const PerformanceTest = () => {
    // Simulating a real-world list of items using your signal-based library
    const items = createSignal(
        Array.from({ length: 1000 }, (_, i) => `Item ${i}`)
    );
    const sortAsc = createSignal<boolean>(true);

    // Simulating initial render delay (for example, fetching data)
    setTimeout(() => {
        console.time("Initial Render");

        // After initial render, trigger automatic operations
        setTimeout(() => {
            console.timeEnd("Initial Render");
            console.time("Update 1");

            // Simulating add item after 1 second
            setTimeout(() => {
                items.value.push(`Item ${items.value.length + 1}`);
                console.timeEnd("Update 1");
                console.time("Update 2");
                // Simulating sort after another second
                setTimeout(() => {
                    sortAsc.value = !sortAsc.value;
                    console.timeEnd("Update 2");
                }, 1000);
            }, 1000);
        }, 1000);
    });

    // Sorting the list based on the selected order
    const sortedItems = computed(() => {
        return items.value.sort((a, b) => {
            if (sortAsc.value) return a.localeCompare(b);
            return b.localeCompare(a);
        });
    });

    return (
        <div>
            <div>
                <p>
                    Sorting:{" "}
                    {() => (sortAsc.value ? "Ascending" : "Descending")}
                </p>
            </div>
            <div>
                {() =>
                    sortedItems.value.map((item) => <p key={item}>{item}</p>)
                }
            </div>
        </div>
    );
};

export default PerformanceTest;
