# SOP Maker - Technical Context

## Tech Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Tailwind CSS v3.4.0
- **BPMN**: bpmn-js library for diagram rendering
- **File Handling**: JSZip for client-side ZIP operations
- **Backend**: Node.js with Express.js
- **Deployment**: Railway with Nixpacks (Node.js 22, npm 9.x)

## Dependencies
```json
{
  "express": "^4.18.2",
  "serve-static": "^1.15.0"
}
```

## CDN Libraries
- Tailwind CSS: https://cdn.tailwindcss.com
- bpmn-js: https://unpkg.com/bpmn-js@latest/dist/bpmn-navigated-viewer.production.min.js
- JSZip: https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js

## Environment Setup
- **Development**: Python HTTP server (`python -m http.server 3001`)
- **Production**: Express server on Railway (port 8080)
- **Build**: Automatic via Nixpacks on Railway

## File Structure
```
SOPMaker/
├── index.html              # Main application
├── script.js               # Core application logic
├── style.css               # Custom styles
├── server.js               # Express server
├── package.json            # Node.js configuration
├── sop_content/            # Default SOP content
├── tests/                  # Unit tests
└── augment_docs/           # Memory bank
```

## Deployment Configuration
- **Platform**: Railway (https://sop-maker-production.up.railway.app)
- **Project ID**: f467f65b-d477-4fa4-a5fc-a33e45d7e13b
- **Build Time**: ~73 seconds
- **Region**: europe-west4

## Constraints
- Client-side only processing (no server-side AI)
- Browser compatibility for modern features (ES6+)
- File size limits for ZIP downloads
- CORS considerations for local development
