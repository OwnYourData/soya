import { PipelineInput, StreamPipelineInput, PipelineStage, PipelineEngine } from './pipeline-engine';
/**
 * A PipelineStage which materializes all intermediate results in main memory.
 * @author Thomas Minier
 */
export declare class VectorStage<T> implements PipelineStage<T> {
    private readonly _content;
    constructor(content: Promise<Array<T>>);
    getContent(): Promise<Array<T>>;
    subscribe(onData: (value: T) => void, onError: (err: any) => void, onEnd: () => void): void;
    forEach(cb: (value: T) => void): void;
}
export declare class VectorStreamInput<T> implements StreamPipelineInput<T> {
    private readonly _resolve;
    private readonly _reject;
    private _content;
    constructor(resolve: any, reject: any);
    next(value: T): void;
    error(err: any): void;
    complete(): void;
}
/**
 * A pipeline implemented using {@link VectorStage}, *i.e.*, all intermediate results are materialized in main memory. This approach is often called **vectorized approach**.
 * This pipeline is more efficient CPU-wise than {@link RxjsPipeline}, but it also consumes much more memory, as it materializes evey stage of the pipeline before moving to the next.
 * It should only be used when SPARQL queries generate few intermediate results.
 * @see P. A. Boncz, S. Manegold, and M. L. Kersten. "Database architecture evolution: Mammals flourished long before dinosaurs became extinct". PVLDB, (2009)
 * @author Thomas Minier
 */
export default class VectorPipeline extends PipelineEngine {
    empty<T>(): VectorStage<T>;
    of<T>(...values: T[]): VectorStage<T>;
    from<T>(x: PipelineInput<T>): VectorStage<T>;
    fromAsync<T>(cb: (input: StreamPipelineInput<T>) => void): VectorStage<T>;
    clone<T>(stage: VectorStage<T>): VectorStage<T>;
    catch<T, O>(input: VectorStage<T>, handler?: (err: Error) => VectorStage<O>): VectorStage<T | O>;
    merge<T>(...inputs: Array<VectorStage<T>>): VectorStage<T>;
    map<F, T>(input: VectorStage<F>, mapper: (value: F) => T): VectorStage<T>;
    flatMap<F, T>(input: VectorStage<F>, mapper: (value: F) => T[]): VectorStage<T>;
    mergeMap<F, T>(input: VectorStage<F>, mapper: (value: F) => VectorStage<T>): VectorStage<T>;
    filter<T>(input: VectorStage<T>, predicate: (value: T) => boolean): VectorStage<T>;
    finalize<T>(input: VectorStage<T>, callback: () => void): VectorStage<T>;
    reduce<F, T>(input: VectorStage<F>, reducer: (acc: T, value: F) => T, initial: T): VectorStage<T>;
    limit<T>(input: VectorStage<T>, stopAfter: number): VectorStage<T>;
    skip<T>(input: VectorStage<T>, toSkip: number): VectorStage<T>;
    defaultValues<T>(input: VectorStage<T>, ...values: T[]): VectorStage<T>;
    bufferCount<T>(input: VectorStage<T>, count: number): VectorStage<T[]>;
    forEach<T>(input: VectorStage<T>, cb: (value: T) => void): void;
    first<T>(input: VectorStage<T>): VectorStage<T>;
    collect<T>(input: VectorStage<T>): VectorStage<T[]>;
}
