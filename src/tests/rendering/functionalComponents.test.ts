import { describe, expect, it } from "vitest";
import {
    cleanUp,
    cleanUpFC,
    clearCurrentFC,
    setCurrentFC,
} from "../../rendering/functionalComponents";
import { computed, createEffect, createSignal } from "../../signals/signal";

describe("Functional Components life cycle", () => {
    it("should be defined", () => {
        expect(cleanUp).toBeTruthy();
    });
    it("should add cleanup to the FC", () => {
        let FC = () => {
            console.log("FC");
        };
        setCurrentFC(FC);
        let count = 0;
        let cleanup = () => {
            count++;
        };
        cleanUp(cleanup);
        clearCurrentFC();

        cleanUpFC(FC, {});
        expect(count).toBe(1);
        cleanUpFC(FC, {});
        expect(count).toBe(1);
    });
    it("Should remove all listeners and signals inside FC from a signal", async () => {
        let count = 0;
        const propSignal = createSignal<number>(0);
        let computedCount = 0;

        const FC = ({ propSignal }) => {
            const signal = createSignal(0);
            const comp = computed(() => {
                computedCount++;
                return propSignal.value * 2;
            });

            createEffect(() => {
                signal.value;
                count++;
            });
            createEffect(() => {
                propSignal.value;
                count++;
            });
        };
        setCurrentFC(FC);

        FC({ propSignal });
        clearCurrentFC();

        expect(count).toBe(2);
        expect(computedCount).toBe(1);

        propSignal.value = 1;
        await Promise.resolve();

        expect(count).toBe(3);
        expect(computedCount).toBe(2);

        cleanUpFC(FC, { propSignal });

        expect(count).toBe(3);
        expect(computedCount).toBe(2);

        propSignal.value = 2;
        await Promise.resolve();

        expect(computedCount).toBe(2);
    });
});
