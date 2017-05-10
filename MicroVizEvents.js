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
  constructor(events) {
    this.events = events;
  }

  add(event) {
    throw new Error('abstract method!');
  }

  get lastEvent() {
    return this.events[this.events.length - 1];
  }
}

class LocalEventGroup extends AbstractEventGroup {
  constructor(...events) {
    super(events);
  }

  add(event) {
    this.events.push(event);
  }
}

class RemoteEventGroup extends AbstractEventGroup {
  constructor(...events) {
    super(events);
  }

  add(event) {
    for (let idx = 0; idx < this.events.length; idx++) {
      if (event.subsumes(this.events[idx])) {
        this.events[idx] = event;
        return;
      }
    }
    this.events.push(event);
  }
}
