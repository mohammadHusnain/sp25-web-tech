$(function () {
    $("#predictButton").click(() => {
        const name = $("#nameInput").val().trim();
        if (!name) return $("#resultContainer").html("<p class='error'>Please enter a name</p>");

        $.ajax({
            url: `https://api.agify.io?name=${name}`,
            success: (data) => {
                $("#resultContainer").html(`
                    <div class="result">
                        <p><strong>Name:</strong> ${data.name}</p>
                        <p><strong>Age:</strong> ${data.age || "Unknown"}</p>
                        <p><strong>Count:</strong> ${data.count}</p>
                    </div>
                `);
            },
            error: () => {
                $("#resultContainer").html("<p class='error'>Failed to fetch data</p>");
            }
        });
    });
});