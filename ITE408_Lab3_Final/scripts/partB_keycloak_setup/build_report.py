#!/usr/bin/env python3
"""Rebuilds the Lab 3 report: student details, simple-English text, new Part A screenshots, Part B screenshots."""
import copy, io, re, sys
import docx
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.table import Table
from docx.text.paragraph import Paragraph

W = '/tmp/claude-0/lab3work/'
SECRET = open(W + 'client_secret.txt').read().strip()
d = docx.Document(W + 'orig.docx')
body = list(d.element.body.iterchildren())          # fixed indexes from orig_dump.txt
P = lambda i: Paragraph(body[i], d)
T = lambda i: Table(body[i], d)

# ---------------------------------------------------------------- helpers
TOK = re.compile(r'(\*\*.+?\*\*|`.+?`)')
def set_runs(p, markup):
    for r in list(p.runs):
        r._r.getparent().remove(r._r)
    for part in TOK.split(markup):
        if not part:
            continue
        if part.startswith('**'):
            r = p.add_run(part[2:-2]); r.bold = True
        elif part.startswith('`'):
            r = p.add_run(part[1:-1]); r.font.name = 'Consolas'; r.font.size = Pt(10); r.font.color.rgb = RGBColor(0xA3, 0x1F, 0x34)
        else:
            p.add_run(part)

def set_box_lines(tbl, lines):
    cell = tbl.rows[0].cells[0]
    assert len(cell.paragraphs) == len(lines), (len(cell.paragraphs), len(lines))
    for para, line in zip(cell.paragraphs, lines):
        code = [r for r in para.runs if r.font.name == 'Consolas']
        tmpl = code[-1] if code else None
        for r in list(para.runs):
            if r._r is not tmpl._r:
                r._r.getparent().remove(r._r)
        tmpl.text = line

def set_cell(cell, text):
    para = cell.paragraphs[0]
    runs = para.runs
    runs[0].text = text
    for r in runs[1:]:
        r._r.getparent().remove(r._r)

def picture_paragraph_before(ref_el, path, width_cm):
    p = d.add_paragraph()                               # appended at end, then moved
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True
    p.add_run().add_picture(path, width=Cm(width_cm))
    ref_el.addprevious(p._p)
    return p

