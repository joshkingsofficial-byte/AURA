import os
import asyncio
from dotenv import load_dotenv
load_dotenv()

TAPO_EMAIL = os.getenv("TAPO_EMAIL")
TAPO_PASSWORD = os.getenv("TAPO_PASSWORD")
TAPO_IP = os.getenv("TAPO_IP")

async def turn_on_async():
    from tapo import ApiClient
    client = ApiClient(TAPO_EMAIL, TAPO_PASSWORD)
    device = await client.l530(TAPO_IP)
    await device.on()
    print("[Tapo] Light turned ON")

async def turn_off_async():
    from tapo import ApiClient
    client = ApiClient(TAPO_EMAIL, TAPO_PASSWORD)
    device = await client.l530(TAPO_IP)
    await device.off()
    print("[Tapo] Light turned OFF")

async def set_brightness_async(level):
    from tapo import ApiClient
    client = ApiClient(TAPO_EMAIL, TAPO_PASSWORD)
    device = await client.l530(TAPO_IP)
    await device.set_brightness(level)
    print(f"[Tapo] Brightness set to {level}%")

async def set_color_async(hue, saturation):
    from tapo import ApiClient
    client = ApiClient(TAPO_EMAIL, TAPO_PASSWORD)
    device = await client.l530(TAPO_IP)
    await device.set_color(hue, saturation)
    print(f"[Tapo] Color set to hue:{hue} sat:{saturation}")

async def set_color_temperature_async(kelvin):
    from tapo import ApiClient
    client = ApiClient(TAPO_EMAIL, TAPO_PASSWORD)
    device = await client.l530(TAPO_IP)
    await device.set_color_temperature(kelvin)
    print(f"[Tapo] Color temperature set to {kelvin}K")

def turn_on():
    try:
        asyncio.run(turn_on_async())
        return True
    except Exception as e:
        print(f"[Tapo] Error: {e}")
        return False

def turn_off():
    try:
        asyncio.run(turn_off_async())
        return True
    except Exception as e:
        print(f"[Tapo] Error: {e}")
        return False

def set_brightness(level):
    try:
        asyncio.run(set_brightness_async(level))
        return True
    except Exception as e:
        print(f"[Tapo] Error: {e}")
        return False
