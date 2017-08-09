#!/usr/bin/env python3

from EventRecorder import EventRecorder

R = EventRecorder()
globalEnv = R.program('program')

sum = R.declVar('sumDecl', globalEnv, 'sum', 0)
R.declVar('xDecl', globalEnv, 'x')
for x in range(3):
  R.assignVar('xAssignment', globalEnv, globalEnv, 'x', x)
  sum = R.assignVar('sumAssignment', globalEnv, globalEnv, 'sum', sum + x)

ans = R.declVar('ansDecl', globalEnv, 'ans', sum)