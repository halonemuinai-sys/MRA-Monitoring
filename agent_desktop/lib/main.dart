import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';
import 'package:system_tray/system_tray.dart';
import 'package:launch_at_startup/launch_at_startup.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'dart:io';
import 'dart:async';

import 'monitoring_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Window Manager
  await windowManager.ensureInitialized();
  
  WindowOptions windowOptions = const WindowOptions(
    size: Size(1000, 700),
    center: true,
    backgroundColor: Colors.transparent,
    skipTaskbar: false,
    titleBarStyle: TitleBarStyle.normal,
    title: 'MRA Asset Intelligence',
  );
  
  await windowManager.waitUntilReadyToShow(windowOptions, () async {
    await windowManager.show();
    await windowManager.focus();
    // Prevent default close behavior
    await windowManager.setPreventClose(true);
  });

  // Setup Launch at Startup
  PackageInfo packageInfo = await PackageInfo.fromPlatform();
  LaunchAtStartup.instance.setup(
    appName: packageInfo.appName,
    appPath: Platform.resolvedExecutable,
  );
  
  runApp(const MRAMonitorApp());
}

class MRAMonitorApp extends StatelessWidget {
  const MRAMonitorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MRA Asset Intelligence',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.blue,
        useMaterial3: true,
        fontFamily: 'Segoe UI',
      ),
      home: const DashboardPage(),
    );
  }
}

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> with WindowListener {
  final MonitoringService _monitoringService = MonitoringService();
  final SystemTray _systemTray = SystemTray();
  
  Map<String, dynamic> _data = {};
  bool _isSyncing = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    windowManager.addListener(this);
    initSystemTray();
    _refreshData();
    // Auto sync every 5 minutes
    _timer = Timer.periodic(const Duration(minutes: 5), (timer) {
      _refreshData();
    });
  }

  @override
  void dispose() {
    windowManager.removeListener(this);
    _timer?.cancel();
    super.dispose();
  }

  // Handle Window Close
  @override
  void onWindowClose() async {
    bool isPreventClose = await windowManager.isPreventClose();
    if (isPreventClose) {
      await windowManager.hide(); // Hide to tray instead of closing
    }
  }

  Future<void> initSystemTray() async {
    String path = Platform.isWindows ? 'windows/runner/resources/app_icon.ico' : 'assets/app_icon.png';

    final Menu menu = Menu();
    await menu.buildFrom([
      MenuItemLabel(label: 'Show Dashboard', onClicked: (menuItem) => windowManager.show()),
      MenuSeparator(),
      MenuItemLabel(label: 'Exit MRA Monitor', onClicked: (menuItem) => exit(0)),
    ]);

    await _systemTray.initSystemTray(
      title: "MRA Monitor",
      iconPath: path,
    );

    await _systemTray.setContextMenu(menu);

    // Handle tray double click
    _systemTray.registerSystemTrayEventHandler((eventName) {
      if (eventName == kSystemTrayEventClick) {
        windowManager.show();
      } else if (eventName == kSystemTrayEventRightClick) {
        _systemTray.popUpContextMenu();
      }
    });
  }

  Future<void> _refreshData() async {
    setState(() => _isSyncing = true);
    try {
      final newData = await _monitoringService.collectData();
      setState(() => _data = newData);
      await _monitoringService.syncToSupabase(newData);
    } catch (e) {
      debugPrint('Sync Error: $e');
    } finally {
      if (mounted) setState(() => _isSyncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F12),
      body: Stack(
        children: [
          // Background Gradient
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.blue.withAlpha(12), // Menggantikan withOpacity
              ),
            ),
          ),
          
          // Main Content
          Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                const SizedBox(height: 40),
                Expanded(
                  child: GridView.count(
                    crossAxisCount: 2,
                    childAspectRatio: 1.8,
                    crossAxisSpacing: 24,
                    mainAxisSpacing: 24,
                    children: [
                      _buildInfoCard('Device', _data['hostname'] ?? '...', Icons.laptop_windows, Colors.blue),
                      _buildInfoCard('Battery Wear', '${_data['battery_wear_level'] ?? '0'}%', Icons.battery_charging_full, Colors.green),
                      _buildInfoCard('Storage Free', '${_data['storage_free_gb'] ?? '0'} GB', Icons.storage, Colors.orange),
                      _buildInfoCard('Installed Apps', '${_data['apps_count'] ?? '0'} Packages', Icons.apps, Colors.purple),
                    ],
                  ),
                ),
                _buildFooter(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withAlpha(25),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.security, color: Colors.blue, size: 24),
                ),
                const SizedBox(width: 16),
                const Text(
                  'MRA ASSET INTELLIGENCE',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Hardware & Software Compliance Monitoring',
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withAlpha(100),
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: _isSyncing ? Colors.blue.withAlpha(25) : Colors.white.withAlpha(12),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: _isSyncing ? Colors.blue.withAlpha(76) : Colors.white10),
          ),
          child: Row(
            children: [
              if (_isSyncing)
                const SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.blue),
                )
              else
                const Icon(Icons.check_circle, color: Colors.green, size: 14),
              const SizedBox(width: 8),
              Text(
                _isSyncing ? 'SYNCING...' : 'LIVE',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: _isSyncing ? Colors.blue : Colors.green,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(8),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withAlpha(12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title.toUpperCase(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.white.withAlpha(76),
                  letterSpacing: 1,
                ),
              ),
              Icon(icon, color: color.withAlpha(127), size: 20),
            ],
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Last Sync: ${DateTime.now().toString().split('.')[0]}',
          style: TextStyle(fontSize: 10, color: Colors.white.withAlpha(76), fontWeight: FontWeight.bold),
        ),
        Text(
          'AGENT v2.0.0',
          style: TextStyle(fontSize: 10, color: Colors.white.withAlpha(76), fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}
