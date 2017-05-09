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
      const lastEvent = this.lastEventGroup.lastEvent;
      if (event.sourceLoc.startPos >= lastEvent.sourceLoc.endPos ||  // Toby's rule
          event.sourceLoc.strictlyContains(lastEvent.sourceLoc)) {   // Inside-out rule
        // no-op
      } else {
        this.eventGroups.push(new LocalEventGroup());
      }
    } else if (eventIsLocal && !(this.lastEventGroup instanceof LocalEventGroup)) {
      this.eventGroups.push(new LocalEventGroup());
    } else if (!eventIsLocal && !(this.lastEventGroup instanceof RemoteEventGroup)) {
      this.eventGroups.push(new RemoteEventGroup());
    }
    this.lastEventGroup.add(event);
  }
}

class AbstractEventGroup {
  constructor() {
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

class LocalEventGroup extends AbstractEventGroup {}
class RemoteEventGroup extends AbstractEventGroup {}
