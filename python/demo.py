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

