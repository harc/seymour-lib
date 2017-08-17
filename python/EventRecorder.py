import json
import time

from events import *
from Env import Env, Scope
from utils import toJSON

## TODO: since we don't have to propagate anything here, events are not that important
## they're more like rpc calls to the right method in the eventrecorder
## but, since we need environments to make these calls, tracking envs is crucial

class EventRecorder(object):
  def __init__(self, queue):
    self.currentProgramOrSendEvent = None
    self.queue = queue
  
  def program(self, sourceLoc):
    event = ProgramEvent(sourceLoc)
    self.currentProgramOrSendEvent = event
    self._emit(event)

    env = self.mkEnv(sourceLoc, None)
    return env

  ## TODO: deal with activationPathToken
  def send(self, sourceLoc, env, recv, selector, args, activationPathToken):
    event = SendEvent(sourceLoc, env, recv, selector, args, activationPathToken)
    self._emit(event)

    env.currentSendEvent = event ## TODO: these effects must be replicated on both sides
    self.currentProgramOrSendEvent = event

  def mkEnv(self, newEnvSourceLoc, parentEnv, scope=False):
    if scope:
      envClass = Scope
    else:
      envClass = Env
    programOrSendEvent = self.currentProgramOrSendEvent
    callerEnv = programOrSendEvent.env
    newEnv = envClass(newEnvSourceLoc, parentEnv, callerEnv, programOrSendEvent)

    ## TODO: it may be the case that we can eliminate most of these effects on the server side
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
    
    self.queue.put(newEnv.toJSONObject())
    return newEnv
  
  def receive(self, env, returnValue):
    ## TODO: this should be something other than an event, closer to an RPC, purely for effects
    event = ReceiveEvent(env, returnValue) 
    self._emit(event)

    try:
      env.currentSendEvent.returnValue = returnValue
    except AttributeError:
      pass
    self.currentProgramOrSendEvent = env.programOrSendEvent
    return returnValue

  def enterScope(self, sourceLoc, env): ## TODO: make this create a scope not an env
    self.send(sourceLoc, env, None, 'enterNewScope', [], None)
    return self.mkEnv(sourceLoc, env, True)

  def leaveScope(self, env):
    self.receive(env, None)
  
  def _emit(self, event):
    self.queue.put(event.toJSONObject())
  
  def show(self, sourceLoc, env, string, alt):
    pass
  
  def error(self, sourceLoc, env, errorString):
    pass
  
  def localReturn(self, sourceLoc, env, value):
    event = LocalReturnEvent(sourceLoc, env, value)
    self._emit(event)

    return value
  
  def nonLocalReturn(self, sourceLoc, env, value):
    pass
  
  def assignVar(self, sourceLoc, env, declEnv, name, value):
    try:
      declEnv = declEnv.getDeclEnvFor(name)
      event = VarAssignmentEvent(sourceLoc, env, declEnv, name, value)
    except KeyError:
      declEnv.declare(name)
      event = VarDeclEvent(sourceLoc, env, declEnv, name, value)
    self._emit(event)
    return value
  
  def assignInstVar(self, sourceLoc, env, obj, name, value):
    pass
  
  def instantiate(sourceLoc, env, _class, args, newInstance):
    pass
  
  def done(self):
    self.queue.put({'type': 'done'})