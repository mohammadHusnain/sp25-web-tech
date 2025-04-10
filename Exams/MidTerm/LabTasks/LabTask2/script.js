
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('checkoutForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryDateInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');
    const fillCardDataBtn = document.getElementById('fillCardData');

    // Fill card data with test data
    fillCardDataBtn.addEventListener('click', function () {
        cardNumberInput.value = "4111111111111111";

        // Set expiry date to next year
        const today = new Date();
        const nextYear = today.getFullYear() + 1;
        const month = String(today.getMonth() + 1).padStart(2, '0');
        expiryDateInput.value = `${nextYear}-${month}`;

        cvvInput.value = "123";

        // Remove any validation errors from card fields
        cardNumberInput.classList.remove('is-invalid');
        expiryDateInput.classList.remove('is-invalid');
        cvvInput.classList.remove('is-invalid');
    });

    // Format card number as user types
    cardNumberInput.addEventListener('input', function (e) {
        // Remove any non-digit characters
        let value = this.value.replace(/\D/g, '');

        // Limit to 16 digits
        if (value.length > 16) {
            value = value.slice(0, 16);
        }

        this.value = value;
    });

    // Format CVV as user types
    cvvInput.addEventListener('input', function (e) {
        // Remove any non-digit characters
        let value = this.value.replace(/\D/g, '');

        // Limit to 3 digits
        if (value.length > 3) {
            value = value.slice(0, 3);
        }

        this.value = value;
    });

    // Format phone number as user types
    phoneInput.addEventListener('input', function (e) {
        // Remove any non-digit characters
        let value = this.value.replace(/\D/g, '');

        // Limit to 11 digits
        if (value.length > 11) {
            value = value.slice(0, 11);
        }

        this.value = value;
    });

    // Set minimum date for expiry date (current month)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    expiryDateInput.min = `${year}-${month}`;

    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form submission
        let isValid = true;

        // Reset validation states
        resetValidation();

        // Validate Full Name (only alphabets)
        if (!fullNameInput.checkValidity()) {
            showError(fullNameInput);
            isValid = false;
        }

        // Validate Email
        if (!validateEmail(emailInput.value)) {
            showError(emailInput);
            isValid = false;
        }

        // Validate Phone (10-11 digits)
        if (!phoneInput.checkValidity() || !(/^[0-9]{10, 11}$/.test(phoneInput.value))) {
            showError(phoneInput);
            isValid = false;
        }

        // Validate Address (not empty)
        if (addressInput.value.trim() === '') {
            showError(addressInput);
            isValid = false;
        }

        // Validate Credit Card Number (16 digits)
        if (!cardNumberInput.checkValidity() || !/^[0-9]{16}$/.test(cardNumberInput.value)) {
            showError(cardNumberInput);
            isValid = false;
        }

        // Validate Expiry Date (future date)
        const currentDate = new Date();
        const expiryDate = new Date(expiryDateInput.value);
        expiryDate.setDate(1); // Set to first day of month

        // Set current date to first day of month for comparison
        const currentDateForComparison = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        if (!expiryDateInput.value || expiryDate < currentDateForComparison) {
            showError(expiryDateInput);
            isValid = false;
        }

        // Validate CVV (3 digits)
        if (!cvvInput.checkValidity() || !/^[0-9]{3}$/.test(cvvInput.value)) {
            showError(cvvInput);
            isValid = false;
        }

        // If all fields are valid, submit the form
        if (isValid) {
            // Generate a random order reference
            const orderRef = 'ACW-' + Math.floor(100000 + Math.random() * 900000);
            document.getElementById('orderReference').textContent = orderRef;

            // Show the order complete modal
            const orderCompleteModal = new bootstrap.Modal(document.getElementById('orderCompleteModal'));
            orderCompleteModal.show();

            // Reset the form
            form.reset();
        }
    });

    // Function to validate email
    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Function to show error message
    function showError(input) {
        input.classList.add('is-invalid');
    }

    // Function to reset validation states
    function resetValidation() {
        const formInputs = form.querySelectorAll('.form-control');
        formInputs.forEach((input) => {
            input.classList.remove('is-invalid');
        });
    }

    // Add input event listeners to provide real-time validation feedback
    const allInputs = form.querySelectorAll('.form-control');
    allInputs.forEach(input => {
        input.addEventListener('input', function () {
            if (this.checkValidity()) {
                this.classList.remove('is-invalid');
            }
        });
    });
});
