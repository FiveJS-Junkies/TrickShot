document.getElementById('back-button').addEventListener('click', function () {
    window.location.href = 'menu.html';
});

document.addEventListener('DOMContentLoaded', function () {
    const SEVolumeSlider = document.getElementById('SEVolume-slider');
    const SEVolumeValue = document.getElementById('SEVolume-value');

    SEVolumeSlider.addEventListener('input', function () {
        const actualSEValue = SEVolumeSlider.value;  
        const displayedSEValue = actualSEValue * 10; 
        SEVolumeValue.textContent = displayedSEValue;

        localStorage.setItem('SEVolume', actualSEValue);
    });

    const storedSEVolume = localStorage.getItem('SEVolume') ;
    SEVolumeSlider.value = storedSEVolume;
    SEVolumeValue.textContent = storedSEVolume * 10;

    const MouseSpeedSlider = document.getElementById('MouseSpeed-slider');
    const MouseSpeedValue = document.getElementById('MouseSpeed-value');

    MouseSpeedSlider.addEventListener('input', function () {
        const actualMouseSpeedValue = 1200 - MouseSpeedSlider.value;  
        const displayedMouseSpeedValue = 110 -actualMouseSpeedValue / 10; 
        MouseSpeedValue.textContent = displayedMouseSpeedValue;

        localStorage.setItem('MouseSpeed', actualMouseSpeedValue);
    });

    const storedMouseSpeed = localStorage.getItem('MouseSpeed') ;
    MouseSpeedSlider.value = 1200-storedMouseSpeed;
    MouseSpeedValue.textContent = 110-storedMouseSpeed / 10;
    
    const BackgroundVolumeSlider = document.getElementById('BackgroundVolume-slider');
    const BackgroundVolumeValue = document.getElementById('BackgroundVolume-value');

    BackgroundVolumeSlider.addEventListener('input', function () {
        const actualBackgroundValue = BackgroundVolumeSlider.value;  
        const displayedBackgroundValue = parseInt(actualBackgroundValue * 100); 
        BackgroundVolumeValue.textContent = displayedBackgroundValue;

        localStorage.setItem('BackgroundVolume', actualBackgroundValue);
    });

    const storedBackgroundVolume = localStorage.getItem('BackgroundVolume') ;
    BackgroundVolumeSlider.value = storedBackgroundVolume;
    BackgroundVolumeValue.textContent = parseInt(storedBackgroundVolume * 100);

    const FOVSlider = document.getElementById('FOV-slider');
    const FOVValue = document.getElementById('FOV-value');

    FOVSlider.addEventListener('input', function () {
        const actualFOVValue = FOVSlider.value;  
        const displayedFOVValue = parseInt(actualFOVValue)-50; 
        FOVValue.textContent = displayedFOVValue;

        localStorage.setItem('FOV', actualFOVValue);
    });

    const storedFOV = localStorage.getItem('FOV') ;
    FOVSlider.value = storedFOV;
    FOVValue.textContent = parseInt(storedFOV );
});

