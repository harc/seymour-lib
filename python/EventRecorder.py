import json
import time

from events import *
from Env import Env, Scope
from utils import toJSON
import pickle
from datetime import datetime
import time
## TODO: since we don't have to propagate anything here, events are not that important
## they're more like rpc calls to the right method in the eventrecorder
## but, since we need environments to make these calls, tracking envs is crucial

EVENTS_PER_PERIOD = 100
SECONDS_PER_PERIOD = 1

class TerminateException(Exception):
  pass

class EventRecorder(object):
  def __init__(self, queue):
    self.currentProgramOrSendEvent = None
    self.queue = queue
    self.raised = False
    self.memo = {}
    self.parents = {}
    self.numEventsCreated = 0
    self.numEventsCreatedInLastPeriod = 0
    self.periodStart = datetime.now()
    self.terminate = False
  
  def memoize(self, key, value):
    self.memo[key] = value
  
  def retrieve(self, key):
    return self.memo[key]

  def parentEnv(self, fn, env):
    self.parents[fn] = env
  
  def getParentEnv(self, fn):
    return self.parents[fn]


  def event(self):
    if self.terminate:
      print('TERMINATE')
      self.queue.close()
      raise TerminateException()
    self.numEventsCreated += 1
    self.numEventsCreatedInLastPeriod += 1
    now = datetime.now()
    delta = now - self.periodStart
    diffSeconds = delta.total_seconds()
    if (diffSeconds >= SECONDS_PER_PERIOD):
      self.periodStart = now
      self.numEventsCreatedInLastPeriod = 0
    if (self.numEventsCreatedInLastPeriod >= EVENTS_PER_PERIOD):
      print(SECONDS_PER_PERIOD - diffSeconds)
      time.sleep(SECONDS_PER_PERIOD - diffSeconds)
      self.periodStart = datetime.now()
      self.numEventsCreatedInLastPeriod = 0
  
  def program(self, orderNum, sourceLoc):
    event = ProgramEvent(orderNum, sourceLoc)
    self.currentProgramOrSendEvent = event
    self._emit(event)

    env = self.mkEnv(sourceLoc, None, None, 'program', [])
    return env

  ## TODO: deal with activationPathToken
  def send(self, orderNum, sourceLoc, env, recv, selector, args, activationPathToken):
    event = SendEvent(orderNum, sourceLoc, env, recv, selector, args, activationPathToken)
    self._emit(event)

    env.currentSendEvent = event ## TODO: these effects must be replicated on both sides
    self.currentProgramOrSendEvent = event
  
  def _hiddenSend(self, env, selector):
    self.send(-1, None, env, None, selector, [], None) # TODO: this is wrong, should have more info

  def _mkHiddenEnv(self, parentEnv):
    programOrSendEvent = self.currentProgramOrSendEvent
    newEnv = Env(None, parentEnv, programOrSendEvent.env, programOrSendEvent)
    return self._registerSend(newEnv)

  def mkEnv(self, newEnvSourceLoc, parentEnv, recv, selector, args, scope=False):
    if scope:
      envClass = Scope
    else:
      envClass = Env
    programOrSendEvent = self.currentProgramOrSendEvent
    same = (recv is programOrSendEvent.recv) and (selector is programOrSendEvent.selector)
    for idx, arg in enumerate(args):
      same = same and (arg is programOrSendEvent.args[idx])
    
    if not programOrSendEvent.activated:
      if same:
        callerEnv = programOrSendEvent.env
      else:
        callerEnv = self._mkHiddenEnv(parentEnv)
        self._hiddenSend(callerEnv, selector)
        programOrSendEvent = self.currentProgramOrSendEvent
    else:
      callerEnv = programOrSendEvent.env
      self._hiddenSend(callerEnv, selector) #TODO, different env
      programOrSendEvent = self.currentProgramOrSendEvent  

    newEnv = envClass(newEnvSourceLoc, parentEnv, callerEnv, programOrSendEvent)
    return self._registerSend(newEnv)
  
  def _registerSend(self, newEnv):
    ## TODO: it may be the case that we can eliminate most of these effects on the server side
    programOrSendEvent = self.currentProgramOrSendEvent
    if ((isinstance(programOrSendEvent, SendEvent) or 
           isinstance(programOrSendEvent, ProgramEvent)) and
        hasattr(programOrSendEvent, 'activationEnv')):
      programOrSendEvent.activationEnv = newEnv
      programOrSendEvent.activated = True
      if programOrSendEvent.env != None:
        parentEvent = programOrSendEvent.env.programOrSendEvent
      else:
        parentEvent = None
      if parentEvent != None:
        parentEvent.children.append(programOrSendEvent)
      
      self.event()
      self.queue.put(pickle.dumps(newEnv.toJSONObject()))
      return newEnv
  
  def receive(self, env, returnValue):
    if not self.currentProgramOrSendEvent.activated:
      newEnv = self._mkHiddenEnv(None)
      self._registerSend(newEnv)
    ## TODO: this should be something other than an event, closer to an RPC, purely for effects
    event = ReceiveEvent(env, returnValue) 
    self._emit(event)

    try:
      env.currentSendEvent.returnValue = returnValue
    except AttributeError:
      pass
    self.currentProgramOrSendEvent = env.programOrSendEvent
    return returnValue

  def enterScope(self, orderNum, sourceLoc, env, activationPathToken): ## TODO: make this create a scope not an env
    self.send(orderNum, sourceLoc, env, None, 'enterNewScope', [], activationPathToken)
    return self.mkEnv(sourceLoc, env, None, 'enterNewScope', [],  True)

  def leaveScope(self, env):
    self.receive(env, None)
  
  def _emit(self, event):
    self.event()
    self.queue.put(pickle.dumps(event.toJSONObject()))
  
  def show(self, orderNum, sourceLoc, env, string, alt):
    pass
  
  def error(self, sourceLoc, env, error):
    event = ErrorEvent(sourceLoc, env, str(error))
    self.raised = True
    self._emit(event)
    return error
  
  def localReturn(self, orderNum, sourceLoc, env, value):
    event = LocalReturnEvent(orderNum, sourceLoc, env, value)
    self._emit(event)

    return value
  
  def nonLocalReturn(self, orderNum, sourceLoc, env, value):
    pass
  
  def assignVar(self, orderNum, sourceLoc, env, declEnv, name, value):
    try:
      declEnv = declEnv.getDeclEnvFor(name)
      event = VarAssignmentEvent(orderNum, sourceLoc, env, declEnv, name, value)
    except KeyError:
      declEnv.declare(name)
      event = VarDeclEvent(orderNum, sourceLoc, env, declEnv, name, value)
    self._emit(event)
    return value
  
  def assignInstVar(self, orderNum, sourceLoc, env, obj, name, value):
    event = InstVarAssignmentEvent(orderNum, sourceLoc, env, obj, name, value)
    self._emit(event)
    return value
  
  def instantiate(self, orderNum, sourceLoc, env, _class, args, newInstance):
    event = InstantiationEvent(orderNum, sourceLoc, env, _class, args, newInstance)
    self._emit(event)
    return newInstance
  
  def done(self):
    self.queue.put(pickle.dumps({'type': 'done'}))