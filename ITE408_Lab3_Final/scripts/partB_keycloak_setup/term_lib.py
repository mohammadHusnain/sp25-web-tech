# Runs commands for real and records them in the same prompt style as Part A (prompt shows the student ID).
import subprocess, textwrap
SID="1091080"
PRE=textwrap.dedent(r'''
export TZ=Asia/Karachi
P(){ printf '%s %s [%s] %s:%s%s ' "$(date '+%a %b %d')" "$(date '+%I:%M %p')" "__SID__" "$(id -un)" "$(pwd | sed "s|^$HOME|~|")" "$([ $(id -u) = 0 ] && echo '#' || echo '$')"; }
''').replace("__SID__",SID)
def run(cmd, shown=None, cwd="/root"):
    """Run cmd, return text with prompt line + real output. `shown` = text displayed after the prompt."""
    body=PRE+f"cd {cwd}\nP; printf '%s\\n' {shown_q(shown or cmd)}\n{cmd} 2>&1\n"
    r=subprocess.run(["bash","-c",body],capture_output=True,text=True)
    return (r.stdout+r.stderr).rstrip("\n")
def shown_q(s): return "'"+s.replace("'","'\\''")+"'"
