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
          this.lastEventGroup instanceof RemoteEventGroup ||
          this.lastEventGroup instanceof LocalEventGroup &&
              !event.sourceLoc.contains(this.lastEventGroup.lastEvent.sourceLoc);
      this.eventGroups.push(new LocalEventGroup(isNewIteration));
    } else if (!eventIsLocal && !(this.lastEventGroup instanceof RemoteEventGroup)) {
      const isNewIteration = !!this.lastEventGroup;
      this.eventGroups.push(new RemoteEventGroup(isNewIteration));
    }
    this.lastEventGroup.add(event);
  }

  isLocal(event) {
    return this.sourceLoc.contains(event.sourceLoc);
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
