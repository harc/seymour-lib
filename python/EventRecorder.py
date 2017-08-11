import json
import time

from events import ProgramEvent, VarDeclEvent, VarAssignmentEvent, SendEvent, LocalReturnEvent, ReceiveEvent
from Env import Env

class EventRecorder(object):
  def __init__(self, websocket):
    self.currentProgramOrSendEvent = None
    self.websocket = websocket
  
  async def program(self, sourceLoc): ##
    event = ProgramEvent(sourceLoc)
    self.currentProgramOrSendEvent = event
    await self._emit(event)
    env = await self.mkEnv(sourceLoc, None)
    return env

  async def send(self, sourceLoc, env, recv, selector, args, activationPathToken): ##
    event = SendEvent(sourceLoc, env, recv, selector, args, activationPathToken)
    await self._emit(event)
    env.currentSendEvent = event
    self.currentProgramOrSendEvent = event

  async def mkEnv(self, newEnvSourceLoc, parentEnv): ##
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
    
    print('env')
    await self.websocket.send(newEnv.toJSON())
    return newEnv
  
  async def receive(self, env, returnValue): ## make this an event
    event = ReceiveEvent(env, returnValue)
    env.currentSendEvent.returnValue = returnValue
    self.currentProgramOrSendEvent = env.programOrSendEvent
    await self._emit(event)
    return returnValue
  
  async def _emit(self, event):
    print(event.toMicroVizString())
    await self.websocket.send(event.toJSON())
  
  async def show(self, sourceLoc, env, string, alt):
    pass
  
  async def error(self, sourceLoc, env, errorString):
    pass
  
  async def localReturn(self, sourceLoc, env, value): ##
    event = LocalReturnEvent(sourceLoc, env, value)
    await self._emit(event)
    return value
  
  async def nonLocalReturn(self, sourceLoc, env, value):
    pass
  
  async def assignVar(self, sourceLoc, env, name, value): # add declEnv
    if env.declEnv(name):
      declEnv = env.declEnv(name)
      event = VarAssignmentEvent(sourceLoc, env, declEnv, name, value)
    else:
      declEnv = env.declVar(name)
      event = VarDeclEvent(sourceLoc, env, name, value)
    await self._emit(event)
    return value
  
  async def assignInstVar(self, sourceLoc, env, obj, name, value):
    pass
  
  async def instantiate(sourceLoc, env, _class, args, newInstance):
    pass
  
  async def done(self):
    await self.websocket.send(json.dumps({'type': 'done'}))