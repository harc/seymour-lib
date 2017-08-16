#!/usr/bin/env python3

from EventRecorder import EventRecorder

R = EventRecorder()
_currentEnv = R.program('program')
_currentLexicalEnv = globalEnv

sum = R.assignVar('sumDecl', globalEnv, _currentLexicalEnv, 'sum', 0)
R.assignVar('xDecl', globalEnv, 'x')
_oldEnv123 = _currentEnv
_currentEnv = ...
for x in range(3):
  R.assignVar('xAssignment', globalEnv, _currentLexicalEnv, 'x', x)
  sum = R.assignVar('sumAssignment', globalEnv, _currentLexicalEnv, 'sum', sum + x)
_currentEnv = _oldEnv123

ans = R.assignVar('ansDecl', globalEnv, _currentLexicalEnv, 'ans', sum)