"""
Part B - Web UI Automation with Python Selenium (SauceDemo)
Run (Windows):  py -m pytest -v -s test_saucedemo.py
"""
import os

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

BASE_URL = "https://www.saucedemo.com/"
USERNAME = "standard_user"
PASSWORD = "secret_sauce"
WRONG_PASSWORD = "wrong_password"
PRODUCT_NAME = "Sauce Labs Backpack"
# Screenshots are saved next to this file, whatever folder pytest is run from
SCREENSHOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshots")


@pytest.fixture
def driver(request):
    options = webdriver.ChromeOptions()
    # Stop Chrome's password-manager / breach pop-ups from covering the page
    options.add_experimental_option("prefs", {
        "credentials_enable_service": False,
        "profile.password_manager_enabled": False,
        "profile.password_manager_leak_detection": False,
    })
    drv = webdriver.Chrome(options=options)
    drv.maximize_window()
    yield drv
    # B5: evidence screenshot, then reliable browser close (runs even if the test fails)
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    drv.save_screenshot(os.path.join(SCREENSHOT_DIR, f"{request.node.name}.png"))
    drv.quit()


def open_login_page(driver):
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, 10)
    # Verify title and login form are present
    assert driver.title == "Swag Labs", f"Unexpected page title: {driver.title}"
    wait.until(EC.visibility_of_element_located((By.ID, "user-name")))
    assert driver.find_element(By.ID, "password").is_displayed()
    assert driver.find_element(By.ID, "login-button").is_displayed()
    return wait


def login(driver, username, password):
    driver.find_element(By.ID, "user-name").send_keys(username)
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.ID, "login-button").click()


def login_successfully(driver):
    wait = open_login_page(driver)
    login(driver, USERNAME, PASSWORD)
    # Explicit wait for the page transition to the inventory page
    wait.until(EC.url_contains("inventory.html"))
    title = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "title")))
    return wait, title


# ---------------- B1: Launch and valid login ----------------
def test_b1_valid_login(driver):
    wait, title = login_successfully(driver)
    assert "inventory.html" in driver.current_url
    assert title.text == "Products"
    assert driver.find_element(By.CLASS_NAME, "inventory_list").is_displayed()
    print("B1 PASSED: valid login reached the inventory page")


# ---------------- B2: Negative login ----------------
def test_b2_invalid_password_shows_error(driver):
    wait = open_login_page(driver)
    login(driver, USERNAME, WRONG_PASSWORD)
    error = wait.until(EC.visibility_of_element_located(
        (By.CSS_SELECTOR, "h3[data-test='error']")))
    assert error.is_displayed()
    assert "Username and password do not match" in error.text
    assert "inventory.html" not in driver.current_url
    print(f"B2 PASSED: error shown -> {error.text}")


# ---------------- B3: Sort by price low to high ----------------
def test_b3_sort_price_low_to_high(driver):
    wait, _ = login_successfully(driver)
    Select(driver.find_element(By.CLASS_NAME, "product_sort_container")) \
        .select_by_visible_text("Price (low to high)")
    wait.until(EC.text_to_be_present_in_element(
        (By.CLASS_NAME, "active_option"), "Price (low to high)"))

    price_elements = driver.find_elements(By.CLASS_NAME, "inventory_item_price")
    prices = [float(p.text.replace("$", "")) for p in price_elements]
    assert len(prices) > 0, "No prices were found on the page"
    assert prices == sorted(prices), f"Prices not ascending: {prices}"
    print(f"B3 PASSED: prices ascending -> {prices}")


# ---------------- B4: Cart validation ----------------
def test_b4_cart_contains_added_product(driver):
    wait, _ = login_successfully(driver)
    driver.find_element(By.ID, "add-to-cart-sauce-labs-backpack").click()
    badge = wait.until(EC.visibility_of_element_located(
        (By.CLASS_NAME, "shopping_cart_badge")))
    assert badge.text == "1"

    driver.find_element(By.CLASS_NAME, "shopping_cart_link").click()
    wait.until(EC.url_contains("cart.html"))
    names = [e.text for e in wait.until(EC.visibility_of_all_elements_located(
        (By.CLASS_NAME, "inventory_item_name")))]
    assert PRODUCT_NAME in names, f"{PRODUCT_NAME} not in cart: {names}"
    print(f"B4 PASSED: cart contains -> {names}")