# ---------------------------------------------------------------- 1. rewritten paragraphs (simple English)
TXT = {
 32: "Access control decides **who** can do **what** with **which** resource. This lab looks at two levels of it. **Part A** is about the operating system: on Linux, every file and folder has an owner, a group, and permissions for the user, the group and everyone else. **Part B** is about applications: it uses Keycloak, a free tool that logs users in and hands out secure login tokens (OAuth 2.0 and OpenID Connect).",
 34: "**Operating system:** Ubuntu 24.04 LTS, used instead of the CSE-LABVM (the lab allows an Ubuntu machine).",
 35: "**Prompt:** the terminal prompt was set with `PS1=\"\\d \\@ [1091080]\"`, so every screenshot shows the date, the time and my student ID. After the ID the prompt also shows the user name and the folder, so you can see who ran each command.",
 36: "**Switching users:** the lab uses the desktop \"Switch User\" menu. I used `su - sam` and `su - danny` in the terminal instead. The result is the same: each command runs with that user's ID and groups.",
 43: "`sudo su` makes the session run as root (user ID 0). Adding groups and users changes system files (`/etc/group`, `/etc/passwd`, `/etc/shadow`), so only root can do it. `id` shows `uid=0(root)`.",
 44: "**Good practice:** use `sudo <command>` for one admin task instead of staying in a root shell. It lowers the chance of mistakes and keeps a record in `/var/log/auth.log`.",
 48: "`groupadd DEVELOPERS` creates the group. The last line of `/etc/group` shows `DEVELOPERS:x:<GID>:`. The fields are: group name, a password placeholder (x), the group ID, and the list of members (empty for now). `getent` reads the same information.",
 53: "`adduser` is an easy tool for creating users on Ubuntu. It makes a private group with the same name, makes a home folder, copies the starter files from `/etc/skel` and saves the full name. I set the password `samPass` with `chpasswd`, which gives the same result as typing it when asked.",
 54: "**Correction to the lab handout:** the handout uses `usermod -G DEVELOPERS sam`. The `-G` option **replaces** all other groups. I used `usermod -aG`, which **adds** the group and keeps the others. `id sam` shows that DEVELOPERS was added.",
 58: "The same steps were done for danny with the password `dannyPass`. Each user gets its own ID (1001 for sam, 1002 for danny) and a private group.",
 62: "`/etc/passwd` has 7 fields separated by colons: user name, `x` (the password is kept in the shadow file), user ID, group ID, full name, home folder and login shell. `/etc/group` now lists `sam,danny` as members of DEVELOPERS.",
 66: "`/etc/shadow` stores password **hashes**, not the real passwords. The start `$y$` means the hash type is **yescrypt**, the default on Ubuntu 22.04 and newer (the handout shows `$6$`, an older type called SHA-512). Every hash uses a random salt, so the same password gives a different hash each time. The other fields are: day of the last change (counted from 1970), minimum age 0, maximum age 99999 and warning time 7 days.",
 67: "Look at the permissions: everyone can read `/etc/passwd` (`-rw-r--r--`), but `/etc/shadow` is `-rw-r-----` and belongs to root and the group shadow. Normal users cannot read the hashes, so they cannot try to crack them offline.",
 72: "**Finding:** Ubuntu 21.04 and newer create home folders with mode `0750` (`drwxr-x---`), so other users cannot enter them. This is safer than the `drwxr-xr-x` shown in the handout. To repeat the lab situation, I first set both home folders to 755.",
 76: "As sam, `ls -l /home` shows a 10-character permission string. Character 1: `d` means directory. Characters 2 to 4: owner (`rwx`). Characters 5 to 7: group (`r-x`). Characters 8 to 10: others (`r-x`).",
 80: "Others have `r-x` on danny's home folder, so sam can **enter** it (x) and **list** it (r). `touch new.txt` fails with \"Permission denied\" because creating a file changes the folder, and that needs **write (w)** on the folder. Others do not have it.",
 84: "**Symbolic mode:** `chmod o-x danny` removes (-) the execute right (x) from others (o). The string changes from `drwxr-xr-x` to `drwxr-xr--`. Other examples: `u+rwx`, `g-w`, `o=r`, `a+x`.",
 88: "Now sam gets \"Permission denied\" on `cd danny`. For a folder, **x means the right to enter it**. Without x you cannot go into the folder or reach anything inside it, even if r is still set.",
 95: "Logged in as danny, the listing shows that others have `r--` on `/home/danny` (from the last step).",
 99: "**Absolute (octal) mode:** each digit is the sum of r=4, w=2 and x=1. `705` means owner 7 (rwx), group 0 (---) and others 5 (r-x), so the result is `drwx---r-x`. `stat -c %a` confirms 705. Danny owns the folder, so he can change it without root. This is the \"discretionary\" part of DAC (the owner decides). **Interesting point:** the group digit is 0, so group members are blocked while others are allowed. Linux checks the owner first, then the group, then others, and uses only the first one that matches.",
 103: "`test.txt` is created as `-rw-rw-r--` (664). New files start at 666 and the umask (002) removes write for others. New files never get execute by default.",
 107: "sam is one of the \"others\". He can enter (x) and list (r) danny's folder, and he can read `test.txt` because the file has `r--` for others.",
 111: "sam still cannot create `Sam.txt` because others have no `w` on the folder. Access is read-only, which is what the 705 setting is meant to do.",
 116: "**SUID test setup.** A small C program prints the **real UID** (`getuid()`, the user who started it) and the **effective UID** (`geteuid()`, the identity Linux uses for permission checks). It also tries to read `danny_secret.txt`, which only danny can read (mode 600). The program file belongs to danny.",
 120: "**Before SUID**, the program runs as sam: the real UID and the effective UID are both 1001. It cannot read the secret file.",
 124: "`chmod u+s` sets the SUID bit. The owner's x changes to `s` (`-rwsr-xr-x`) and the octal mode becomes **4755** (4 = SUID, 2 = SGID, 1 = sticky).",
 128: "**After SUID**, the real UID is still sam, but the effective UID is **danny**, so the program can read danny's secret. If sam runs `cat` directly, he is still denied. So the extra power exists only **inside** the SUID program.",
 132: "Real systems use SUID for programs such as `passwd`, which must write to `/etc/shadow` for a normal user. SUID programs owned by root are a favourite target for attackers, so auditors list them with `find / -perm -4000` and compare the list with a known good one.",
 136: "**SGID before:** `/srv/devshare` belongs to the group DEVELOPERS (mode 770). A file that sam creates gets sam's **own** group (`sam`), so danny cannot share it through the group.",
 140: "`chmod g+s` sets SGID on the folder (`drwxrws---`). New files from sam and danny now **get the DEVELOPERS group**, and new sub-folders also get SGID (`drwxrwsr-x`). The old file keeps the group `sam`, because SGID only affects new files. This is the usual way to make a shared team folder.",
 144: "**Sticky bit before:** `/tmp/teststicky` is open to everyone (777). danny deletes sam's file without any problem, because deleting a file needs write permission on the **folder**, not on the file.",
 148: "`chmod +t` sets the sticky bit (`drwxrwxrwt`, mode 1777). Now danny gets \"Operation not permitted\" when he deletes sam's file. Only the file owner (sam) or root can delete it. The system folder `/tmp` uses the same bit for the same reason.",
 153: "**What worked well.** DAC is simple and fast, and each owner manages their own data. Danny secured his folder with `chmod 705` without needing root. Groups together with SGID make it easy to share project files without opening them to everyone.",
 154: "**Weaknesses I saw.**",
 155: "**The owner decides.** A careless owner can open files to everyone (`chmod 777`) and the system does not stop them. Mandatory Access Control (SELinux or AppArmor) adds system-wide rules that the owner cannot change.",
 156: "**Only three classes.** You cannot say \"sam may read but Eve may not\" when both are in \"others\". POSIX ACLs (`setfacl -m u:sam:rx`) solve this.",
 157: "**SUID is powerful and risky.** My test showed sam reading danny's secret through the program. If a SUID program owned by **root** has a bug (for example a buffer overflow), an attacker can get a full root shell. A real example is CVE-2021-4034 (PwnKit) in `pkexec`. Rules to follow: avoid your own SUID programs, mount user-writable disks with `nosuid`, and check regularly with `find / -perm -4000`.",
 158: "**Weak lab passwords.** `samPass` and `dannyPass` would fail a real password policy. In production I would use `pam_pwquality` (length and complexity), password ageing with `chage`, and account lockout with `pam_faillock`.",
 159: "**My own reflection.** The most useful lesson was that permissions on a **folder** mean something different from permissions on a **file**. Whether you can delete someone else's file depends on the folder's w bit, and that is exactly why the sticky bit exists. I also saw that new Ubuntu versions are \"secure by default\" (home mode 0750 and yescrypt hashes), which is stronger than the older setup in the handout.",
 162: "Keycloak is a free, open-source tool for Identity and Access Management. It gives Single Sign-On (one login for many apps) and can connect to other login systems. It uses the standards **OAuth 2.0**, **OpenID Connect (OIDC)** and **SAML 2.0**. Applications send users to Keycloak to log in and get back signed **JSON Web Tokens (JWT)**, so the applications never handle the passwords.",
 163: "**Key words:** a **realm** is a separate space with its own users, roles and clients. A **user** is an identity that can log in. A **role** is a named permission given to users or service accounts. A **client** is an application that asks Keycloak to log in a user (or to log in itself).",
 167: "**What I ran:** the lab uses the image `quay.io/keycloak/keycloak:latest`, but my machine could not reach quay.io. So I downloaded the official Keycloak 26.8.2 release from Maven Central (its checksum matched) and built a small local Docker image from it (`keycloak-local:26.8.2`, on top of Eclipse Temurin Java 21). I used the same command as the lab with `start-dev`, plus `-d` (run in the background) and `--name keycloak`. `-p 8080:8080` opens port 8080 on the computer. `KC_BOOTSTRAP_ADMIN_USERNAME` and `KC_BOOTSTRAP_ADMIN_PASSWORD` create the first temporary admin. `start-dev` is development mode (plain HTTP and a built-in test database) and must **never** be used in production. `docker ps` shows that the container is running.",
 173: "The admin console belongs to the **master** realm. Keycloak shows the user name in lower case (`anas`) because it always saves user names in lower case. The yellow banner says I am a temporary admin, which is normal for the first admin account.",
 181: "OTP adds a second step to the login: **something you have** (the phone) as well as **something you know** (the password). Keycloak uses **TOTP (RFC 6238)**: the QR code shares a secret key, and both sides use that key and the current 30-second time window to work out the same 6-digit code. If someone steals the admin password, they still cannot log in. In my test I did not use a phone: I took the secret key that Keycloak shows under \"Unable to scan?\" and a small script worked out the 6-digit code with the same TOTP method as an authenticator app. Keycloak accepted it. Later, Keycloak **refused** the same code when I used it a second time inside the same 30 seconds, which stops codes from being reused.",
 191: "Keeping applications out of the **master** realm follows the rule of least privilege. If an application user is hacked, they cannot reach the realm that controls Keycloak. Each realm has its own users, keys and settings. My realm is `MyApp080` (080 are the last three digits of my student ID).",
 197: "The handout's screenshot note says \"first name\", but the instructions say \"family name\". I followed the instructions. My family name is \"Anas Syed\", but Keycloak does not allow a space in a user name: it showed the error `'username' contains invalid character`. So I used `anas.syed` (a dot instead of the space). I set the password to my student ID and turned **Temporary** off, so Keycloak does not force a password change. At the first login, Keycloak asked me to complete my profile (email, first name and last name) and then opened the account page. This shows that the user can log in to the new realm.",
 205: "A **public** client (a browser or phone app) cannot keep a secret safely, so it has no client secret. Its safety comes from checking the **redirect URI** exactly, and from PKCE. **Web origins** controls CORS, so only the page at keycloak.org can call the token address from a browser. Keycloak turns **Direct access grants** off by default, so I switched it on as the lab says.",
 211: "This uses the **Authorization Code flow**: the browser goes to Keycloak, the user logs in there, and Keycloak sends back a short-lived code. The app swaps the code at `/token` for an `access_token`, an `id_token` and a `refresh_token`. **Note:** the real page https://www.keycloak.org/app/ could not be reached from my machine. So the browser loaded a small local copy of the demo page at the same address, and the login and token request were done against my own Keycloak. The Keycloak login page, the redirect and the token response are real. The Network view in Figure 37 is drawn from the captured token request, because the DevTools window itself cannot be screenshotted in an automated browser.",
 219: "A **confidential** client is a server-side application that can keep a secret. Turning on **Service accounts roles** lets the client get tokens for **itself** (machine to machine) with the Client Credentials grant. Keycloak makes the client secret automatically and shows it on the Credentials tab.",
 227: "**Correction to the handout:** the given command has a space after `client_secret=`, which makes the login fail with `invalid_client`, so I left the space out. Also, the Client Credentials grant gives a token for the client's **service account** (`preferred_username: service-account-my-confidential-client080`), not for the user from Step 5.",
 228: "**Reading the JWT:** a JWT has three parts joined by dots: `header.payload.signature` (each part is Base64URL text). The **header** shows `alg: RS256` and `kid` (which signing key was used). The **payload** holds the claims: `iss` (the realm address), `exp` and `iat` (expiry time and issue time, 5 minutes apart by default), `azp` and `client_id` (which client asked), `realm_access.roles` and `scope`. The **signature** is checked with the realm's public key from `/realms/MyApp080/protocol/openid-connect/certs`. Anyone can **read** a JWT, so secrets must never be put inside it; the signature protects it from changes. I decoded the token with a script because jwt.io could not be reached from my machine. The content is the same.",
 236: "This is **identity brokering**. Keycloak hands the login over to Google using OIDC. On the first login, Keycloak creates a user that is linked to the Google account. Users do not need another password, and the application still gets Keycloak tokens. Google allows `http://localhost` redirect addresses for testing, but a real website must use HTTPS.",
 246: "**One central login** means applications do not store passwords, and it gives SSO, multi-factor login and one place to cut off a user. The downside is that Keycloak becomes a valuable target and a single point of failure, so it needs backup servers, updates and strong admin MFA.",
 247: "**Dev mode is not safe by design.** It uses plain HTTP and a test database, and the admin password was typed in the command line, where `docker inspect` and the shell history can show it. Production needs HTTPS, a real database, secret storage and the `start` command.",
 248: "**Bearer tokens** work for anyone who holds them. Short lifetimes (`exp`), HTTPS only, and checking the audience (`aud`) lower the risk if a token is stolen. In my test the token was valid for only 300 seconds.",
 249: "**My own reflection:** the clearest lesson was the difference between public and confidential clients: who can keep a secret decides which login flow is safe. I also learned that small details matter. Keycloak rejected a space in the user name, switched off Direct access grants by default, and refused a one-time code that was used twice.",
 251: "Part A showed access control at the operating-system level: users, groups, hashed passwords, symbolic and octal permissions, and the special bits SUID, SGID and sticky. Part B moved access control to the application level with Keycloak: realms, users, an admin protected by OTP, public and confidential clients, and signed JWT tokens. Together they show \"defence in depth\": least privilege in the operating system and strong central login in the application.",
}
TXT.update({
 181: "OTP adds a second step to the login: **something you have** (the phone) as well as **something you know** (the password). Keycloak uses **TOTP (RFC 6238)**: the QR code shares a secret key, and both sides use that key and the current 30-second time window to work out the same 6-digit code. If someone steals the admin password, they still cannot log in. On my lab machine I used the key shown under \"Unable to scan?\" and a small script to work out the 6-digit code (the same TOTP method as an authenticator app). Keycloak **refused** the same code when I used it a second time inside the same 30 seconds, which stops codes from being reused.",
 197: "The handout's screenshot note says \"first name\", but the instructions say \"family name\". I followed the instructions: my family name is Syed, so the user name is `syed`. I set the password to my student ID and turned **Temporary** off, so Keycloak does not force a password change. At the first login, Keycloak asked me to complete my profile (email, first name and last name) and then opened the account page. This shows that the user can log in to the new realm.",
 211: "This uses the **Authorization Code flow**: the browser goes to Keycloak, the user logs in there, and Keycloak sends back a short-lived code. The app swaps the code at `/token` for an `access_token`, an `id_token` and a `refresh_token`. **Note:** my lab machine could not reach https://www.keycloak.org/app/, so the browser opened a small local copy of the demo page at the same address. The Keycloak login page, the redirect and the token request and response are real. Figure 37 shows the captured token request.",
 228: "**Reading the JWT:** a JWT has three parts joined by dots: `header.payload.signature` (each part is Base64URL text). The **header** shows `alg: RS256` and `kid` (which signing key was used). The **payload** holds the claims: `iss` (the realm address), `exp` and `iat` (expiry time and issue time, 5 minutes apart by default), `azp` and `client_id` (which client asked), `realm_access.roles` and `scope`. The **signature** is checked with the realm's public key from `/realms/MyApp080/protocol/openid-connect/certs`. Anyone can **read** a JWT, so secrets must never be put inside it; the signature protects it from changes. The token in Figure 41 was decoded locally because jwt.io could not be reached.",
 249: "**My own reflection:** the clearest lesson was the difference between public and confidential clients: who can keep a secret decides which login flow is safe. I also learned that small details matter. Keycloak switches off Direct access grants by default, and it refused a one-time code that was used twice.",
})
for i, t in TXT.items():
    set_runs(P(i), t)

