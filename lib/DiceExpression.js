
var Dice        = require("./Dice.js"),
    isNumeric   = require("./isNumeric.js");

/**
 * DiceExpression
 * @param {string} exp
 * @constructor
 */
function DiceExpression(exp) {
    var diceToken = {type: "dice", exp: "\\d*[dD](\\d+|%)"},    // x?(d|D)y where x is the # of dice and y the sides.
                                                                // OR x?(d|D)% where x is the # of dice and '%' = 100
        arithmeticToken = {type: "arithmetic", exp: "[+-]"},    // plus or minus only
        integerToken = {type: "integer", exp: "\\d+"},
        whitespaceToken = {type: "whitespace", exp: "\\s+"};

    var ruleOrder = [
        diceToken,
        integerToken,
        arithmeticToken,
        whitespaceToken
    ];

    var tokens = [],
        foundToken,
        strIndex = 0,
        self;

    // tokenizer breaks up expression into valid tokens array
    while(exp) {
        foundToken = false;
        ruleOrder.forEach(function(rule) {
            exp = exp.replace(new RegExp("^" + rule.exp), function(match) {
                var startPos = strIndex;
                strIndex += match.length;

                // just ignore whitespace
                if(rule.type !== whitespaceToken.type) {
                    foundToken = true;
                    tokens.push({
                        type: rule.type,

                        // mark the start and end of tokens.  useful for errors
                        startPos: startPos,
                        endPos: strIndex,

                        value: match.toLowerCase() // lower case so we can make assumptions on value later
                    });
                }
                return "";
            });
        });
        if(!foundToken && exp) {
            throw new InvalidToken("Unrecognized token at strIndex(" + strIndex + "): '" + exp + "'");
        }
    }

    if(tokens.length < 1) {
        throw new SyntaxError("No valid tokens found in expression");
    }

    // convert dice tokens to Dice helper class instances and perform quick sanity check against grammar
    tokens.forEach(function(token, index) {
        var split,
            peek = tokens[index + 1];
        switch(token.type) {
            case diceToken.type:
                split = token.value.split("d");
                token.value = new Dice(split[1], split[0]);
            //noinspection FallthroughInSwitchStatementJS
            case integerToken.type:
                // can't have two dice or integer token types in a row
                if(typeof peek !== "undefined" && (peek.type === diceToken.type || peek.type === integerToken.type)) {
                    throw new SyntaxError("Arithmetic token expected at strIndex(" + token.endPos + ")");
                }
                break;
            case arithmeticToken.type:
                // must be followed by a dice or integer token
                if(typeof peek === "undefined" || !(peek.type === diceToken.type || peek.type === integerToken.type)) {
                    throw new SyntaxError("Invalid arithmetic token '" + token.value + "' at strIndex(" + token.startPos + ")");
                }
                break;
        }
    });

    function evaluate(diceEval, includeRolls) {

        // CONVERT to postfix in-case we ever want more complex infix expressions (and want to avoid eval())
        // using: https://en.wikipedia.org/wiki/Shunting-yard_algorithm
        var outputQueue = [],
            operatorStack = [],
            rolls = [],
            value;

        function checkOperators() {
            // for now no precedence check since the only valid operators are [+-] and they're always equal
            while(operatorStack[0]) {
                outputQueue.push(
                    operatorStack.shift()
                )
            }
        }

        tokens.forEach(function(token) {
            var dice,
                split,
                result;
            switch(token.type) {
                case diceToken.type:
                    result = diceEval.apply(token.value);
                    rolls = rolls.concat(result.dice);
                    outputQueue.push(result.roll);
                    break;
                case integerToken.type:
                    result = parseInt(token.value, 10);
                    rolls.push(result);
                    outputQueue.push(result);
                    break;
                case arithmeticToken.type:
                    checkOperators();
                    operatorStack.push(token.value);
            }
            return token.value;
        });
        checkOperators();

        // EVALULATE postfix result
        var resultStack = [];
        outputQueue.forEach(function(value) {
            var a, b;
            if(isNumeric(value)) {
                resultStack.push(value);
            } else {
                a = resultStack.pop();
                b = resultStack.pop();

                // this can happen for singular arithmetic expressions like "+1" or "-2"
                if(typeof b === "undefined") {
                    b = 0;
                }

                switch(value) {
                    case "+":
                        resultStack.push(a + b);
                        break;
                    case "-":
                        resultStack.push(b - a);
                }
            }
        });

        value = resultStack.pop();

        return includeRolls ?
            {roll: value, dice: rolls} :
            value;

    }

    // return regular DiceExpression evaluator and special extra functions bound to other Dice helpers
    self = evaluate.bind(null, Dice.prototype.roll);
    self.min = evaluate.bind(null, Dice.prototype.min);
    self.max = evaluate.bind(null, Dice.prototype.max);

    return self;
}

function InvalidToken(message) {
    this.message = message;
    this.name = "InvalidToken";
}

function SyntaxError(message) {
    this.message = message;
    this.name = "SyntaxError";
}

DiceExpression.InvalidToken = InvalidToken;
DiceExpression.SyntaxError = SyntaxError;

DiceExpression.__enableTestingMode = function() {
    Dice.__setSeed(7777);
};

module.exports = DiceExpression;