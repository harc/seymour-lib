#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import math
import json

class NetworkEncoder(json.JSONEncoder):
  def default(self, o):
    if callable(v):
      return '{callable}'
    elif v == None:
      return 'None'
    elif v == math.inf:
      return '∞'
    elif v == -math.inf:
      return '-∞'
    else:
      try:
        return JSONEncoder.default(self, o)
      except TypeError:
        return '#' + id(o) # may wanna add object id emojis

class Event(object):
  nextEventId = 0

  def __init__(self, sourceLoc, env):
    self.id = Event.nextEventId
    Event.nextEventId += 1
    self.sourceLoc = sourceLoc
    self.env = env
    self.children = []
  
  def toMicroVizString(self):
    raise Exception('abstract method!')
  
  def toJSON(self):
    return {
      'type': type(self).__name__,
      'sourceLoc': self.sourceLoc,
      'id': self.id,
      'envId': self.env.id if self.env != None else None,
      'microVizString': self.toMicroVizString()
    }

class ProgramEvent(Event):
  def __init__(self, sourceLoc):
    super(ProgramEvent, self).__init__(sourceLoc, None)
  
  def toMicroVizString(self):
    return 'PROGRAM'

class VarDeclEvent(Event):
  def __init__(self, sourceLoc, env, name, value):
    super(VarDeclEvent, self).__init__(sourceLoc, env)
    self.name = name
    self.value = value
  
  def toMicroVizString(self):
    return self.name + ' = ' + NetworkEncoder().encode(self.value)

  def toJSON(self):
    dict = super(VarDeclEvent, self).toJSON()
    dict['name'] = self.name
    dict['value'] = NetworkEncoder().encode(self.value)
    return dict

class VarAssignmentEvent(Event):
  def __init__(self, sourceLoc, env, declEnv, name, value):
    super(VarAssignmentEvent, self).__init__(sourceLoc, env)
    self.declEnv = declEnv
    self.name = name
    self.value = value
  
  def toMicroVizString(self):
    return self.name + ' = ' + NetworkEncoder().encode(self.value)

  def toJSON(self):
    dict = super(VarAssignmentEvent, self).toJSON()
    dict['name'] = self.name
    dict['declEnvId'] = self.declEnv.id
    dict['value'] = NetworkEncoder().encode(self.value)
    return dict

class SendEvent(Event):
  def __init__(self, sourceLoc, env, recv, selector, args, activationPathToken):
    super(SendEvent, self).__init__(sourceLoc, env)
    self.recv = recv
    self.selector = selector
    self.args = args
    self.activationPathToken = activationPathToken

  def toJSON(self):
    dict = super(SendEvent, self).toJSON()
    dict['recv'] = NetworkEncoder().encode(self.recv)
    dict['selector'] = self.selector
    dict['args'] = map(lambda x: NetworkEncoder().encode(x), self.args)
    dict['activationPathToken'] = self.activationPathToken
    return dict

  def toMicroVizString(self):
    return ''

class ReturnEvent(Event):
  def __init__(self, sourceLoc, env, value):
    super(ReturnEvent, self).__init__(sourceLoc, env)
    self.value = value
  
  def toJSON(self):
    dict = super(LocalReturnEvent, self).toJSON()
    dict['value'] = NetworkEncoder().encode(self.value)

class LocalReturnEvent(ReturnEvent):
  def __init__(self, sourceLoc, env, value):
    super(LocalReturnEvent, self).__init__(sourceLoc, env, value)
  
  def toJSON(self):
    return super(LocalReturnEvent, self).toJSON()

  def toMicroVizString(self):
    return '→ ' + NetworkEncoder().encode(self.value)