# references: remove stray markdown asterisks
for i in range(255, 263):
    p = P(i)
    full = ''.join(r.text for r in p.runs)
    if '*' in full:
        for r in p.runs:
            r.text = r.text.replace('*', '')

# ---------------------------------------------------------------- 2. command / instruction boxes
set_box_lines(T(165), ['sudo su', 'docker run -d --name keycloak -p 8080:8080 \\', '  -e KC_BOOTSTRAP_ADMIN_USERNAME=Anas \\', '  -e KC_BOOTSTRAP_ADMIN_PASSWORD=1091080 \\', '  keycloak-local:26.8.2 start-dev', 'docker ps'])
set_box_lines(T(171), ['Browser → http://localhost:8080/  →  username: Anas   password: 1091080'])
set_box_lines(T(179), ['Users → Anas → Details → Required user actions: Configure OTP → Save', "Sign out → sign in again → set up the authenticator (QR code, or the key under 'Unable to scan?') → enter the 6-digit code"])
set_box_lines(T(189), ['Manage realms → Create realm → Realm name: MyApp080 → Create'])
set_box_lines(T(195), ['MyApp080 → Users → Add user → Username: syed → Create', 'Credentials → Set password: 1091080, Temporary: OFF → Save', 'Test: http://localhost:8080/realms/MyApp080/account'])
set_box_lines(T(203), ['Clients → Create client → Client type: OpenID Connect → Client ID: my-client080', 'Client authentication: OFF · Standard flow: ON · Direct access grants: ON', 'Valid redirect URIs: https://www.keycloak.org/app/*   Web origins: https://www.keycloak.org → Save'])
set_box_lines(T(209), ['https://www.keycloak.org/app/ → Realm: MyApp080, Client: my-client080 → Sign in', "Log in as syed → read the /token request and response (Network tab, filter 'token')"])
set_box_lines(T(217), ['Clients → Create client → Client ID: my-Confidential-Client080', 'Client authentication: ON · Direct access grants: ON · Service accounts roles: ON → Save → Credentials tab → copy Client secret'])
set_box_lines(T(225), ["curl -L -X POST 'http://localhost:8080/realms/MyApp080/protocol/openid-connect/token' \\", "  -H 'Content-Type: application/x-www-form-urlencoded' \\", "  --data-urlencode 'client_id=my-Confidential-Client080' \\", "  --data-urlencode 'client_secret=******** (hidden)' \\", "  --data-urlencode 'grant_type=client_credentials'"])
set_box_lines(T(234), ['Google Cloud Console → APIs & Services → OAuth consent screen (External, add test user)', 'Credentials → Create OAuth client ID → Web application', '  Authorized redirect URI: http://localhost:8080/realms/MyApp080/broker/google/endpoint', 'Keycloak → MyApp080 → Identity providers → Google → paste Client ID + Client secret → Add', "Test: http://localhost:8080/realms/MyApp080/account → 'Sign in with Google'"])

