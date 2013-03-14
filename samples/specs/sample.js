/*global global, describe, it, expect  */
describe("brackets-jasmine-tests", function () {
    it("Verify a test without .spec.js but in specs directory is detected as a test", function () {
        expect(true).toBe(true);
    });
});