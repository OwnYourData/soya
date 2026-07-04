import { Semcon } from 'semcon-js';

let semcon: Semcon;

export const setInstance = (instance: Semcon): Semcon => semcon = instance;
export const getInstance = (): Semcon => semcon;
