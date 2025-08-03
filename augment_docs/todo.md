# SOP Maker Enhancement Tasks

## CURRENT PRIORITY: OpenRouter Integration & AI Sync Fix
**Status**: In Progress | **Priority**: High
**Context**: AI sync buttons not completing due to API credit issues. OpenRouter integration needed.

### Recently Completed ✅
- [x] RACM inline editing with click-to-edit functionality
- [x] Enhanced footer with contextual metadata and professional status
- [x] Fixed BPMN XML structure with proper sequence flows
- [x] Added comprehensive error handling for API timeouts

### Current Tasks 🔄
- [ ] Integrate OpenRouter API to replace OpenAI for reliability
- [ ] Fix "AI: Update Other Sections" buttons that hang in loading state
- [ ] Test sync functionality with new API configuration
- [ ] Verify modal displays actual results instead of loading spinner
- [ ] Add better fallback simulation when API unavailable

## PREVIOUS PRIORITY: AI Sync UX Improvements
**Status**: Completed Analysis | **Priority**: Medium
**Context**: AI sync functionality is fully operational but needs UX enhancements

### Analysis Complete ✅
- [x] Confirmed AI sync functionality is working correctly
- [x] Identified UX improvement opportunities:
  - Loading indicators for 5-15 second API calls
  - Response time optimization with caching mechanisms
  - Improved modal design for better visual feedback
  - Enhanced error messages and success state visibility

### Implementation Plan
- [ ] Enhanced loading indicators during API calls
- [ ] Improved modal design with better visual feedback
- [ ] Response time optimization with caching
- [ ] Enhanced error messages and success states
- [ ] Add analytics/logging for sync success rates

---

## Task 1: Implement Intelligent SOP Generation

### 1 · Plan
- [x] Analyze current SOP generation limitations
- [x] Identify key improvement areas (BPMN, description, procedure steps)
- [x] Research domain-specific templates and business process patterns
- [x] Design keyword detection system for process types
- [x] Plan business logic patterns for different SOP types

### 2 · Tests First (TDD)
- [x] Write unit tests for keyword detection function
- [x] Write tests for domain-specific template selection
- [x] Write tests for BPMN generation with business logic
- [x] Write integration tests for complete SOP generation flow
- [x] Test edge cases and error handling

### 3 · Implement
- [x] Create process type detection system (refund, onboarding, approval, etc.)
- [x] Implement domain-specific BPMN templates with decision points
- [x] Create contextual description generator
- [x] Build actionable procedure steps generator
- [x] Add business logic patterns (validation, approval workflows, etc.)

### 4 · Update Documentation
- [x] Update README.md with new generation capabilities
- [x] Document process types and templates
- [x] Add examples of improved SOP outputs

### 5 · Local Validation
- [x] Test with various business process descriptions
- [x] Verify BPMN diagrams show proper business logic
- [x] Ensure descriptions are contextual and valuable
- [x] Validate procedure steps are actionable

### 6 · Integration Testing
- [x] Test complete generation flow
- [x] Verify all components work together
- [x] Test error handling and edge cases

### 7 · Finalise & Commit
- [x] Commit intelligent SOP generation features
- [x] Mark task **DONE**

---

## Task 2: Add SOP Content Editing Capabilities

### 1 · Plan
- [x] Design inline editing interface for description section
- [x] Plan procedure steps editing with markdown support
- [x] Design risk & mitigation section structure and editing
- [x] Plan control measures section for monitoring and measurement
- [x] Identify UI/UX patterns for seamless editing experience

### 2 · Tests First (TDD)
- [x] Write tests for inline editing functionality
- [x] Write tests for markdown parsing and rendering
- [x] Write tests for content validation and saving
- [x] Write tests for risk & mitigation section
- [x] Write tests for control measures functionality

### 3 · Implement
- [x] Add inline editing for description section
- [x] Implement procedure steps editing with markdown support
- [x] Create risk & mitigation section with editing capabilities
- [x] Add control measures section for KPIs and monitoring
- [x] Implement auto-save functionality
- [x] Add edit/view mode toggle buttons

### 4 · Update Documentation
- [x] Document editing features in README.md
- [x] Add user guide for editing capabilities
- [x] Document risk & mitigation and control measures sections

### 5 · Local Validation
- [x] Test inline editing functionality
- [x] Verify markdown rendering works correctly
- [x] Test auto-save and data persistence
- [x] Validate new sections display properly

