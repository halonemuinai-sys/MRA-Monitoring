import 'dart:io';
import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';
import 'package:system_tray/system_tray.dart';
import 'monitoring_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Initialize window manager
  await windowManager.ensureInitialized();

  WindowOptions windowOptions = const WindowOptions(
    size: Size(450, 650),
    center: true,
    backgroundColor: Colors.transparent,
    skipTaskbar: false,
    titleBarStyle: TitleBarStyle.hidden,
  );
  
  windowManager.waitUntilReadyToShow(windowOptions, () async {
    await windowManager.show();
    await windowManager.focus();
    await windowManager.setPreventClose(true); // Mencegah aplikasi benar-benar mati saat di-close
  });

  runApp(const MRAAssetMonitor());
}

class MRAAssetMonitor extends StatelessWidget {
  const MRAAssetMonitor({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0A0A0B),
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blueAccent,
          brightness: Brightness.dark,
        ),
      ),
      home: const InstallerScreen(),
    );
  }
}

class InstallerScreen extends StatefulWidget {
  const InstallerScreen({super.key});

  @override
  State<InstallerScreen> createState() => _InstallerScreenState();
}

class _InstallerScreenState extends State<InstallerScreen> with WindowListener {
  bool isInstalling = false;
  double progress = 0.0;
  String statusText = "Ready to Install";
  final SystemTray _systemTray = SystemTray();

  @override
  void initState() {
    super.initState();
    windowManager.addListener(this);
  }

  @override
  void dispose() {
    windowManager.removeListener(this);
    super.dispose();
  }

  @override
  void onWindowClose() async {
    bool isPreventClose = await windowManager.isPreventClose();
    if (isPreventClose) {
      await windowManager.hide();
    }
  }

  Future<void> initSystemTray() async {
    String path = Platform.isWindows ? 'assets/app_icon.ico' : 'assets/app_icon.png';
    
    // We'll skip actual icon loading if file doesn't exist for now to prevent crash
    try {
      await _systemTray.initSystemTray(
        title: "MRA Monitor",
        iconPath: path,
      );

      final Menu menu = Menu();
      await menu.buildFrom([
        MenuItemLabel(label: 'Show Dashboard', onClicked: (menuItem) => windowManager.show()),
        MenuItemLabel(label: 'Sync Now', onClicked: (menuItem) => startSync()),
        MenuSeparator(),
        MenuItemLabel(label: 'Exit', onClicked: (menuItem) => exit(0)),
      ]);

      await _systemTray.setContextMenu(menu);
      _systemTray.registerSystemTrayEventHandler((eventName) {
        if (eventName == kSystemTrayEventClick) {
          windowManager.show();
        }
      });
    } catch (e) {
      debugPrint("Tray error: $e");
    }
  }

  Future<void> startSync() async {
    // Logic to collect and send data (similar to Python agent)
    debugPrint("Syncing data...");
  }

  void runInstallation() async {
    setState(() {
      isInstalling = true;
      statusText = "Analyzing System...";
    });

    // Simulate installation steps
    for (int i = 1; i <= 100; i++) {
      await Future.delayed(const Duration(milliseconds: 30));
      setState(() {
        progress = i / 100;
        if (i == 30) statusText = "Fetching Hardware ID...";
        if (i == 60) statusText = "Configuring Background Service...";
        if (i == 90) statusText = "Finalizing...";
      });
    }

    // Real Sync to Server
    try {
      await MonitoringService.syncData();
      setState(() {
        statusText = "Sync Successful!";
      });
    } catch (e) {
      setState(() {
        statusText = "Sync failed, but service active.";
      });
    }

    await initSystemTray();
    setState(() {
      statusText = "Monitoring Active";
    });
    
    // Tunggu 2 detik agar user sempat melihat status 'Active', lalu sembunyikan ke Tray
    await Future.delayed(const Duration(seconds: 2));
    await windowManager.hide(); 
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFF141417),
              const Color(0xFF0A0A0B),
            ],
          ),
        ),
        child: Stack(
          children: [
            // Close Button
            Positioned(
              top: 20,
              right: 20,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white24),
                onPressed: () => exit(0),
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.all(40.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo / Icon Placeholder
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.blueAccent.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.blueAccent.withValues(alpha: 0.3)),
                    ),
                    child: const Icon(Icons.security_update_good, size: 50, color: Colors.blueAccent),
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    "MRA Asset Monitor",
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Professional IT Hardware Monitoring",
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 14),
                  ),
                  const SizedBox(height: 60),
                  
                  if (!isInstalling)
                    ElevatedButton(
                      onPressed: runInstallation,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blueAccent,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(double.infinity, 56),
                        shape: RoundedRectangleAtBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: const Text("Install & Start Monitoring", style: TextStyle(fontWeight: FontWeight.bold)),
                    )
                  else if (statusText == "Monitoring Active")
                    Column(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.greenAccent, size: 48),
                        const SizedBox(height: 16),
                        const Text("System is Protected", style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 32),
                        OutlinedButton.icon(
                          onPressed: () async {
                            setState(() => statusText = "Syncing...");
                            await MonitoringService.syncData();
                            setState(() => statusText = "Monitoring Active");
                          },
                          icon: const Icon(Icons.sync, size: 18),
                          label: const Text("Sync Now"),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.blueAccent,
                            side: const BorderSide(color: Colors.blueAccent),
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            shape: RoundedRectangleAtBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ],
                    )
                  else
                    Column(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 8,
                            backgroundColor: Colors.white10,
                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.blueAccent),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          statusText,
                          style: const TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  
                  const SizedBox(height: 40),
                  Text(
                    "Version 1.0.0",
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.2), fontSize: 10),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Helper for rounded button
class RoundedRectangleAtBorder extends OutlinedBorder {
  final BorderRadius borderRadius;
  const RoundedRectangleAtBorder({required this.borderRadius});
  @override
  OutlinedBorder copyWith({BorderSide? side, BorderRadiusGeometry? borderRadius}) => this;
  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) => Path()..addRRect(borderRadius.resolve(textDirection).toRRect(rect));
  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) => Path()..addRRect(borderRadius.resolve(textDirection).toRRect(rect));
  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {}
  @override
  ShapeBorder scale(double t) => this;
}
