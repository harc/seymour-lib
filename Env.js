'use strict';

let nextEnvId = 0;

class Env {
  constructor(sourceLoc, callerEnv, programOrSendEvent) {
    this.id = nextEnvId++;
    this.sourceLoc = sourceLoc;
    this.callerEnv = callerEnv;
    this.programOrSendEvent = programOrSendEvent;
    this.microVizEvents = new MicroVizEvents(programOrSendEvent, sourceLoc);  // will only have local events
    this.programOrSendEventToMicroVizEvents = new Map([[programOrSendEvent, this.microVizEvents]]);
  }

  receive(event) {
    this.maybeAdd(event);
    if (this.callerEnv && this.shouldBubbleUp(event)) {
      this.callerEnv.receive(event);
    }
  }

  maybeAdd(event) {
    const programOrSendEvent = this.targetProgramOrSendEventFor(event);
    if (!programOrSendEvent) {
      return;
    }
    const microVizEvents = this.programOrSendEventToMicroVizEvents.get(programOrSendEvent);
    if (event instanceof SendEvent) {
      const newMicroVizEvents = new MicroVizEvents(event, event.sourceLoc);
      this.programOrSendEventToMicroVizEvents.set(event, newMicroVizEvents);
      microVizEvents.add(newMicroVizEvents);
    } else {
      microVizEvents.add(event);
    }
  }

  targetProgramOrSendEventFor(event) {
    if (event.env === this) {
      return this.programOrSendEvent;
    }
    const rootSendEvent = this.rootSendEventFor(event);
    const isLocal = evt => rootSendEvent.sourceLoc.strictlyContains(evt.sourceLoc);
    if (!rootSendEvent || this.shouldOnlyShowWhenLocal(event) && !isLocal(event)) {
      return null;
    }
    let env = event.env;
    while (env) {
      const sendEvent = env.programOrSendEvent;
      if (isLocal(sendEvent)) {
        return sendEvent;
      } else {
        env = env.callerEnv;
      }
    }
    return rootSendEvent;
  }

  rootSendEventFor(event) {
    let env = event.env;
    while (env) {
      if (env.programOrSendEvent.env === this) {
        return env.programOrSendEvent;
      }
      env = env.callerEnv;
    }
    return null;
  }

  shouldOnlyShowWhenLocal(event) {
    return event instanceof SendEvent ||
        event instanceof ReturnEvent ||
        event instanceof VarDeclEvent;
  }

  shouldBubbleUp(event) {
    if (event instanceof VarAssignmentEvent) {
      return this !== event.declEnv;
    } else {
      return true;
    }
  }
}