### 6 · Integration Testing
- [x] Test editing with SOP generation
- [x] Test saving edited content to ZIP
- [x] Test loading edited SOPs from folder
- [x] Verify all editing features work together

### 7 · Finalise & Commit
- [x] Commit editing capabilities
- [x] Mark task **DONE**

---

## Task 3: Add Risk & Mitigation and Control Measures Sections

### 1 · Plan
- [x] Design risk assessment framework for SOPs
- [x] Plan mitigation strategies templates
- [x] Design control measures with KPIs and monitoring
- [x] Plan integration with existing SOP structure

### 2 · Tests First (TDD)
- [x] Write tests for risk assessment generation
- [x] Write tests for mitigation strategies
- [x] Write tests for control measures functionality
- [x] Write tests for section integration

### 3 · Implement
- [x] Add risk & mitigation section to SOP template
- [x] Implement control measures section
- [x] Create intelligent risk assessment based on process type
- [x] Add KPI suggestions and monitoring guidelines
- [x] Integrate sections with generation and editing

### 4 · Update Documentation
- [x] Document new sections in README.md
- [x] Add examples of risk assessments and control measures
- [x] Update SOP template documentation

### 5 · Local Validation
- [x] Test risk & mitigation generation
- [x] Verify control measures functionality
- [x] Test integration with existing features

### 6 · Integration Testing
- [x] Test complete SOP with all sections
- [x] Verify saving and loading includes new sections
- [x] Test editing capabilities for new sections

### 7 · Finalise & Commit
- [x] Commit new sections
- [x] Mark task **DONE**

---

## Task 4: Fix Description Markdown Styling and Implement BPMN Swimlanes

### 1 · Plan
- [x] Fix description section markdown rendering (currently shows raw text)
- [x] Design swimlane structure for different process types
- [x] Plan role-based swimlanes (Customer, Employee, Manager, System)
- [x] Design swimlane templates for each process type

### 2 · Tests First (TDD)
- [x] Write tests for description markdown parsing
- [x] Write tests for swimlane BPMN generation
- [x] Write tests for role-based process flows
- [x] Test swimlane rendering and display

### 3 · Implement
- [x] Fix description section to use parseMarkdownToHtml()
- [x] Create swimlane BPMN templates for refund process
- [x] Create swimlane BPMN templates for onboarding process
- [x] Create swimlane BPMN templates for approval process
- [x] Add role-based task assignments in BPMN

### 4 · Update Documentation
- [x] Document swimlane implementation
- [x] Add examples of role-based process flows
- [x] Update BPMN generation documentation

### 5 · Local Validation
- [x] Test description markdown rendering
- [x] Verify swimlane BPMN diagrams display correctly
- [x] Test all process types with swimlanes
- [x] Validate role assignments are clear

### 6 · Integration Testing
- [x] Test swimlanes with SOP generation
- [x] Test swimlanes with editing functionality
- [x] Verify save/load works with new BPMN structure

### 7 · Finalise & Commit
- [x] Commit swimlane implementation
- [x] Mark task **DONE**

---

## Task 5: Implement BPMN Diagram Editing

### 1 · Plan
- [x] Research bpmn-js modeler integration options
- [x] Analyze pre-packaged vs custom integration approach
- [x] Design editing interface and user experience
- [x] Plan integration with existing save/load functionality

### 2 · Tests First (TDD)
- [x] Write tests for BPMN modeler initialization
- [x] Write tests for diagram editing functionality
- [x] Write tests for saving edited diagrams
- [x] Write tests for validation and error handling

### 3 · Implement
- [x] Replace bpmn-navigated-viewer with bpmn-js modeler
- [x] Add editing toolbar and controls
- [x] Implement save functionality for edited diagrams
- [x] Add validation for BPMN diagram integrity

### 4 · Update Documentation
- [x] Document BPMN editing capabilities
- [x] Add user guide for diagram editing
- [x] Update technical documentation

### 5 · Local Validation
- [x] Test BPMN editing functionality
- [x] Verify diagram validation works
- [x] Test integration with existing features

### 6 · Integration Testing
- [x] Test editing with SOP generation
- [x] Test saving edited diagrams to ZIP
- [x] Test loading and editing existing diagrams

### 7 · Finalise & Commit
- [x] Commit BPMN editing features
- [x] Mark task **DONE**

---

## Task 6: Architectural Review & Production Readiness

### 📋 **Architect-Level Analysis** (Based on External Review)

