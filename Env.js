let nextEnvId = 0;

class Env {
  constructor(sourceLoc, callerEnv, sendEvent) {
    this.id = nextEnvId++;
    this.sourceLoc = sourceLoc;
    this.callerEnv = callerEnv;
    this.sendEvent = sendEvent;
    this.microVizEvents = [];
    this.children = [];
  }

  receive(event) {
    if (event instanceof SendEvent) {
      // no-op
      return;
    }

    if (event.env.sendEvent === this.sendEvent) {
      this.add(event, event.sourceLoc);
    } else {
      let sendEvent = event.env.ancestorWithCallerEnv(this).sendEvent;
      if (sendEvent) {
        const nearestSendEvent = event.env.nearestSendEventInside(sendEvent.sourceLoc);
        const shouldAdd = (event instanceof VarDeclEvent || event instanceof ReturnEvent) ?
            sendEvent.sourceLoc.contains(event.sourceLoc) :
            true;
        const whereToAdd = nearestSendEvent.sourceLoc.contains(event.sourceLoc) ?
            event.sourceLoc :
            nearestSendEvent.sourceLoc;
        if (shouldAdd) {
          this.add(event, whereToAdd);
        }
      }
    }

    if (this.callerEnv && this.shouldBubbleUp(event)) {
      this.callerEnv.receive(event);
    }
  }

  ancestorWithCallerEnv(env) {
    let ancestor = this;
    while (ancestor) {
      if (ancestor.callerEnv === env) {
        return ancestor;
      }
      ancestor = ancestor.callerEnv;
    }
    return null;
  }

  nearestSendEventInside(sourceLoc) {
    let ancestor = this;
    while (ancestor) {
      if (ancestor.sendEvent && sourceLoc.contains(ancestor.sendEvent.sourceLoc)) {
        return ancestor.sendEvent;
      }
      ancestor = ancestor.callerEnv;
    }
    throw new Error('impossible!');
  }

  add(event, sourceLoc) {
    if (event.sourceLoc === sourceLoc) {
      this.microVizEvents.push(event);
      return;
    }

    const lastEvent = this.microVizEvents[this.microVizEvents.length - 1];
    if (lastEvent instanceof EventGroup && lastEvent.sourceLoc === sourceLoc) {
      lastEvent.add(event);
    } else {
      const eventGroup = new EventGroup(sourceLoc, this);
      eventGroup.add(event);
      this.microVizEvents.push(eventGroup);
    }
  }

  shouldBubbleUp(event) {
    if (event instanceof VarAssignmentEvent) {
      return this !== event.declEnv;
    } else {
      return true;
    }
  }
}
