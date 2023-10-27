setTimeout(function() {
    window.location.href = "menu.html"; // Redirect to homepage
}, 5000); //5 seconds

document.addEventListener('DOMContentLoaded', function () {
    let storedSEVolume = localStorage.getItem('SEVolume');
    if (storedSEVolume === null) {
        storedSEVolume = 0.5;
        localStorage.setItem('SEVolume', storedSEVolume);
    }

    let storedMouseSpeed = localStorage.getItem('MouseSpeed');
    if (storedMouseSpeed === null) {
        storedMouseSpeed = 600;
        localStorage.setItem('MouseSpeed', storedMouseSpeed);
    }

    let storedBackgroundVolume = localStorage.getItem('BackgroundVolume');
    if (storedBackgroundVolume === null) {
        storedBackgroundVolume = 0.1;
        localStorage.setItem('BackgroundVolume', storedBackgroundVolume);
    }

    let storedFOV = localStorage.getItem('FOV');
    if (storedFOV === null) {
        storedFOV = 75;
        localStorage.setItem('FOV', storedFOV);
    }
    
});

