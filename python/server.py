#!/usr/bin/env python

import asyncio
from aioprocessing import AioProcess, AioQueue
import signal
import sys
import argparse
import websockets
import json
import dill
import os

from EventRecorder import EventRecorder, TerminateException
from utils import toJSON

class ClientCommunicator(object):
  def __init__(self, port):
    self.queue = AioQueue()
    self.port = port
    self.websocket = None
    self.codeRunner = None

    self.start_server = websockets.serve(self.onConnection, 'localhost', self.port)
    self.loop = asyncio.get_event_loop()
    asyncio.ensure_future(self.processQueue(self.queue), loop=self.loop)
  
  def serve(self):
    self.loop.run_until_complete(self.start_server)
    self.loop.run_forever()

  async def onConnection(self, websocket, path):
    self.websocket = websocket
    while True:
      try:
        message = await self.websocket.recv()
      except websockets.exceptions.ConnectionClosed:
        print('CONNECTION CLOSED')
      
      message = json.loads(message)
      print(message['type'])
      if message['type'] == 'run':
        print(message['code'])
        self.codeRunner = CodeRunner(message['code'], message['sourceLocs'], self.queue)
        self.codeRunner.start()
      elif message['type'] == 'kill':
        try:
          self.codeRunner.terminate()
          self.codeRunner.process.join()
          self.codeRunner = None
        except AttributeError:
          pass
      else:
        raise ValueError('unknown message type {}'.format(message['type']))

  async def processQueue(self, queue):
    while True:
      item = dill.loads(await queue.coro_get())
      await self.websocket.send(toJSON(item))
      if item['type'] == 'done':
        await self.codeRunner.join()
        self.codeRunner = None

class CodeRunner(object):
  def __init__(self, code, sourceLocs, queue):
    self.code = code
    self.sourceLocs = sourceLocs
    self.queue = queue
    self.process = AioProcess(target=self.run)
    self.R = None
  
  def run(self):
    signal.signal(signal.SIGTERM, self.exit_gracefully)
    g = globals().copy()
    self.R = R = EventRecorder(self.queue)
    g['sls'] = self.sourceLocs
    g['R'] = R
    exec(self.code, g)
    try:
      g['runCode']()
    except TerminateException as te:
      pass
    except Exception as e:
      if not R.raised:
        print(e)
        activationEnv = R.currentProgramOrSendEvent.activationEnv
        R.error(
          R.currentProgramOrSendEvent.sourceLoc if activationEnv != None else None,
          activationEnv if activationEnv != None else R.currentProgramOrSendEvent.env,
          str(e)
        )
  
  def exit_gracefully(self, arg1, arg2):
    self.R.terminate = True


  def start(self):
    self.process.start()
  
  def terminate(self):
    self.process.terminate()
  
  async def join(self):
    return await self.process.coro_join()


parser = argparse.ArgumentParser(description="seymour-lib python server")
parser.add_argument('--port')

if __name__ == '__main__':
  args = parser.parse_args()
  server = ClientCommunicator(args.port)
  server.serve()