# (1) it’s like bret’s binary search demo

sum = 0;
for x in range(1, 11):
  sum = sum + x

# (2) … but we can handle nested loops

count = 0
for x in range(1, 4):
  for y in range(1, 4):
    count = count + 1

# (3) … and things that are loop-like
from functools import reduce

arr = [1, 2, 3, 4, 5]
sum = reduce(lambda x, y: x + y, arr, 0)



# (4) … and OO

def fact(x):
  if x == 0:
    return 1
  else:
    rest = fact(this-1)
    return this * rest

f0 = fact(0)
f1 = fact(1)
f5 = fact(5)


# (5) here’s a class (maybe cut this, and just do array?)

class Point(object):
  def __init__(self, x, y):
    self.x = x
    self.y = y

  def __str__(self):
    sx = self.x.toString()
    sy = self.y.toString()
    return "(" + sx + ", " + sy + ")"

  def toDebugString(self):
    return str(self)

  def move(self):
    self.x = self.x + 5
    self.y = self.y - 7

p = Point(1, 2)
s = str(p)

before = p
p.move()
after = p

###

globalEnv = R.program(...)

_env = R.enterScope(..., globalEnv)
class Point(object): 
  def __init__(self, x, y):
    R.instantiate(..., R.currentEnvironment, Point, [x, y], self)
    initEnv = R.mkEnv(..., '__init__', Point._env)
    R.assignVar(..., initEnv, initEnv, 'self', self)
    R.assignVar(..., initEnv, initEnv, 'x', x)
    R.assignVar(..., initEnv, initEnv, 'y', y)
    self.x = R.assignInstVar(..., initEnv, self, 'x', x)
    self.y = R.assignInstVar(..., initEnv, self, 'y', y)

  def __str__(self):
    strEnv = R.mkEnv(..., '__str__', Point._env)
    R.assignVar(..., strEnv, strEnv, 'self', self)
    sx = R.assignVar(..., strEnv, strEnv, 'sx', (
      R.send(..., tdsEnv, None, 'str', [self.x], None),
      R.receive(tdsEnv, str(self.x))
    )[1])
    sy = R.assignVar(..., strEnv, strEnv, 'sy', (
      R.send(..., tdsEnv, None, 'str', [self.y], None),
      R.receive(tdsEnv, str(self.y))
    )[1])
    return R.localReturn(..., strEnv, "(" + sx + ", " + sy + ")")

  def toDebugString(self):
    tdsEnv = R.mkEnv(..., 'toDebugString', Point._env)
    R.assignVar(..., tdsEnv, tdsEnv, 'self', self)
    return R.localReturn(..., tdsEnv, (
      R.send(..., tdsEnv, None, 'str', [self], None),
      R.receive(tdsEnv, str(self))
    )[1])

  def move(self):
    moveEnv = R.mkEnv(..., 'move', Point._env)
    R.assignVar(..., moveEnv, moveEnv, 'self', self)
    self.x = R.assignInstVar(..., moveEnv, self, 'x', self.x + 5) 
    self.y = R.assignInstVar(..., moveEnv, self, 'y', self.y - 7)
R.leaveScope(..., _env)

p = R.assignVar(..., globalEnv, globalEnv, 'p', (
  R.send(..., globalEnv, None, 'Point', [1, 2], None),
  R.receive(globalEnv, Point(1, 2))
)[1])
s = R.assignVar(..., globalEnv, globalEnv, 's', (
  R.send(..., globalEnv, None, 'str', [p], None),
  R.receive(globalEnv, str(p))
)[1])

before = R.assignVar(..., globalEnv, globalEnv, 'before', p)
(
  R.send(..., globalEnv, p, 'move', [], None),
  R.receive(globalEnv, p.move())
)[1]
after = R.assignVar(..., globalEnv, globalEnv, 'after', p)

# (6) more live programming

arr = [6, 1, 2, 8, -5];

def toString(arr):
  var ans = ""
  var idx = 0
  for x in arr:
    if idx > 0:
      ans = ans + ", "
    ans = ans + str(x)
  return "[" + ans + "]"

s = toString(arr)

# (7) user-defined control structures XXX can't do this in python

# (8) interesting: understanding closures (also: ask for help w/ design!)

def add(a):
  return lambda x: x + a


inc = add(5)
ans = inc(6)

