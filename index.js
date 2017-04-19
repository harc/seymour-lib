

class Event {
  constructor(sourceLoc, env) {
    this.sourceLoc = sourceLoc;
    this.env = env;
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
  constructor(sourceLoc, env, _class, args) {
    super(sourceLoc, env);
    this.class = _class;
    this.args = args;
  }
}

class SendEvent extends Event {
  constructor(sourceLoc, env, recv, selector, args) {
    super(sourceLoc, env);
    this.recv = obj;
    this.selector = selector;
    this.args = args;
    // also: activationEnv, returnValue
  }
}

class SendSummaryEvent extends Event {
  constructor(sendEvent) {
    super(sendEvent.sourceLoc, sendEvent.env);
    this.sendEvent = sendEvent;
    this.events = events;
  }
}



const events = [];
function processsEvent(e) {
  events.push(e);
  if (e instanceof VarDeclEvent) {
    // This is something the interpreter would do
    e.env.decls.add(e.name);
  }
  e.env.receive(e);
}

let nextEnvId = 0;
class Env {
  constructor(caller) {
    this.id = nextEnvId++;
    this.caller = caller;
    this.decls = new Set();
    this.events = [];
  }

  receive(event) {
    console.log('env', this.id, 'receiving', event);
    this.events.push(event);
    if (!(event instanceof VarDeclEvent) ||
        !(event instanceof VarAssignmentEvent && ))
  }
}

let nextEventId = 0;
class Event {
  constructor(sourceLoc, env) {
    this.id = nextEventId++;
    this.sourceLoc = sourceLoc;
    this.env = env;
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
  constructor(sourceLoc, env, name, value) {
    super(sourceLoc, env);
    this.name = name;
    this.value = value;
  }
}

class InstVarAssignmentEvent extends Event {
  constructor(sourceLoc, env, receiver, name, value) {
    super(sourceLoc, env);
    this.receiver = receiver;
    this.name = name;
    this.value = value;
  }
}

class SendEvent extends Event {
  constructor(sourceLoc, env, receiver, selector, args, activationEnv) {
    super(sourceLoc, env);
    this.receiver = receiver;
    this.selector = selector;
    this.args = args;
    this.activationEnv = activationEnv;
  }
}

class SendSummaryEvent extends Event {
  constructor(sourceLoc, env, sendEvent) {
    super(sourceLoc, env);
    this.sendEvent = sendEvent;
  }
}

/*
1: var sum = 0;
2: for 1 to: 10 do: {x |
3:   sum = sum + x;
4: };
*/

function sl(start, end) { return new SourceLoc(start, end); }

const sumDeclSourceLoc = {from: {line: 1, col: 1}, to: {line: 1, col: 13}};
const forSourceLoc = {from: {line: 2, col: 1}, to: {line: 4, col: 2}};
const xDeclSourceLoc = {from: {line: 2, col: 20}, to: {line: 2, col: 21}};
const sumAssignmentSourceLoc = {from: {line: 3, col: 3}, to: {line: 3, col: 16}};

const globalEnv = new Env(null);
let sum = 0;
processsEvent(new VarDeclEvent(sumDeclSourceLoc, globalEnv, "sum", 0));
for (let x = 1; x <= 10; x++) {
  const activationEnv = new Env(globalEnv);
  processsEvent(new SendEvent(forSourceLoc, globalEnv, "bodyBlock", "call", x));
  processsEvent(new VarDeclEvent(xDeclSourceLoc, activationEnv, "x", x));
  processsEvent(new VarAssignmentEvent(sumAssignmentSourceLoc, activationEnv, "sum", sum + x));
}
