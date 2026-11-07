# Lab 3 – Video Script (Part A, about 2.5 minutes)

**Before recording:** open Ubuntu terminal, press Win + G (or open OBS), click Record.
Type each command, then read the line under it out loud.

---

**[0:00] Intro**
> "Hello, my name is ______, student ID ______. This is my ITE 408 Lab 3 video on Linux access control."

```
PS1="\d \@ [YOUR-ID] "
sudo su
```
> "First I set my prompt to show my student ID, then I become root, because only root can add users and groups."

**[0:20] Group and users**
```
groupadd DEVELOPERS
adduser sam
usermod -aG DEVELOPERS sam
adduser danny
usermod -aG DEVELOPERS danny
id sam
```
> "I created the DEVELOPERS group and two users, sam and danny. I used usermod dash a G so the group is added, not replaced."

**[0:50] Shadow file**
```
grep -E 'sam|danny' /etc/shadow
```
> "Passwords are stored as salted yescrypt hashes in the shadow file, which only root can read."

**[1:05] Symbolic permissions**
```
chmod 755 /home/danny
su - sam
cd /home/danny
touch new.txt
exit
chmod o-x /home/danny
su - sam -c "cd /home/danny"
```
> "Sam can enter danny's folder but can't create files, because others have no write permission. After chmod o minus x, sam can't even enter, because x on a directory means permission to enter it."

**[1:40] Absolute permissions**
```
chmod 705 /home/danny
ls -ld /home/danny
su - sam -c "ls /home/danny; touch /home/danny/Sam.txt"
```
> "In octal, 7 is read write execute for the owner, 0 is nothing for the group, and 5 is read and execute for others. So sam can list but not write."

**[2:05] Special bits**
```
mkdir /tmp/teststicky && chmod 1777 /tmp/teststicky
ls -ld /tmp/teststicky
```
> "The t at the end is the sticky bit: only the owner or root can delete files here, like in /tmp. SUID runs a program as its owner, and SGID makes new files inherit the folder's group."

**[2:25] End**
> "That completes Part A. Thank you."

Upload to OneDrive → Share → "Anyone with the link can view" → paste the link on the cover page and in Section 5 of the report.
