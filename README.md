# SOP Maker

## Overview

SOP Maker is a web-based tool designed for viewing, managing, and dynamically generating Standard Operating Procedures (SOPs). It provides an interactive interface to display SOPs, including their process flow (via BPMN diagrams), detailed descriptions, and step-by-step procedures. A key feature is the client-side simulated AI-powered SOP generation, allowing users to describe a desired SOP and see the page update with newly generated (placeholder) content. Users can save their current SOP (default or generated) as a structured ZIP file and later load SOPs from such folders.

**Key Technologies:**

*   HTML5
*   Tailwind CSS (for styling and UI components)
*   Vanilla JavaScript (for all client-side logic)
*   bpmn-js (for rendering BPMN diagrams)
*   JSZip (for creating ZIP archives client-side)

## Features

*   **BPMN Diagram Viewing:** Displays SOP process flows using the bpmn-js library.
*   **Dynamic Content Loading:**
    *   Initial default SOP description and procedure steps are loaded from external Markdown files.
    *   Supports loading a complete SOP (diagram, description, steps, metadata) from a user-selected folder.
*   **File Interaction (BPMN Diagram Section):**
    *   Upload custom BPMN XML files to view different diagrams.
    *   Download the currently displayed BPMN diagram as an XML file.
*   **Floating Action Button (FAB) Menu:** Provides quick access to common actions:
    *   **Generate New SOP:** Opens a modal for SOP generation.
    *   **Save SOP (as ZIP):** Packages the current SOP (diagram, description, steps, metadata) into a structured ZIP file for download. The ZIP is named after the SOP title.
    *   **Load SOP from Folder:** Allows users to select a folder (previously created by extracting a saved SOP ZIP) to load its content into the application.
    *   **Print SOP:** Triggers the browser's print functionality for the current page view.
*   **Intelligent SOP Generation:**
    *   Users can input a description of an SOP they wish to create via a modal.
    *   **Process Type Detection:** Automatically detects the type of business process (refund, onboarding, approval, procurement, customer service) based on keywords in the user input.
    *   **Domain-Specific BPMN Generation:** Creates appropriate BPMN diagrams with business logic patterns specific to each process type:
        *   **Refund Process:** Includes validation steps, policy checks, decision gateways, and payment processing
        *   **Onboarding Process:** Features parallel gateways for simultaneous IT setup and HR documentation tasks
        *   **Approval Process:** Contains decision points based on amount thresholds and multi-level approval workflows
        *   **Procurement Process:** Linear workflow from requirements definition through vendor selection to delivery monitoring
        *   **Customer Service Process:** Decision-based routing for simple vs. complex issues with escalation paths
    *   **Contextual Content Generation:** Generates relevant descriptions, actionable procedure steps, risk assessments, and control measures tailored to the detected process type.
    *   **Risk & Mitigation Sections:** Automatically generates process-specific risk assessments and mitigation strategies.
    *   **Control Measures & KPIs:** Creates relevant key performance indicators and monitoring guidelines for each process type.
    *   Includes progress indicators (status messages and a spinner) during the simulated generation process.
    *   Ability to load the default SOP description into the generation modal as a starting point.
*   **Responsive Design:** Styled with Tailwind CSS for a modern look and feel.

## File Structure

```
SOPMaker/
├── sop_content/                 # Contains the default initial SOP content
│   ├── initial_diagram.bpmn
│   ├── description.md
│   └── procedure_steps.md
├── tests/                       # Test files for the application
│   └── sop-generation.test.js   # Unit tests for SOP generation functionality
├── index.html                   # Main HTML file
├── script.js                    # Client-side JavaScript logic (includes intelligent generation)
├── style.css                    # Custom CSS rules
├── tests.json                   # Describes test cases for the application
└── README.md                    # This file
```

**Structure of a Saved SOP (inside the downloaded ZIP, and expected for loading):**

When an SOP is saved, a ZIP file (e.g., `My_SOP_Title.zip`) is created. Upon extraction, it yields a folder named after the SOP title (e.g., `My_SOP_Title/`), containing:

