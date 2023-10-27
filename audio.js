import { Audio, AudioLoader, AudioListener } from 'three';

const listener = new AudioListener();
const audioLoader = new AudioLoader();

let storedSEVolume = localStorage.getItem('SEVolume');
let storedBackgroundVolume = localStorage.getItem('BackgroundVolume');

//Jump Noise
const jumpSound = new Audio(listener);
audioLoader.load('music/jump.mp3', (buffer) => {
    jumpSound.setBuffer(buffer);
    jumpSound.setLoop(false);
    jumpSound.setVolume(storedSEVolume); // Adjust the volume as needed
});

function playJumpSound() {
    jumpSound.play();
}

//Collision (Extra) Noise
const collisionSound  = new Audio(listener);
audioLoader.load('music/ballcollision.mp3', (buffer) => {
    collisionSound.setBuffer(buffer);
    collisionSound.setLoop(false);
    collisionSound.setVolume(storedSEVolume); // Adjust the volume as needed
});

function playCollisionSound() {
    collisionSound.play();
}

//Target Collision Noise
const targetHit = new Audio(listener);
audioLoader.load('music/targetcollision.mp3', (buffer) => {
    targetHit.setBuffer(buffer);
    targetHit.setLoop(false);
    targetHit.setVolume(storedSEVolume); // Adjust the volume as needed
});

function playTargetHitSound() {
    targetHit.play();
}

//Level Complete Noise
const levelComplete = new Audio(listener);
audioLoader.load('music/levelcomplete.mp3', (buffer) => {
    levelComplete.setBuffer(buffer);
    levelComplete.setLoop(false);
    levelComplete.setVolume(storedSEVolume); // Adjust the volume as needed
});

function playLevelCompleteSound() {
    levelComplete.play();
}

//Background Music
let backgroundMusic; 
function playBackgroundMusic() {
    backgroundMusic = new Audio(listener); // Store it in the module-level variable
    audioLoader.load('music/background.mp3', (buffer) => {
      backgroundMusic.setBuffer(buffer);
      backgroundMusic.setLoop(true);
      backgroundMusic.setVolume(storedBackgroundVolume);
      backgroundMusic.play();
    });
  }
  
function stopBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.stop();
    }
}


//Background Music
let wind;
function playWind() {
    wind = new Audio(listener); // Store it in the module-level variable
    audioLoader.load('music/wind.mp3', (buffer) => {
        wind.setBuffer(buffer);
        wind.setLoop(true);
        wind.setVolume(storedSEVolume);
        wind.play();
    });
}

function stopWind() {
    if (wind) {
        wind.stop();
    }
}


export {playJumpSound, playCollisionSound,playTargetHitSound, playLevelCompleteSound , playBackgroundMusic, stopBackgroundMusic, playWind, stopWind};
