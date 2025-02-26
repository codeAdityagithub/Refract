import { describe, expect, it } from "vitest";
import {
    ArraySignal,
    computed,
    createEffect,
    createPromise,
    createSignal,
    ObjectSignal,
    PrimitiveSignal,
    reactive,
} from "../../signals/signal";
describe("Signal", () => {
    it("should be defined", () => {
        expect(createSignal).toBeTruthy();
    });
    it("should create a signal", () => {
        const signal = createSignal(0);
        expect(signal.value).toBe(0);
    });
    it("should not create a signal with function", () => {
        expect(() => {
            createSignal(() => 0);
        }).toThrow("Functions cannot be used as signal value");
    });
    it("should should create Normal Signal for primitive and null values", () => {
        const values = [0, "", false, null, undefined];
        const signals = values.map((val) => createSignal(val));
        expect(
            signals.every((signal) => signal instanceof PrimitiveSignal)
        ).toBe(true);
        const assignWrongValue = () => {
            signals[0].value = [1, 2, 4];
        };
        expect(assignWrongValue).toThrow(
            "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
        );
    });
    it("should should create ArraySignal for array values", () => {
        const arraySignal = createSignal([0, 1, 2]);
        expect(arraySignal instanceof ArraySignal).toBe(true);
        expect(createSignal({}) instanceof ArraySignal).toBe(false);
        const assignWrongValue = () => {
            arraySignal.value = 3;
        };
        expect(assignWrongValue).toThrow(
            "Invalid type for ArraySignal; value must be an array"
        );
    });
    it("should create ObjectSignal for object values", () => {
        const objectSignal = createSignal({ a: 0, b: 1, c: 2 });
        expect(objectSignal instanceof ObjectSignal).toBe(true);
        expect(createSignal({ 0: "hello" }) instanceof ObjectSignal).toBe(true);
        const assignWrongValue = () => {
            objectSignal.value = 3;
            objectSignal.value = [1, 2];
        };
        expect(assignWrongValue).toThrow(
            "Invalid type for ObjectSignal; value must be a plain object"
        );
    });
    it("should throw when creating effect without function", () => {
        const wrongEffect = () => createEffect(1);
        expect(wrongEffect).toThrow(
            "createEffect takes a effect function as the argument"
        );
    });
    it("should react to changes and call the effect function only once for every render", () => {
        const signal = createSignal<number>(0);
        const arrSignal = createSignal([1, 2, 3]);
        const objSignal = createSignal({ a: 1, b: 2, c: 3 });

        let count = 0;

        createEffect(() => {
            count++;
            signal.value;
            arrSignal.value;
            objSignal.value;
        });

        signal.value = 1;
        arrSignal.value.push(4);
        objSignal.value.a = 4;
        expect(count).toBe(1);
    });
    it("should run the cleanup function of the effect once", async () => {
        const signal = createSignal<number>(0);
        const arrSignal = createSignal([1, 2, 3]);
        const objSignal = createSignal({ a: 1, b: 2, c: 3 });

        let count = 0;
        let cleanup = 0;
        createEffect(() => {
            count++;
            signal.value;
            arrSignal.value;
            objSignal.value;
            return () => {
                cleanup++;
            };
        });

        expect(count).toBe(1);
        expect(cleanup).toBe(0);

        signal.value = 1;
        arrSignal.value.push(4);
        objSignal.value.a = 4;
        await Promise.resolve();

        expect(count).toBe(2);
        expect(cleanup).toBe(1);
    });
    it("reactive function should throw when invalid type for dom node is passed", () => {
        const wrongReactive = () => {
            reactive(1);
        };
        const wrongReturn = () => {
            reactive(() => {
                return { a: 1, b: 2 };
            });
        };

        expect(wrongReactive).toThrow(
            "reactive takes a render function as the argument"
        );
        expect(wrongReturn).toThrow(
            /^Reactive value must be primitive or functional component, got: /
        );
    });
    it("reactive function should run twice for any number of signal changes and returns the function back", async () => {
        const signal = createSignal<number>(0);
        const arrSignal = createSignal([1, 2, 3]);
        const objSignal = createSignal({ a: 1, b: 2, c: 3 });

        let count = 0;
        const func = () => {
            count++;
            signal.value;
            arrSignal.value;
            objSignal.value;
            return 1;
        };

        const retval = reactive(func);
        expect(retval).toBe(1);
        expect(count).toBe(1);

        // to mimic rendering function
        // setReactiveFunction(func);

        signal.value = 10;
        arrSignal.value.push(4);
        objSignal.value.a = 4;
        // Wait for batching to complete
        await Promise.resolve();
        expect(count).toBe(2);
    });
    it("should support all array modification operations and react as expected", async () => {
        const arrSignal = createSignal<number[]>([1, 2, 3]);
        let count = 0;

        // Reactive function to track changes
        const func = () => {
            count++;
            return arrSignal.value.join(","); // Joining the array for easy comparison
        };

        const retval = reactive(func);
        expect(retval).toBe("1,2,3");
        expect(count).toBe(1);

        // Test push
        arrSignal.value.push(4);
        await Promise.resolve();
        expect(arrSignal.value).toEqual([1, 2, 3, 4]);
        expect(count).toBe(2);

        // Test pop
        arrSignal.value.pop();
        await Promise.resolve();
        expect(arrSignal.value).toEqual([1, 2, 3]);
        expect(count).toBe(3);

        // Test shift
        arrSignal.value.shift();
        await Promise.resolve();
        expect(arrSignal.value).toEqual([2, 3]);
        expect(count).toBe(4);

        // Test unshift
        arrSignal.value.unshift(0);
        await Promise.resolve();
        expect(arrSignal.value).toEqual([0, 2, 3]);
        expect(count).toBe(5);

        // Test splice (remove and add elements)
        arrSignal.value.splice(1, 1, 8, 9);
        await Promise.resolve();
        expect(arrSignal.value).toEqual([0, 8, 9, 3]);
        expect(count).toBe(6);

        // Test reverse
        arrSignal.value.reverse();
        await Promise.resolve();
        expect(arrSignal.value).toEqual([3, 9, 8, 0]);
        expect(count).toBe(7);

        // Test sort
        arrSignal.value.sort((a, b) => a - b);
        await Promise.resolve();
        expect(arrSignal.value).toEqual([0, 3, 8, 9]);
        expect(count).toBe(8);

        // Test fill
        arrSignal.value.fill(1, 1, 3);
        await Promise.resolve();
        expect(arrSignal.value).toEqual([0, 1, 1, 9]);
        expect(count).toBe(9);

        // Test copyWithin
        arrSignal.value.copyWithin(1, 2, 4);
        await Promise.resolve();
        expect(arrSignal.value).toEqual([0, 1, 9, 9]);
        expect(count).toBe(10);

        // Test length modification (truncation)
        arrSignal.value.length = 2;
        await Promise.resolve();
        expect(arrSignal.value).toEqual([0, 1]);
        expect(count).toBe(11);

        // Test length extension
        arrSignal.value.length = 5;
        await Promise.resolve();
        expect(arrSignal.value).toEqual([
            0,
            1,
            undefined,
            undefined,
            undefined,
        ]);
        expect(count).toBe(12);
    });
    it("should support all object modification operations and react as expected", async () => {
        const objSignal = createSignal<{ a: number; b: number; c?: number }>({
            a: 1,
            b: 2,
        });
        let count = 0;

        // Reactive function to track changes
        const func = () => {
            count++;
            return JSON.stringify(objSignal.value); // Stringify for easy comparison
        };

        const retval = reactive(func);
        expect(retval).toBe(JSON.stringify({ a: 1, b: 2 }));
        expect(count).toBe(1);

        // Test property update
        objSignal.value.a = 10;
        await Promise.resolve();
        expect(objSignal.value).toEqual({ a: 10, b: 2 });
        expect(count).toBe(2);

        // Test property addition
        objSignal.value.c = 3;
        await Promise.resolve();
        expect(objSignal.value).toEqual({ a: 10, b: 2, c: 3 });
        expect(count).toBe(3);

        // Test property deletion
        delete objSignal.value.b;
        await Promise.resolve();
        expect(objSignal.value).toEqual({ a: 10, c: 3 });
        expect(count).toBe(4);

        // Test reassigning the entire object
        objSignal.value = { x: 42, y: 24 };
        await Promise.resolve();
        expect(objSignal.value).toEqual({ x: 42, y: 24 });
        expect(count).toBe(5);

        // Test nested property modification
        objSignal.value.z = { nested: true };
        await Promise.resolve();
        objSignal.value.z.nested = false;
        await Promise.resolve();
        expect(objSignal.value).toEqual({ x: 42, y: 24, z: { nested: false } });
        expect(count).toBe(7); // Two updates: one for addition, one for nested modification

        // Test assigning the same value (should not trigger reactivity)
        objSignal.value.x = 42; // No change
        await Promise.resolve();
        expect(count).toBe(7); // No increment since value is unchanged

        // Test assigning a deeply equal object (should trigger reactivity)
        objSignal.value = { x: 42, y: 24, z: { nested: false } };
        await Promise.resolve();
        expect(count).toBe(8); // Reassignment triggers reactivity even if deeply equal

        // Test removing all properties by reassigning an empty object
        objSignal.value = {};
        await Promise.resolve();
        expect(objSignal.value).toEqual({});
        expect(count).toBe(9);
    });
    it("should handle primitive signal changes", async () => {
        const numSignal = createSignal(0);
        const strSignal = createSignal("hello");
        const boolSignal = createSignal(true);
        const undefinedSignal = createSignal(undefined);
        const nullSignal = createSignal(null);

        let count = 0;
        const func = () => {
            count++;
            numSignal.value;
            strSignal.value;
            boolSignal.value;
            undefinedSignal.value;
            nullSignal.value;
            return 1;
        };

        const retval = reactive(func);
        expect(retval).toBe(1);
        expect(count).toBe(1);

        // Update signals
        numSignal.value = 10;
        strSignal.value = "world";
        boolSignal.value = false;
        undefinedSignal.value = "changed";
        nullSignal.value = "not null anymore";
        await Promise.resolve();
        expect(count).toBe(2);

        // Ensure values have been updated
        expect(numSignal.value).toBe(10);
        expect(strSignal.value).toBe("world");
        expect(boolSignal.value).toBe(false);
        expect(undefinedSignal.value).toBe("changed");
        expect(nullSignal.value).toBe("not null anymore");
    });
    it("Should handle array of objects changes", async () => {
        const arrSignal = createSignal([
            { id: 1, name: "John" },
            { id: 2, name: "Jane" },
        ]);

        let count = 0;
        const func = () => {
            count++;
            arrSignal.value;
        };
        createEffect(func);
        arrSignal.value[0].id = 3;
        await Promise.resolve();
        expect(count).toBe(1);
        expect(arrSignal.value[0].id).toBe(3);
    });
    it("Should handle object containing array changes", async () => {
        const arrSignal = createSignal({
            ids: [1, 2, 3],
        });

        let count = 0;

        // Reactive function to track changes
        const func = () => {
            count++;
            return arrSignal.value.ids.join(","); // Joining the array for easy comparison
        };

        const retval = reactive(func);
        expect(retval).toBe("1,2,3");
        expect(count).toBe(1);

        // Test push
        arrSignal.value.ids.push(4);
        await Promise.resolve();
        expect(arrSignal.value.ids).toEqual([1, 2, 3, 4]);
        expect(count).toBe(2);

        // Test pop
        arrSignal.value.ids.pop();
        await Promise.resolve();
        expect(arrSignal.value.ids).toEqual([1, 2, 3]);
        expect(count).toBe(3);

        // Test shift
        arrSignal.value.ids.shift();
        await Promise.resolve();
        expect(arrSignal.value.ids).toEqual([2, 3]);
        expect(count).toBe(4);

        // Test unshift
        arrSignal.value.ids.unshift(0);
        await Promise.resolve();
        expect(arrSignal.value.ids).toEqual([0, 2, 3]);
        expect(count).toBe(5);

        // Test splice (remove and add elements)
        arrSignal.value.ids.splice(1, 1, 8, 9);
        await Promise.resolve();
        expect(arrSignal.value.ids).toEqual([0, 8, 9, 3]);
        expect(count).toBe(6);

        // Test reverse
        arrSignal.value.ids.reverse();
        await Promise.resolve();
        expect(arrSignal.value.ids).toEqual([3, 9, 8, 0]);
        expect(count).toBe(7);

        // Test sort
        arrSignal.value.ids.sort((a, b) => a - b);
        await Promise.resolve();
        expect(arrSignal.value.ids).toEqual([0, 3, 8, 9]);
        expect(count).toBe(8);

        // Test fill
        arrSignal.value.ids.fill(1, 1, 3);
        await Promise.resolve();
        expect(arrSignal.value.ids).toEqual([0, 1, 1, 9]);
        expect(count).toBe(9);

        // Test copyWithin
        arrSignal.value.ids.copyWithin(1, 2, 4);
        await Promise.resolve();
        expect(arrSignal.value.ids).toEqual([0, 1, 9, 9]);
        expect(count).toBe(10);

        // Test length modification (truncation)
        arrSignal.value.ids.length = 2;
        await Promise.resolve();
        expect(arrSignal.value.ids).toEqual([0, 1]);
        expect(count).toBe(11);

        // Test length extension
        arrSignal.value.ids.length = 5;
        await Promise.resolve();
        expect(arrSignal.value.ids).toEqual([
            0,
            1,
            undefined,
            undefined,
            undefined,
        ]);
        expect(count).toBe(12);

        arrSignal.value.ids[0] = 10;
        await Promise.resolve();
        expect(count).toBe(13);

        arrSignal.value.ids[1]++;
        await Promise.resolve();
        expect(count).toBe(14);
    });
    it("should not trigger reactivity on the same value set", async () => {
        const numSignal = createSignal(0);
        let count = 0;
        const func = () => {
            count++;
            numSignal.value;
            return 1;
        };

        const retval = reactive(func);
        expect(retval).toBe(1);
        expect(count).toBe(1);

        // Set the same value
        numSignal.value = 0;
        await Promise.resolve();

        expect(count).toBe(1); // No reactivity trigger
    });
});

