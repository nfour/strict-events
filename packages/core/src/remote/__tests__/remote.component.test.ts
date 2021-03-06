import { delay, map } from 'bluebird';
import { resolve } from 'path';

import { ComponentMediator, ComponentSignature, EventAwaiter } from '../../';
import { EventSignature } from '../../componentry';
import { COMPLETION_CALLBACK_SYMBOL, RemoteModuleComponent } from '../remote';
import { A, apple, banana, BananaDef, C } from './fixtures/components';

type IValidMembers = keyof typeof import('./fixtures/components');

const bananaComponentPath = resolve(__dirname, './fixtures/components');
const bananaMember: IValidMembers = 'banana';

jest.setTimeout(15000);

describe('Running components in a worker process', () => {
  /** Used to clean up after tests */
  const containers: Array<ReturnType<typeof ComponentMediator>> = [];

  afterEach(async () => {
    for (const c of containers) { await c.disconnect(); }

    containers.splice(0, containers.length); // Empty
  });

  test('This tests lifecycle works with regular components', async () => {
    const container = ComponentMediator({ components: [apple, banana] });
    containers.push(container);

    const mediator = await container.connect();

    const eventCCalled = jest.fn();

    mediator.observe(C, eventCCalled);
    mediator.publish(A);

    expect(eventCCalled).toBeCalledTimes(1);
  });

  test('Can send and receive remote events', async () => {
    const { mediator } = await prepareRemoteBananaCase();

    const eventCCalled = jest.fn();

    const waitFor = EventAwaiter(mediator);

    const waitingForC = waitFor(C);
    await mediator.publish(A);

    const result = await waitingForC;

    expect(result).toMatchObject(C);
  });

  test('Can send many events to and from a remote component', async () => {
    const { mediator } = await prepareRemoteBananaCase();

    const eventCCalled = jest.fn();

    mediator.observe(C, eventCCalled);

    // 30x10 == 1.6s, 300x100 == 1.7s, 3000x1000 == 4.5s
    const concurrency = 100;
    const size = 300;

    await map(Array(size).fill(''), () => { mediator.publish(A); }, { concurrency });

    while (eventCCalled.mock.calls.length < size) { await delay(10); }

    expect(eventCCalled).toBeCalledTimes(size);
  });

  test('Can spawn many remote components and exchange many events', async () => {
    const spawnSize = 5;
    const start = Date.now();
    const bananas = Array(spawnSize).fill('').map(() => {
      return RemoteModuleComponent(BananaDef, {
        module: { path: bananaComponentPath, member: bananaMember },
        tsconfig: { autoDiscover: true },
      });
    });

    const container = ComponentMediator({ components: [apple, ...bananas] });

    containers.push(container);

    const mediator = await container.connect();

    // tslint:disable-next-line: no-console
    console.log(`Took ${Date.now() - start}ms to initialize ${spawnSize} workers`);

    const eventCCalled = jest.fn();

    mediator.observe(C, () => eventCCalled());

    const eventEmitSize = 10;
    const expectedCallTimes = eventEmitSize * spawnSize;

    await map(Array(eventEmitSize).fill(''), () => { mediator.publish(A); });

    while (eventCCalled.mock.calls.length < expectedCallTimes) {
      await delay(50);
    }

    expect(eventCCalled).toBeCalledTimes(expectedCallTimes);
  });

  // test('Worker wont kill itself, parent should timeout and terminate');
  // test('Errors when recursive events are defined');
  // test('Infinite loops with recursive events when the checks are disabled');
  // test('Can load balance between multiple workers');

  test('Can spawn a remote component around a configured plain function', async () => {
    const RequestEvent = EventSignature('RequestEvent', {} as {
      _eventId: string,
      params: [{ foo: number}, {}, typeof COMPLETION_CALLBACK_SYMBOL],
    });
    const ResponseEvent = EventSignature('ResponseEvent', {} as { _eventId: string, result: any });
    const ExceptionEvent = EventSignature('ExceptionEvent', {} as { _eventId: string, error: any });

    const HandlerSig = ComponentSignature('LambdaTest', {
      observations: [RequestEvent],
      publications: [ResponseEvent, ExceptionEvent],
    });

    const simpleAwsHandlerComponent = RemoteModuleComponent(HandlerSig, {
      module: {
        path: bananaComponentPath,
        member: <IValidMembers> 'simpleAwsLambdaHandlerFunction',
      },
      tsconfig: { autoDiscover: true },
      plainFunction: { events: { ExceptionEvent, RequestEvent, ResponseEvent } },
    });

    const container = ComponentMediator({ components: [simpleAwsHandlerComponent] });
    containers.push(container);

    const { mediator, connect } = container;

    await connect();

    const waitFor = EventAwaiter(mediator);

    await mediator.publish(RequestEvent, { _eventId: 'foobar', params: [{ foo: 1 }, {}, COMPLETION_CALLBACK_SYMBOL] });

    const response = await waitFor(ResponseEvent);

    expect(response).toMatchObject({
      _eventId: 'foobar',
      result: { statusCode: 999, body: { foo: 1 } },
    });

  });

  async function prepareRemoteBananaCase () {
    const remoteBananaComponent = RemoteModuleComponent(BananaDef, {
      module: { path: bananaComponentPath, member: bananaMember },
      tsconfig: { autoDiscover: true },
    });

    const container = ComponentMediator({ components: [apple, remoteBananaComponent] });

    containers.push(container);

    const mediator = await container.connect();

    return { ...container, remoteBananaComponent };
  }
});
