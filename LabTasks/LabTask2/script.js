$(function () {
    $("#predictButton").click(() => {
        const input = $("#nameInput").val().trim();
        if (!input) return $("#resultContainer").html("<p class='error'>Please enter names</p>");

        // Split names by space and filter out empty strings
        const names = input.split(" ").filter(name => name.length > 0);

        // Clear previous results
        $("#resultContainer").empty();

        // Fetch age for each name
        names.forEach(name => {
            $.ajax({
                url: `https://api.agify.io?name=${name}`,
                success: (data) => {
                    $("#resultContainer").append(`
                        <div class="result">
                            <p><strong>Name:</strong> ${data.name}</p>
                            <p><strong>Age:</strong> ${data.age || "Unknown"}</p>
                            <p><strong>Count:</strong> ${data.count}</p>
                        </div>
                    `);
                },
                error: () => {
                    $("#resultContainer").append(`<p class='error'>Failed to fetch age for ${name}</p>`);
                }
            });
        });
    });
});