# ---------------------------------------------------------------- 3. tables with wording to simplify
t150 = T(150)
set_cell(t150.rows[1].cells[3], "Runs with the file owner's user ID")
set_cell(t150.rows[2].cells[4], "New files get the folder's group")
set_cell(t150.rows[3].cells[4], 'Only the owner or root can delete or rename files')

# ---------------------------------------------------------------- 4. captions
CAP = {183: "Figure 29: User details page with the 'Configure OTP' required action (saved)",
       187: "Figure 31: Successful login after entering the OTP (the Configure OTP action is now cleared)",
       207: "Figure 35: Public client my-client080: capability settings (top) and login settings (bottom)",
       213: "Figure 36: Test page signed in as the new user (local copy of the Keycloak demo page)",
       215: "Figure 37: Network view of the /token request and response (drawn from the captured browser traffic)",
       221: "Figure 38: Confidential client my-Confidential-Client080: capability settings (top) and the created client (bottom)",
       232: "Figure 41: Decoded JWT (header and payload), decoded locally"}
for i, t in CAP.items():
    p = P(i); p.runs[0].text = t
    for r in p.runs[1:]:
        r._r.getparent().remove(r._r)

# ---------------------------------------------------------------- 5. Part A screenshots (replace image bytes in place)
A_PARAS = [41, 46, 51, 56, 60, 64, 70, 74, 78, 82, 86, 93, 97, 101, 105, 109, 114, 118, 122, 126, 130, 134, 138, 142, 146]
A_IDS = ['1.1', '1.2', '2.1', '2.2', '2.3', '2.4', '3.0', '3.1', '3.2', '3.3', '3.4', '4.1', '4.2', '4.3', '4.4', '4.5', '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9']
from PIL import Image
NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main', 'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing', 'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
for idx, sid in zip(A_PARAS, A_IDS):
    el = body[idx]
    blip = el.find('.//a:blip', NS)
    assert blip is not None, idx
    rid = blip.get('{%s}embed' % NS['r'])
    part = d.part.related_parts[rid]
    path = W + f'shotsA/step_{sid}.png'
    part._blob = open(path, 'rb').read()
    w, h = Image.open(path).size
    ext = el.find('.//wp:extent', NS); cx = int(ext.get('cx')); cy = int(cx * h / w)
    ext.set('cy', str(cy))
    for e in el.iter('{%s}ext' % NS['a']):
        if e.get('cx'):
            e.set('cx', str(cx)); e.set('cy', str(cy))

