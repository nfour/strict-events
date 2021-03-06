# YAEF: Yet Another Event Framework

**Features:**
- Useful type validation for evented architectures
- IPC communication, including a **Registry**
- Clearly defined event model

+ [Usage](#usage)
+ [Example](#example)
+ [Documented example](#documented-example)

## Usage

- If you are utilizing `RemoteModuleComponent` then:
  - You must set an environment variable:
    - `NODE_OPTIONS=--experimental-worker`
  - Requires NodeJS `>= 10.5.0`

## Example

It looks something like this:

```ts
import { Component, ComponentMediator, ComponentSignature, EventSignature } from '@yaef/core';

type IFruitTypes = 'Apple' | 'Banana';

// Create some event signatures

const ItIsANewDay = EventSignature('ItIsANewDay')
const FruitIsRipe = EventSignature('IsRipe', { fruit: <IFruitTypes> '' });

// Or:
const HarvestedFruit = { name: <const> 'HarvestedFruit', fruit: <IFruitTypes> '' };

// Create some component signatures

const Apple = ComponentSignature('Apple', {
  observations: [ItIsANewDay],
  publications: [FruitIsRipe],
});

// Or:
const Harvester = {
  name: <const> 'Harvester',
  observations: [FruitIsRipe],
  publications: [HarvestedFruit],
};

// Create some components

const harvester = Component(Harvester, (m) => {
  m.observe(FruitIsRipe, ({ fruit }) => {
    fruit; // IFruitTypes
    m.publish(HarvestedFruit, { fruit });
  });
});

const apple = Component(Apple, (m) => {
  m.observe(ItIsANewDay, () => {
    if (true) { /** pretend this is doing something... */
      m.publish(FruitIsRipe, { fruit: 'Apple' });
    }
  });
});


const { disconnect, connect, mediator } = ComponentMediator({
  components: [apple, harvester]
});

// The components are initialized with the mediator
await connect();

// Emit some events.

function theEarthRotates () {
  mediator.publish(ItIsANewDay);
}

async function theEarthExplodes () {
  clearTimeout(dayInterval);

  await disconnect(); // If components need to gracefully die, they can here
}

const dayInterval = setInterval(theEarthRotates, 1000); // That is a bit fast

setTimeout(theEarthExplodes, 20000);
```

## Documented example

- (WIP) [./docs/overview.ts](./docs/overview.ts)
