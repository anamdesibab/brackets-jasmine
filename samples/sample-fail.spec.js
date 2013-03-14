describe("brackets jasmine expected failure", function() {
  it("The 1st test passes", function() {
    expect(true).toBe(true);
  });
  it("The 2nd test fails", function() {
    expect(false).toBe(true);
  });
});
describe("This is the 2nd suite", function() {
  it("The 1st test in 2nd suite passes", function() {
    expect(true).toBe(true);
  });
});
describe("This is the 3rd suite", function() {
  it("The 1st test in 3rd suite passes", function() {
    expect(true).toBe(true);
  });
});
describe("This is the 4th suite", function() {
  it("The 1st test in 4th suite passes", function() {
    expect(true).toBe(true);
  });
  it("The top panel should appear as x o o o, Failing 1 specs, 4 specs | 1 failing", function() {
    expect(true).toBe(true);
  });
});