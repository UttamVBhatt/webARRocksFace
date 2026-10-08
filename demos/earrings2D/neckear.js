/**
 * neckear.js
 * AR Try-On logic for Earrings, Necklaces (WebARRocksFace)
 * and Bracelets (MediaPipe Hands)
 */

// ─── Shared state ────────────────────────────────────────────────────────────
const _canvases = {
  face: null,
  overlay: null
};
let _ctx = null;
let _earringImage = null;
let _necklaceImage = null;
let _currentMode = null; // 'ear' | 'neck' | 'bracelet'

// ─── Screen-width helper ─────────────────────────────────────────────────────
let _isMobile = window.innerWidth < 768;
window.addEventListener('resize', () => {
  _isMobile = window.innerWidth < 768;
});

// ─── Earring settings ────────────────────────────────────────────────────────
const _earringSettings = {
  image: '',
  angleHide: 5,        // degrees from which we hide earrings
  angleHysteresis: 0.5,
  scaleRatio: 0.12,    // earring width as fraction of face width
  pullUp: 0.1          // vertical pull-up factor
};

const _earringsVisibility = {
  right: false,
  left: false
};

// ─── Necklace settings ───────────────────────────────────────────────────────
const _necklaceSettings = {
  image: '',
  scale: 0.7,
  pullDown: 0.17
};

// ─── Shared canvas utilities ─────────────────────────────────────────────────
function _clearCanvas() {
  _ctx.clearRect(0, 0, _canvases.overlay.width, _canvases.overlay.height);
}

function _drawFaceCrop(faceCrop) {
  _ctx.strokeStyle = 'transparent';
  _ctx.beginPath();
  _ctx.moveTo(faceCrop[0][0], faceCrop[0][1]);
  _ctx.lineTo(faceCrop[1][0], faceCrop[1][1]);
  _ctx.lineTo(faceCrop[2][0], faceCrop[2][1]);
  _ctx.lineTo(faceCrop[3][0], faceCrop[3][1]);
  _ctx.closePath();
  _ctx.stroke();
}

function _mixLandmarks(posA, posB, k) {
  return [
    posA[0] * (1 - k) + posB[0] * k,
    posA[1] * (1 - k) + posB[1] * k
  ];
}

// ─── Earring drawing ─────────────────────────────────────────────────────────
function _drawSingleEarring(pos, faceWidth) {
  const dWidth  = _earringSettings.scaleRatio * faceWidth;
  const aspectRatio = (_earringImage.naturalHeight || _earringImage.height) /
                      (_earringImage.naturalWidth  || _earringImage.width  || 1);
  const dHeight = dWidth * Math.max(aspectRatio, 1.5); // keep tall proportions
  const dx = pos[0] - dWidth / 2;
  const dy = pos[1] - dHeight * _earringSettings.pullUp;
  _ctx.drawImage(_earringImage, dx, dy, dWidth, dHeight);
}

function _drawEarrings(landmarks, faceWidth, ry) {
  // Right earring
  const rightAngleLimit = -_earringSettings.angleHide -
    _earringSettings.angleHysteresis * (_earringsVisibility.right ? 1 : -1);
  if (ry > rightAngleLimit) {
    const pos = _mixLandmarks(landmarks.rightEarBottom, landmarks.rightEarEarring, 0.83);
    pos[0] -= faceWidth * 0.001;
    _drawSingleEarring(pos, faceWidth);
    _earringsVisibility.right = true;
  } else {
    _earringsVisibility.right = false;
  }

  // Left earring
  const leftAngleLimit = -_earringSettings.angleHide -
    _earringSettings.angleHysteresis * (_earringsVisibility.left ? 1 : -1);
  if (-ry > leftAngleLimit) {
    const pos = _mixLandmarks(landmarks.leftEarBottom, landmarks.leftEarEarring, 1.1);
    pos[0] -= faceWidth * 0.014;
    pos[1] -= faceWidth * 0.03;
    _drawSingleEarring(pos, faceWidth);
    _earringsVisibility.left = true;
  } else {
    _earringsVisibility.left = false;
  }
}

