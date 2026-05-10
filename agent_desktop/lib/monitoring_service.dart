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
      // 1. Serial Number (WMIC)
      String sn = await runPowerShell('(Get-CimInstance Win32_BIOS).SerialNumber');
      data["serialNumber"] = sn.isEmpty ? "Unknown-SN" : sn;
      debugPrint("SN: $sn");

      // 2. System Info
      data["manufacturer"] = await runPowerShell('(Get-CimInstance Win32_ComputerSystem).Manufacturer');
      data["model"] = await runPowerShell('(Get-CimInstance Win32_ComputerSystem).Model');
      data["currentUser"] = await runPowerShell('[System.Security.Principal.WindowsIdentity]::GetCurrent().Name');
      debugPrint("System: ${data["manufacturer"]} ${data["model"]}");

      // 3. OS
      data["os"] = await runPowerShell('(Get-CimInstance Win32_OperatingSystem).Caption');

      // 4. Hardware (RAM & Disk)
      try {
        double ramRaw = double.tryParse(await runPowerShell('(Get-CimInstance Win32_PhysicalMemory | Measure-Object Capacity -Sum).Sum')) ?? 0;
        data["hardware"] = {
          "ramGB": (ramRaw / (1024 * 1024 * 1024)).round(),
        };

        String diskSizeStr = await runPowerShell('(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID=\'C:\'").Size');
        String diskFreeStr = await runPowerShell('(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID=\'C:\'").FreeSpace');
        
        data["hardware"]["diskTotalGB"] = (double.tryParse(diskSizeStr) ?? 0) ~/ (1024 * 1024 * 1024);
        data["hardware"]["diskFreeGB"] = (double.tryParse(diskFreeStr) ?? 0) ~/ (1024 * 1024 * 1024);
        debugPrint("Storage: ${data["hardware"]["diskFreeGB"]} / ${data["hardware"]["diskTotalGB"]}");
      } catch (e) { debugPrint("HW Error: $e"); }

      // 5. Security
      data["security"] = {
        "antivirus": await runPowerShell('Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | Select-Object -ExpandProperty displayName'),
        "firewall": (await runPowerShell('Get-NetFirewallProfile -Profile Domain,Public,Private | Select-Object -ExpandProperty Enabled') == "1") ? "Active" : "Disabled",
        "bitlocker": (await runPowerShell('Get-BitLockerVolume -MountPoint "C:" | Select-Object -ExpandProperty ProtectionStatus') == "1") ? "Encrypted" : "Unprotected",
      };

      // 6. Battery
      String batteryWear = await runPowerShell('\$b = Get-CimInstance Win32_Battery | Select-Object -First 1; if (\$b.DesignCapacity -gt 0) { [math]::Round((1 - (\$b.FullChargeCapacity / \$b.DesignCapacity)) * 100, 2) } else { 0 }');
      data["battery"] = { "wearLevel": double.tryParse(batteryWear) ?? 0.0 };

      // 7. Public IP
      try {
        var ipResponse = await http.get(Uri.parse('https://api.ipify.org')).timeout(const Duration(seconds: 3));
        data["network"] = { "publicIp": ipResponse.body };
      } catch (_) {
        data["network"] = { "publicIp": "Unknown" };
      }

    } catch (e) {
      debugPrint("Global Error gathering specs: $e");
    }

    return data;
  }

  static Future<void> syncData() async {
    final payload = await getSystemSpecs();
    debugPrint("Payload: ${jsonEncode(payload)}");

    try {
      final response = await http.post(
        Uri.parse(apiUrl),
        headers: {"Content-Type": "application/json", "x-api-key": apiKey},
        body: jsonEncode(payload),
      );
      debugPrint("Sync Response: ${response.statusCode} - ${response.body}");
    } catch (e) {
      debugPrint("Sync failed: $e");
    }
  }
}
