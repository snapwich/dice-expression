
var Random  = require("random-js"),
    isNumeric = require("./isNumeric.js");

var random = new Random(Random.engines.mt19937().autoSeed());

/**
 * DiceResult
 * @param {Array<number>} rolls An array of computed rolls
 * @constructor
 */
function DiceResult(rolls) {
    this.roll = rolls.reduce(function(memo, val) {return memo + val;}, 0);
    this.dice = rolls;
}

/**
 * Dice
 * @param {number|string} sides The number of sides dice should have
 * @param {number|string} [count] How many die of given sides to roll (Default: 1)
 * @constructor
 */
function Dice(sides, count) {
    if(sides === "%") {
        this.sides = 100;
    } else {
        this.sides = parseInt(sides, 10);
    }
    if(!isNumeric(count)) {
        this.count = 1;
    } else {
        this.count = parseInt(count, 10);
    }
}

Dice.prototype.roll = function() {
    var rolls = random.dice(this.sides, this.count);
    return new DiceResult(rolls);
};

Dice.prototype.min = function() {
    var rolls = this._createFakeRolls(1);
    return new DiceResult(rolls);
};

Dice.prototype.max = function() {
    var rolls = this._createFakeRolls(this.sides);
    return new DiceResult(rolls);
};

Dice.prototype._createFakeRolls = function(value) {
    return Array.apply(null, Array(this.count)).map(function(){return value});
};

Dice.__setSeed = function(seed) {
    random = new Random(Random.engines.mt19937().seed(seed));
};

module.exports = Dice;