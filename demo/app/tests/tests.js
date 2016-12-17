var aws = require("nativescript-aws");

describe("config", function() {
  it("exists", function() {
    expect(aws.config).toBeDefined();
  });
});