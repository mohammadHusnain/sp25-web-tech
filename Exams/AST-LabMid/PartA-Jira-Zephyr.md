# Part A — Jira + Zephyr Scale (25 marks)

System under test: **https://www.saucedemo.com/** (Login feature)

> Note for R1: the requirement says "registered email", but SauceDemo logs in with a
> **username**. Record this in the test case so the deviation is visible (examiners like this).
> SauceDemo's "dashboard" = the **Products / inventory page** (`/inventory.html`).

Everything in `code blocks` below is meant to be copy-pasted.

---

## Step 0 — Setup (once)

1. Create a free Jira Cloud account at https://www.atlassian.com/software/jira/free → create a
   **Scrum** or **Kanban** project. Name: `Login Testing`, key: `LT` (any key is fine — if you
   use another, replace `LT` everywhere below).
2. Install Zephyr Scale: in Jira top bar → **Apps → Explore more apps** → search
   **"Zephyr Scale - Test Management for Jira"** → **Try it free**.
3. Open the project → left sidebar → **Zephyr Scale** (sometimes shown as "Tests").
   📸 Screenshot **A0-setup.png**: project with Zephyr Scale open.

### Create the 3 requirements as Jira issues (for traceability, A5)

Create → Issue type **Story** (or Task):

| Summary | Description |
|---|---|
| `R1: Valid login reaches dashboard` | `A user with a registered email and correct password can log in and reach the dashboard.` |
| `R2: Incorrect password is rejected` | `An incorrect password must prevent access and display a clear error message.` |
| `R3: Required login fields reject empty values` | `Required login fields must not accept empty values.` |

They will get keys like `LT-1`, `LT-2`, `LT-3`.

---

## A1 + A2 — Create the 3 test cases (6 + 3 marks)

Zephyr Scale → **Test Cases → + Create Test Case**. Fill the **Details** tab, then the
**Test Script** tab → choose **Step-by-Step** and add each step with its *Test Data* and
*Expected Result*.

Labels are used to classify **positive / negative** (A2). Priority uses Zephyr's built-in
**Priority** field.

### TC1 — Valid login

| Field | Value |
|---|---|
| Name | `TC-LOGIN-01: Valid login with registered user and correct password` |
| Objective | `Verify that a registered user with the correct password can log in and reach the dashboard (R1).` |
| Precondition | `1. https://www.saucedemo.com/ is reachable in Chrome. 2. User "standard_user" is registered. 3. User is logged out.` |
| Priority | **High** |
| Labels | `positive`, `login` |
| Status | Approved |

Test Script (Step-by-Step):

| # | Step | Test Data | Expected Result |
|---|---|---|---|
| 1 | `Open https://www.saucedemo.com/ in Chrome` | `URL: https://www.saucedemo.com/` | `Login page "Swag Labs" is shown with Username, Password and Login button` |
| 2 | `Enter the username` | `standard_user` | `Username is entered in the Username field` |
| 3 | `Enter the password` | `secret_sauce` | `Password is entered (masked)` |
| 4 | `Click the Login button` | `-` | `User is logged in and redirected to /inventory.html; "Products" heading (dashboard) is displayed` |

Note to add in the Objective or a comment: `SauceDemo uses a username instead of an email; standard_user is the registered-account equivalent for R1.`

### TC2 — Invalid password

| Field | Value |
|---|---|
| Name | `TC-LOGIN-02: Login rejected with incorrect password` |
| Objective | `Verify that an incorrect password prevents access and shows a clear error message (R2).` |
| Precondition | `1. https://www.saucedemo.com/ is reachable in Chrome. 2. User "standard_user" is registered. 3. User is logged out.` |
| Priority | **High** |
| Labels | `negative`, `login` |
| Status | Approved |

| # | Step | Test Data | Expected Result |
|---|---|---|---|
| 1 | `Open https://www.saucedemo.com/ in Chrome` | `URL: https://www.saucedemo.com/` | `Login page is displayed` |
| 2 | `Enter a registered username` | `standard_user` | `Username is entered` |
| 3 | `Enter an incorrect password` | `wrong_pass123` | `Password is entered (masked)` |
| 4 | `Click the Login button` | `-` | `Access is denied: user stays on the login page and a clear error message is displayed (e.g. "Username and password do not match any user in this service")` |

### TC3 — Empty required field

| Field | Value |
|---|---|
| Name | `TC-LOGIN-03: Login rejected when required fields are empty` |
| Objective | `Verify that the required Username/Password fields do not accept empty values (R3).` |
| Precondition | `1. https://www.saucedemo.com/ is reachable in Chrome. 2. User is logged out. 3. Username and Password fields are empty.` |
| Priority | **Normal** (Medium) |
| Labels | `negative`, `login`, `validation` |
| Status | Approved |

| # | Step | Test Data | Expected Result |
|---|---|---|---|
| 1 | `Open https://www.saucedemo.com/ in Chrome` | `URL: https://www.saucedemo.com/` | `Login page is displayed with empty fields` |
| 2 | `Leave Username and Password empty and click Login` | `Username: (empty), Password: (empty)` | `Login is blocked; error "Username is required" is displayed` |
| 3 | `Enter the username only, leave Password empty, click Login` | `Username: standard_user, Password: (empty)` | `Login is blocked; error "Password is required" is displayed` |

