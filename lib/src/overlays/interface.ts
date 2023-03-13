import { SoyaDocument } from "../interfaces";

export interface OverlayResult {
  data: any,
}

export interface OverlayPlugin {
  run: (overlay: SoyaDocument, data: any, options?: any) => Promise<OverlayResult>;
}