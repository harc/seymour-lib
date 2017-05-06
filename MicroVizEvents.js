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

    // (1) do nothing -- no overlap
    //   x = 1; y = 2;         [x = 1] [y = 2]

    // (2) do nothing -- inside-out rule
    //   var x = f();          [f()] [x = 5]

    // (2.5) introduce new local event group
    //   var x = f(            [f()  [x = 5]
    //            );            ...]

    // (3) introduce new local event group -- pre-events
    //   for f()               [f()] [for
    //   to: g()               [g()]  ...
    //   do: {...}                    ...]

    // (4) local event groups (2nd and 3rd are new iterations)
    //   var sum = 0;          [sum = 0]
    //   for 1 to: 3 do: {x|   [x = 1]   | [x = 2]   | [x = 3]
    //     sum = sum + x;      [sum = 1] | [sum = 3] | [sum = 6]
    //   };                              |           |

    const eventIsLocal = this.sourceLoc.contains(event.sourceLoc);
    if (eventIsLocal && this.lastEventGroup instanceof LocalEventGroup) {
      if (this.lastEventGroup instanceof LocalEventGroup) {
        if (event.sourceLoc.startPos >= this.lastEventGroup.lastEvent.sourceLoc.endPos ||
            event.sourceLoc.startLineNumber >= this.lastEventGroup.lastEvent.sourceLoc.endLineNumber) {
          // no-op
        } else {
          const isNewIteration = !event.sourceLoc.contains(this.lastEventGroup.lastEvent.sourceLoc);
          this.eventGroups.push(new LocalEventGroup(isNewIteration));
        }
      }
    } else if (eventIsLocal && !(this.lastEventGroup instanceof LocalEventGroup)) {
      this.eventGroups.push(new LocalEventGroup(false));  // not a new iteration
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
