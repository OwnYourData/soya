import { Soya } from "soya-js";

// soya is created centrally
// this way we can make use of its inbuilt caching
export let soya = new Soya();
export const initialize = (instance: Soya) => soya = instance;