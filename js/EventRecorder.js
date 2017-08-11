'use strict';

class EventRecorder {
  constructor(newEventHandler) {
    this.eventStack = [];  // ProgramEvent SendEvent*
    this.lastEvent = null;
  }

  get topOfEventStack() {
    return this.eventStack[this.eventStack.length - 1];
  }

  program(sourceLoc) {
    const event = new ProgramEvent(sourceLoc);
    this.eventStack.push(event);
    this.lastEvent = event;
    return this.mkEnv(sourceLoc);
  }

  send(sourceLoc, env, recv, selector, args) {
    debugger;
    const event = new SendEvent(sourceLoc, env, recv, selector, args);
    this.eventStack.push(event);
    this.lastEvent = event;
    // this event is only sent to event handler after it gets an activation environment (see below)
  }

  mkEnv(newEnvSourceLoc) {
    const programOrSendEvent = this.eventStack[this.eventStack.length - 1];
    const callerEnv = programOrSendEvent.env;
    const newEnv = new Env(newEnvSourceLoc, callerEnv, programOrSendEvent);
    if ((programOrSendEvent instanceof SendEvent || programOrSendEvent instanceof ProgramEvent) &&
        !programOrSendEvent.activationEnv) {
      programOrSendEvent.activationEnv = newEnv;
      const parentEvent = this.eventStack[this.eventStack.length - 2];
      if (parentEvent) {
        parentEvent.children.push(programOrSendEvent);
        programOrSendEvent.env.receive(programOrSendEvent);
      }
    }
    return newEnv;
  }

  receive(returnValue) {
    this.topOfEventStack.returnValue = returnValue;
    this.eventStack.pop();
    return returnValue;
  }

  enterScope(sourceLoc, env) {
    this.send(sourceLoc, env, null, 'enterNewScope', []);
    return this.mkEnv(sourceLoc);
  }

  leaveScope() {
    this.receive(null);
  }

  _emit(event) {
    this.topOfEventStack.children.push(event);
    event.env.receive(event);
  }

  return(sourceLoc, env, value) {
    const event = new ReturnEvent(sourceLoc, env, value);
    this.lastEvent = event;
    this._emit(event);
    return value;
  }

  declVar(sourceLoc, env, /*declEnv, */name, value) { // TODO: allow for declEnv
    const event = new VarDeclEvent(sourceLoc, env, name, value);
    this.lastEvent = event;
    this._emit(event);
    return value;
  }

  assignVar(sourceLoc, env, declEnv, name, value) {
    const event = new VarAssignmentEvent(sourceLoc, env, declEnv, name, value);
    this.lastEvent = event;
    this._emit(event);
    return value;
  }

  assignInstVar(sourceLoc, env, obj, name, value) {
    const event = new InstVarAssignmentEvent(sourceLoc, env, obj, name, value);
    this.lastEvent = event;
    this._emit(event);
    return value;
  }

  instantiate(sourceLoc, env, _class, args, newInstance) {
    const event = new InstantiationEvent(sourceLoc, env, _class, args, newInstance);
    this.lastEvent = event;
    this._emit(event);
    return newInstance;
  }
}
