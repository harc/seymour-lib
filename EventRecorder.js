class EventRecorder {
  constructor() {
    this.sendEventStack = [null];
  }

  _record(event) {
    event.env.receive(event);
  }

  pushSend(sourceLoc, env, recv, selector, args) {
    const event = new SendEvent(sourceLoc, env, recv, selector, args);
    this.sendEventStack.push(event);
    this._record(event);
  }

  // optParentEnv shouldn't be passed in to create a new activation.
  // (only use it if you're creating a new lexical scope)
  mkEnv(newEnvSourceLoc, optParentEnv) {
    const sendEvent = this.sendEventStack[this.sendEventStack.length - 1];
    const callerEnv = optParentEnv || sendEvent && sendEvent.env || null;
    const newEnv = new Env(newEnvSourceLoc, callerEnv, sendEvent);
    if (sendEvent && !sendEvent.activationEnv) {
      sendEvent.activationEnv = newEnv;
    }
    return newEnv;
  }

  popSend() {
    this.sendEventStack.pop();
  }

  return(sourceLoc, env, value) {
    const sendEvent = this.sendEventStack[this.sendEventStack.length - 1];
    const event = new ReturnEvent(sourceLoc, env, value);
    env.sendEvent.returnValue = value;
    this._record(event);
    return value;
  }

  varDecl(sourceLoc, env, name, value) {
    const event = new VarDeclEvent(sourceLoc, env, name, value);
    this._record(event);
    return value;
  }

  varAssign(sourceLoc, env, declEnv, name, value) {
    const event = new VarAssignmentEvent(sourceLoc, env, declEnv, name, value);
    this._record(event);
    return value;
  }

  instVarAssign(sourceLoc, env, obj, name, value) {
    const event = new InstVarAssignmentEvent(sourceLoc, env, obj, name, value);
    this._record(event);
    return value;
  }

  instantiate(sourceLoc, env, _class, args, newInstance) {
    const event = new InstantiationEvent(sourceLoc, env, _class, args, newInstance);
    this._record(event);
    return newInstance;
  }
}
