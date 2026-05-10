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
      return "";
    }
  }

  static Future<Map<String, dynamic>> getSystemSpecs() async {
    try {
      // 1. Storage Info (C: Drive) - Gunakan PowerShell agar lebih presisi
      String diskJson = await runPowerShell(
        'Get-CimInstance Win32_LogicalDisk -Filter "DeviceID=\'C:\'" | Select-Object Size, FreeSpace | ConvertTo-Json'
      );
      var diskData = jsonDecode(diskJson);
      int diskTotal = (diskData['Size'] as int) ~/ (1024 * 1024 * 1024);
      int diskFree = (diskData['FreeSpace'] as int) ~/ (1024 * 1024 * 1024);

      // 2. Battery Wear Level
      String batteryWear = await runPowerShell(
        '\$b = Get-CimInstance Win32_Battery; if (\$b.DesignCapacity -gt 0) { [math]::Round((1 - (\$b.FullChargeCapacity / \$b.DesignCapacity)) * 100, 2) } else { 0 }'
      );
      double wearLevel = double.tryParse(batteryWear) ?? 0.0;

      // 3. Security Check
      String avName = await runPowerShell('Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | Select-Object -ExpandProperty displayName');
      if (avName.isEmpty) avName = "Windows Defender";

      String fwEnabled = await runPowerShell('Get-NetFirewallProfile -Profile Domain,Public,Private | Select-Object -ExpandProperty Enabled');
      bool isFwOn = fwEnabled.contains('1') || fwEnabled.toLowerCase().contains('true');

      String blStatus = await runPowerShell('Get-BitLockerVolume -MountPoint "C:" | Select-Object -ExpandProperty ProtectionStatus');
      String bitLocker = blStatus == "1" ? "Encrypted" : "Unprotected";

      // 4. Basic Info
      var snResult = await Process.run('wmic', ['bios', 'get', 'serialnumber']);
      String sn = snResult.stdout.toString().trim().split('\n').last.trim();

      var sysResult = await Process.run('wmic', ['computersystem', 'get', 'manufacturer,model,username']);
      var sysLines = sysResult.stdout.toString().trim().split('\n');
      var sysValues = sysLines.last.trim().split(RegExp(r'\s{2,}'));

      // 5. Public IP
      String publicIp = "Unknown";
      try {
        var ipResponse = await http.get(Uri.parse('https://api.ipify.org')).timeout(const Duration(seconds: 3));
        publicIp = ipResponse.body;
      } catch (_) {}

      return {
        "hostname": Platform.localHostname,
        "currentUser": sysValues.last,
        "manufacturer": sysValues[0],
        "model": sysValues.length > 1 ? sysValues[1] : "Unknown",
        "serialNumber": sn,
        "os": "Windows ${Platform.operatingSystemVersion}",
        "security": {
          "antivirus": avName,
          "firewall": isFwOn ? "Active" : "Disabled",
          "bitlocker": bitLocker,
        },
        "network": { "publicIp": publicIp },
        "hardware": {
          "ramGB": (int.parse(await runPowerShell('(Get-CimInstance Win32_PhysicalMemory | Measure-Object Capacity -Sum).Sum')) / (1024 * 1024 * 1024)).round(),
          "diskTotalGB": diskTotal,
          "diskFreeGB": diskFree,
        },
        "battery": { "wearLevel": wearLevel },
        "timestamp": DateTime.now().toIso8601String()
      };
    } catch (e) {
      debugPrint("Error gathering specs: $e");
      return {};
    }
  }

  static Future<void> syncData() async {
    final payload = await getSystemSpecs();
    if (payload.isEmpty) return;
    try {
      await http.post(
        Uri.parse(apiUrl),
        headers: {"Content-Type": "application/json", "x-api-key": apiKey},
        body: jsonEncode(payload),
      );
    } catch (e) {
      debugPrint("Sync failed: $e");
    }
  }
}
