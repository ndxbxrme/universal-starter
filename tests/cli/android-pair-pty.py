"""POSIX terminal regression: fake adb tests stdin ownership, not phone integration.
Run: python3 tests/cli/android-pair-pty.py
"""
import errno
import os
from pathlib import Path
import pty
import select
import signal
import sys
import tempfile
import termios
import time

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
FAKE_ADB = '''#!/usr/bin/env python3
import os, sys, termios, signal
args = sys.argv[1:]
if args[0] == "version":
    print("Android Debug Bridge fixture")
elif args[0] == "pair":
    flags = termios.tcgetattr(0)[3]
    assert flags & termios.ICANON and flags & termios.ECHO and flags & termios.ISIG, "adb inherited raw terminal"
    if os.environ.get("PAIR_TEST_IGNORE_INT"):
        signal.signal(signal.SIGINT, signal.SIG_IGN)
    print("Fixture pairing code: ", end="", flush=True)
    assert input() == "123456"
    print("Successfully paired")
elif args[0] == "connect":
    print("connected")
elif args[0] == "devices":
    print("List of devices attached\\nadb-example-random._adb-tls-connect._tcp device model:Example")
else:
    sys.exit(2)
'''


def check(mode, folder):
    pid, fd = pty.fork()
    if pid == 0:
        os.chdir(ROOT)
        os.environ["PATH"] = str(folder) + os.pathsep + os.environ["PATH"]
        if mode == "stubborn":
            os.environ["PAIR_TEST_IGNORE_INT"] = "1"
        os.execvp("node", ["node", "scripts/mobile.mjs", "pair"])
    transcript = b""
    stage = 0
    deadline = time.monotonic() + 12
    status = None
    try:
        while time.monotonic() < deadline:
            if select.select([fd], [], [], 0.1)[0]:
                try:
                    data = os.read(fd, 65536)
                except OSError as error:
                    if error.errno != errno.EIO:
                        raise
                    data = b""
                transcript += data
            if stage == 0 and b"host:PAIRING_PORT):" in transcript:
                os.write(fd, b"\x03" if mode == "prompt-cancel" else b"192.0.2.1:12345\n")
                stage = 1
            if stage == 1 and b"Fixture pairing code:" in transcript:
                os.write(fd, b"123456\n" if mode == "success" else b"\x03")
                stage = 2
            if stage == 2 and b"from the main Wireless debugging page):" in transcript:
                os.write(fd, b"192.0.2.1:23456\n")
                stage = 3
            done, status = os.waitpid(pid, os.WNOHANG)
            if done:
                break
        else:
            raise AssertionError("pairing hung: " + transcript.decode(errors="replace"))
        assert os.WIFEXITED(status), transcript
        assert os.WEXITSTATUS(status) == (0 if mode == "success" else 1), transcript
        assert (b"first column" if mode == "success" else b"Pairing cancelled") in transcript, transcript
        flags = termios.tcgetattr(fd)[3]
        assert flags & termios.ICANON and flags & termios.ECHO and flags & termios.ISIG
        print("PASS terminal regression:", mode)
    finally:
        try:
            os.kill(pid, signal.SIGKILL)
            os.waitpid(pid, 0)
        except ProcessLookupError:
            pass
        os.close(fd)


with tempfile.TemporaryDirectory(prefix="universal-pair-test-") as temp:
    folder = Path(temp)
    adb = folder / "adb"
    adb.write_text(FAKE_ADB)
    adb.chmod(0o700)
    for mode in ["success", "prompt-cancel", "code-cancel", "stubborn"]:
        check(mode, folder)