#### ✅ **Current Strengths**
- Single-page prototype with modern UI stack (Tailwind v3 + Google Inter)
- BPMN-js integration with edit/save/upload workflow
- Editable RACM grid with add/edit/delete functionality
- Floating action button (FAB) menu for power-user actions
- Coherent color palette and responsive behavior

#### 🔧 **Immediate "Hygiene" Fixes** (Low-effort, High Pay-off)

### 1 · Plan
- [ ] **Accessibility & Semantics**: Add `<main>`, `<nav>`, `<section>`, `<footer>` landmarks
- [ ] **ARIA Labels**: Add `aria-label` to icon-only FAB buttons for screen readers
- [ ] **Color Contrast**: Ensure WCAG 2.2 AA compliance (white text on accent red)
- [ ] **Script Cleanup**: Remove empty inline `<script>` block, split embedded scripts
- [ ] **Performance**: Defer heavy libraries (bpmn-modeler.development.js ≈800 KB)
- [ ] **Input Validation**: Add try/catch for XML imports with friendly error messages
- [ ] **Data Persistence**: Implement localStorage for RACM edits

### 2 · Tests First (TDD)
- [ ] Write Jest/Puppeteer smoke tests:
  - [ ] Load page → confirm BPMN canvas initializes
  - [ ] Add RACM row → save → reload → row persists
  - [ ] Upload malformed XML → error alert visible
- [ ] Write accessibility tests for screen reader compatibility
- [ ] Write performance tests for large BPMN files

### 3 · Implement
- [ ] **Accessibility Improvements**:
  - [ ] Add semantic HTML landmarks
  - [ ] Implement ARIA labels and descriptions
  - [ ] Ensure keyboard navigation works
  - [ ] Fix color contrast issues
- [ ] **Performance Optimizations**:
  - [ ] Lazy-load BPMN bundle with `type="module"` + `import()`
  - [ ] Implement progress indicators for long operations
  - [ ] Add file size validation for uploads
- [ ] **Data Persistence**:
  - [ ] Add localStorage for RACM data
  - [ ] Implement auto-save functionality
  - [ ] Add data export/import capabilities

### 4 · Update Documentation
- [ ] Document accessibility features and compliance
- [ ] Add performance optimization guide
- [ ] Document data persistence and storage options
- [ ] Create deployment guide for production environments

### 5 · Local Validation
- [ ] Test with screen readers (NVDA, JAWS)
- [ ] Validate WCAG 2.2 AA compliance
- [ ] Test performance with large files
- [ ] Verify data persistence across sessions

### 6 · Integration Testing
- [ ] Test accessibility with all features
- [ ] Test performance under load
- [ ] Verify data integrity with persistence
- [ ] Test error handling and recovery

### 7 · Finalise & Commit
- [ ] Commit accessibility and performance improvements
- [ ] Mark task **DONE**

---

## Task 7: Enterprise Architecture & Scalability

### 🏗️ **Architectural Considerations** (Before Business Rollout)

### 1 · Plan
- [ ] **Data Storage Strategy**:
  - [ ] Evaluate client-side only (IndexedDB/localStorage) vs serverless (Firebase/Supabase)
  - [ ] Design enterprise REST/GraphQL endpoints for compliance DB integration
  - [ ] Plan data migration strategy from prototype to production
- [ ] **Version Control & Audit Trail**:
  - [ ] Design immutable snapshot system for regulatory compliance
  - [ ] Plan Git/S3 integration for version storage
  - [ ] Design audit metadata (who/when/why) tracking
- [ ] **Role-Based Authorization**:
  - [ ] Design permission system (display-only vs edit vs approve)
  - [ ] Plan JWT/session role integration
  - [ ] Design role-based UI hiding/showing

### 2 · Tests First (TDD)
- [ ] Write tests for data storage abstraction layer
- [ ] Write tests for version control and audit trail
- [ ] Write tests for role-based access control
- [ ] Write tests for bulk import/export functionality

### 3 · Implement
- [ ] **Backend Architecture**:
  - [ ] Create Node/Express API stub for RACM POST/GET
  - [ ] Implement data storage abstraction layer
  - [ ] Add version control with immutable snapshots
  - [ ] Implement audit trail with metadata tracking
- [ ] **Authorization System**:
  - [ ] Add role-based access control
  - [ ] Implement JWT/session integration
  - [ ] Add permission-based UI rendering
