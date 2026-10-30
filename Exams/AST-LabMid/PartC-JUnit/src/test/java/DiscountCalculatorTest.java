import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DiscountCalculatorTest {

    private static final double DELTA = 0.0001;
    private DiscountCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new DiscountCalculator();
    }

    // ---------- C2: Normal-value tests ----------
    @Test
    @DisplayName("C2: price 100 with 20% discount returns 80")
    void normalDiscountReturnsReducedPrice() {
        assertEquals(80.0, calculator.calculateFinalPrice(100, 20), DELTA,
                "20% off 100 should be 80");
    }

    @Test
    @DisplayName("C2: price 49.99 with 0% discount returns 49.99")
    void zeroDiscountReturnsOriginalPrice() {
        assertEquals(49.99, calculator.calculateFinalPrice(49.99, 0), DELTA,
                "0% discount should leave the price unchanged");
    }

    // ---------- C3: Boundary tests ----------
    @Test
    @DisplayName("C3: 100% discount returns 0")
    void fullDiscountReturnsZero() {
        assertEquals(0.0, calculator.calculateFinalPrice(100, 100), DELTA,
                "100% discount (upper boundary) should give 0");
    }

    @Test
    @DisplayName("C3: price 0 with valid discount returns 0")
    void zeroPriceReturnsZero() {
        assertEquals(0.0, calculator.calculateFinalPrice(0, 50), DELTA,
                "Price 0 (lower boundary) should give 0");
    }

    // ---------- C4: Invalid-input tests ----------
    @Test
    @DisplayName("C4: negative price throws IllegalArgumentException")
    void negativePriceThrows() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> calculator.calculateFinalPrice(-1, 10));
        assertEquals("Price must be greater than or equal to 0", ex.getMessage());
    }

    @Test
    @DisplayName("C4: discount below 0 throws IllegalArgumentException")
    void discountBelowZeroThrows() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> calculator.calculateFinalPrice(100, -0.01));
        assertEquals("Discount percent must be between 0 and 100 inclusive", ex.getMessage());
    }

    @Test
    @DisplayName("C4: discount above 100 throws IllegalArgumentException")
    void discountAboveHundredThrows() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> calculator.calculateFinalPrice(100, 100.01));
        assertEquals("Discount percent must be between 0 and 100 inclusive", ex.getMessage());
    }
}
