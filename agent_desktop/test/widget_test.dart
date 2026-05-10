import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agent_desktop/main.dart';

void main() {
  testWidgets('Dashboard basic UI test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MRAMonitorApp());

    // Verify that our title exists.
    expect(find.text('MRA ASSET INTELLIGENCE'), findsOneWidget);
  });
}
