#!/usr/bin/env python3

from EventRecorder import EventRecorder

R = EventRecorder()
globalEnv = R.program('program')

def fib(n):
  fEnv = R.mkEnv('fib', globalEnv)
  R.assignVar('nDecl', fEnv, 'n', n)
  if n < 2: 
    return R.localReturn('baseReturn', fEnv, n)
  else:
    fa = R.assignVar('faDecl', fEnv, 'fa', 
      (R.send('leftRecCall' , fEnv, None, 'fib', [n-1], None), R.receive(fEnv, fib(n-1)))[1])
    fb = R.assignVar('fbDecl', fEnv, 'fb', 
      (R.send('rightRecCall', fEnv, None, 'fib', [n-2], None), R.receive(fEnv, fib(n-2)))[1])
    return R.localReturn('recReturn', fEnv, fa + fb)

for x in range(5):
  R.assignVar('xAssignment', globalEnv, 'x', x)
  
  fx = R.assignVar('fx', globalEnv, 'fx', 
    (R.send('fibCall', globalEnv, None, 'fib', [x], None), R.receive(globalEnv, fib(x)))[1])