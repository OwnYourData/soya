export interface Overlay {
  type: string,
  '@graph': any[],
  [key: string]: any,
}

export interface OverlayResult {
  data: any,
}

export interface CommandPlugin {
  run: (overlay: Overlay, data: any) => Promise<OverlayResult>;
}