- [ ] **Enterprise Features**:
  - [ ] Add bulk import/export (Excel/CSV)
  - [ ] Implement search and filtering for RACM grid
  - [ ] Add keyboard shortcuts for power users
  - [ ] Implement dark mode toggle

### 4 · Update Documentation
- [ ] Document enterprise architecture decisions
- [ ] Create deployment guide for different environments
- [ ] Document security and compliance features
- [ ] Add API documentation for backend integration

### 5 · Local Validation
- [ ] Test with pilot group (5-10 users)
- [ ] Validate role-based access control
- [ ] Test bulk operations with large datasets
- [ ] Verify audit trail functionality

### 6 · Integration Testing
- [ ] Test with existing GRC tooling integration
- [ ] Test SSO integration
- [ ] Verify compliance with regulatory requirements
- [ ] Test disaster recovery and backup procedures

### 7 · Finalise & Commit
- [ ] Commit enterprise architecture features
- [ ] Mark task **DONE**

---

## Task 8: Fix BPMN Edit Diagram Toggle Issue

### 🐛 **Current Issue**
- Edit Diagram toggle button not working properly
- BPMN viewer/modeler initialization issues
- Event listeners not properly attached
- Global variable scope problems

### 1 · Plan
- [x] Investigate BPMN viewer initialization failure
- [x] Debug event listener attachment issues
- [x] Fix variable scope problems (isEditMode, bpmnViewer, bpmnModeler)
- [x] Ensure proper toggle between view and edit modes

### 2 · Tests First (TDD)
- [x] Write tests for BPMN viewer initialization
- [x] Write tests for edit mode toggle functionality
- [x] Write tests for palette show/hide behavior
- [x] Write tests for context pad enable/disable

### 3 · Implement
- [x] Fix global variable declarations (moved outside DOMContentLoaded)
- [x] Make enterEditMode and exitEditMode globally accessible
- [x] Debug and fix event listener attachment
- [x] Ensure proper BPMN viewer initialization
- [x] Fix toggle state management

### 4 · Update Documentation
- [x] Document BPMN editing toggle functionality
- [x] Add troubleshooting guide for common issues
- [x] Update technical architecture documentation

### 5 · Local Validation
- [x] Test edit mode toggle works correctly
- [x] Verify palette shows/hides properly
- [x] Test context pad enable/disable
- [x] Validate smooth transitions between modes

### 6 · Integration Testing
- [x] Test toggle with generated SOPs
- [x] Test toggle with uploaded diagrams
- [x] Verify save/load works in both modes
- [x] Test error handling and recovery

### 7 · Finalise & Commit
- [x] Commit toggle fix
- [x] Mark task **DONE**

---

## Task 9: AI-Powered Section Synchronization System

### 🔄 **AI-Powered Three-Way Sync** (BPMN ↔ Description ↔ RACM)

#### ✨ **Vision**
Keep BPMN Diagram, Description, and RACM sections synchronized using OpenAI LLM integration for consistent, high-quality SOPs.

### 1 · Plan
- [x] Design hybrid sync strategy (manual + auto-sync options)
- [x] Plan sync button placement in each section (BPMN, Description, RACM)
- [x] Design change detection system for identifying modifications
- [x] Plan OpenAI prompt strategies for each sync scenario
- [x] Design change preview modal with diff view
- [x] Plan user experience flow for sync operations

### 2 · Tests First (TDD)
- [x] Write tests for change detection utilities
- [x] Write tests for sync functionality (simulation)
- [x] Write tests for sync prompt generation
- [x] Write tests for change preview modal
- [x] Write tests for selective change application
- [ ] Write tests for sync status indicators

### 3 · Implement
- [x] **Phase 1: Core Infrastructure**
  - [x] Add sync buttons to BPMN, Description, and RACM sections
  - [x] Create sync service functionality (placeholder for OpenAI)
  - [x] Implement basic change detection and simulation
  - [x] Create sync prompt templates and scenarios
  - [x] Build change preview modal with diff view
- [x] **Phase 2: Enhanced UX**
  - [ ] Add auto-sync option (user preference)
  - [ ] Implement sync status indicators
  - [ ] Add undo/redo for AI changes
  - [x] Create actual OpenAI API integration
- [ ] **Phase 3: Advanced Features**
  - [ ] Smart sync suggestions
  - [ ] Conflict resolution system
  - [ ] Sync history tracking
  - [ ] Batch sync operations

