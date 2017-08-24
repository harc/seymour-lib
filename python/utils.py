import json
import math

class NetworkEncoder(json.JSONEncoder):
  def default(self, o):
    if callable(o):
      return '{callable}'
    elif o == None:
      return 'None'
    elif o == math.inf:
      return '∞'
    elif o == -math.inf:
      return '-∞'
    else:
      try:
        return json.JSONEncoder.default(self, o)
      except TypeError:
        return '#' + str(id(o)) # TODO: may wanna add object id emojis

def toJSON(jsonObject):
  return NetworkEncoder().encode(jsonObject)

def toNetworkObject(jsonObject):
  return json.loads(toJSON(jsonObject))

def toNetworkString(jsonObject):
  return str(toNetworkObject(jsonObject))