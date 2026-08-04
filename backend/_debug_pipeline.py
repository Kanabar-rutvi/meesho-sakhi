import asyncio
import importlib.util
import pathlib
import traceback

spec = importlib.util.spec_from_file_location('main', pathlib.Path('main.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

async def main():
    try:
        async for item in mod.run_pipeline('Help me set up my hostel room in Mumbai, budget ₹12,000'):
            print(item)
    except Exception:
        traceback.print_exc()

asyncio.run(main())
