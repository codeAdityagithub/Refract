import { describe, expect, it } from "vitest";
import {
    cleanUp,
    cleanUpFC,
    clearCurrentFC,
    setCurrentFC,
} from "../../rendering/functionalComponents";

describe("cleanup", () => {
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
    });
});
