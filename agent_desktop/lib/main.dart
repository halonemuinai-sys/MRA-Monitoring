import 'dart:io';
import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';
import 'package:system_tray/system_tray.dart';
import 'monitoring_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
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
    await windowManager.setResizable(false);
    await windowManager.setAsFrameless();
  });

  runApp(const MRAAssetMonitor());
}

class MRAAssetMonitor extends StatelessWidget {
  const MRAAssetMonitor({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        fontFamily: 'Segoe UI',
      ),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with WindowListener {
  final SystemTray _systemTray = SystemTray();
  bool isInstalling = false;
  String statusText = "Ready to Install";

  @override
  void initState() {
    super.initState();
    windowManager.addListener(this);
    initSystemTray();
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
    await _systemTray.initSystemTray(
      title: "MRA Monitor",
      iconPath: path,
    );

    final Menu menu = Menu();
    await menu.buildFrom([
      MenuItemLabel(label: 'Show Dashboard', onClicked: (menuItem) => windowManager.show()),
      MenuItemLabel(label: 'Sync Now', onClicked: (menuItem) => MonitoringService.syncData()),
      MenuSeparator(),
      MenuItemLabel(label: 'Exit', onClicked: (menuItem) => exit(0)),
    ]);

    await _systemTray.setContextMenu(menu);
    _systemTray.registerSystemTrayEventHandler((eventName) {
      if (eventName == kSystemTrayEventClick) {
        windowManager.show();
      }
    });
  }

  void runInstallation() async {
    setState(() {
      isInstalling = true;
      statusText = "Setting up background service...";
    });

    await Future.delayed(const Duration(seconds: 2));
    await MonitoringService.syncData();

    setState(() {
      statusText = "Monitoring Active";
    });
    
    await windowManager.setPreventClose(true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0F),
      body: Stack(
        children: [
          // Background Gradient subtle
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 1.2,
                  colors: [
                    Colors.blueAccent.withValues(alpha: 0.05),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Close Button - Symmetrical padding
          Positioned(
            top: 20,
            right: 20,
            child: IconButton(
              icon: Icon(Icons.close, color: Colors.white.withValues(alpha: 0.3), size: 20),
              onPressed: () => windowManager.hide(),
              hoverColor: Colors.redAccent.withValues(alpha: 0.1),
              splashRadius: 20,
            ),
          ),

          // Main Content
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Logo Container
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.02),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.blueAccent.withValues(alpha: 0.1),
                          blurRadius: 30,
                          spreadRadius: 5,
                        )
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: Image.asset(
                        'assets/app_icon.ico',
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.monitor, size: 50, color: Colors.blueAccent),
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Brand Text
                  const Text(
                    "MRA Asset Monitor",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Professional IT Hardware Monitoring",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  
                  const SizedBox(height: 80),

                  // Dynamic UI
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 500),
                    child: _buildInteractionArea(),
                  ),

                  const SizedBox(height: 60),
                  
                  // Footer Version
                  Text(
                    "Version 1.0.0",
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.1),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInteractionArea() {
    if (!isInstalling) {
      return ElevatedButton(
        key: const ValueKey("btn_install"),
        onPressed: runInstallation,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.blueAccent,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 60),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          elevation: 10,
          shadowColor: Colors.blueAccent.withValues(alpha: 0.3),
        ),
        child: const Text("INSTALL & START", style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
      );
    } else if (statusText == "Monitoring Active") {
      return Column(
        key: const ValueKey("area_active"),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.greenAccent.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle, color: Colors.greenAccent, size: 40),
          ),
          const SizedBox(height: 16),
          const Text(
            "SYSTEM PROTECTED",
            style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.w900, letterSpacing: 1),
          ),
          const SizedBox(height: 32),
          TextButton.icon(
            onPressed: () async {
              setState(() => statusText = "Syncing...");
              await MonitoringService.syncData();
              setState(() => statusText = "Monitoring Active");
            },
            icon: const Icon(Icons.sync, size: 18),
            label: const Text("SYNC DATA NOW"),
            style: TextButton.styleFrom(
              foregroundColor: Colors.blueAccent,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
            ),
          ),
        ],
      );
    } else {
      return Column(
        key: const ValueKey("area_installing"),
        children: [
          const SizedBox(
            width: 40,
            height: 40,
            child: CircularProgressIndicator(color: Colors.blueAccent, strokeWidth: 3),
          ),
          const SizedBox(height: 24),
          Text(
            statusText.toUpperCase(),
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.blueAccent.withValues(alpha: 0.7),
              fontSize: 12,
              fontWeight: FontWeight.w900,
              letterSpacing: 1,
            ),
          ),
        ],
      );
    }
  }
}
