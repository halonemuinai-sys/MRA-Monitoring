import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:window_manager/window_manager.dart';
import 'package:system_tray/system_tray.dart';
import 'package:launch_at_startup/launch_at_startup.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'dart:io';
import 'dart:async';

import 'monitoring_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 1. Initialize Window Manager
  await windowManager.ensureInitialized();
  
  WindowOptions windowOptions = const WindowOptions(
    size: Size(600, 450),
    center: true,
    backgroundColor: Colors.transparent,
    skipTaskbar: false,
    titleBarStyle: TitleBarStyle.normal,
    title: 'AEGIS MRA Agent',
  );
  
  // 2. Setup Auto Startup
  try {
    PackageInfo packageInfo = await PackageInfo.fromPlatform();
    LaunchAtStartup.instance.setup(
      appName: packageInfo.appName,
      appPath: Platform.resolvedExecutable,
    );
  } catch (e) {
    debugPrint("LaunchAtStartup Error: $e");
  }

  // 3. Start Window Logic
  await windowManager.waitUntilReadyToShow(windowOptions, () async {
    await windowManager.show();
    await windowManager.focus();
    await windowManager.setPreventClose(true);
  });

  runApp(const MRAMonitorApp());
}

class MRAMonitorApp extends StatelessWidget {
  const MRAMonitorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AEGIS MRA Agent',
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
  
  bool _isSyncing = false;
  String _lastSync = 'Never';
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    windowManager.addListener(this);
    initSystemTray();
    _refreshData();
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

  @override
  void onWindowClose() async {
    await windowManager.hide();
  }

  Future<void> initSystemTray() async {
    try {
      final ByteData data = await rootBundle.load('assets/app_icon.ico');
      final Directory tempDir = await getTemporaryDirectory();
      final File tempFile = File(p.join(tempDir.path, 'mra_app_icon.ico'));
      await tempFile.writeAsBytes(data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes));

      final Menu menu = Menu();
      await menu.buildFrom([
        MenuItemLabel(label: 'Open AEGIS MRA', onClicked: (menuItem) => windowManager.show()),
        MenuSeparator(),
        MenuItemLabel(label: 'Exit', onClicked: (menuItem) => exit(0)),
      ]);

      await _systemTray.initSystemTray(
        title: "AEGIS MRA",
        iconPath: tempFile.path,
      );
      
      await _systemTray.setContextMenu(menu);

      _systemTray.registerSystemTrayEventHandler((eventName) {
        if (eventName == kSystemTrayEventClick) {
          windowManager.show();
        } else if (eventName == kSystemTrayEventRightClick) {
          _systemTray.popUpContextMenu();
        }
      });
    } catch (e) {
      debugPrint("Tray Error: $e");
    }
  }

  Future<void> _refreshData() async {
    if (!mounted) return;
    setState(() => _isSyncing = true);
    try {
      final newData = await _monitoringService.collectData();
      if (mounted) {
        await _monitoringService.syncToSupabase(newData);
        setState(() {
          _lastSync = DateTime.now().toString().split('.')[0].split(' ')[1];
        });
      }
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
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Status Icon with Pulse
            Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(20),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Image.asset(
                    'assets/logoITshied.png',
                    fit: BoxFit.contain,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            
            const Text(
              'AEGIS MRA MONITORING',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'SYSTEM ACTIVE & SECURE',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
                color: Colors.white.withAlpha(100),
              ),
            ),
            
            const SizedBox(height: 48),
            
            // Status Pills
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildStatusPill(
                  _isSyncing ? 'SYNCING DATA...' : 'STANDBY',
                  _isSyncing ? Colors.blue : Colors.white24,
                ),
                const SizedBox(width: 12),
                _buildStatusPill(
                  'LAST SYNC: $_lastSync',
                  Colors.white10,
                ),
              ],
            ),
            
            const SizedBox(height: 40),
            Text(
              'The application is running in the background.\nYou can close this window anytime.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                color: Colors.white.withAlpha(50),
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusPill(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withAlpha(40)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.bold,
          color: color.withAlpha(200),
        ),
      ),
    );
  }
}
