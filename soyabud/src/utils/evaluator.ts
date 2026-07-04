import * as expressionEval from "expression-eval";

type parseExpression = expressionEval.parse.Expression & {
  name: string
  object: parseExpression,
  property: parseExpression,
  left?: parseExpression,
  right?: parseExpression,
}

export class Evaluator {
  static makeSafeObject = (expression: parseExpression, obj: any, isObject?: boolean): any => {
    if (expression.type === 'Identifier') {
      if (isObject && typeof obj[expression.name] !== 'object')
        obj[expression.name] = {};
      else if (obj[expression.name] === undefined)
        obj[expression.name] = '';

      return obj[expression.name];
    }
    else if (expression.type === 'MemberExpression') {
      obj = Evaluator.makeSafeObject(expression.object, obj, isObject ?? true);
      obj = Evaluator.makeSafeObject(expression.property, obj, isObject ?? false);
    }
    else if (expression.left && expression.right) {
      Evaluator.makeSafeObject(expression.left, obj);
      Evaluator.makeSafeObject(expression.right, obj);
    }

    return obj;
  }

  static eval = (expression: string, value: any): any => {
    try {
      const exp = expressionEval.parse(expression) as parseExpression;
      Evaluator.makeSafeObject(exp, value);

      return expressionEval.eval(exp, value);
    }
    catch (e) {
      /* we don't mind any errors */
    }

    return expression;
  }

  static evalTypeAgnostic = (expression: string, value: any) => {
    const val = Evaluator.eval(expression, value);

    if (val instanceof Date)
      return new Intl.DateTimeFormat('de', {
        // @ts-ignore somehow TS does not know dateStyle and wants to complain
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(val);

    // try parsing values as float
    const floatVal = parseFloat(val);
    if (!isNaN(floatVal))
      return floatVal;

    return val;
  };
}