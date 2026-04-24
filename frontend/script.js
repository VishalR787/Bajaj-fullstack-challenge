async function submitData() {

    const input = document.getElementById("input").value;

    const output = document.getElementById("output");

    try {

        const parsed = JSON.parse(input);

        const response = await fetch("https://bajaj-fullstack-challenge-bgoo.onrender.com/bfhl", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                data: parsed
            })

        });

        const data = await response.json();

        output.textContent = JSON.stringify(data, null, 2);

    } catch (err) {

        output.textContent = "Error: " + err.message;
    }
}