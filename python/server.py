#!/usr/bin/env python3

import asyncio
from aioprocessing import AioProcess, AioQueue
import websockets
import json

from EventRecorder import EventRecorder
from utils import toJSON

class ClientCommunicator(object):
  def __init__(self):
    self.start_server = websockets.serve(self.onConnection, 'localhost', 8000)
    self.loop = asyncio.get_event_loop()
    self.queue = AioQueue()
    self.websocket = None
    self.codeRunner = None
  
  def serve(self):
    self.loop.run_until_complete(self.start_server)
    asyncio.ensure_future(self.processQueue(self.queue), loop=self.loop)
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
          self.codeRunner = None
        except AttributeError:
          pass
      else:
        raise ValueError('unknown message type {}'.format(message['type']))

  async def processQueue(self, queue):
    while True:
      item = await queue.coro_get()
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
  
  def run(self):
    g = globals().copy()
    R = EventRecorder(self.queue)
    g['sls'] = self.sourceLocs
    g['R'] = R
    exec(self.code, g)
    try:
      g['runCode']()
    except Exception as e:
      activationEnv = R.currentProgramOrSendEvent.activationEnv
      R.error(
        R.currentProgramOrSendEvent.sourceLoc if activationEnv != None else None,
        activationEnv if activationEnv != None else R.currentProgramOrSendEvent.env,
        str(e)
      )
  
  def start(self):
    self.process.start()
  
  def terminate(self):
    self.process.terminate()
  
  async def join(self):
    return await self.process.coro_join()

if __name__ == '__main__':
  server = ClientCommunicator()
  server.serve()