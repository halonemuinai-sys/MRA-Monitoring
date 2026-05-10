import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class MonitoringService {
  static const String apiUrl = "http://localhost:3000/api/monitoring";
  static const String apiKey = "mra-secret-key-2024";

  static Future<String> runPowerShell(String command) async {
    try {
      var result = await Process.run('powershell', ['-Command', command]);
      return result.stdout.toString().trim();
    } catch (e) {
      debugPrint("PS Error ($command): $e");
      return "";
    }
  }

  static Future<Map<String, dynamic>> getSystemSpecs() async {
    Map<String, dynamic> data = {
      "hostname": Platform.localHostname,
      "timestamp": DateTime.now().toIso8601String(),
    };

    try {
      // 1. Core Info
      data["serialNumber"] = await runPowerShell('(Get-CimInstance Win32_BIOS).SerialNumber');
      data["manufacturer"] = await runPowerShell('(Get-CimInstance Win32_ComputerSystem).Manufacturer');
      data["model"] = await runPowerShell('(Get-CimInstance Win32_ComputerSystem).Model');
      data["currentUser"] = await runPowerShell('[System.Security.Principal.WindowsIdentity]::GetCurrent().Name');
      data["os"] = await runPowerShell('(Get-CimInstance Win32_OperatingSystem).Caption');
      data["cpu"] = await runPowerShell('(Get-CimInstance Win32_Processor).Name');
      data["gpu"] = await runPowerShell('(Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join " / "');

      // 2. Hardware Stats
      double ramRaw = double.tryParse(await runPowerShell('(Get-CimInstance Win32_PhysicalMemory | Measure-Object Capacity -Sum).Sum')) ?? 0;
      String diskSizeStr = await runPowerShell('(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID=\'C:\'").Size');
      String diskFreeStr = await runPowerShell('(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID=\'C:\'").FreeSpace');
      
      data["hardware"] = {
        "ramGB": (ramRaw / (1024 * 1024 * 1024)).round(),
        "diskTotalGB": (double.tryParse(diskSizeStr) ?? 0) ~/ (1024 * 1024 * 1024),
        "diskFreeGB": (double.tryParse(diskFreeStr) ?? 0) ~/ (1024 * 1024 * 1024),
      };

      // 3. Security & Battery
      data["security"] = {
        "antivirus": await runPowerShell('Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | Select-Object -ExpandProperty displayName'),
        "firewall": (await runPowerShell('Get-NetFirewallProfile -Profile Domain,Public,Private | Select-Object -ExpandProperty Enabled') == "1") ? "Active" : "Disabled",
        "bitlocker": (await runPowerShell('Get-BitLockerVolume -MountPoint "C:" | Select-Object -ExpandProperty ProtectionStatus') == "1") ? "Encrypted" : "Unprotected",
      };

      String batteryWear = await runPowerShell('''
        \$full = (Get-CimInstance -Namespace root/WMI -ClassName BatteryFullChargedCapacity | Measure-Object FullChargedCapacity -Sum).Sum;
        \$design = (Get-CimInstance -Namespace root/WMI -ClassName BatteryStaticData | Measure-Object DesignedCapacity -Sum).Sum;
        if (\$design -gt 0) { [math]::Round((1 - (\$full / \$design)) * 100, 2) } else { 0 }
      ''');
      data["battery"] = { "wearLevel": double.tryParse(batteryWear) ?? 0.0 };

      // 4. Installed Apps (BARU)
      String appsJson = await runPowerShell('''
        Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*, HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*, HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
        Where-Object { \$_.DisplayName -ne \$null } | 
        Select-Object DisplayName, DisplayVersion | 
        Sort-Object DisplayName | 
        ConvertTo-Json -Compress
      ''');
      try {
        data["installed_apps"] = jsonDecode(appsJson);
      } catch (_) {
        data["installed_apps"] = [];
      }

      // 5. Network
      try {
        var ipResponse = await http.get(Uri.parse('https://api.ipify.org')).timeout(const Duration(seconds: 3));
        data["network"] = { "publicIp": ipResponse.body };
      } catch (_) {
        data["network"] = { "publicIp": "Unknown" };
      }

    } catch (e) {
      debugPrint("Specs Error: $e");
    }
    return data;
  }

  static Future<void> syncData() async {
    final payload = await getSystemSpecs();
    try {
      await http.post(
        Uri.parse(apiUrl),
        headers: {"Content-Type": "application/json", "x-api-key": apiKey},
        body: jsonEncode(payload),
      );
      debugPrint("Sync complete for ${payload['hostname']}");
    } catch (e) {
      debugPrint("Sync failed: $e");
    }
  }
}
