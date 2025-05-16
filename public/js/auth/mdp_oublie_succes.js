document.addEventListener("DOMContentLoaded", function () {
    let seconds = 5;
    const countdown = document.getElementById('countdown');

    const interval = setInterval(() => {
        seconds--;
        countdown.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(interval);
            window.location.href = "http://localhost:8080";
        }
    }, 1000);
});
