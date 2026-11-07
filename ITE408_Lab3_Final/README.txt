ITE 408 - Lab 3 package   (Anas Syed, ID 1091080)
================================================
ITE408_Lab3_Report.pdf / .docx   Final report (Part A + Part B, Figures 1-41, no placeholders)
screenshots_PartA/               25 Part A terminal screenshots (prompt shows [1091080])
screenshots_PartB/               Part B screenshots, Figures 26-41 (real Keycloak 26.8.2 run)
PartA_terminal_transcript.txt    Full text output of every Part A command
Video_Script_PartA.md            Script for the 2-3 minute video
ITE408_Lab3_Demo_Video.mp4       94-second silent demo of Part A commands and Part B Steps 1-9 (add your own voiceover for the graded video)
scripts/                         Part A script, SUID C program, and the Part B setup/automation scripts

STILL TO DO BEFORE SUBMITTING
1. Step 10 (Gmail / Google login): needs your own Google Cloud account. Add the 4 screenshots
   after the Step 10 text in the Word file, then save as PDF.
2. Record the 2-3 minute video (voiceover), upload to OneDrive, and add the link to the front page
   (the report currently has no video section; add "Video Link (OneDrive)" row + a short Section 5).
3. Optional: add the instructor name on the front page.

NOTES ON PART B (also explained in the report)
- quay.io was not reachable, so Keycloak 26.8.2 (official release, checksum verified) was built into a local Docker image.
- Keycloak does not allow a space in a user name, so "Anas Syed" became anas.syed.
- Step 7: keycloak.org was not reachable; a local copy of the demo page was used at the same address.
- OTP code was computed from the secret key shown by Keycloak (same TOTP method as an authenticator app).
