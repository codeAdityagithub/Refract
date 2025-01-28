import { describe, expect, it } from "vitest";
import { cleanUp, clearCurrentFC, setCurrentFC } from "../../rendering/cleanup";

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

        // @ts-expect-error
        expect(FC.__cleanup).toBe(cleanup);
    });
});