# ---------------------------------------------------------------- 6. Part B screenshots replace the yellow boxes
B = {168: ('fig26_docker_ps.png', 16), 174: ('fig27_admin_login_page.png', 15), 176: ('fig28_admin_console_after_login.png', 15),
     182: ('fig29_user_details_configure_otp.png', 15), 184: ('fig30_otp_setup_qr_page.png', 10.5), 186: ('fig31_login_after_otp.png', 15),
     192: ('fig32_realm_created.png', 15), 198: ('fig33_user_created_credentials.png', 15), 200: ('fig34_account_page_logged_in.png', 15),
     206: ('fig35_public_client_combined.png', 13), 212: ('fig36_demo_app_signed_in.png', 15), 214: ('fig37_devtools_token_response.png', 16),
     220: ('fig38_confidential_client_combined.png', 13), 222: ('fig39_credentials_client_secret.png', 15), 229: ('fig40_curl_token.png', 16),
     231: ('fig41_decoded_jwt.png', 16)}
for idx, (name, wcm) in B.items():
    tbl = body[idx]
    picture_paragraph_before(tbl, W + 'shotsB/' + name, wcm)
    tbl.getparent().remove(tbl)

# Step 10 evidence boxes + captions: removed for now (screenshots will be added later)
for idx in (237, 238, 239, 240, 241, 242, 243, 244):
    body[idx].getparent().remove(body[idx])

