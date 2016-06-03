
var expect = require("chai").expect;

var DiceExpression = require("../index.js");

describe("DiceExpression", function() {

    it("should throw a InvalidToken when coming across unrecognized token", function() {
        expect(function() {
            new DiceExpression("2d11d")
        }).to.throw(DiceExpression.InvalidToken);

        expect(function() {
            new DiceExpression("2d11 x")
        }).to.throw(DiceExpression.InvalidToken);
    });

    it("should throw a SyntaxError when providing a malformed expression", function() {
        expect(function() {
            new DiceExpression("2d5 +")
        }).to.throw(DiceExpression.SyntaxError);

        expect(function() {
            new DiceExpression("2d5 -")
        }).to.throw(DiceExpression.SyntaxError);

        expect(function() {
            new DiceExpression("3d6 2d6")
        }).to.throw(DiceExpression.SyntaxError);
    });

    it("should allow singular positive and negative values", function() {
        expect(
            new DiceExpression("+3")()
        ).to.equal(3);

        expect(
            new DiceExpression("-3")()
        ).to.equal(-3);

        expect(
            new DiceExpression("-4d6").min()
        ).to.equal(-4);
    });

    it("should allow result to include dice rolls (and not suffer from regressions)", function() {
        // sets static seed
        DiceExpression.__enableTestingMode();

        expect(
            new DiceExpression("2d6 - d6 + 45 - 3")(true)
        ).to.deep.equal({
            roll: 50,
            dice: [5, 5, 2, 45, 3]
        });
    });

    describe("for given examples", function() {
        var _2d6 = new DiceExpression("2d6");

        it("should handle min", function() {
            expect(_2d6.min()).to.equal(2);
        });

        it("should handle max", function() {
            expect(_2d6.max()).to.equal(12);
        });
    });

    describe("for d% with percentage sign", function() {
        var _d100 = new DiceExpression("d%");
        it("should be 1 to 100", function() {
            expect(_d100.min()).to.equal(1);
            expect(_d100.max()).to.equal(100);
        })
    });
});