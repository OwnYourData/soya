"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRange = exports.DateRange = exports.NumberRange = void 0;
class NumberRange {
    constructor(
    /**
     * The minimum value is INCLUDED in the range
     */
    min, 
    /**
     * The maximum value is INCLUDED in the range
     */
    max) {
        this.min = min;
        this.max = max;
    }
}
exports.NumberRange = NumberRange;
class DateRange {
    constructor(
    /**
     * The minimum value is INCLUDED in the range
     */
    min, 
    /**
     * The maximum value is INCLUDED in the range
     */
    max) {
        this.min = min;
        this.max = max;
    }
}
exports.DateRange = DateRange;
const isExcluded = (char = '') => ['(', ')'].indexOf(char) !== -1;
// this is a very stupid date regex
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const numberRegex = /^\d+$/;
const parseValue = (value) => {
    if (!value)
        return;
    if (dateRegex.test(value))
        return value;
    else if (numberRegex.test(value))
        return parseInt(value);
    return;
};
const rangeRegex = /^([\(\[]?)([^\(\[]+)\.\.([^\)\]]+)([\)\]]?)$/;
const parseRange = (input) => {
    const match = rangeRegex.exec(input);
    if (!match || match === null || match.length !== 5)
        return;
    const excludeMin = isExcluded(match[1]);
    const excludeMax = isExcluded(match[4]);
    let minValue = parseValue(match[2]);
    let maxValue = parseValue(match[3]);
    if ((minValue === undefined || typeof minValue === 'number') && (maxValue === undefined || typeof maxValue === 'number')) {
        if (minValue && excludeMin)
            minValue++;
        if (maxValue && excludeMax)
            maxValue--;
        return new NumberRange(minValue, maxValue);
    }
    else if ((minValue === undefined || typeof minValue === 'string') && (maxValue === undefined || typeof maxValue === 'string'))
        return new DateRange(minValue, maxValue);
    return undefined;
};
exports.parseRange = parseRange;
//# sourceMappingURL=range.js.map