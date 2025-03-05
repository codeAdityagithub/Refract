import { describe, expect, it, vi } from "vitest";
import {
    cleanUp,
    cleanUpFC,
    clearCurrentFC,
    setCurrentFC,
} from "../../rendering/functionalComponents";
import * as rendering from "../../rendering/render";

import { computed, createEffect, createSignal } from "../../signals/signal";

vi.stubGlobal("requestIdleCallback", (cb) => {
    queueMicrotask(() => cb({ timeRemaining: () => 2 }));
});

// @ts-expect-error
const createFiber = rendering.createFiber;
// @ts-expect-error
const commitFiber = rendering.commitFiber;
// @ts-expect-error
const commitDeletion = rendering.commitDeletion;

describe("Functional Components life cycle", () => {
    it("should be defined", () => {
        expect(cleanUp).toBeTruthy();
    });
    it("should add cleanup to the FC", () => {
        let FC = () => {
            console.log("FC");
        };
        // @ts-expect-error
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
            return <div>Hello</div>;
        };

        const fiber = (
            <div>
                <FC propSignal={propSignal} />
            </div>
        );

        createFiber(fiber);
        commitFiber(fiber);

        expect(count).toBe(0);

        await Promise.resolve();

        expect(count).toBe(2);
        expect(computedCount).toBe(1);

        propSignal.update(1);
        await Promise.resolve();

        expect(count).toBe(3);
        expect(computedCount).toBe(2);

        commitDeletion(fiber);

        expect(count).toBe(3);
        expect(computedCount).toBe(2);

        propSignal.update(2);
        await Promise.resolve();

        expect(computedCount).toBe(2);
    });
});
