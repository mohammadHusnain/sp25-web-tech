# AST Lab Mid — CSE482 Automated Software Testing

| Part | Folder / file | Marks |
|---|---|---|
| A — Jira + Zephyr Scale | `PartA-Jira-Zephyr.md` (step-by-step, copy-paste guide) | 25 |
| B — Python Selenium | `PartB-Selenium/test_saucedemo.py` | 40 |
| C — Java + JUnit 5 | `PartC-JUnit/` (Maven project) | 35 |

---

## One-time setup on Windows (Antigravity)

1. **Python 3.10+**: https://www.python.org/downloads/ (tick **"Add python.exe to PATH"** during install).
2. **Google Chrome**: already installed in most cases. Selenium 4 downloads the matching
   ChromeDriver automatically, so you don't need to download a driver.
3. **JDK 17 or newer**: https://adoptium.net/ (Temurin). During install, enable *Set JAVA_HOME*.
4. In **Antigravity → Extensions**, install:
   - **Python** (ms-python or the Open VSX equivalent)
   - **Extension Pack for Java** (Red Hat Java + Test Runner for Java + Maven for Java)
5. Restart Antigravity after installing.

---

## Part B — run the Selenium tests

Open the `PartB-Selenium` folder in the Antigravity terminal (**Terminal → New Terminal**):

```powershell
cd Exams\AST-LabMid\PartB-Selenium
py -m pip install -r requirements.txt
py -m pytest -v -s test_saucedemo.py
```

Chrome opens 4 times (once per test). Expected output ends with:

```
test_saucedemo.py::test_b1_valid_login PASSED
test_saucedemo.py::test_b2_invalid_password_shows_error PASSED
test_saucedemo.py::test_b3_sort_price_low_to_high PASSED
test_saucedemo.py::test_b4_cart_contains_added_product PASSED
==================== 4 passed in ...s ====================
```

Evidence (B5):
- 📸 **B-pytest-output.png**: screenshot of the terminal showing 4 PASSED.
- `PartB-Selenium/screenshots/` is filled automatically with one browser screenshot per test
  (`test_b1_valid_login.png`, …), taken just before the browser closes.

### What each test checks (for explaining to the examiner)

| Task | Test | Assertions |
|---|---|---|
| B1 | `test_b1_valid_login` | Title is "Swag Labs"; username, password and login fields are visible; after login the URL contains `inventory.html`, the heading is "Products" and the product list is displayed. The browser is maximized in the fixture. |
| B2 | `test_b2_invalid_password_shows_error` | The error element `h3[data-test='error']` is **displayed** and contains "Username and password do not match"; the URL is **not** the inventory page. These are real `assert`s, not prints. |
| B3 | `test_b3_sort_price_low_to_high` | Selects "Price (low to high)", reads every `.inventory_item_price`, converts "$7.99" to 7.99, and asserts `prices == sorted(prices)`. |
| B4 | `test_b4_cart_contains_added_product` | Adds **"Sauce Labs Backpack"**, asserts the cart badge is "1", opens the cart and asserts the same name is in the cart items. |
| B5 | whole file | **Locators:** stable `By.ID`, `data-test` CSS and class names. **Explicit waits:** `WebDriverWait` + `expected_conditions` (`url_contains`, `visibility_of_element_located`, `text_to_be_present_in_element`), with no `time.sleep`. **Reliable close:** the pytest fixture runs `driver.quit()` after `yield`, so it runs even if the test fails. **Evidence:** screenshots plus the pytest output. |

If Chrome shows a "Change your password" pop-up, the script already disables Chrome's password
manager. If you still see one, tell me and I'll adjust the script.

---

## Part C — run the JUnit 5 tests

**Option 1 (Antigravity UI):** open the folder `Exams/AST-LabMid/PartC-JUnit` using **File → Open
Folder**, and wait until the Java extension finishes "Importing Maven project" (bottom bar). Then
open the **Testing** panel (beaker icon) and click **Run All**. You can also open
`DiscountCalculatorTest.java` and click the ▶ next to the class.

**Option 2 (terminal, if Maven is installed):**

```powershell
cd Exams\AST-LabMid\PartC-JUnit
mvn test
```

Expected: `Tests run: 7, Failures: 0, Errors: 0, Skipped: 0` and `BUILD SUCCESS`.
(Verified: these 7 tests pass with JDK 21 + Maven 3.9.)

Evidence (C5): 📸 **C-junit-output.png**, showing the Testing panel with 7 green ticks or the
`mvn test` output.

### What each assertion checks (C5 explanation)

| Task | Test | What the assertion checks |
|---|---|---|
| C2 | `normalDiscountReturnsReducedPrice` | `calculateFinalPrice(100, 20)` equals **80** (within delta 0.0001, since these are doubles). |
| C2 | `zeroDiscountReturnsOriginalPrice` | `calculateFinalPrice(49.99, 0)` equals **49.99**, so a 0% discount leaves the price unchanged. |
| C3 | `fullDiscountReturnsZero` | Upper boundary: `calculateFinalPrice(100, 100)` equals **0**. |
| C3 | `zeroPriceReturnsZero` | Lower boundary: `calculateFinalPrice(0, 50)` equals **0**. |
| C4 | `negativePriceThrows` | `assertThrows(IllegalArgumentException)` for price **-1**, and that the message names the price rule. |
| C4 | `discountBelowZeroThrows` | `assertThrows(IllegalArgumentException)` for discount **-0.01**, just below the boundary. |
| C4 | `discountAboveHundredThrows` | `assertThrows(IllegalArgumentException)` for discount **100.01**, just above the boundary. |

C1: `DiscountCalculator.calculateFinalPrice(double price, double discountPercent)` first validates
`price >= 0` and `0 <= discountPercent <= 100`, then returns `price - (price * discountPercent / 100)`.
It also rejects `NaN`, which would otherwise slip past the `<` and `>` checks.

---

## Screenshot checklist (label every file exactly like this)

- [ ] A0-setup, A1-TC1, A1-TC2, A1-TC3, A2-list
- [ ] A3-cycle, A3-TC01-exec, A3-TC02-exec, A3-TC03-exec
- [ ] A4-no-defect (or A4-bug if a real failure happened)
- [ ] A5-trace-TC01/02/03, A5-summary
- [ ] B-pytest-output + `PartB-Selenium/screenshots/*.png`
- [ ] C-junit-output

Submit: this whole `AST-LabMid` folder (code), plus all screenshots, plus the A5 summary text.
