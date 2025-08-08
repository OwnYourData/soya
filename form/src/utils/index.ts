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

export async function evaluteDynamicEnum(object: any): Promise<any> {
  const schemaProperties = object["schema"]["properties"];
  const props: Array<string> = Object.keys(schemaProperties);

  for(const propName of props) {
    if(!Object.keys(schemaProperties[propName]).includes("enumApi"))
      continue;

    console.log(`Schema has '${propName}' as DynamicEnum property.`);
    const prop = schemaProperties[propName];
    
    console.log(`Fetching: ${prop["enumApi"]}`);
    const res = await fetch(prop["enumApi"], {
      headers: {
        "Accept": "application/json"
      }
    });
    const json = await res.json();

    delete object["schema"]["properties"][propName]["enumApi"];
    object["schema"]["properties"][propName]["oneOf"] = json;
  }

  return object;
}
