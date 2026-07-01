export interface Range { }

export class NumberRange implements Range {
  constructor(
    /**
     * The minimum value is INCLUDED in the range
     */
    public min?: number,
    /**
     * The maximum value is INCLUDED in the range
     */
    public max?: number,
  ) { }
}

export class DateRange implements Range {
  constructor(
    /**
     * The minimum value is INCLUDED in the range
     */
    public min?: string,
    /**
     * The maximum value is INCLUDED in the range
     */
    public max?: string,
  ) { }
}

const isExcluded = (char: string = '') => ['(', ')'].indexOf(char) !== -1;

// this is a very stupid date regex
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const numberRegex = /^\d+$/

const parseValue = (value?: string): string | number | undefined => {
  if (!value)
    return;

  if (dateRegex.test(value))
    return value;
  else if (numberRegex.test(value))
    return parseInt(value);

  return;
}

const rangeRegex = /^([\(\[]?)([^\(\[]+)\.\.([^\)\]]+)([\)\]]?)$/;
export const parseRange = (input: string): Range | undefined => {
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
}