// ─── Necklace drawing ────────────────────────────────────────────────────────
function _drawNecklace(landmarks, faceWidth) {
  const leftEarPos  = landmarks.leftEarBottom;
  const rightEarPos = landmarks.rightEarBottom;
  const midX        = (leftEarPos[0] + rightEarPos[0]) / 2;
  const midY        = (leftEarPos[1] + rightEarPos[1]) / 2;
  const earDistance = Math.abs(leftEarPos[0] - rightEarPos[0]);

  const neckY = midY + 39 + 0.5 * earDistance;
  const scale = _necklaceSettings.scale * faceWidth / (_necklaceImage.naturalWidth || _necklaceImage.width || 1);

  const dWidth  = faceWidth * 0.65;
  const dHeight = scale * (_necklaceImage.naturalHeight || _necklaceImage.height || 1);
  const dx = midX - dWidth / 2;
  const dy = neckY - dHeight * _necklaceSettings.pullDown;

  _ctx.drawImage(_necklaceImage, dx, dy, dWidth, dHeight);
}

// ─── WebARRocksFace initialisation ───────────────────────────────────────────
function _startFaceAR(callbackTrack) {
  WebARRocksFaceCanvas2DHelper.init({
    spec: {
      NNCPath: '../../neuralNets/NN_EARS_4.json',
      canvas: _canvases.face
    },
    callbackReady: function (err) {
      if (err) {
        console.error('WebARRocksFace error:', err);
        if (err === 'WEBCAM_UNAVAILABLE') {
          alert('Camera access was denied or unavailable. Please allow camera access and try again.');
          closeDialog();
        }
        return;
      }
      console.log('WebARRocksFace ready');
    },
    callbackTrack: function (detectState) {
      _clearCanvas();
      if (detectState.isDetected) {
        _drawFaceCrop(detectState.faceCrop);
        callbackTrack(detectState.landmarks, detectState.faceWidth, detectState.ry);
      }
    }
  });
}

function _initFaceCanvas(callback) {
  _canvases.face    = document.getElementById('WebARRocksFaceCanvas');
  _canvases.overlay = document.getElementById('overlayCanvas');
  _ctx = _canvases.overlay.getContext('2d');

  WebARRocksResizer.size_canvas({
    isFullScreen: false,
    canvas: _canvases.face,
    overlayCanvas: [_canvases.overlay],
    callback: callback
  });
}

// ─── Public: earMain ─────────────────────────────────────────────────────────
function earMain() {
  _earringImage = new Image();
  _earringImage.src = _earringSettings.image;
  _initFaceCanvas(() => {
    _startFaceAR((landmarks, faceWidth, ry) => {
      _drawEarrings(landmarks, faceWidth, ry);
    });
  });
}

// ─── Public: neckMain ────────────────────────────────────────────────────────
function neckMain() {
  _necklaceImage = new Image();
  _necklaceImage.src = _necklaceSettings.image;
  _initFaceCanvas(() => {
    _startFaceAR((landmarks, faceWidth) => {
      _drawNecklace(landmarks, faceWidth);
    });
  });
}

// ─── Bracelet try-on via MediaPipe Hands ─────────────────────────────────────
let _braceletImage  = null;
let _braceletCanvas = null;
let _braceletCtx    = null;
let _mpHands        = null;
let _mpCamera       = null;
let _braceletVideoEl = null;

function _stopBracelet() {
  if (_mpCamera) {
    try { _mpCamera.stop(); } catch(e) {}
    _mpCamera = null;
  }
  if (_braceletVideoEl && _braceletVideoEl.srcObject) {
    _braceletVideoEl.srcObject.getTracks().forEach(t => t.stop());
    _braceletVideoEl.srcObject = null;
  }
}