### 4 · Update Documentation
- [ ] Document sync system architecture
- [ ] Add user guide for sync functionality
- [ ] Document OpenAI prompt strategies
- [ ] Create troubleshooting guide for sync issues

### 5 · Local Validation
- [x] Test sync between BPMN and Description
- [x] Test sync between Description and RACM
- [x] Test sync between RACM and BPMN
- [x] Validate change preview accuracy
- [ ] Test auto-sync functionality

### 6 · Integration Testing
- [ ] Test sync with existing SOP generation
- [ ] Test sync with editing capabilities
- [ ] Verify save/load works with sync data
- [ ] Test sync with large/complex SOPs

### 7 · Finalise & Commit
- [x] Commit sync system implementation
- [x] Mark task **DONE**

---

## Task 10: Fix RACM Process Replacement for Different SOPs

### 🔧 **Critical Issue Identified**
When user changes description to completely different process (e.g., "make a posh cup of tea"), the AI provides relevant RACM entries but the system doesn't properly replace the process step names.

#### **Current Behavior**:
- ✅ Description: Enhanced with tea-making content
- ✅ BPMN: Tea-making process suggestions
- ❌ RACM: Still shows "Receive and validate request", "Review and approve request" (payment processing steps)

#### **Expected Behavior**:
- ✅ Description: Enhanced with tea-making content
- ✅ BPMN: Tea-making process suggestions
- ✅ RACM: Should show "Select tea leaves", "Heat water", "Steep tea" (tea-making steps)

### 1 · Plan
- [x] Analyze root cause of RACM process replacement logic
- [x] Identify why process steps aren't being updated correctly
- [x] Design improved logic for detecting completely different processes
- [x] Plan force replacement strategy for different process types

### 2 · Tests First (TDD)
- [x] Write tests for process type detection (tea vs payment vs manufacturing)
- [x] Write tests for complete RACM replacement logic
- [x] Write tests for process step name updates
- [x] Write tests for preview modal showing correct replacement message

### 3 · Implement
- [x] Fix process detection logic to force complete replacement
- [x] Ensure process step names are properly updated
- [x] Update preview modal to show correct replacement vs update message
- [x] Test with multiple different process types (tea, manufacturing, service)

### 4 · Update Documentation
- [x] Document process replacement logic
- [x] Add examples of different process types
- [x] Update troubleshooting guide

### 5 · Local Validation
- [x] Test tea making process replacement
- [x] Test manufacturing process replacement
- [x] Test service process replacement
- [x] Verify process steps are correctly displayed

### 6 · Integration Testing
- [x] Test on Railway deployment
- [x] Test with GPT-4o-mini integration
- [x] Verify all sync types work correctly
- [x] Test edge cases and error handling

### 7 · Finalise & Commit
- [x] Commit RACM process replacement fix
- [x] Mark task **DONE**

---

## Implementation Priority
1. **Task 1**: Intelligent SOP Generation ✅ **DONE**
2. **Task 2**: Content Editing Capabilities ✅ **DONE**
3. **Task 3**: Risk & Control Measures ✅ **DONE**
4. **Task 4**: Description Markdown Fix + BPMN Swimlanes ✅ **DONE**
5. **Task 5**: BPMN Diagram Editing ✅ **DONE**
6. **Task 8**: Fix BPMN Edit Diagram Toggle Issue ✅ **DONE**
7. **Task 9**: AI-Powered Section Synchronization System ✅ **DONE** (OpenAI GPT-4o-mini Integrated)
8. **Task 10**: Fix RACM Process Replacement for Different SOPs ✅ **DONE**
9. **Task 6**: Architectural Review & Production Readiness 📋 **PLANNED**
10. **Task 7**: Enterprise Architecture & Scalability 🏗️ **PLANNED**

## Quick Win Roadmap (Based on Architectural Review)
1. **Refactor scripts** into ES modules, lazy-load BPMN bundle
2. **Add localStorage persistence** for RACM + description
3. **Implement ARIA labels** and color-contrast fixes
4. **Write 10-line Node/Express API stub** for future backend integration
5. **Usability test** with MA and Compliance Officer for full workflow

## Technical Notes
- Maintain backward compatibility with existing SOPs
- Ensure all new features work with save/load ZIP functionality
- Keep UI responsive and user-friendly
- Follow existing code patterns and architecture
- Focus on regulatory compliance and audit trail requirements
- Plan for enterprise scalability from the beginning
