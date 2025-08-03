# SOP Maker - Technical Context

## Tech Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Tailwind CSS v3.4.0
- **BPMN**: bpmn-js library for diagram rendering and editing
- **AI Integration**: OpenRouter API (primary) + OpenAI GPT-4o-mini (fallback) for intelligent content generation
- **Testing**: Playwright for integration testing, custom static analysis
- **File Handling**: JSZip for client-side ZIP operations
- **Backend**: Node.js with Express.js
- **Deployment**: Railway with Nixpacks (Node.js 22, npm 9.x)

## Dependencies
```json
{
  "express": "^4.18.2",
  "serve-static": "^1.15.0",
  "openai": "^5.7.0",
  "dotenv": "^16.5.0"
}
```

## Dev Dependencies
```json
{
  "playwright": "^1.40.0"
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
├── server.js               # Express server with OpenAI API integration
├── package.json            # Node.js configuration
├── package-lock.json       # Dependency lock file
├── .env.example            # Environment variables template
├── sop_content/            # Default SOP content
├── test-battery.js         # Static analysis test suite
├── test-integration.js     # Playwright integration tests
├── run-tests.js            # Complete test orchestrator
├── TEST-README.md          # Test documentation
└── augment_docs/           # Memory bank
```

## Deployment Configuration
- **Platform**: Railway (https://sop-maker-production.up.railway.app)
- **Project ID**: f467f65b-d477-4fa4-a5fc-a33e45d7e13b
- **Build Time**: ~73 seconds
- **Region**: europe-west4

## Testing & Quality Assurance
- **Static Analysis**: 8 comprehensive checks (syntax, structure, logic)
- **Integration Testing**: Playwright-based UI testing (87.5% success rate)
- **Production Testing**: Tests validate against live Railway deployment
- **NPM Scripts**: `npm run test`, `test:static`, `test:integration`
- **Quality Gates**: Automated testing prevents regressions

## Environment Variables
- **OPENROUTER_API_KEY**: Primary AI API for reliable synchronization
- **OPENAI_API_KEY**: Fallback AI API for synchronization features
- **NODE_ENV**: Environment setting (development/production)
- **TEST_URL**: Custom URL for integration testing

## Constraints & Considerations
- **AI API**: OpenRouter (primary) or OpenAI (fallback) required for AI features (graceful simulation available)
- **Credit Management**: Timeout detection and fallback for API billing issues
- **Browser Compatibility**: Modern features (ES6+, optional chaining)
- **File Size Limits**: ZIP downloads limited by browser memory
- **CORS Considerations**: Local development vs production deployment
- **Null Safety**: Comprehensive protection against undefined/null errors

## Recent Enhancements
- **RACM Inline Editing**: Click-to-edit functionality with smart input types
- **Footer Intelligence**: Contextual document IDs and professional metadata
- **BPMN XML Structure**: Fixed sequence flows for proper diagram rendering
- **API Error Handling**: Enhanced timeout and credit issue detection
