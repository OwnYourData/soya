import { ConfigService } from "@/services/config-service";
import { NetworkResponse, Semcon, SemconItem } from "semcon-js";
import Vue from "vue";

export enum ActionMethod {
  // triggers an internal event
  INTERNAL = 'INTERNAL',
  // opens a new tab
  OPEN = 'OPEN',
  // opens a URL in the same tab
  HREF = 'HREF',
  // issues a HTTP POST request
  POST = 'POST',
  // issues a HTTP PUT request
  PUT = 'PUT',
  // issues a HTTP GET request
  GET = 'GET',
}

export interface Action {
  key: string,
  title: string,
  url: string,
  usesAuth: boolean,
  method: ActionMethod,
}

export const executeAction = async (action: Action, semcon: Semcon, vue?: Vue, item?: SemconItem): Promise<NetworkResponse | undefined> => {
  const { key, title, method, usesAuth } = action;
  let { url } = action;

  const baseUrlPlaceholder = '{{base_url}}';
  const vaultItemIdPlaceholder = '{{item_id}}';

  if (item)
    url = url.replace(vaultItemIdPlaceholder, item.id.toString());

  let returnValue: NetworkResponse | undefined = undefined;

  // method `OPEN` just opens a new tab
  if (method === ActionMethod.OPEN) {
    window.open(url, '_blank');
  }
  else if (method === ActionMethod.HREF) {
    window.location.href = url;
  }
  else
    try {
      if (url.indexOf(baseUrlPlaceholder) !== -1) {
        const semconUrl = url.replace(baseUrlPlaceholder, '');

        if (method === ActionMethod.POST)
          returnValue = await semcon.post(semconUrl, usesAuth);
        else if (method === ActionMethod.PUT)
          returnValue = await semcon.put(semconUrl, usesAuth);
        else if (method === ActionMethod.GET)
          returnValue = await semcon.get(semconUrl, usesAuth);
        else
          throw new Error(`Invalid method for action ${key}`);
      }
      else {
        const req = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (req.status >= 400)
          throw new Error('Action did not result in a valid HTTP status code');
      }

      if (vue)
        vue.$bvModal.msgBoxOk(`The action "${title}" was executed succssfully.`);
    } catch {
      if (vue)
        vue.$bvModal.msgBoxOk(`The action "${title}" has failed.`);
    }

  return returnValue;
}

export const getActionsFromConfig = (...path: string[]): Action[] => {
  const actionsObj = ConfigService.get(...path);
  const arr: Action[] = []

  for (const key in actionsObj) {
    arr.push({
      usesAuth: false,
      ...actionsObj[key],
      key,
    });
  }

  return arr;
}