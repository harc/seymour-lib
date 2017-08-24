#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

from utils import toJSON, toNetworkObject, toNetworkString

class Event(object):
  nextEventId = 0

  def __init__(self, orderNum, sourceLoc, env):
    self.id = Event.nextEventId
    Event.nextEventId += 1
    self.orderNum = orderNum
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
      'orderNum': self.orderNum,
      'sourceLoc': self.sourceLoc,
      'id': self.id,
      'envId': self.env.id if self.env != None else None,
      'microVizString': microVizString
    }

class ProgramEvent(Event):
  def __init__(self, orderNum, sourceLoc):
    super(ProgramEvent, self).__init__(orderNum, sourceLoc, None)
    self.activationEnv = None
    self.selector = 'program'
    self.activated = False
    self.recv = None
    self.args = []
  
  def toMicroVizString(self):
    return 'PROGRAM'

class VarDeclEvent(Event):
  def __init__(self, orderNum, sourceLoc, env, declEnv, name, value):
    super(VarDeclEvent, self).__init__(orderNum, sourceLoc, env)
    self.name = name
    self.value = value
    self.declEnv = declEnv
  
  def toMicroVizString(self):
    return self.name + ' = ' + toNetworkString(self.value)

  def toJSONObject(self):
    dict = super(VarDeclEvent, self).toJSONObject()
    dict['name'] = self.name
    dict['value'] = toNetworkObject(self.value)
    dict['declEnvId'] = self.declEnv.id
    return dict

class VarAssignmentEvent(Event):
  def __init__(self, orderNum, sourceLoc, env, declEnv, name, value):
    super(VarAssignmentEvent, self).__init__(orderNum, sourceLoc, env)
    self.declEnv = declEnv
    self.name = name
    self.value = value
  
  def toMicroVizString(self):
    return self.name + ' = ' + toNetworkString(self.value)

  def toJSONObject(self):
    dict = super(VarAssignmentEvent, self).toJSONObject()
    dict['name'] = self.name
    dict['value'] = toNetworkObject(self.value)
    dict['declEnvId'] = self.declEnv.id
    return dict

class SendEvent(Event):
  def __init__(self, orderNum, sourceLoc, env, recv, selector, args, activationPathToken):
    super(SendEvent, self).__init__(orderNum, sourceLoc, env)
    self.recv = recv
    self.selector = selector
    self.args = args
    self.activationPathToken = activationPathToken
    self.activationEnv = None # assigned when mkEnv is called
    self.returnValue = None # assigned when receive is called
    self.activated = False # assigned when mkEnv is called

  def toJSONObject(self):
    dict = super(SendEvent, self).toJSONObject()
    dict['recv'] = toNetworkObject(self.recv)
    dict['selector'] = self.selector
    dict['args'] = list(map(toNetworkObject, self.args))
    dict['activationPathToken'] = self.activationPathToken
    return dict

class ReturnEvent(Event):
  def __init__(self, orderNum, sourceLoc, env, value):
    super(ReturnEvent, self).__init__(orderNum, sourceLoc, env)
    self.value = value
  
  def toJSONObject(self):
    dict = super(ReturnEvent, self).toJSONObject()
    dict['value'] = self.value
    return dict

class LocalReturnEvent(ReturnEvent):
  def __init__(self, orderNum, sourceLoc, env, value):
    super(LocalReturnEvent, self).__init__(orderNum, sourceLoc, env, value)

  def toMicroVizString(self):
    return '→ ' + toNetworkString(self.value)

class ErrorEvent(Event):
  def __init__(self, sourceLoc, env, errorString):
    super(ErrorEvent, self).__init__(-1, sourceLoc, env)
    self.errorString = errorString
  
  def toJSONObject(self):
    dict = super(ErrorEvent, self).toJSONObject()
    dict['errorString'] = self.errorString
    return dict

  def toMicroVizString(self):
    return '▨'

class InstVarAssignmentEvent(Event):
  def __init__(self, orderNum, sourceLoc, env, obj, name, value):
    super(InstVarAssignmentEvent, self).__init__(orderNum, sourceLoc, env)
    self.obj = obj
    self.name = name
    self.value = value

  def toJSONObject(self):
    dict = super(InstVarAssignmentEvent, self).toJSONObject()
    dict['obj'] = toNetworkObject(self.obj)
    dict['name'] = self.name
    dict['value'] = toNetworkObject(self.value)
    return dict
  
  def toMicroVizString(self):
    return toNetworkString(self.obj) + '.' + self.name + ' = ' + toNetworkString(self.value)

class InstantiationEvent(Event):
  def __init__(self, orderNum, sourceLoc, env, _class, args, newInstance):
    super(InstantiationEvent, self).__init__(orderNum, sourceLoc, env)
    self._class = _class
    self.args = args
    self.newInstance = newInstance
  
  def toJSONObject(self):
    dict = super(InstantiationEvent, self).toJSONObject()
    dict['class'] = self._class.__name__
    dict['args'] = self.args
    dict['newInstance'] = toNetworkObject(self.newInstance)
    return dict
  
  def toMicroVizString(self):
    return 'new ' + self._class.__name__ + ' → ' + toNetworkString(self.newInstance)


##----- Intended as RPC calls -------

class ReceiveEvent(Event):
  def __init__(self, env, returnValue):
    super(ReceiveEvent, self).__init__(-1, None, env)
    self.returnValue = returnValue
  
  def toJSONObject(self):
    dict = super(ReceiveEvent, self).toJSONObject()
    dict['returnValue'] = toJSON(self.returnValue)
    return dict