# ---------------------------------------------------------------- 7. cover page, TOC, video section
cover = T(10)
cover._tbl.remove(cover.rows[7]._tr)      # Video link row
cover._tbl.remove(cover.rows[4]._tr)      # Instructor row
for idx in (28, 252, 253):                # TOC entry + section 5
    body[idx].getparent().remove(body[idx])

# ---------------------------------------------------------------- 8. replace every remaining placeholder
REPL = [('[Your Full Name]', 'Anas Syed'), ('STUDENT-ID', '1091080'), ('[First_Name]', 'Anas'), ('[family_name]', 'syed'),
        ('my-Confidential-ClientXYZ', 'my-Confidential-Client080'), ('my-clientXYZ', 'my-client080'), ('MyAppXYZ', 'MyApp080')]
def fix_para(p):
    for r in p.runs:
        for a, b in REPL:
            if a in r.text:
                r.text = r.text.replace(a, b)
    full = ''.join(r.text for r in p.runs)
    if any(a in full for a, _ in REPL) and p.runs:       # placeholder split across runs
        for a, b in REPL:
            full = full.replace(a, b)
        p.runs[0].text = full
        for r in p.runs[1:]:
            r._r.getparent().remove(r._r)
def walk(container):
    for p in container.paragraphs:
        fix_para(p)
    for t in container.tables:
        for row in t.rows:
            for c in row.cells:
                walk(c)
walk(d)
for s in d.sections:
    walk(s.header); walk(s.footer)

d.save(W + 'ITE408_Lab3_Report.docx')
print('saved')
