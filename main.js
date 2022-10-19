import './style.css'
import * as faceDetection from '@tensorflow-models/face-detection';
import * as tf from '@tensorflow/tfjs';

document.querySelector('#app').innerHTML = `
  <div>
    <div id="video-wrapper">
      <div id="overlay">
        <div class="face"></div>
      </div>
      <img src="" />
      <canvas id="canvas" width="500" height="400"></canvas>
      <video id="video" autoplay></video>
    </div>
    <input type="range" min="0" max="20" value="0"/>
    <button>Take another picture</button>
  </div>
`;

const video = document.querySelector("video");
const button = document.querySelector("button");
const image = document.querySelector("img");
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const input = document.querySelector("input");
const detectorConfig = { runtime: 'tfjs' };

const showPredictionBox = true;

let numHits = 0;
let interval;
let model = faceDetection.SupportedModels.MediaPipeFaceDetector;
let detector;

button.addEventListener('click', () => {
  image.classList.remove('is-visible');
  button.classList.remove('is-visible');
  numHits = 0;
  image.src = '';
  accessCamera();
});

const accessCamera = async () => {
  const stream = await navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: { width: 500, height: 400 },
    })
    video.srcObject = stream
};

function isInPostition(pos) {
  const [x, y] = pos;
  return  x >= 175 && x <= 205 || y <= 134 && y >= 165;
}

const detectFaces = async () => {
  ctx.drawImage(video, 0, 0, 500, 400);

  const predictions = await detector.estimateFaces(canvas);

  input.value = numHits;
  if (numHits >= 20) {
    capureImage();
  }

  ctx.stroke();
  if (predictions.length > 0) {
    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];

      if (isInPostition(
        [
          prediction.box.xMin,
          prediction.box.yMin,
        ]
      )) {
        numHits++;
      } else {
        numHits = 0;
      }

      if (showPredictionBox) {
        ctx.beginPath();
        ctx.lineWidth = "4";
        ctx.strokeStyle = "blue";
  
        ctx.rect(
          prediction.box.xMin,
          prediction.box.yMin,
          prediction.box.width,
          prediction.box.height
        );
  
        ctx.stroke();
  
        ctx.fillStyle = "red";
        prediction.keypoints.forEach((landmark) => {
          ctx.fillRect(landmark.x, landmark.y, 5, 5);
        });
      }
    }
  } else {
    numHits = 0;
  }
};

video.addEventListener("loadeddata", async () => {
  detector = await faceDetection.createDetector(model, detectorConfig);
  interval = setInterval(detectFaces, 100);
});

function capureImage() {
  image.classList.add('is-visible');
  button.classList.add('is-visible');

  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 400;
  canvas.getContext('2d').drawImage(video, 0, 0);

  image.src = canvas.toDataURL('image/png');

  clearTimeout(interval)
}

accessCamera();
