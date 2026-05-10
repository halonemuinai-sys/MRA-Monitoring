import platform
import subprocess
import time
import random
import requests
import wmi
import json
import os
import sys

# === CONFIGURATION ===
# Ganti dengan URL API Next.js Anda nanti
API_URL = "http://localhost:3000/api/monitoring"
API_KEY = "mra-secret-key-2024" # Gunakan key yang sama di Server
DEBUG = True # Set True jika ingin melihat output di console saat testing

def get_battery_info():
    """Mengambil data kesehatan baterai melalui WMI."""
    try:
        c = wmi.WMI()
        # Mengambil info dari Win32_Battery
        batteries = c.Win32_Battery()
        
        if not batteries:
            return None
        
        batt = batteries[0]
        
        # Design Capacity & Full Charge Capacity dalam mWh
        design_cap = batt.DesignCapacity
        full_charge_cap = batt.FullChargeCapacity
        
        # Hitung Wear Level
        # Formula: (1 - (FullCharge / Design)) * 100
        wear_level = 0
        if design_cap and full_charge_cap:
            wear_level = round((1 - (full_charge_cap / design_cap)) * 100, 2)
            
        return {
            "designCapacity": design_cap,
            "fullChargeCapacity": full_charge_cap,
            "wearLevel": max(0, wear_level) # Pastikan tidak negatif
        }
    except Exception as e:
        if DEBUG: print(f"Error getting battery info: {e}")
        return None

def get_serial_number():
    """Mengambil Serial Number BIOS."""
    try:
        c = wmi.WMI()
        for bios in c.Win32_BIOS():
            sn = bios.SerialNumber.strip()
            if sn and "To be filled" not in sn:
                return sn
        return "UNKNOWN_SN"
    except:
        return "UNKNOWN_SN"

def get_system_specs():
    """Mengumpulkan semua payload data."""
    try:
        c = wmi.WMI()
        # Mengambil RAM dalam Bytes
        system_info = c.Win32_ComputerSystem()[0]
        total_memory_bytes = int(system_info.TotalPhysicalMemory)
        
        return {
            "hostname": platform.node(),
            "serialNumber": get_serial_number(),
            "os": f"Windows {platform.release()} ({platform.version()})",
            "cpu": platform.processor(),
            "ramGB": round(total_memory_bytes / (1024**3)),
            "battery": get_battery_info(),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
    except Exception as e:
        if DEBUG: print(f"Error gathering specs: {e}")
        return None

def main():
    # 1. Jitter: Delay acak antara 1 hingga 5 menit (60-300 detik)
    # Ini untuk mencegah 'Thundering Herd' pada 200 unit laptop
    if not DEBUG:
        delay = random.randint(60, 300)
        time.sleep(delay)
    
    # 2. Ambil Data
    payload = get_system_specs()
    if not payload:
        return

    # 3. Kirim ke Server
    try:
        headers = {
            "Content-Type": "application/json",
            "x-api-key": API_KEY
        }
        
        response = requests.post(API_URL, json=payload, headers=headers, timeout=30)
        
        if DEBUG:
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        if DEBUG: print(f"Failed to send data: {e}")
        # Jika gagal, aplikasi akan exit silent. 
        # Task Scheduler akan mencoba lagi di jadwal berikutnya (besok).
        pass

if __name__ == "__main__":
    main()
