@echo off
echo Memulai proses kompilasi Monitoring Agent...
pyinstaller --noconsole --onefile --icon=NONE --name="MRA_Asset_Monitor" agent_monitoring.py
echo.
echo Selesai! File .exe ada di folder 'dist/MRA_Asset_Monitor.exe'
pause
