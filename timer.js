const timerElement = document.getElementById('timer');

// Function to format the time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secondsPart = seconds % 60;
    return `${padZero(minutes)}:${padZero(secondsPart)}`;
}

// Function to pad single-digit numbers with a leading zero
function padZero(number) {
    return number < 10 ? `0${number}` : number;
}

// Function to update the timer element with the formatted time
function updateTimerDisplay(time) {
    timerElement.innerText = `Time left: ${formatTime(time)}`;
}

export { formatTime,updateTimerDisplay };