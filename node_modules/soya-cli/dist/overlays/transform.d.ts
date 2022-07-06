import { Overlays, SoyaDocument } from 'soya-js';
export declare class SoyaTransform implements Overlays.OverlayPlugin {
    private runJolt;
    private runJq;
    run: (soyaDoc: SoyaDocument, data: any) => Promise<Overlays.OverlayResult>;
}
