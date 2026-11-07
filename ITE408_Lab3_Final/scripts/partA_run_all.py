#!/usr/bin/env python3
"""Runs Lab 3 Part A for real and records every command + output per step.
Usage: STUDENT_ID=1234567 python3 run_partA.py
Writes out/steps.json"""
import json, os, subprocess, textwrap

SID = os.environ.get("STUDENT_ID", "STUDENT-ID")
os.makedirs("out", exist_ok=True)

PRE = textwrap.dedent(r'''
export TZ=Asia/Karachi
P(){ printf '%s %s [%s] %s:%s%s ' "$(date '+%a %b %d')" "$(date '+%I:%M %p')" "__SID__" "$(id -un)" "$(pwd | sed "s|^$HOME|~|")" "$([ $(id -u) = 0 ] && echo '#' || echo '$')"; }
run(){ P; printf '%s\n' "$*"; eval "$@" 2>&1; }
''').replace("__SID__", SID)

def session(user, cmds, cwd=None):
    body = PRE + (f"cd {cwd}\n" if cwd else ("cd /root\n" if user=="root" else "")) + "\n".join(
        "run " + _q(c) for c in cmds)
    if user == "root":
        argv = ["bash", "-c", body]
    else:
        argv = ["su", "-", user, "-c", body]
    r = subprocess.run(argv, capture_output=True, text=True)
    import re
    return re.sub(r"environment: line \d+: ", "-bash: ", (r.stdout + r.stderr)).rstrip("\n")

def _q(s):
    return "'" + s.replace("'", "'\\''") + "'"

# ---------- reset (so script is re-runnable) ----------
subprocess.run("for u in sam danny; do userdel -r $u 2>/dev/null; done; "
               "groupdel DEVELOPERS 2>/dev/null; rm -rf /srv/devshare /tmp/teststicky /opt/suidlab",
               shell=True)

steps = []
def step(sid, part, title, user, cmds, cwd=None, explain=""):
    out = session(user, cmds, cwd)
    steps.append(dict(id=sid, part=part, title=title, user=user, output=out, explain=explain))
    print(f"\n===== {sid} {title} =====\n{out}")

# ---------- Part 1: group ----------
step("1.1", "Part 1", "Prompt changed to show student ID and privileges escalated to root", "root",
     ['echo "PS1=\\"\\\\d \\\\@ [' + SID + ']\\""', "whoami", "id"])
step("1.2", "Part 1", "Add the DEVELOPERS group", "root",
     ["groupadd DEVELOPERS", "tail -n 2 /etc/group", "getent group DEVELOPERS"])

# ---------- Part 2: users ----------
step("2.1", "Part 2", "Add user sam (password samPass) and place him in DEVELOPERS", "root",
     ["adduser --gecos 'Sam,,,' --disabled-password sam",
      "echo 'sam:samPass' | chpasswd && echo 'passwd: password updated successfully'",
      "usermod -aG DEVELOPERS sam", "id sam"])
step("2.2", "Part 2", "Add user danny (password dannyPass) and place him in DEVELOPERS", "root",
     ["adduser --gecos 'Danny,,,' --disabled-password danny",
      "echo 'danny:dannyPass' | chpasswd && echo 'passwd: password updated successfully'",
      "usermod -aG DEVELOPERS danny", "id danny"])
step("2.3", "Part 2", "Verify the new users in /etc/passwd and /etc/group", "root",
     ["tail -n 3 /etc/passwd", "grep DEVELOPERS /etc/group"])
step("2.4", "Part 2", "Verify the password hashes in /etc/shadow", "root",
     ["grep -E '^(sam|danny):' /etc/shadow", "ls -l /etc/shadow /etc/passwd"])

# ---------- Part 3: symbolic ----------
step("3.0", "Part 3", "Default home-directory mode on Ubuntu 24.04 (HOME_MODE) and lab baseline", "root",
     ["grep -E '^HOME_MODE' /etc/login.defs", "ls -ld /home/sam /home/danny",
      "chmod 755 /home/sam /home/danny", "ls -ld /home/sam /home/danny"])
step("3.1", "Part 3", "Switch to sam and explore the environment", "sam",
     ["pwd", "cd /home", "ls -l"])
step("3.2", "Part 3", "sam can enter danny's directory but cannot write in it", "sam",
     ["cd danny", "pwd", "touch new.txt", "cd .."], cwd="/home")
step("3.3", "Part 3", "As root, remove execute for others on danny's directory (chmod o-x)", "root",
     ["cd /home", "chmod o-x danny", "ls -l"])
step("3.4", "Part 3", "Verify sam can no longer access danny's directory", "sam",
     ["cd danny", "ls -ld danny"], cwd="/home")

# ---------- Part 4: absolute ----------
step("4.1", "Part 4", "Switch to danny and view current permissions", "danny",
     ["pwd", "cd /home", "ls -l"])
step("4.2", "Part 4", "Absolute mode: chmod 705 danny (owner rwx, group ---, others r-x)", "danny",
     ["chmod 705 danny", "ls -ld danny", "stat -c '%a %A %n' danny"], cwd="/home")