describe("Computed", () => {
    it("should should create Normal Signal for primitive and null values", () => {
        const values = [0, "", false, null, undefined];
        const signals = values.map((val) => computed(() => val));
        expect(
            signals.every((signal) => signal instanceof PrimitiveSignal)
        ).toBe(true);
        const assignWrongValue = () => {
            signals[0].value = [1, 2, 4];
        };
        expect(assignWrongValue).toThrow(
            "Invalid type for PrimitiveSignal. Valid types: [boolean, string, number, undefined, null]"
        );
    });
    it("should should create ArraySignal for array values", () => {
        const arraySignal = computed(() => [0, 1, 2]);
        expect(arraySignal instanceof ArraySignal).toBe(true);
        expect(computed(() => ({})) instanceof ArraySignal).toBe(false);
        const assignWrongValue = () => {
            arraySignal.value = 3;
        };
        expect(assignWrongValue).toThrow(
            "Invalid type for ArraySignal; value must be an array"
        );
    });
    it("should create ObjectSignal for object values", () => {
        const objectSignal = computed(() => ({ a: 0, b: 1, c: 2 }));
        expect(objectSignal instanceof ObjectSignal).toBe(true);
        expect(createSignal({ 0: "hello" }) instanceof ObjectSignal).toBe(true);
        const assignWrongValue = () => {
            objectSignal.value = 3;
            objectSignal.value = [1, 2];
        };
        expect(assignWrongValue).toThrow(
            "Invalid type for ObjectSignal; value must be a plain object"
        );
    });
    it("Should support computed value from signals", async () => {
        const numSignal = createSignal<number>(0);
        let count = 0;
        const doubleSignal = computed(() => {
            count++;
            return numSignal.value * 2;
        });
        expect(count).toBe(1);
        expect(doubleSignal.value).toBe(0);
        numSignal.value = 10;
        await Promise.resolve();
        expect(count).toBe(2);
        expect(doubleSignal.value).toBe(20);
    });
});

