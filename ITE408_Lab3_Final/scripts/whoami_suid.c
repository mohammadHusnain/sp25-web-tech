#include <stdio.h>
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
