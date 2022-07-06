import { Observable, Subscriber } from 'rxjs';
import { StreamPipelineInput, PipelineEngine } from './pipeline-engine';
/**
 * A StreamPipelineInput implemented using Rxjs' subscribers.
 * @author Thomas Minier
 */
export declare class RxjsStreamInput<T> implements StreamPipelineInput<T> {
    private readonly _subscriber;
    constructor(subscriber: Subscriber<T>);
    next(value: T): void;
    complete(): void;
    error(err: any): void;
}
/**
 * A pipeline implemented using Rx.js
 * @author Thomas Minier
 */
export default class RxjsPipeline extends PipelineEngine {
    empty<T>(): Observable<T>;
    of<T>(...values: T[]): Observable<T>;
    from(x: any): Observable<any>;
    fromAsync<T>(cb: (input: StreamPipelineInput<T>) => void): Observable<T>;
    clone<T>(stage: Observable<T>): Observable<T>;
    catch<T, O>(input: Observable<T>, handler?: (err: Error) => Observable<O>): Observable<T | O>;
    merge<T>(...inputs: Array<Observable<T>>): Observable<T>;
    map<F, T>(input: Observable<F>, mapper: (value: F) => T): Observable<T>;
    flatMap<F, T>(input: Observable<F>, mapper: (value: F) => T[]): Observable<T>;
    mergeMap<F, T>(input: Observable<F>, mapper: (value: F) => Observable<T>): Observable<T>;
    filter<T>(input: Observable<T>, predicate: (value: T) => boolean): Observable<T>;
    finalize<T>(input: Observable<T>, callback: () => void): Observable<T>;
    reduce<F, T>(input: Observable<F>, reducer: (acc: T, value: F) => T, initial: T): Observable<T>;
    limit<T>(input: Observable<T>, stopAfter: number): Observable<T>;
    skip<T>(input: Observable<T>, toSkip: number): Observable<T>;
    distinct<T, K>(input: Observable<T>, selector?: (value: T) => T | K): Observable<T>;
    defaultValues<T>(input: Observable<T>, ...values: T[]): Observable<T>;
    bufferCount<T>(input: Observable<T>, count: number): Observable<T[]>;
    forEach<T>(input: Observable<T>, cb: (value: T) => void): void;
    first<T>(input: Observable<T>): Observable<T>;
    endWith<T>(input: Observable<T>, values: T[]): Observable<T>;
    tap<T>(input: Observable<T>, cb: (value: T) => void): Observable<T>;
    collect<T>(input: Observable<T>): Observable<T[]>;
}
