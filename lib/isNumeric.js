
function isNumeric(val) {
    return !isNaN(parseFloat(val)) && isFinite(val);
}

module.exports = isNumeric;