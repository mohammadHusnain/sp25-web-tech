public class DiscountCalculator {

    /**
     * Returns the final price after applying a percentage discount.
     * Rules: price >= 0, 0 <= discountPercent <= 100; otherwise IllegalArgumentException.
     */
    public double calculateFinalPrice(double price, double discountPercent) {
        if (Double.isNaN(price) || price < 0) {
            throw new IllegalArgumentException("Price must be greater than or equal to 0");
        }
        if (Double.isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
            throw new IllegalArgumentException("Discount percent must be between 0 and 100 inclusive");
        }
        return price - (price * discountPercent / 100);
    }
}
