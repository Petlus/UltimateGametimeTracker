import sys
import os
import json
import argparse
import asyncio

# Setup paths to include plugin sources
base_dir = os.path.dirname(os.path.abspath(__file__))
plugins_src = os.path.join(os.path.dirname(base_dir), "plugins_src")

origin_path = os.path.join(plugins_src, "galaxy-integration-origin", "src")
uplay_path = os.path.join(plugins_src, "galaxy-integration-uplay", "src")

sys.path.append(origin_path)
sys.path.append(uplay_path)

def output_result(data, success=True):
    print(json.dumps({"success": success, "data": data}))

async def handle_ea_sync(cookies):
    from ea_bridge import OriginSync
    sync = OriginSync()
    try:
        data = await sync.sync_playtime(cookies)
        output_result(data)
    except Exception as e:
        output_result(str(e), success=False)

async def handle_ubi_sync(credentials):
    from ubi_bridge import UplaySync
    sync = UplaySync()
    try:
        # credentials is a list of strings [prodLoginData, prodRememberMe, prodLastProfile]
        data = await sync.sync_playtime(credentials)
        output_result(data)
    except Exception as e:
        output_result(str(e), success=False)

def main():
    parser = argparse.ArgumentParser(description="GOG Bridge CLI")
    parser.add_argument("--platform", required=True, choices=["ea", "ubi"])
    parser.add_argument("--action", required=True, choices=["sync"])
    parser.add_argument("--data", required=True, help="JSON encoded input data")

    args = parser.parse_args()
    
    try:
        input_data = json.loads(args.data)
    except:
        output_result("Invalid input data", success=False)
        return

    if args.platform == "ea":
        if args.action == "sync":
            asyncio.run(handle_ea_sync(input_data))
    elif args.platform == "ubi":
        if args.action == "sync":
            asyncio.run(handle_ubi_sync(input_data))

if __name__ == "__main__":
    main()
