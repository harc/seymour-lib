#!/usr/bin/env python3

import asyncio
import websockets
import json

from EventRecorder import EventRecorder

async def handler(websocket, path):
  while True:
    global ws
    ws = websocket
    message = await websocket.recv()
    message = json.loads(message)
    print(message)
    await runProgram(websocket, message)


async def runProgram(websocket, message):
  global sls
  sls = message['sourceLocs']
  exec(message['code'], globals(), locals())
  await runCode()

start_server = websockets.serve(handler, 'localhost', 8001)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()