step("4.3", "Part 4", "Create test.txt in danny's directory", "danny",
     ["touch test.txt", "ls -l"], cwd="/home/danny")
step("4.4", "Part 4", "As sam: read access to danny's directory and test.txt", "sam",
     ["cd /home", "ls -l", "cd danny", "ls -l", "cat test.txt && echo '(file readable - empty)'"])
step("4.5", "Part 4", "As sam: attempt to create a file in danny's directory", "sam",
     ["touch Sam.txt"], cwd="/home/danny")

# ---------- Part 5: SUID ----------
C_SRC = r'''#include <stdio.h>
#include <unistd.h>
#include <pwd.h>
static const char *nm(uid_t u){ struct passwd *p = getpwuid(u); return p ? p->pw_name : "?"; }
int main(void){
    uid_t r = getuid(), e = geteuid();
    printf("Real UID      : %d (%s)\n", r, nm(r));
    printf("Effective UID : %d (%s)\n", e, nm(e));
    FILE *f = fopen("/opt/suidlab/danny_secret.txt", "r");
    if (f) { char b[128]; if (fgets(b, sizeof b, f)) printf("Secret file   : %s", b); fclose(f); }
    else    printf("Secret file   : Permission denied\n");
    return 0;
}
'''
os.makedirs("/opt/suidlab", exist_ok=True)
open("/opt/suidlab/whoami_suid.c", "w").write(C_SRC)
open("out/whoami_suid.c", "w").write(C_SRC)
step("5.1", "Part 5", "SUID: create test directory, write and compile the C program (owner danny)", "root",
     ["cd /opt/suidlab", "echo 'TOP-SECRET: only danny can read this' > danny_secret.txt",
      "chown danny:danny danny_secret.txt && chmod 600 danny_secret.txt",
      "cat whoami_suid.c", "gcc whoami_suid.c -o whoami_suid",
      "chown danny:danny whoami_suid && chmod 755 whoami_suid", "ls -l"])
step("5.2", "Part 5", "SUID BEFORE: sam runs the program (runs as sam)", "sam",
     ["ls -l whoami_suid", "./whoami_suid"], cwd="/opt/suidlab")
step("5.3", "Part 5", "Apply SUID with chmod u+s", "root",
     ["cd /opt/suidlab", "chmod u+s whoami_suid", "ls -l whoami_suid", "stat -c '%a %A %n' whoami_suid"])
step("5.4", "Part 5", "SUID AFTER: sam runs the program (effective UID = danny)", "sam",
     ["./whoami_suid", "cat danny_secret.txt"], cwd="/opt/suidlab")
step("5.5", "Part 5", "Real-world SUID binaries and how auditors find them", "root",
     ["ls -l /usr/bin/passwd", "find /usr/bin -perm -4000 -type f 2>/dev/null | head"])
# ---------- SGID ----------
step("5.6", "Part 5", "SGID BEFORE: shared directory owned by DEVELOPERS, no SGID", "root",
     ["mkdir /srv/devshare", "chgrp DEVELOPERS /srv/devshare", "chmod 2770 /srv/devshare && chmod g-s /srv/devshare",
      "ls -ld /srv/devshare", "su sam -c 'touch /srv/devshare/before_sgid.txt'", "ls -l /srv/devshare"])
step("5.7", "Part 5", "SGID AFTER: chmod g+s - new files inherit the DEVELOPERS group", "root",
     ["chmod g+s /srv/devshare", "ls -ld /srv/devshare",
      "su sam -c 'touch /srv/devshare/after_sgid_sam.txt'",
      "su danny -c 'touch /srv/devshare/after_sgid_danny.txt; mkdir /srv/devshare/subdir'",
      "ls -l /srv/devshare"])
# ---------- Sticky ----------
step("5.8", "Part 5", "Sticky BEFORE: world-writable /tmp/teststicky - danny deletes sam's file", "root",
     ["mkdir /tmp/teststicky && chmod 777 /tmp/teststicky", "ls -ld /tmp/teststicky",
      "su sam -c 'echo sam-data > /tmp/teststicky/sam.txt'", "ls -l /tmp/teststicky",
      "su danny -c 'rm -f /tmp/teststicky/sam.txt' && echo 'danny deleted sam.txt'", "ls -l /tmp/teststicky"])
step("5.9", "Part 5", "Sticky AFTER: chmod +t - only owner or root can delete", "root",
     ["chmod +t /tmp/teststicky", "ls -ld /tmp/teststicky",
      "su sam -c 'echo sam-data > /tmp/teststicky/sam.txt'",
      "su danny -c 'echo danny-data > /tmp/teststicky/danny.txt'", "ls -l /tmp/teststicky",
      "su danny -c 'rm -f /tmp/teststicky/sam.txt'",
      "su sam -c 'rm -f /tmp/teststicky/sam.txt' && echo 'sam deleted his own file'",
      "rm -f /tmp/teststicky/danny.txt && echo 'root deleted danny.txt'", "ls -l /tmp/teststicky",
      "ls -ld /tmp"])

json.dump(dict(student_id=SID, steps=steps), open("out/steps.json", "w"), indent=1)
