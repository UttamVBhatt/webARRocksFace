# Jewellery AR Try-On

A virtual jewellery try-on web app that lets customers preview **necklaces**, **earrings**, and **bracelets** using their device camera — no app download required.

## Features
- Necklace Try-On — Overlays necklaces on your neck using face-landmark detection
- Earring Try-On — Places earrings precisely on your earlobes using face AR
- Bracelet Try-On — Fits bracelets on your wrist using hand-tracking (MediaPipe Hands)

## Project Structure

```
jewellery-ar/
├── demos/
│   └── earrings2D/         <- Main website (open this)
│       ├── index.html      <- Entry point (Necklaces | Earrings | Bracelets tabs)
│       ├── neckear.js      <- AR logic for face (earrings + necklace) + bracelet
│       ├── bracelet.png    <- Bracelet image asset
│       ├── img/            <- Necklace product images
│       ├── images/         <- Earring product images
│       ├── css/            <- Stylesheets
│       └── js/             <- jQuery / Bootstrap
├── dist/                   <- WebARRocksFace library (face AR engine)
├── helpers/                <- WebARRocksFace helper scripts
└── neuralNets/             <- Neural network models for face/ear detection
```

## How to Run

Camera access requires a local HTTP server (file:// does not work).

### VS Code Live Server (Recommended)
1. Open the jewellery-ar folder in VS Code
2. Install the Live Server extension
3. Right-click demos/earrings2D/index.html -> Open with Live Server

### npx serve
```
npx serve .
```
Visit: http://localhost:3000/demos/earrings2D/index.html

### Python
```
python -m http.server 8080
```
Visit: http://localhost:8080/demos/earrings2D/index.html

## Tech Stack
- Face/Ear detection: WebAR.rocks.face
- Hand/Wrist tracking: MediaPipe Hands
- Frontend: HTML5, Vanilla CSS, JavaScript