📸 Screenshots **A1-TC1.png**, **A1-TC2.png**, **A1-TC3.png**: the Details tab (showing priority
and labels) and the Test Script tab of each case. Also **A2-list.png**: the Test Cases list
showing all 3 with priority and labels.

---

## A3 — Test cycle "Login Verification" (5 marks)

1. Zephyr Scale → **Test Cycles → + Create Test Cycle**.
   - Name: `Login Verification` (**exact spelling**)
   - Description: `Execution of login test cases TC-LOGIN-01..03 against https://www.saucedemo.com/ on Chrome.`
2. Open the cycle → **Add test cases** → select all 3 → Add.
3. Click **Test Player** (or the play ▶ icon). For each case, **actually perform the steps in
   Chrome**, then set the status and write the comment.

Expected comments if SauceDemo behaves normally. **Only use them if they match what you
actually saw.** If anything is different, write what really happened.

| Case | Status | Execution comment |
|---|---|---|
| TC-LOGIN-01 | Pass | `Executed on Chrome (Windows). Logged in as standard_user/secret_sauce; redirected to /inventory.html and "Products" page displayed. Matches R1.` |
| TC-LOGIN-02 | Pass | `Executed on Chrome. Password "wrong_pass123" rejected; stayed on login page; error "Epic sadface: Username and password do not match any user in this service" displayed. Matches R2.` |
| TC-LOGIN-03 | Pass | `Executed on Chrome. Empty fields -> "Epic sadface: Username is required"; empty password -> "Epic sadface: Password is required". Login blocked. Matches R3.` |

Tip: in the Test Player you can also attach a screenshot of the browser to each execution.
Take those with **Win + Shift + S**. It is strong evidence.

📸 **A3-cycle.png**: the cycle showing all 3 cases with status. **A3-TC0x-exec.png**: each
execution with its comment.

---

## A4 — Defect reporting (5 marks)

The rule is: **record a failure only if the observed result differs from R2.**

### Case 1 (most likely): TC-LOGIN-02 passed, so do NOT create a bug

Add this in the TC-LOGIN-02 execution comment (or as a comment on the cycle). Also put it in
your submission:

```
A4 – Defect reporting: TC-LOGIN-02 (invalid password) was executed on <date> in Chrome.
Observed result: login was denied and the error "Epic sadface: Username and password do not
match any user in this service" was displayed; the user remained on the login page.
This matches the expected result for R2, so no defect was observed and no bug was raised.
No defect was fabricated.
```

📸 **A4-no-defect.png**: the TC-LOGIN-02 execution showing Pass and this comment.

### Case 2 (only if it really failed, e.g. you got logged in or no error was shown)

1. Set TC-LOGIN-02 status to **Fail**.
2. In the Test Player → **Issues → Create new issue** (this links it automatically) → type **Bug**:

```
Summary: Login with incorrect password does not show error / allows access
Environment: https://www.saucedemo.com/, Chrome <version>, Windows
Steps to reproduce:
1. Open https://www.saucedemo.com/
2. Enter username: standard_user
3. Enter password: wrong_pass123
4. Click Login
Expected result: Access denied; clear error message shown; user stays on the login page (R2).
Actual result: <write exactly what you saw>
Severity: Critical (security / access control)
Priority: High
Linked test: TC-LOGIN-02 in cycle "Login Verification"; Requirement: LT-2 (R2)
```

📸 **A4-bug.png**: the bug issue and its link to the execution.

---

## A5 — Traceability + summary (6 marks)

### Traceability links

Open each test case → **Traceability** tab → **Add → Issues** → pick the requirement:

| Test case | Linked requirement |
|---|---|
| TC-LOGIN-01 | LT-1 (R1) |
| TC-LOGIN-02 | LT-2 (R2) |
| TC-LOGIN-03 | LT-3 (R3) |

📸 **A5-trace-TC0x.png**: the Traceability tab of each case. Optional bonus: open a story
(LT-1) → its Zephyr Scale panel shows the linked test case and its last execution status.

### Results summary (fill with your REAL numbers)

If all 3 passed:

```
Test Cycle: Login Verification   |   Date: <date>   |   Environment: Chrome on Windows, https://www.saucedemo.com/

Total test cases: 3
Executed: 3
Passed: 3
Failed: 0
Blocked: 0
Not executed: 0

Requirement coverage: R1 -> TC-LOGIN-01 (Pass), R2 -> TC-LOGIN-02 (Pass), R3 -> TC-LOGIN-03 (Pass).
Defects: none observed (see A4).

Release-risk statement: Risk for the Login feature is LOW. All 3 test cases covering R1–R3
were executed and passed on <date> in Chrome, with no defects raised. Residual risk remains
because only one browser (Chrome) and one valid account (standard_user) were tested, and R1
was verified with a username instead of an email, which is how SauceDemo works.
```

If something failed, change the counts and write the risk statement around the failure. For
example: `Risk is HIGH: TC-LOGIN-02 failed (bug LT-4), so R2 is not met and access control is
not reliable. Do not release until LT-4 is fixed and retested.`

Paste the summary as the **cycle description/comment** in Zephyr **and** in your submission
document.

📸 **A5-summary.png**: the cycle overview or report (Zephyr Scale → Reports → "Test
Execution Results" / "Traceability" report, if available on your plan).