function braceletMain(imageSrc) {
  // Show bracelet modal, hide face modal
  const dialog = document.getElementById('imageDialog');
  const braceletDialog = document.getElementById('braceletDialog');
  dialog.classList.remove('active');
  braceletDialog.classList.add('active');

  _braceletCanvas = document.getElementById('braceletOverlayCanvas');
  _braceletVideoEl = document.getElementById('braceletVideo');
  _braceletCtx = _braceletCanvas.getContext('2d');

  _braceletImage = new Image();
  _braceletImage.src = imageSrc;

  // Dynamically load MediaPipe if not already loaded
  function _initMpHands() {
    _mpHands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    _mpHands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.75,
      minTrackingConfidence: 0.75
    });
    _mpHands.onResults(_onBraceletResults);

    _mpCamera = new Camera(_braceletVideoEl, {
      onFrame: async () => {
        await _mpHands.send({ image: _braceletVideoEl });
      },
      width: 1280,
      height: 720
    });
    _mpCamera.start();
  }

  if (typeof Hands !== 'undefined' && typeof Camera !== 'undefined') {
    _initMpHands();
  } else {
    // Load scripts dynamically
    function _loadScript(src, cb) {
      const s = document.createElement('script');
      s.src = src;
      s.onload = cb;
      document.head.appendChild(s);
    }
    _loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js', () => {
      _loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js', _initMpHands);
    });
  }
}

function _onBraceletResults(results) {
  _braceletCanvas.width  = _braceletVideoEl.videoWidth  || 1280;
  _braceletCanvas.height = _braceletVideoEl.videoHeight || 720;

  _braceletCtx.clearRect(0, 0, _braceletCanvas.width, _braceletCanvas.height);
  _braceletCtx.drawImage(results.image, 0, 0, _braceletCanvas.width, _braceletCanvas.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks    = results.multiHandLandmarks[0];
    const wrist        = landmarks[0];
    const indexBase    = landmarks[5];
    const pinkyBase    = landmarks[17];

    const wristX = wrist.x * _braceletCanvas.width;
    const wristY = wrist.y * _braceletCanvas.height;

    // Width = distance between index base and pinky base (knuckle span)
    const braceletWidth = Math.sqrt(
      Math.pow((indexBase.x - pinkyBase.x) * _braceletCanvas.width, 2) +
      Math.pow((indexBase.y - pinkyBase.y) * _braceletCanvas.height, 2)
    ) * 1.4;

    // Angle of the wrist
    const angle = Math.atan2(
      (indexBase.y - wrist.y) * _braceletCanvas.height,
      (indexBase.x - wrist.x) * _braceletCanvas.width
    );

    const braceletHeight = braceletWidth * 0.28;

    _braceletCtx.save();
    _braceletCtx.translate(wristX, wristY);
    _braceletCtx.rotate(angle - Math.PI / 2);
    _braceletCtx.drawImage(
      _braceletImage,
      -braceletWidth / 2,
      -braceletHeight / 2,
      braceletWidth,
      braceletHeight
    );
    _braceletCtx.restore();
  }
}

// ─── Dialog management ───────────────────────────────────────────────────────
function showImage(imageSrc, type) {
  _currentMode = type;

  if (type === 'bracelet') {
    braceletMain(imageSrc);
    return;
  }

  const dialog = document.getElementById('imageDialog');
  dialog.classList.add('active');

  if (type === 'ear') {
    _earringSettings.image = imageSrc;
    earMain();
  } else {
    _necklaceSettings.image = imageSrc;
    neckMain();
  }
}

function closeDialog() {
  // Stop face AR
  if (_canvases.face) {
    try { WEBARROCKSFACE.destroy(); } catch (e) {}
  }
  const dialog = document.getElementById('imageDialog');
  if (dialog) dialog.classList.remove('active');

  // Reset canvases
  _canvases.face    = null;
  _canvases.overlay = null;
  _ctx = null;
  _currentMode = null;
}

function closeBraceletDialog() {
  _stopBracelet();
  const braceletDialog = document.getElementById('braceletDialog');
  if (braceletDialog) braceletDialog.classList.remove('active');
}

// ─── Close on backdrop click ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.getElementById('imageDialog');
  if (dialog) {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeDialog();
    });
  }
  const braceletDialog = document.getElementById('braceletDialog');
  if (braceletDialog) {
    braceletDialog.addEventListener('click', (e) => {
      if (e.target === braceletDialog) closeBraceletDialog();
    });
  }
});

// ─── Sticky sidebar ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const sideNav = document.querySelector('.banner-container');
  if (!sideNav) return;
  window.addEventListener('wheel', () => {
    if (window.innerWidth > 770) {
      if (window.scrollY >= 700) {
        sideNav.classList.add('fixed');
      } else {
        sideNav.classList.remove('fixed');
      }
    }
  });
});