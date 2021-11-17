import { Overlay } from "./overlays/interface";

export interface Stack {
  '@context': {
    [key: string]: string,
  },
  import: string[],
  overlays: Overlay[],
}