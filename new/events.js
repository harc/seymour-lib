'use strict';

class Event {
  constructor(sourceLoc, env) {
    this.sourceLoc = sourceLoc;
    this.env = env;
    this.children = [];
  }
}

class ProgramEvent extends Event {
  constructor(sourceLoc) {
    super(sourceLoc, null);
    // also: activationEnv
  }
}

class SendEvent extends Event {
  constructor(sourceLoc, env, recv, selector, args) {
    super(sourceLoc, env);
    this.recv = recv;
    this.selector = selector;
    this.args = args;
    // also: activationEnv, returnValue
  }
}

class VarDeclEvent extends Event {
  constructor(sourceLoc, env, name, value) {
    super(sourceLoc, env);
    this.name = name;
    this.value = value;
  }
}

class VarAssignmentEvent extends Event {
  constructor(sourceLoc, env, declEnv, name, value) {
    super(sourceLoc, env);
    this.declEnv = declEnv;
    this.name = name;
    this.value = value;
  }
}

class InstVarAssignmentEvent extends Event {
  constructor(sourceLoc, env, obj, name, value) {
    super(sourceLoc, env);
    this.obj = obj;
    this.name = name;
    this.value = value;
  }
}

class InstantiationEvent extends Event {
  // TODO: how should we handle the call to init?
  constructor(sourceLoc, env, _class, args, newInstance) {
    super(sourceLoc, env);
    this.class = _class;
    this.args = args;
    this.newInstance = newInstance;
  }
}

class ReturnEvent extends Event {
  constructor(sourceLoc, env, value) {
    super(sourceLoc, env);
    this.value = value;
  }
}
