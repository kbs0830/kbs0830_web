Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\user\Desktop\kbs0830_web-master"
WshShell.Run """C:\Program Files\nodejs\node.exe"" ""C:\Users\user\Desktop\kbs0830_web-master\node_modules\next\dist\bin\next"" start", 0, False
