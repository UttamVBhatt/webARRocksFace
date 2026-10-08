const _canvases = {
  face: null,
  overlay: null
};
let _ctx = null, _necklaceImage = null;
let _screenWidthDependentVar = false;


document.addEventListener("DOMContentLoaded", () => {
  const necklaceImages = document.querySelectorAll(".earring");

  necklaceImages.forEach(imageObj => {
    imageObj.addEventListener("click", (e) => {
      _necklaceSettings.image = e.target.src.split("2D")[1].slice(1);
      main();
    });
  });

   // Update variable based on screen width
   function updateScreenWidthDependentVar() {
    _screenWidthDependentVar = window.innerWidth < 768; // Example: Change value if width is less than 768px
  }

  // Initial check and event listener for window resize
  updateScreenWidthDependentVar();
  window.addEventListener('resize', updateScreenWidthDependentVar);
});

console.log(_screenWidthDependentVar)

window.addEventListener("resize", () =>{
  _screenWidthDependentVar = window.innerWidth < 768
})

console.log(_screenWidthDependentVar)

const _necklaceSettings = {
  image: "images/necklaces/necklace-1.png", // default image for necklace
  angleHide: 10, // head rotation angle in degrees from which we should hide the necklace
  angleHysteresis: 1, // hysteresis to avoid constant hiding/showing
  scale: 0.7, // width of the necklace compared to the face width (1 -> 100% of the face width)
  pullDown: 0.30, // 0 -> necklace displayed at the top, 1 -> necklace is displayed further down
  k: 0.5, // interpolation coefficient for necklace position
};

const _necklaceVisibility = {
  visible: false
};

function start() {
  WebARRocksFaceCanvas2DHelper.init({
    spec: {
      NNCPath: '../../neuralNets/NN_EARS_4.json', // neural network model file
      canvas: _canvases.face
    },

    callbackReady: function (err, spec) { // called when everything is ready
      if (err) {
        console.log('ERROR in demo.js: ', err);
        return;
      }

      console.log('INFO in demo.js: WebAR.rocks.face is ready :)');
    },

    callbackTrack: function (detectState) {
      clear_canvas();
      if (detectState.isDetected) {
        // console.log(detectState);
        draw_faceCrop(detectState.faceCrop);
        draw_necklace(detectState.landmarks, detectState.faceWidth, detectState.ry);
      } else {
        _necklaceVisibility.visible = false;
      }
    }
  });
}

function mix_landmarks(posA, posB, k) {
  return [
    posA[0] * (1 - k) + posB[0] * k, // X
    posA[1] * (1 - k) + posB[1] * k  // Y
  ];
}

function draw_faceCrop(faceCrop) {
  _ctx.strokeStyle = 'transparent';
  _ctx.beginPath();
  _ctx.moveTo(faceCrop[0][0], faceCrop[0][1]);
  _ctx.lineTo(faceCrop[1][0], faceCrop[1][1]);
  _ctx.lineTo(faceCrop[2][0], faceCrop[2][1]);
  _ctx.lineTo(faceCrop[3][0], faceCrop[3][1]);
  _ctx.closePath();
  _ctx.stroke();
}

function draw_necklace(landmarks, faceWidth, ry) {
  const scale = _necklaceSettings.scale * faceWidth / _necklaceImage.width;

  // Calculate midpoint and neck position
  const leftEarPos = landmarks.leftEarBottom;
  const rightEarPos = landmarks.rightEarBottom;

  const midX = (leftEarPos[0] + rightEarPos[0]) / 2;
  const midY = (leftEarPos[1] + rightEarPos[1]) / 2;
  const earDistance = Math.abs(leftEarPos[0] - rightEarPos[0]);
  const neckY = _screenWidthDependentVar ? midY +  200 + 0.5 * earDistance : midY +  100 + 0.5 * earDistance
  // _screenWidthDependentVar ? midY * 10 : 2
  // const neckY = 
  const neckWidth = earDistance * 0.7;

  const pos = [midX, neckY];

  // Use the calculated position to draw the necklace
  draw_necklace_image(pos, scale);
}

function draw_necklace_image(pos, scale) {
  const dWidth = scale * _necklaceImage.width;
  const dHeight = scale * _necklaceImage.height;
  const dx = pos[0] - dWidth / 2.0; // center the necklace horizontally
  const dy = pos[1] - dHeight * _necklaceSettings.pullDown; // position the necklace vertically

  _ctx.drawImage(_necklaceImage, dx, dy, dWidth, dHeight);
}

function clear_canvas() {
  _ctx.clearRect(0, 0, _canvases.overlay.width, _canvases.overlay.height);
}

function main() {
  // Create necklace image:
  _necklaceImage = new Image();
  _necklaceImage.src = _necklaceSettings.image;

  // Get canvas from the DOM:
  _canvases.face = document.getElementById('WebARRocksFaceCanvas');
  _canvases.overlay = document.getElementById('overlayCanvas');

  // Create 2D context for the overlay canvas (where the necklace is drawn):
  _ctx = _canvases.overlay.getContext('2d');

  // Set the canvas to fullscreen
  // and add an event handler to capture window resize:
  WebARRocksResizer.size_canvas({
    isFullScreen: true,
    canvas: _canvases.face,     // WebARRocksFace main canvas
    overlayCanvas: [_canvases.overlay], // other canvas which should be resized at the same size of the main canvas
    callback: start
  });
}

window.addEventListener('load', main);