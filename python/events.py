#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

from utils import toJSON

class Event(object):
  nextEventId = 0

  def __init__(self, sourceLoc, env):
    self.id = Event.nextEventId
    Event.nextEventId += 1
    self.sourceLoc = sourceLoc
    self.env = env
    self.children = []
  
  def toMicroVizString(self):
    raise NotImplementedError('abstract method!')
  
  def toJSONObject(self):
    try:
      microVizString = self.toMicroVizString()
    except NotImplementedError:
      microVizString = ''
    
    return {
      'type': type(self).__name__,
      'sourceLoc': self.sourceLoc,
      'id': self.id,
      'envId': self.env.id if self.env != None else None,
      'microVizString': microVizString
    }

class ProgramEvent(Event):
  def __init__(self, sourceLoc):
    super(ProgramEvent, self).__init__(sourceLoc, None)
  
  def toMicroVizString(self):
    return 'PROGRAM'

class VarDeclEvent(Event):
  def __init__(self, sourceLoc, env, declEnv, name, value):
    super(VarDeclEvent, self).__init__(sourceLoc, env)
    self.name = name
    self.value = value
    self.declEnv = declEnv
  
  def toMicroVizString(self):
    return self.name + ' = ' + toJSON(self.value)

  def toJSONObject(self):
    dict = super(VarDeclEvent, self).toJSONObject()
    dict['name'] = self.name
    dict['value'] = self.value
    dict['declEnvId'] = self.declEnv.id
    return dict

class VarAssignmentEvent(Event):
  def __init__(self, sourceLoc, env, declEnv, name, value):
    super(VarAssignmentEvent, self).__init__(sourceLoc, env)
    self.declEnv = declEnv
    self.name = name
    self.value = value
  
  def toMicroVizString(self):
    return self.name + ' = ' + toJSON(self.value)

  def toJSONObject(self):
    dict = super(VarAssignmentEvent, self).toJSONObject()
    dict['name'] = self.name
    dict['value'] = self.value
    dict['declEnvId'] = self.declEnv.id
    return dict

class SendEvent(Event):
  def __init__(self, sourceLoc, env, recv, selector, args, activationPathToken):
    super(SendEvent, self).__init__(sourceLoc, env)
    self.recv = recv
    self.selector = selector
    self.args = args
    self.activationPathToken = activationPathToken
    self.activationEnv = None # assigned when mkEnv is called
    self.returnValue = None # assigned when receive is called

  def toJSONObject(self):
    dict = super(SendEvent, self).toJSONObject()
    dict['recv'] = self.recv
    dict['selector'] = self.selector
    dict['args'] = self.args
    dict['activationPathToken'] = self.activationPathToken
    return dict

class ReturnEvent(Event):
  def __init__(self, sourceLoc, env, value):
    super(ReturnEvent, self).__init__(sourceLoc, env)
    self.value = value
  
  def toJSONObject(self):
    dict = super(ReturnEvent, self).toJSONObject()
    dict['value'] = self.value
    return dict

class LocalReturnEvent(ReturnEvent):
  def __init__(self, sourceLoc, env, value):
    super(LocalReturnEvent, self).__init__(sourceLoc, env, value)
  
  def toJSONObject(self):
    return super(LocalReturnEvent, self).toJSONObject()

  def toMicroVizString(self):
    return '→ ' + toJSON(self.value)

##----- Intended as RPC calls -------

class ReceiveEvent(Event):
  def __init__(self, env, returnValue):
    super(ReceiveEvent, self).__init__(None, env)
    self.returnValue = returnValue
  
  def toJSONObject(self):
    dict = super(ReceiveEvent, self).toJSONObject()
    dict['returnValue'] = self.returnValue
    return dict
