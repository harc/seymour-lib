import json
import time

from events import *
from Env import Env, Scope
from utils import toJSON

## TODO: since we don't have to propagate anything here, events are not that important
## they're more like rpc calls to the right method in the eventrecorder
## but, since we need environments to make these calls, tracking envs is crucial

class EventRecorder(object):
  def __init__(self, websocket):
    self.currentProgramOrSendEvent = None
    self.websocket = websocket
  
  async def program(self, sourceLoc):
    event = ProgramEvent(sourceLoc)
    self.currentProgramOrSendEvent = event
    await self._emit(event)

    env = await self.mkEnv(sourceLoc, None)
    return env

  ## TODO: deal with activationPathToken
  async def send(self, sourceLoc, env, recv, selector, args, activationPathToken):
    event = SendEvent(sourceLoc, env, recv, selector, args, activationPathToken)
    await self._emit(event)

    env.currentSendEvent = event ## TODO: these effects must be replicated on both sides
    self.currentProgramOrSendEvent = event

  async def mkEnv(self, newEnvSourceLoc, parentEnv, scope=False):
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
    
    await self.websocket.send(toJSON(newEnv.toJSONObject()))
    return newEnv
  
  async def receive(self, env, returnValue):
    ## TODO: this should be something other than an event, closer to an RPC, purely for effects
    event = ReceiveEvent(env, returnValue) 
    await self._emit(event)

    env.currentSendEvent.returnValue = returnValue
    self.currentProgramOrSendEvent = env.programOrSendEvent
    return returnValue

  async def enterScope(self, sourceLoc, env): ## TODO: make this create a scope not an env
    await self.send(sourceLoc, env, None, 'enterNewScope', [], None)
    return await self.mkEnv(sourceLoc, env, True)

  async def leaveScope(self, env):
    await self.receive(env, None)
  
  async def _emit(self, event):
    await self.websocket.send(toJSON(event.toJSONObject()))
  
  async def show(self, sourceLoc, env, string, alt):
    pass
  
  async def error(self, sourceLoc, env, errorString):
    pass
  
  async def localReturn(self, sourceLoc, env, value):
    event = LocalReturnEvent(sourceLoc, env, value)
    await self._emit(event)

    return value
  
  async def nonLocalReturn(self, sourceLoc, env, value):
    pass
  
  async def assignVar(self, sourceLoc, env, declEnv, name, value):
    try:
      declEnv = declEnv.getDeclEnvFor(name)
      event = VarAssignmentEvent(sourceLoc, env, declEnv, name, value)
    except KeyError:
      declEnv.declare(name)
      event = VarDeclEvent(sourceLoc, env, declEnv, name, value)
    await self._emit(event)
    return value
  
  async def assignInstVar(self, sourceLoc, env, obj, name, value):
    pass
  
  async def instantiate(sourceLoc, env, _class, args, newInstance):
    pass
  
  async def done(self):
    await self.websocket.send(toJSON({'type': 'done'}))