import { MessagePort } from 'worker_threads';

import { IComponentSignature, IEventSignature } from '../';

export interface IRemoteModuleConfig {
  module: {
    path: string,
    member: string,
    /** Path to the tsconig which ts-node will use to execute .ts files you define in the `module` */
  };
  /**
   * When true each imported file will be watched for changes and the worker process will be fully restarted.
   * The debounce delay is `500` ms
   */
  reloadOnFileChanges?: boolean;
  tsconfig?: string | { autoDiscover: true };
  /** When set, the imported function will be wrapped in a component using this as a config */
  plainFunction?: {
    /**
     * If true, the path will be imported immediately instead of when a RequestEvent comes in.
     * This being set increases startup cost but removes a delay on first-call
     */
    preload?: boolean;
    events: {
      /** This event will invoke the function */
      RequestEvent: { name?: string, _eventId: string, params: unknown[] };
      /** This event will be published when the function completes */
      ResponseEvent: { name?: string, _eventId: string, result: unknown };
      /** This event will be published if the function errors through the callback */
      ExceptionEvent: { name?: string, _eventId: string, error: unknown };
    },
  };
}

export interface IMessages {
  'readyMessage': { id: 'ready' };
  'killMessage': { id: 'kill' };
  'portMessage': { id: 'port', port: MessagePort };
  'componentWorkerData': {
    eventInput: IComponentSignature,
    module: IRemoteModuleConfig['module'],
    plainFunction?: IRemoteModuleConfig['plainFunction'],
    tsconfig?: IRemoteModuleConfig['tsconfig'],
    reloadOnFileChanges?: IRemoteModuleConfig['reloadOnFileChanges'];
  };
  'observationMessage': { id: 'observation', event: IEventSignature, payload: any };
  'publicationMessage': { id: 'publication', event: IEventSignature, payload: any };
}
