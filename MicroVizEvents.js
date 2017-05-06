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
    const eventIsLocal = this.sourceLoc.contains(event.sourceLoc);
    if (this.isLocal(event) &&
        (!this.lastEventGroup ||
         !(this.lastEventGroup instanceof LocalEventGroup) ||
         event.sourceLoc.startPos < this.lastEventGroup.lastEvent.sourceLoc.startPos)) {
      const isNewIteration =
          this.lastEventGroup instanceof LocalEventGroup &&
          !this.lastEventGroup.lastEvent.sourceLoc.contains(event.sourceLoc);
      this.eventGroups.push(new LocalEventGroup(isNewIteration));
    } else if (!eventIsLocal && !(this.lastEventGroup instanceof RemoteEventGroup)) {
      this.eventGroups.push(new RemoteEventGroup());
    }
    this.lastEventGroup.add(event);
  }

  isLocal(event) {
    return this.sourceLoc.contains(event.sourceLoc);
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

class LocalEventGroup extends AbstractEventGroup {
  constructor(isNewIteration = false) {
    super();
    this.isNewIteration = isNewIteration;
  }
}

class RemoteEventGroup extends AbstractEventGroup {}
