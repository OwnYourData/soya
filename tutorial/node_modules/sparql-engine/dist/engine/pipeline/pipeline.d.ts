import { PipelineEngine } from './pipeline-engine';
/**
 * Singleton class used to access the current pipeline engine
 * @author Thomas Minier
 */
export declare class Pipeline {
    /**
     * Get the instance of the current pipeline engine
     * @return The instance of the current pipeline engine
     */
    static getInstance(): PipelineEngine;
    /**
     * Set the instance of the current pipeline engine
     * @param instance  - New pipeline engine to use as the current one
     */
    static setInstance(instance: PipelineEngine): void;
}