```
My_SOP_Title/ (or chosen SOP title)
├── diagram.bpmn         # BPMN diagram with process-specific business logic
├── description.md       # Contextual description tailored to process type
├── procedure_steps.md   # Actionable procedure steps
├── risks_mitigation.md  # Risk assessment and mitigation strategies
├── control_measures.md  # KPIs and monitoring guidelines
└── metadata.json        # Contains title, subtitle, and footer information
```

## Setup and Running

1.  **Prerequisites:** A modern web browser.
2.  **Running Locally:**
    *   Navigate to the `SOPMaker` directory.
    *   Start a local HTTP server (e.g., `python -m http.server 3001`).
    *   Open `http://localhost:3001/index.html` in your browser.

## Key Functionality Details

*   **Intelligent SOP Generation (Client-Side):**
    *   Entirely client-side, includes sophisticated process type detection and domain-specific content generation (`generatePlaceholderSopData` in `script.js`).
    *   **Process Detection:** Uses keyword analysis to identify business process types (refund, onboarding, approval, procurement, customer service).
    *   **BPMN Generation:** Creates process-specific BPMN diagrams with appropriate business logic patterns (decision gateways, parallel tasks, approval workflows).
    *   **Content Tailoring:** Generates contextual descriptions, actionable steps, risk assessments, and control measures specific to each process type.
    *   Generated content updates the current view but is **not automatically saved to files**. Users must use the "Save SOP (as ZIP)" feature.
*   **Saving SOPs:**
    *   Uses JSZip to create a ZIP archive in the browser.
    *   The ZIP contains a folder named after the SOP title, which includes `diagram.bpmn`, `description.md`, `procedure_steps.md`, `risks_mitigation.md`, `control_measures.md`, and `metadata.json` (for title, subtitle, footer data).
    *   This is a client-side download; the user manages the downloaded ZIP and its extraction.
*   **Loading SOPs from Folder:**
    *   Uses `<input type="file" webkitdirectory>`. The user selects a folder.
    *   JavaScript reads the expected files (`diagram.bpmn`, `description.md`, `procedure_steps.md`, `risks_mitigation.md`, `control_measures.md`, `metadata.json`) from the selected folder's root.
    *   The page content is updated based on these files, including the new risk assessment and control measures sections.
    *   The application relies on the user selecting a folder that matches the expected structure (typically one created by extracting a previously saved SOP ZIP).
*   **Content Loading (Initial & Markdown):**
    *   The default initial SOP is loaded from `sop_content/`.
    *   Markdown for description is rendered in `<pre>` tags.
    *   Markdown for procedure steps is parsed by a custom JS function into styled HTML.
*   **Styling:** Uses Tailwind CSS and custom styles in `style.css`.

## Future Enhancements

*   **Backend Integration & Data Persistence:**
    *   Connect to a backend service for actual AI-powered SOP content generation (e.g., using OpenAI).
    *   Implement robust server-side saving, retrieval, and management of multiple SOP documents (replacing the client-side ZIP/folder method for a more integrated experience).
    *   SOP Versioning and History: Track changes and allow users to revert to previous versions.
*   **User Management & Collaboration:**
    *   User Authentication: Implement user accounts for personalized SOP management.
    *   User Roles and Permissions: Define roles (viewer, editor, admin) for granular access control.
    *   Enhanced Collaboration Features: Support for comments, review workflows, and SOP sharing.
*   **Content Creation & Management:**
    *   Rich Markdown/Text Editor: Integrate a WYSIWYG or advanced Markdown editor.
    *   In-Page Editing: Allow more seamless direct editing of textual SOP content.
    *   Direct BPMN Diagram Editing: Integrate `bpmn-js-modeler`.
    *   SOP Templates: Provide a library of common SOP templates and allow users to save their own SOPs as templates.
    *   Structured Metadata & Tagging: For better organization and search (with backend).
    *   AI-Powered Content Refinement: Suggest improvements for clarity, consistency, and completeness.
*   **Usability & Output:**
    *   Customizable Export Formats: Allow exporting the complete SOP to formats like PDF or Word.
    *   Comprehensive Accessibility Audit & Enhancements (WCAG).
    *   Notifications & Reminders: For SOP review dates or workflow updates.
*   **Technical Improvements:**
    *   Advanced Error Handling and user-friendly feedback.
    *   Expanded Automated Testing (e.g., with Playwright Test runner).