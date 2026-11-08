import sys,json,base64
sys.path.insert(0,'/tmp/claude-0/lab3work')
from term_lib import run
secret=open('/tmp/claude-0/lab3work/client_secret.txt').read().strip()
single=("curl -s -L -X POST 'http://localhost:8080/realms/MyApp080/protocol/openid-connect/token' -H 'Content-Type: application/x-www-form-urlencoded' --data-urlencode 'client_id=my-Confidential-Client080' "
        f"--data-urlencode 'client_secret={secret}' --data-urlencode 'grant_type=client_credentials'; echo")
shown=("curl -L -X POST 'http://localhost:8080/realms/MyApp080/protocol/openid-connect/token' \\\\\n  -H 'Content-Type: application/x-www-form-urlencoded' \\\\\n"
       "  --data-urlencode 'client_id=my-Confidential-Client080' \\\\\n"+f"  --data-urlencode 'client_secret={secret}' \\\\\n  --data-urlencode 'grant_type=client_credentials'")
text=run(single,shown)
tok=json.loads([l for l in text.split('\n') if l.startswith('{')][-1])
open('/tmp/claude-0/lab3work/access_token.txt','w').write(tok['access_token'])
dec=lambda p: json.loads(base64.urlsafe_b64decode(p+'='*(-len(p)%4)))
h,p,s=tok['access_token'].split('.')
json.dump({"header":dec(h),"payload":dec(p),"sig":s},open('/tmp/claude-0/lab3work/jwt_parts.json','w'),indent=1)
mask='●'*32
# blurred terminal image + masked text for the video scene
json.dump([{"title":"root@ubuntu: Terminal — [1091080]","text":text,"out":"/tmp/claude-0/lab3work/shotsB/fig40_curl_token.png","blur":secret}],open('/tmp/claude-0/lab3work/jobsB9.json','w'))
json.dump([{"banner":"","text":text.replace(secret,mask),"typeMs":1500,"holdMs":2200}],open('/tmp/claude-0/lab3work/scenesB9.json','w'))
print('ok', dec(p)['preferred_username'])
