on run argv
  set entrada to POSIX file (item 1 of argv)
  set salida to POSIX file (item 2 of argv)
  tell application "Keynote"
    set d to open entrada
    delay 2
    export d to salida as PDF
    close d saving no
  end tell
end run
