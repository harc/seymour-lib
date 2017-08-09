from events import ProgramEvent, VarDeclEvent, VarAssignmentEvent, SendEvent, LocalReturnEvent
from Env import Env

class EventRecorder(object):
  def __init__(self):
    self.currentProgramOrSendEvent = None
  
  def program(self, sourceLoc): ##
    event = ProgramEvent(sourceLoc)
    self.currentProgramOrSendEvent = event
    env = self.mkEnv(sourceLoc, None)
    self._emit(event)
    return env

  def send(self, sourceLoc, env, recv, selector, args, activationPathToken): ##
    event = SendEvent(sourceLoc, env, recv, selector, args, activationPathToken)
    self._emit(event)
    env.currentSendEvent = event
    self.currentProgramOrSendEvent = event

  def mkEnv(self, newEnvSourceLoc, parentEnv): ##
    programOrSendEvent = self.currentProgramOrSendEvent;
    callerEnv = programOrSendEvent.env
    newEnv = Env(newEnvSourceLoc, parentEnv, callerEnv, programOrSendEvent)

    if ((isinstance(programOrSendEvent, SendEvent) or 
           isinstance(programOrSendEvent, ProgramEvent)) and
        hasattr(programOrSendEvent, 'activationEnv')):
      programOrSendEvent.activationEnv = newEnv
      if programOrSendEvent.env != None:
        parentEvent = programOrSendEvent.env.programOrSendEvent
      else:
        parentEvent = None
      
      if parentEvent != None:
        parentEvent.children.append(programOrSendEvent)
    
    return newEnv
  
  def receive(self, env, returnValue): ##
    env.currentSendEvent.returnValue = returnValue
    self.currentProgramOrSendEvent = env.programOrSendEvent
    return returnValue
  
  def _emit(self, event):
    print(event.toMicroVizString())
  
  def show(self, sourceLoc, env, string, alt):
    pass
  
  def error(self, sourceLoc, env, errorString):
    pass
  
  def localReturn(self, sourceLoc, env, value): ##
    event = LocalReturnEvent(sourceLoc, env, value)
    self._emit(event)
    return value
  
  def nonLocalReturn(self, sourceLoc, env, value):
    pass
  
  def assignVar(self, sourceLoc, env, name, value):
    if env.declEnv(name):
      declEnv = env.declEnv(name)
      event = VarAssignmentEvent(sourceLoc, env, declEnv, name, value)
    else:
      declEnv = env.declVar(name)
      event = VarDeclEvent(sourceLoc, env, name, value)
    self._emit(event)
    return value
  
  def assignInstVar(self, sourceLoc, env, obj, name, value):
    pass
  
  def instantiate(sourceLoc, env, _class, args, newInstance):
    pass