# YAEF: Yet Another Event Framework

> This is a **!! Work in progress !!**

+ [Usage](#usage)
+ [Example](#example)
+ [Documented example](#documented-example)

## Usage

- When executing this package you must set an environment variable:
  - `NODE_OPTIONS=--experimental-worker`
- Requires NodeJS `>= 10.5.0`

## Example

It looks something like this:

```ts
import { Component, ComponentMediator, ComponentSignature, EventSignature } from 'yaef';

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

// Initialize the event mediator

const mediator = await ComponentMediator({ components: [apple, harvester] })
  .initialize();

// Emit some events.

function theEarthRotates () {
  mediator.publish(ItIsANewDay);
}

setInterval(theEarthRotates, 1000); // That is a bit fast
```

## Documented example

- (WIP) [./examples/overview.ts](./examples/overview.ts)
