'use strict';

class MicroVizEvents {
  constructor(programOrSendEvent, sourceLoc) {
    this.programOrSendEvent = programOrSendEvent;
    this.sourceLoc = sourceLoc;
    this.eventGroups = [];
  }

  get lastEventGroup() {
    return this.eventGroups[this.eventGroups.length - 1];
  }

  add(event) {
    const eventIsLocal = this.sourceLoc.strictlyContains(event.sourceLoc);
    if (eventIsLocal && this.lastEventGroup instanceof LocalEventGroup) {

      // "Just accumulating events"
      //   x = 1; y = 2;
      // [y = 2] goes "forward in pos", so it can be placed into the same LEG.

      // "Toby's rule"
      //   var sum = 0;          [sum = 0]
      //   for 1 to: 3 do: {x|   [x = 1]   | [x = 2]   | [x = 3]
      //     sum = sum + x;      [sum = 1] | [sum = 3] | [sum = 6]
      //   };                              |           |
      // Each [x = _] after the first is going "back in pos" so it's the start of a new iteration.

      // Another example of "Toby's rule"
      //   [1,2,3].reduce((x, y) => x + y);
      // Each x declaration after the first starts a new iteration.

      // "Inside-out rule", case 1
      //   var x = f();
      // Event starts @ same line as nested event ends -- so no LEGs req'd.

      // "Inside-out rule", case 2
      //   var x = f(
      //           );
      // x's decl goes "back in pos" so it must go into a new LEG -- but not a new iteration.

      // "Inside-out rule", case 2 (another example: "pre-events" for a send)
      //   for f()
      //   to: g()
      //   do: {...}
      // A new LEG -- but not a new iteration -- is needed for the for-to-do send.

      const lastEvent = this.lastEventGroup.lastEvent;
      const eventNestsLastEvent = event.sourceLoc.strictlyContains(lastEvent.sourceLoc);
      if (event.sourceLoc.startPos >= this.lastEventGroup.lastEvent.sourceLoc.endPos ||
          eventNestsLastEvent &&
              event.sourceLoc.startLineNumber >= lastEvent.sourceLoc.endLineNumber) {
        // no-op
      } else {
        const isNewIteration = !eventNestsLastEvent;
        this.eventGroups.push(new LocalEventGroup(isNewIteration));
      }
    } else if (eventIsLocal && !(this.lastEventGroup instanceof LocalEventGroup)) {
      const isNewIteration = !!this.lastEventGroup;
      this.eventGroups.push(new LocalEventGroup(isNewIteration));
    } else if (!eventIsLocal && !(this.lastEventGroup instanceof RemoteEventGroup)) {
      const isNewIteration = !!this.lastEventGroup;
      this.eventGroups.push(new RemoteEventGroup(isNewIteration));
    }
    this.lastEventGroup.add(event);
  }
}

class AbstractEventGroup {
  constructor(isNewIteration) {
    this.isNewIteration = isNewIteration;
    this.events = [];
  }

  add(event) {
    this.events.push(event);
    return this;
  }

  get lastEvent() {
    return this.events[this.events.length - 1];
  }
}

class LocalEventGroup extends AbstractEventGroup {
  constructor(isNewIteration = false) {
    super(isNewIteration);
  }
}

class RemoteEventGroup extends AbstractEventGroup {
  constructor(isNewIteration = false) {
    super(isNewIteration);
  }
}
