#!/usr/bin/env python3

import asyncio
import websockets
import json

from EventRecorder import EventRecorder

async def handler(websocket, path):
  while True:
    message = await websocket.recv()
    message = json.loads(message)
    print(message)
    await runProgram(websocket, message)


async def runProgram(websocket, message):
  scope = {
    'sls': message['sourceLocs'], 
    'ws': websocket,
    'EventRecorder': EventRecorder
  }
  exec(message['code'], scope)
  await scope['runCode']()

start_server = websockets.serve(handler, 'localhost', 8001)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()