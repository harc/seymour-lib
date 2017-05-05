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
         this.belongsInNewIteration(event))) {
      this.eventGroups.push(new LocalEventGroup(this.sourceLoc));
    } else if (!eventIsLocal && !(this.lastEventGroup instanceof RemoteEventGroup)) {
      this.eventGroups.push(new RemoteEventGroup(this.sourceLoc));
    }
    this.lastEventGroup.add(event);
  }

  belongsInNewIteration(newLocalEvent) {
    console.assert(this.isLocal(newLocalEvent) &&  this.lastEventGroup instanceof LocalEventGroup);
    const lastLocalEvent = this.lastEventGroup.lastEvent;
    return newLocalEvent.sourceLoc.startPos < lastLocalEvent.sourceLoc.startPos &&
        !newLocalEvent.sourceLoc.contains(lastLocalEvent.sourceLoc);
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

class LocalEventGroup extends AbstractEventGroup {}
class RemoteEventGroup extends AbstractEventGroup {}
