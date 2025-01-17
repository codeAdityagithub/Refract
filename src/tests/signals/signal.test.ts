import { describe, expect, it } from "vitest";
import { setReactiveFunction } from "../../signals/batch";
import {
    ArraySignal,
    createEffect,
    createSignal,
    ObjectSignal,
    reactive,
    Signal,
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
        expect(signals.every((signal) => signal instanceof Signal)).toBe(true);
        const assignWrongValue = () => {
            signals[0].value = [1, 2, 4];
        };
        expect(assignWrongValue).toThrow(
            "Invalid type for Signal, valid types: [boolean, string, number, undefined, null]"
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
            "Invalid type for Reference Signal; can be array only"
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
            "Invalid type for Reference Signal; can be object only"
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
    it("reactive function should run twice for any number of signal changes and returns the function back", () => {
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

        const returnedFunc = reactive(func);
        expect(count).toBe(1);

        // to mimic rendering function
        setReactiveFunction(returnedFunc, () => {
            count++;
        });

        expect(returnedFunc === func).toBe(true);

        signal.value = 1;
        arrSignal.value.push(4);
        objSignal.value.a = 4;

        expect(count).toBe(2);
    });
});