describe("createPromise", () => {
    const asyncResolvedFunction = async () => {
        // wait 100 ms
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "resolved";
    };
    const asyncRejectedFunction = async () => {
        // wait 100 ms then reject
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error("rejected");
    };

    it("should resolve a promise", async () => {
        const promise = createPromise(asyncResolvedFunction);
        expect(promise.value.data).toBe(null);
        expect(promise.value.error).toBe(null);
        expect(promise.value.status).toBe("pending");

        await new Promise((resolve) => setTimeout(resolve, 110));

        expect(promise.value.data).toBe("resolved");
        expect(promise.value.error).toBe(null);
        expect(promise.value.status).toBe("resolved");
    });

    it("should reject a promise", async () => {
        const promise = createPromise(asyncRejectedFunction);
        expect(promise.value.data).toBe(null);
        expect(promise.value.error).toBe(null);
        expect(promise.value.status).toBe("pending");

        await new Promise((resolve) => setTimeout(resolve, 110));

        expect(promise.value.data).toBe(null);
        expect(promise.value.error).toBeInstanceOf(Error);
        expect(promise.value.status).toBe("rejected");
    });

    describe("additional edge cases", () => {
        it("should remain stable after resolution", async () => {
            const promise = createPromise(asyncResolvedFunction);
            await new Promise((resolve) => setTimeout(resolve, 110));
            const resolvedState = { ...promise.value };
            // Wait additional time to ensure state does not change
            await new Promise((resolve) => setTimeout(resolve, 50));
            expect(promise.value).toEqual(resolvedState);
        });

        it("should handle non-Error rejections", async () => {
            const asyncRejectNonError = async () => {
                await new Promise((resolve) => setTimeout(resolve, 100));
                return Promise.reject("non-error rejection");
            };
            const promise = createPromise(asyncRejectNonError);
            await new Promise((resolve) => setTimeout(resolve, 110));
            expect(promise.value.data).toBe(null);
            expect(promise.value.error).toBe("non-error rejection");
            expect(promise.value.status).toBe("rejected");
        });

        it("should create independent promises", async () => {
            const promise1 = createPromise(asyncResolvedFunction);
            const promise2 = createPromise(asyncResolvedFunction);
            await new Promise((resolve) => setTimeout(resolve, 110));
            expect(promise1.value.data).toBe("resolved");
            expect(promise2.value.data).toBe("resolved");
        });

        it("should throw if a non-function is passed", () => {
            // @ts-expect-error: intentionally passing a non-function
            expect(() => createPromise(123)).toThrow();
        });
    });
});
