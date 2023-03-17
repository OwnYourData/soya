export function sort<T>(arr: Array<T>, propFunc: (x: T) => any, desc = false) {
  return arr.sort((x, y) => {
    x = propFunc(x);
    y = propFunc(y);

    let res = 0;

    if (x > y) res = 1;
    else if (x < y) res = -1;

    return desc ? -res : res;
  })
}