const _canvases = {
  face: null, 
  overlay: null
};
let _ctx = null, _necklaceImage = null;

// Necklace settings
const _necklaceSettings = {
  image: 'images/necklaces/necklace-2.png', // Necklace image
  scale: 0.48,    // Width of the necklace compared to the face width (1 -> 100% of the face width)
  pullUp: 1,   // Controls the vertical position of the necklace
};

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

window.addEventListener("resize", () =>{
  _screenWidthDependentVar = window.innerWidth < 768
})


function start() {
  WebARRocksFaceCanvas2DHelper.init({
    spec: {
      NNCPath: '../../neuralNets/NN_NECKLACE_2.json', // Neural network model file for necklace detection
      canvas: _canvases.face,
    },

    callbackReady: function (err, spec) {
      if (err) {
        console.log('ERROR in demo.js: ', err);
        return;
      }

      console.log('INFO in demo.js: WebAR.rocks.face is ready :)');
    },

    callbackTrack: function (detectState) {
      clear_canvas();
      if (detectState.isDetected) {
        draw_faceCrop(detectState.faceCrop);
        draw_necklace(detectState.landmarks, detectState.faceWidth);
      }
    }
  });
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

function draw_necklace(landmarks, faceWidth) {
  // Coordinates for the necklace placement
  const neckTop = landmarks.torsoNeckCenterUp; // Assuming index 4 corresponds to "torsoNeckCenterUp"
  const neckBottom = landmarks.torsoNeckCenterDown; // Assuming index 5 corresponds to "torsoNeckCenterDown"

  if (!neckTop || !neckBottom) {
    console.log('ERROR: Neck landmarks not detected');
    return;
  }

  const pos = mix_landmarks(neckTop, neckBottom, _necklaceSettings.pullUp);
  const scale = _necklaceSettings.scale * faceWidth / _necklaceImage.width;

  draw_necklace_image(pos, scale);
}

function mix_landmarks(posA, posB, k) {
  return [
    posA[0] * (1 - k) + posB[0] * k, // X
    posA[1] * (1 - k) + posB[1] * k  // Y
  ];
}

function draw_necklace_image(pos, scale) {
  const dWidth = scale * _necklaceImage.width;
  const dHeight = scale * _necklaceImage.height;
  const dx = (pos[0] - dWidth / 2) + 5; // Center the necklace horizontally
  let dy = pos[1] - dHeight;    // Position it vertically above the detected point
  dHeight > 200 ? dy += 110 : dy

  // console.log(dHeight)

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
    overlayCanvas: [_canvases.overlay], // Other canvas which should be resized at the same size of the main canvas
    callback: start
  });
}

window.addEventListener('load', main);

