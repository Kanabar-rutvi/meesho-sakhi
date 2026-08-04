import asyncio
import importlib.util
import pathlib
import traceback

spec = importlib.util.spec_from_file_location('main', pathlib.Path('main.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class Req:
    def __init__(self, query):
        self.query = query

async def main():
    try:
        resp = await mod.shop(Req('Help me set up my hostel room'))
        print(type(resp))
        print(resp)
    except Exception:
        traceback.print_exc()

asyncio.run(main())
