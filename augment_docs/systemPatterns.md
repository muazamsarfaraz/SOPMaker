# SOP Maker - System Patterns & Architecture

## Architecture Overview
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **Backend**: Express.js server for static file serving
- **Deployment**: Railway platform with Nixpacks
- **File Management**: Client-side ZIP creation/extraction using JSZip

## Key Design Patterns

### 1. Intelligent Process Detection
```javascript
function detectProcessType(userInput) {
    // Keyword-based classification system
    // Returns: refund, onboarding, approval, procurement, customer_service, generic
}
```

### 2. Factory Pattern for BPMN Generation
```javascript
const processTemplates = {
    'refund': generateRefundProcessBPMN,
    'onboarding': generateOnboardingProcessBPMN,
    'approval': generateApprovalProcessBPMN,
    // ... other process types
};
```

### 3. Content Generation Pipeline
1. Process Type Detection
2. BPMN Diagram Generation
3. Contextual Description Creation
4. Procedure Steps Generation
5. Risk Assessment Creation
6. Control Measures Generation

### 4. State Management
- Global `currentSopData` object for application state
- Section-specific content storage (descriptionMd, stepsMd, risksMd, controlsMd)
- Inline editing with save/cancel functionality

### 5. File Structure Pattern
```
SOP_Name/
├── diagram.bpmn
├── description.md
├── procedure_steps.md
├── risks_mitigation.md
├── control_measures.md
└── metadata.json
```

## Core Components
- **SOP Generator**: Modal-based generation interface
- **BPMN System**: Dual-mode viewer/modeler with bpmn-js integration
  - **Viewer Mode**: Read-only diagram display for normal viewing
  - **Modeler Mode**: Interactive editing with palette and context pad
  - **Mode Switching**: Seamless transition between view and edit modes
- **Content Editors**: Inline editing for all text sections
- **File Manager**: Save/load functionality with ZIP handling
- **FAB Menu**: Floating action button for primary actions

## BPMN Editing Architecture

### Dual-Mode System
```javascript
// Viewer for display
bpmnViewer = new window.BpmnJS({ container: diagramContainer });

// Modeler for editing
bpmnModeler = new window.BpmnJS({ container: diagramContainer });

// Mode switching
const activeViewer = isEditMode ? bpmnModeler : bpmnViewer;
```

### Edit Mode Flow
1. **Enter Edit Mode**: Switch to modeler, show edit controls
2. **Interactive Editing**: Use palette and context pad to modify diagram
3. **Save Changes**: Extract XML from modeler, update global state
4. **Exit Edit Mode**: Switch back to viewer, hide edit controls

### Integration Points
- **SOP Generation**: Generated BPMN works seamlessly with editing
- **Save/Load**: Edited diagrams are preserved in ZIP files
- **State Management**: currentSopData.bpmnXml stores current diagram state
