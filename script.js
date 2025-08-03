// Global variables for BPMN functionality
let bpmnViewer;
let bpmnModeler;
let isEditMode = false;

// Make isEditMode accessible via window object
window.isEditMode = isEditMode;

document.addEventListener('DOMContentLoaded', function() {
    // Initial BPMN XML is now in initial_diagram.bpmn

    const diagramContainer = document.getElementById('diagram');
    const uploadStatus = document.getElementById('uploadStatus');
    const loadingMessageElement = diagramContainer ? diagramContainer.querySelector('.loading-message') : null;

    // BPMN editing elements
    const editDiagramBtn = document.getElementById('editDiagramBtn');
    const diagramEditControls = document.getElementById('diagramEditControls');
    const cancelDiagramEdit = document.getElementById('cancelDiagramEdit');
    const saveDiagramEdit = document.getElementById('saveDiagramEdit');

    // SOP Generation Modal Elements
    const sopGeneratorModal = document.getElementById('sopGeneratorModal');
    const closeSopGeneratorModalBtn = document.getElementById('closeSopGeneratorModalBtn');
    const cancelSopGenerationBtn = document.getElementById('cancelSopGenerationBtn');
    const generateSopBtn = document.getElementById('generateSopBtn');
    const sopDescriptionInput = document.getElementById('sopDescriptionInput');
    const sopGeneratorStatus = document.getElementById('sopGeneratorStatus');
    const sopGeneratorSpinner = document.getElementById('sopGeneratorSpinner'); // Get spinner element
    const loadInitialDescriptionBtn = document.getElementById('loadInitialDescriptionBtn'); // New button

    // FAB Menu Elements
    const fabContainer = document.querySelector('.fab-container');
    const mainFabToggleBtn = document.getElementById('mainFabToggleBtn');
    const mainFabIcon = document.getElementById('mainFabIcon');
    const generateSopFabBtn = document.getElementById('generateSopFabBtn');
    const saveSopZipFabBtn = document.getElementById('saveSopZipFabBtn');
    const loadSopFolderFabBtn = document.getElementById('loadSopFolderFabBtn');
    const printSopFabBtn = document.getElementById('printSopFabBtn');
    const fabActionButtons = [generateSopFabBtn, saveSopZipFabBtn, loadSopFolderFabBtn, printSopFabBtn];

    // Hidden input for loading SOP from folder
    const loadSopFolderInput = document.getElementById('loadSopFolderInput');

    // Page elements to update
    const pageTitleElement = document.querySelector('title');
    const mainHeaderElement = document.querySelector('header h1');
    const mainSubHeaderElement = document.querySelector('header div.text-lg'); // For the subtitle
    // Footer elements (assuming structure from previous updates)
    const footerDocIdElement = document.querySelector('footer .document-controls div:nth-child(1) span:last-child');
    const footerVersionElement = document.querySelector('footer .document-controls div:nth-child(2) span:last-child');
    const footerEffectiveDateElement = document.querySelector('footer .document-controls div:nth-child(3) span:last-child');
    const footerReviewDateElement = document.querySelector('footer .document-controls div:nth-child(4) span:last-child');
    const footerApprovedByElement = document.querySelector('footer .document-controls div:nth-child(5) span:last-child');
    const footerDepartmentElement = document.querySelector('footer .document-controls div:nth-child(6) span:last-child');

    // Global state for current SOP data (useful for saving)
    window.currentSopData = {
        title: "Accounts System SOP - Payment Processing", // Initial title
        bpmnXml: null,
        descriptionMd: null,
        stepsMd: null,
        risksMd: null,
        controlsMd: null,
        footerData: {
            docId: "AP-SOP-2025-042",
            version: "2.3",
            effectiveDate: "May 15, 2025",
            reviewDate: "May 15, 2026",
            approvedBy: "J. Thompson, CFO",
            department: "Finance & Accounting"
        }
    };
    let currentSopData = window.currentSopData; // Local reference for backward compatibility

    if (!diagramContainer) {
        console.error('Diagram container #diagram not found.');
        if(loadingMessageElement) loadingMessageElement.textContent = 'Error: Diagram container not found.';
        // return; // Allow other UI like FAB to still work
    }

    if (window.BpmnJS && diagramContainer) {
        try {
            // Initialize viewer mode first (read-only)
            bpmnViewer = new window.BpmnJS({
                container: diagramContainer
            });

            // Make viewer globally accessible for debugging
            window.bpmnViewer = bpmnViewer;

            // Don't initialize modeler until needed to avoid conflicts
            bpmnModeler = null;

            console.log('BPMN viewer initialized successfully');
        } catch (err) {
            console.error('Error initializing BPMN viewer:', err);
            if(loadingMessageElement) {
                loadingMessageElement.innerHTML = '<div class="text-red-600 p-4 text-center">Error initializing BPMN viewer: ' + err.message + '</div>';
                loadingMessageElement.style.display = 'flex';
            }
        }
    } else {
        console.error('BpmnJS library is not loaded or diagram container not found. Check script tags.');
        if(loadingMessageElement && diagramContainer) { // check diagramContainer exists
            loadingMessageElement.innerHTML = '<div class="text-red-600 p-4 text-center">Error: BPMN Modeler library (BpmnJS) not found. Please check the script link.</div>';
            loadingMessageElement.style.display = 'flex';
        }
    }

    async function openDiagram(xml) {
        console.log('🔄 openDiagram called with XML length:', xml ? xml.length : 'null');
        console.log('🔄 isEditMode:', isEditMode);
        console.log('🔄 bpmnViewer initialized:', !!bpmnViewer);

        currentSopData.bpmnXml = xml; // Store current BPMN XML

        // Only use this function for viewer mode now
        // Edit mode handles its own diagram loading
        if (isEditMode) {
            console.log('🔄 Skipping openDiagram - in edit mode');
            return;
        }

        if (!bpmnViewer) {
            console.error('BPMN viewer is not initialized.');
            if (uploadStatus) uploadStatus.textContent = 'Error: Diagram viewer not ready.';
            if (loadingMessageElement && diagramContainer) loadingMessageElement.style.display = 'flex';
            return;
        }

        if (loadingMessageElement && diagramContainer) loadingMessageElement.style.display = 'flex';
        if (uploadStatus) uploadStatus.textContent = 'Loading diagram...';

        const existingError = diagramContainer.querySelector('.custom-diagram-error');
        if (existingError) existingError.remove();

        const bjsContainerPre = diagramContainer.querySelector('.bjs-container');
        if (bjsContainerPre) bjsContainerPre.style.display = 'block';

        try {
            await bpmnViewer.importXML(xml);
            if (loadingMessageElement && diagramContainer) loadingMessageElement.style.display = 'none';
            console.log('BPMN XML imported successfully.');
            if (uploadStatus) uploadStatus.textContent = 'Diagram loaded successfully.';

            const canvas = bpmnViewer.get('canvas');
            canvas.zoom('fit-viewport', 'auto');
            window.addEventListener('resize', () => {
                 canvas.zoom('fit-viewport', 'auto');
            });

            // Ensure no editing capabilities in view mode
            try {
                const palette = bpmnViewer.get('palette');
                if (palette && palette._container) {
                    palette._container.style.display = 'none';
                    palette._container.style.visibility = 'hidden';
                }
            } catch (err) {
                // Palette might not exist in viewer mode, which is expected
                console.log('No palette in viewer mode (expected)');
            }

            // Disable context pad in view mode
            try {
                const contextPad = bpmnViewer.get('contextPad');
                if (contextPad) {
                    contextPad.close();
                }
            } catch (err) {
                // Context pad might not exist in viewer mode, which is expected
                console.log('No context pad in viewer mode (expected)');
            }

            const bjsContainerPost = diagramContainer.querySelector('.bjs-container');
            if (bjsContainerPost) bjsContainerPost.style.display = 'block';

            console.log('View mode active: Navigation only (zoom, pan). No editing capabilities.');

        } catch (err) {
            console.error('Error importing BPMN XML:', err);
            if (loadingMessageElement && diagramContainer) loadingMessageElement.style.display = 'none';
            if (uploadStatus) uploadStatus.textContent = `Error loading diagram: ${err.message || 'Invalid XML or processing error.'}`;

            const errorDiv = document.createElement('div');
            errorDiv.className = 'custom-diagram-error p-4 text-center text-red-600 bg-red-100 border border-red-300 rounded-md';
            errorDiv.innerHTML = `<p><strong>Error loading diagram.</strong></p><p class="text-sm mt-1">${err.message || 'Invalid XML or processing error.'}</p>`;

            const bjsContainer = diagramContainer.querySelector('.bjs-container');
            if (bjsContainer) bjsContainer.style.display = 'none';

            if (diagramContainer) diagramContainer.appendChild(errorDiv);
        }
    }

    // BPMN Editing Functions (make globally accessible)
    window.enterEditMode = async function() {
        if (!currentSopData.bpmnXml) {
            console.error('Cannot enter edit mode: no diagram loaded');
            return;
        }

        // Initialize modeler if not already done
        if (!bpmnModeler) {
            try {
                // Use the full modeler with editing capabilities
                bpmnModeler = new window.BpmnJS({
                    container: diagramContainer,
                    keyboard: {
                        bindTo: window
                    }
                });

                // Store globally for debugging
                window.bpmnModeler = bpmnModeler;
            } catch (err) {
                console.error('Error initializing BPMN modeler:', err);
                return;
            }
        }

        isEditMode = true;
        window.isEditMode = true;

        // Destroy viewer to avoid conflicts
        if (bpmnViewer) {
            try {
                bpmnViewer.destroy();
            } catch (err) {
                console.log('Error destroying viewer:', err);
            }
        }

        // Show edit controls
        if (diagramEditControls) {
            diagramEditControls.classList.remove('hidden');
        }

        // Update button text
        if (editDiagramBtn) {
            editDiagramBtn.innerHTML = `
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                View Mode
            `;
            editDiagramBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            editDiagramBtn.classList.add('bg-gray-500', 'hover:bg-gray-600');
        }

        // Load diagram in modeler with full editing capabilities
        try {
            await bpmnModeler.importXML(currentSopData.bpmnXml);
            if (loadingMessageElement) loadingMessageElement.style.display = 'none';

            // Enable all editing features
            const canvas = bpmnModeler.get('canvas');
            const palette = bpmnModeler.get('palette');

            // Ensure palette is visible and functional
            if (palette && palette._container) {
                palette._container.style.display = 'block';
                palette._container.style.visibility = 'visible';
            }

            // Fit viewport and enable interactions
            canvas.zoom('fit-viewport', 'auto');

            console.log('Edit mode enabled: Full BPMN editing capabilities active');
            if (uploadStatus) uploadStatus.textContent = 'Edit mode enabled. Use the palette to add elements and click elements to modify them.';
        } catch (err) {
            console.error('Error loading diagram in modeler:', err);
            if (uploadStatus) uploadStatus.textContent = `Error loading diagram for editing: ${err.message}`;
        }
    };

    window.exitEditMode = async function() {
        isEditMode = false;
        window.isEditMode = false;

        // Hide edit controls
        if (diagramEditControls) {
            diagramEditControls.classList.add('hidden');
        }

        // Update button text
        if (editDiagramBtn) {
            editDiagramBtn.innerHTML = `
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Edit Diagram
            `;
            editDiagramBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
            editDiagramBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
        }

        // Destroy modeler to avoid conflicts
        if (bpmnModeler) {
            try {
                bpmnModeler.destroy();
            } catch (err) {
                console.log('Error destroying modeler:', err);
            }
            bpmnModeler = null;
        }

        // Reinitialize viewer (view-only mode)
        try {
            bpmnViewer = new window.BpmnJS({
                container: diagramContainer
            });

            // Load diagram in viewer (no editing capabilities)
            await bpmnViewer.importXML(currentSopData.bpmnXml);
            if (loadingMessageElement) loadingMessageElement.style.display = 'none';

            // Ensure no palette or editing capabilities in view mode
            try {
                const palette = bpmnViewer.get('palette');
                if (palette && palette._container) {
                    palette._container.style.display = 'none';
                    palette._container.style.visibility = 'hidden';
                }
            } catch (err) {
                // Palette might not exist in viewer mode, which is expected
                console.log('No palette in viewer mode (expected)');
            }

            // Disable context pad in view mode
            try {
                const contextPad = bpmnViewer.get('contextPad');
                if (contextPad) {
                    contextPad.close();
                }
            } catch (err) {
                // Context pad might not exist in viewer mode, which is expected
                console.log('No context pad in viewer mode (expected)');
            }

            const canvas = bpmnViewer.get('canvas');
            canvas.zoom('fit-viewport', 'auto');

            console.log('View mode enabled: Navigation only (zoom, pan). No editing capabilities.');
            if (uploadStatus) uploadStatus.textContent = 'View mode enabled. Click "Edit Diagram" to modify the diagram.';
        } catch (err) {
            console.error('Error loading diagram in viewer:', err);
            if (uploadStatus) uploadStatus.textContent = `Error loading diagram: ${err.message}`;
        }
    };

    async function saveDiagramChanges() {
        console.log('saveDiagramChanges called');
        console.log('bpmnModeler exists:', !!bpmnModeler);
        console.log('isEditMode:', window.isEditMode);

        if (!bpmnModeler || !window.isEditMode) {
            console.error('Cannot save: not in edit mode or modeler not ready');
            return;
        }

        try {
            console.log('Saving diagram changes...');
            const { xml } = await bpmnModeler.saveXML({ format: true });
            currentSopData.bpmnXml = xml;

            if (uploadStatus) uploadStatus.textContent = 'Diagram changes saved successfully.';

            // Exit edit mode and return to viewer
            console.log('Calling window.exitEditMode...');
            window.exitEditMode();

            // Show success message briefly
            setTimeout(() => {
                if (uploadStatus) uploadStatus.textContent = 'Diagram loaded successfully.';
            }, 2000);

        } catch (err) {
            console.error('Error saving diagram:', err);
            if (uploadStatus) uploadStatus.textContent = `Error saving diagram: ${err.message}`;
        }
    }

    async function loadInitialDiagram(filePath = 'sop_content/initial_diagram.bpmn') {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} loading ${filePath}`);
            }
            const bpmnXML = await response.text();
            openDiagram(bpmnXML);
        } catch (error) {
            console.error(`Error fetching diagram ${filePath}:`, error);
            if (loadingMessageElement && diagramContainer) {
                loadingMessageElement.innerHTML = `<div class="text-red-600 p-4 text-center">Error: Could not load diagram from ${filePath}.</div>`;
                loadingMessageElement.style.display = 'flex';
            }
            if (uploadStatus) uploadStatus.textContent = `Error loading diagram from ${filePath}.`;
        }
    }

    async function loadDescriptionContent(filePath = 'sop_content/description.md', containerId = 'descriptionContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID ${containerId} not found.`);
            return;
        }
        container.innerHTML = '<p class="text-slate-500">Loading description...</p>'; // Reset to loading
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for file ${filePath}`);
            }
            const markdownText = await response.text();
            currentSopData.descriptionMd = markdownText; // Store it
            container.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: inherit;">${markdownText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
        } catch (error) {
            console.error(`Error fetching Markdown file ${filePath}:`, error);
            container.innerHTML = `<p class="text-red-600">Error loading content from ${filePath}.</p>`;
        }
    }

    function parseProcedureStepsMarkdownToHtml(markdown) {
        const steps = markdown.trim().split(/\n\s*\n/);
        let html = '<ul class="step-tree">';
        steps.forEach(stepMarkdown => {
            if (!stepMarkdown.trim()) return;
            const lines = stepMarkdown.trim().split('\n');
            const titleLine = lines[0].trim();
            const descriptionLines = lines.slice(1).map(l => l.trim()).join(' ');
            const titleMatch = titleLine.match(/^(\d+)\.\s*\*\*(.*)\*\*/);
            if (titleMatch) {
                const stepNumber = titleMatch[1];
                const stepText = titleMatch[2];
                const fullTitle = `${stepNumber}. ${stepText}`;
                html += `<li><div class="step-title text-lg font-semibold text-dark mb-1">${fullTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div><p class="text-slate-600 mb-2">${descriptionLines.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></li>`;
            } else {
                html += `<li><p class="text-red-500">Error parsing step.</p><pre>${stepMarkdown.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></li>`;
            }
        });
        html += '</ul>';
        return html;
    }

    async function loadProcedureStepsContent(filePath = 'sop_content/procedure_steps.md', containerId = 'procedureStepsContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID ${containerId} not found.`);
            return;
        }
        container.innerHTML = '<p class="text-slate-500">Loading procedure steps...</p>'; // Reset to loading
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for file ${filePath}`);
            }
            const markdownText = await response.text();
            currentSopData.stepsMd = markdownText; // Store it
            const htmlContent = parseProcedureStepsMarkdownToHtml(markdownText);
            container.innerHTML = htmlContent;
        } catch (error) {
            console.error(`Error fetching or parsing Markdown file ${filePath}:`, error);
            container.innerHTML = `<p class="text-red-600">Error loading procedure steps from ${filePath}.</p>`;
        }
    }

    function updatePageTitle(newTitle, newSubtitle = "Generated SOP Content") {
        currentSopData.title = newTitle; // Store it
        if (pageTitleElement) pageTitleElement.textContent = newTitle + " - SOP";
        if (mainHeaderElement) mainHeaderElement.textContent = newTitle;
        if (mainSubHeaderElement) mainSubHeaderElement.textContent = newSubtitle;
    }

    function updateFooter(footerData) {
        currentSopData.footerData = footerData; // Store it
        if (footerDocIdElement) footerDocIdElement.textContent = footerData.docId || 'N/A';
        if (footerVersionElement) footerVersionElement.textContent = footerData.version || 'N/A';
        if (footerEffectiveDateElement) footerEffectiveDateElement.textContent = footerData.effectiveDate || 'N/A';
        if (footerReviewDateElement) footerReviewDateElement.textContent = footerData.reviewDate || 'N/A';
        if (footerApprovedByElement) footerApprovedByElement.textContent = footerData.approvedBy || 'N/A';
        if (footerDepartmentElement) footerDepartmentElement.textContent = footerData.department || 'N/A';
    }

    // --- SOP Generation Logic ---
    function openSopModal() {
        if (sopGeneratorModal) {
            sopGeneratorModal.classList.remove('hidden');
            // Trigger animation
            setTimeout(() => {
                sopGeneratorModal.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0');
                sopGeneratorModal.querySelector('.modal-content').classList.add('scale-100', 'opacity-100');
            }, 10); // Small delay to ensure transition takes effect
            if (sopDescriptionInput) sopDescriptionInput.value = ''; // Clear previous input
            if (sopGeneratorStatus) sopGeneratorStatus.textContent = ''; // Clear status
        }
    }

    function closeSopModal() {
        if (sopGeneratorModal) {
             sopGeneratorModal.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
             sopGeneratorModal.querySelector('.modal-content').classList.remove('scale-100', 'opacity-100');
            setTimeout(() => {
                sopGeneratorModal.classList.add('hidden');
            }, 300); // Match transition duration
        }
    }

    async function handleSopGenerationRequest() {
        const userInput = sopDescriptionInput.value.trim();
        if (!userInput) {
            if (sopGeneratorStatus) sopGeneratorStatus.textContent = 'Please enter a description for the SOP.';
            if (sopGeneratorSpinner) sopGeneratorSpinner.classList.add('hidden');
            return;
        }

        if (sopGeneratorStatus) sopGeneratorStatus.textContent = 'Preparing generation...';
        if (sopGeneratorSpinner) sopGeneratorSpinner.classList.remove('hidden');
        generateSopBtn.disabled = true;
        cancelSopGenerationBtn.disabled = true;

        try {
            // Use real AI generation instead of hardcoded templates
            const generatedData = await generateRealSopData(userInput, sopGeneratorStatus, sopGeneratorSpinner);
            currentSopData = { ...generatedData }; // Update global state

            if (sopGeneratorStatus) sopGeneratorStatus.textContent = 'Updating page content...';
            await new Promise(resolve => setTimeout(resolve, 200));
            updatePageTitle(currentSopData.title, currentSopData.subtitle || "Generated SOP Content");
            updateFooter(currentSopData.footerData);

            // Generate simple BPMN from process steps
            console.log('🔄 Generating BPMN from process steps:', generatedData.processSteps?.length || 0);
            const bpmnXml = generateSimpleBpmnFromSteps(generatedData.processSteps || []);
            console.log('🔄 Generated BPMN XML length:', bpmnXml ? bpmnXml.length : 'null');

            if (bpmnXml) {
                currentSopData.bpmnXml = bpmnXml;
                console.log('🔄 Calling openDiagram with generated BPMN...');
                openDiagram(bpmnXml);
            } else {
                // Fallback to generic BPMN if generation fails
                console.log('🔄 BPMN generation failed, using fallback...');
                const fallbackBpmn = generateBusinessProcessBPMN('generic', 'Generated process');
                currentSopData.bpmnXml = fallbackBpmn;
                console.log('🔄 Calling openDiagram with fallback BPMN...');
                openDiagram(fallbackBpmn);
            }

            const descriptionContainer = document.getElementById('descriptionContainer');
            if (descriptionContainer) {
                descriptionContainer.innerHTML = parseMarkdownToHtml(currentSopData.descriptionMd);
            }

            // Update RACM data
            if (currentSopData.racmData && Array.isArray(currentSopData.racmData)) {
                racmData = [...currentSopData.racmData];
                renderRacmTable();
            }

            if (sopGeneratorStatus) sopGeneratorStatus.textContent = 'SOP generated and displayed successfully!';
            await new Promise(resolve => setTimeout(resolve, 1500));
            closeSopModal();

        } catch (error) {
            console.error("Error generating SOP:", error);
            if (sopGeneratorStatus) sopGeneratorStatus.textContent = `Error: ${error.message}`;
        } finally {
            if (sopGeneratorSpinner) sopGeneratorSpinner.classList.add('hidden');
            generateSopBtn.disabled = false;
            cancelSopGenerationBtn.disabled = false;
        }
    }

    // Real AI-powered SOP generation
    async function generateRealSopData(userInput, statusElement, spinnerElement) {
        const updateStatus = (text) => {
            if (statusElement) statusElement.textContent = text;
        };

        updateStatus('Connecting to AI service...');
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            updateStatus('AI is analyzing your request...');

            const response = await fetch('/api/generate-sop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userInput })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            updateStatus('AI is creating your SOP...');
            const result = await response.json();

            updateStatus('Processing AI response...');
            await new Promise(resolve => setTimeout(resolve, 300));

            // Transform AI response to our format
            const sopData = result.sopData;

            return {
                title: sopData.title || 'Generated SOP',
                subtitle: sopData.subtitle || 'AI Generated Content',
                descriptionMd: sopData.description || 'No description provided',
                processSteps: sopData.processSteps || [],
                racmData: sopData.racmData || [],
                footerData: {
                    documentId: 'AI-SOP-' + Date.now(),
                    version: '1.0',
                    effectiveDate: new Date().toLocaleDateString(),
                    reviewDate: new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString(),
                    approvedBy: 'AI Generated',
                    department: 'Operations'
                }
            };

        } catch (error) {
            console.error('AI SOP generation failed:', error);
            updateStatus('AI service unavailable, using fallback...');

            // Fallback to original template system
            return await generatePlaceholderSopData(userInput, statusElement, spinnerElement);
        }
    }

    // Generate simple BPMN from process steps
    function generateSimpleBpmnFromSteps(steps) {
        if (!steps || steps.length === 0) {
            // Return a simple start->end process
            return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start Process">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Execute Process">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="End Process">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
        }

        let bpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>`;

        // Add tasks for each step
        steps.forEach((step, index) => {
            const taskId = `Task_${index + 1}`;
            const flowId = `Flow_${index + 2}`;
            const stepName = step.replace(/^\d+\.\s*/, '').substring(0, 50); // Remove numbering and limit length

            bpmnXml += `
    <bpmn:task id="${taskId}" name="${stepName}">
      <bpmn:incoming>Flow_${index + 1}</bpmn:incoming>
      <bpmn:outgoing>${flowId}</bpmn:outgoing>
    </bpmn:task>`;
        });

        // Add end event
        bpmnXml += `
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_${steps.length + 1}</bpmn:incoming>
    </bpmn:endEvent>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>`;

        // Add shapes for each task
        steps.forEach((step, index) => {
            const taskId = `Task_${index + 1}`;
            const x = 300 + (index * 150);
            bpmnXml += `
      <bpmndi:BPMNShape id="${taskId}_di" bpmnElement="${taskId}">
        <dc:Bounds x="${x}" y="77" width="100" height="80" />
      </bpmndi:BPMNShape>`;
        });

        bpmnXml += `
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="${300 + (steps.length * 150)}" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

        return bpmnXml;
    }

    // Process type detection and business logic (fallback)
    function detectProcessType(userInput) {
        const input = userInput.toLowerCase();

        // Refund process keywords
        if (input.includes('refund') || input.includes('return') || input.includes('reimburs')) {
            return 'refund';
        }

        // Onboarding process keywords
        if (input.includes('onboard') || input.includes('new employee') || input.includes('new hire') ||
            (input.includes('employee') && (input.includes('setup') || input.includes('orientation')))) {
            return 'onboarding';
        }

        // Approval process keywords
        if (input.includes('approval') || input.includes('authorize') || input.includes('review') ||
            (input.includes('expense') && input.includes('approve'))) {
            return 'approval';
        }

        // Procurement process keywords
        if (input.includes('procurement') || input.includes('purchase') || input.includes('vendor') ||
            input.includes('supplier') || input.includes('buying')) {
            return 'procurement';
        }

        // Customer service keywords
        if (input.includes('customer service') || input.includes('support') || input.includes('complaint') ||
            input.includes('customer issue')) {
            return 'customer_service';
        }

        // Default to generic
        return 'generic';
    }

    function generateProcessTitle(processType, userInput) {
        const titleTemplates = {
            'refund': 'Customer Refund Processing SOP',
            'onboarding': 'Employee Onboarding SOP',
            'approval': 'Approval Workflow SOP',
            'procurement': 'Procurement and Purchasing SOP',
            'customer_service': 'Customer Service SOP',
            'generic': 'Business Process SOP'
        };

        const baseTitle = titleTemplates[processType] || titleTemplates['generic'];

        // Try to extract specific context from user input
        const words = userInput.split(' ').slice(0, 3);
        const context = words.join(' ');

        if (context.length > 5 && processType !== 'generic') {
            return `${baseTitle} - ${context.charAt(0).toUpperCase() + context.slice(1)}`;
        }

        return baseTitle;
    }

    function generateBusinessProcessBPMN(processType, userInput) {
        const processTemplates = {
            'refund': generateRefundProcessBPMN,
            'onboarding': generateOnboardingProcessBPMN,
            'approval': generateApprovalProcessBPMN,
            'procurement': generateProcurementProcessBPMN,
            'customer_service': generateCustomerServiceBPMN,
            'generic': generateGenericProcessBPMN
        };

        const generator = processTemplates[processType] || processTemplates['generic'];
        return generator(userInput);
    }

    function generateRefundProcessBPMN(userInput) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_Refund" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_Refund" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Refund Request Received">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Validate Request Details">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_1" name="Valid Request?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_2" name="Check Refund Policy">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_2" name="Within Policy?">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
      <bpmn:outgoing>Flow_7</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_3" name="Calculate Refund Amount">
      <bpmn:incoming>Flow_6</bpmn:incoming>
      <bpmn:outgoing>Flow_8</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_4" name="Process Payment">
      <bpmn:incoming>Flow_8</bpmn:incoming>
      <bpmn:outgoing>Flow_9</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_5" name="Send Confirmation">
      <bpmn:incoming>Flow_9</bpmn:incoming>
      <bpmn:outgoing>Flow_10</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_6" name="Escalate to Manager">
      <bpmn:incoming>Flow_7</bpmn:incoming>
      <bpmn:outgoing>Flow_11</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_7" name="Reject Request">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:incoming>Flow_12</bpmn:incoming>
      <bpmn:outgoing>Flow_13</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_3" name="Manager Approved?">
      <bpmn:incoming>Flow_11</bpmn:incoming>
      <bpmn:outgoing>Flow_14</bpmn:outgoing>
      <bpmn:outgoing>Flow_12</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:endEvent id="EndEvent_1" name="Refund Completed">
      <bpmn:incoming>Flow_10</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="EndEvent_2" name="Request Rejected">
      <bpmn:incoming>Flow_13</bpmn:incoming>
    </bpmn:endEvent>

    <!-- Sequence Flows -->
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_3" name="Yes" sourceRef="Gateway_1" targetRef="Task_2" />
    <bpmn:sequenceFlow id="Flow_4" name="No" sourceRef="Gateway_1" targetRef="Task_7" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_2" targetRef="Gateway_2" />
    <bpmn:sequenceFlow id="Flow_6" name="Yes" sourceRef="Gateway_2" targetRef="Task_3" />
    <bpmn:sequenceFlow id="Flow_7" name="No" sourceRef="Gateway_2" targetRef="Task_6" />
    <bpmn:sequenceFlow id="Flow_8" sourceRef="Task_3" targetRef="Task_4" />
    <bpmn:sequenceFlow id="Flow_9" sourceRef="Task_4" targetRef="Task_5" />
    <bpmn:sequenceFlow id="Flow_10" sourceRef="Task_5" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_11" sourceRef="Task_6" targetRef="Gateway_3" />
    <bpmn:sequenceFlow id="Flow_12" name="No" sourceRef="Gateway_3" targetRef="Task_7" />
    <bpmn:sequenceFlow id="Flow_13" sourceRef="Task_7" targetRef="EndEvent_2" />
    <bpmn:sequenceFlow id="Flow_14" name="Yes" sourceRef="Gateway_3" targetRef="Task_3" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_Refund">
    <bpmndi:BPMNPlane id="BPMNPlane_Refund" bpmnElement="Process_Refund">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1"><dc:Bounds x="100" y="200" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="76" y="243" width="84" height="27" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1"><dc:Bounds x="200" y="178" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1" isMarkerVisible="true"><dc:Bounds x="350" y="193" width="50" height="50" /><bpmndi:BPMNLabel><dc:Bounds x="340" y="163" width="70" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2_di" bpmnElement="Task_2"><dc:Bounds x="450" y="178" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_2_di" bpmnElement="Gateway_2" isMarkerVisible="true"><dc:Bounds x="600" y="193" width="50" height="50" /><bpmndi:BPMNLabel><dc:Bounds x="590" y="163" width="70" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_3_di" bpmnElement="Task_3"><dc:Bounds x="700" y="178" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_4_di" bpmnElement="Task_4"><dc:Bounds x="850" y="178" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_5_di" bpmnElement="Task_5"><dc:Bounds x="1000" y="178" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1"><dc:Bounds x="1150" y="200" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="1126" y="243" width="84" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_6_di" bpmnElement="Task_6"><dc:Bounds x="575" y="300" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_3_di" bpmnElement="Gateway_3" isMarkerVisible="true"><dc:Bounds x="725" y="315" width="50" height="50" /><bpmndi:BPMNLabel><dc:Bounds x="708" y="285" width="84" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_7_di" bpmnElement="Task_7"><dc:Bounds x="450" y="400" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_2_di" bpmnElement="EndEvent_2"><dc:Bounds x="482" y="520" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="458" y="563" width="84" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>

      <!-- Edges -->
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1"><di:waypoint x="136" y="218" /><di:waypoint x="200" y="218" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2"><di:waypoint x="300" y="218" /><di:waypoint x="350" y="218" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3"><di:waypoint x="400" y="218" /><di:waypoint x="450" y="218" /><bpmndi:BPMNLabel><dc:Bounds x="417" y="200" width="18" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4"><di:waypoint x="375" y="243" /><di:waypoint x="375" y="440" /><di:waypoint x="450" y="440" /><bpmndi:BPMNLabel><dc:Bounds x="384" y="339" width="15" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5"><di:waypoint x="550" y="218" /><di:waypoint x="600" y="218" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6"><di:waypoint x="650" y="218" /><di:waypoint x="700" y="218" /><bpmndi:BPMNLabel><dc:Bounds x="667" y="200" width="18" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_7_di" bpmnElement="Flow_7"><di:waypoint x="625" y="243" /><di:waypoint x="625" y="300" /><bpmndi:BPMNLabel><dc:Bounds x="634" y="269" width="15" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_8_di" bpmnElement="Flow_8"><di:waypoint x="800" y="218" /><di:waypoint x="850" y="218" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_9_di" bpmnElement="Flow_9"><di:waypoint x="950" y="218" /><di:waypoint x="1000" y="218" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_10_di" bpmnElement="Flow_10"><di:waypoint x="1100" y="218" /><di:waypoint x="1150" y="218" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_11_di" bpmnElement="Flow_11"><di:waypoint x="675" y="340" /><di:waypoint x="725" y="340" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_12_di" bpmnElement="Flow_12"><di:waypoint x="750" y="365" /><di:waypoint x="750" y="440" /><di:waypoint x="550" y="440" /><bpmndi:BPMNLabel><dc:Bounds x="759" y="400" width="15" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_13_di" bpmnElement="Flow_13"><di:waypoint x="500" y="480" /><di:waypoint x="500" y="520" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_14_di" bpmnElement="Flow_14"><di:waypoint x="750" y="315" /><di:waypoint x="750" y="258" /><bpmndi:BPMNLabel><dc:Bounds x="757" y="284" width="18" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
    }

    function generateGenericProcessBPMN(userInput) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_Generic" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_Generic" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Process Started">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Receive Request">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_2" name="Process Request">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_3" name="Complete Process">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Process Completed">
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Task_2" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_2" targetRef="Task_3" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_3" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_Generic">
    <bpmndi:BPMNPlane id="BPMNPlane_Generic" bpmnElement="Process_Generic">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1"><dc:Bounds x="179" y="159" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="160" y="202" width="74" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1"><dc:Bounds x="270" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2_di" bpmnElement="Task_2"><dc:Bounds x="430" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_3_di" bpmnElement="Task_3"><dc:Bounds x="590" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1"><dc:Bounds x="742" y="159" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="716" y="202" width="88" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1"><di:waypoint x="215" y="177" /><di:waypoint x="270" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2"><di:waypoint x="370" y="177" /><di:waypoint x="430" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3"><di:waypoint x="530" y="177" /><di:waypoint x="590" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4"><di:waypoint x="690" y="177" /><di:waypoint x="742" y="177" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
    }

    function generateOnboardingProcessBPMN(userInput) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_Onboarding" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_Onboarding" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="New Employee Hired">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Prepare workspace">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:parallelGateway id="Gateway_1" name="Parallel Setup">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:parallelGateway>
    <bpmn:task id="Task_2" name="IT Setup">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_3" name="HR Documentation">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:parallelGateway id="Gateway_2" name="Sync Point">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:incoming>Flow_6</bpmn:incoming>
      <bpmn:outgoing>Flow_7</bpmn:outgoing>
    </bpmn:parallelGateway>
    <bpmn:task id="Task_4" name="Create user accounts">
      <bpmn:incoming>Flow_7</bpmn:incoming>
      <bpmn:outgoing>Flow_8</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_5" name="Schedule orientation">
      <bpmn:incoming>Flow_8</bpmn:incoming>
      <bpmn:outgoing>Flow_9</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Onboarding Complete">
      <bpmn:incoming>Flow_9</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Gateway_1" targetRef="Task_2" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Gateway_1" targetRef="Task_3" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_2" targetRef="Gateway_2" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_3" targetRef="Gateway_2" />
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Gateway_2" targetRef="Task_4" />
    <bpmn:sequenceFlow id="Flow_8" sourceRef="Task_4" targetRef="Task_5" />
    <bpmn:sequenceFlow id="Flow_9" sourceRef="Task_5" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_Onboarding">
    <bpmndi:BPMNPlane id="BPMNPlane_Onboarding" bpmnElement="Process_Onboarding">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1"><dc:Bounds x="179" y="159" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="155" y="202" width="84" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1"><dc:Bounds x="270" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1"><dc:Bounds x="425" y="152" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2_di" bpmnElement="Task_2"><dc:Bounds x="530" y="80" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_3_di" bpmnElement="Task_3"><dc:Bounds x="530" y="200" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_2_di" bpmnElement="Gateway_2"><dc:Bounds x="685" y="152" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_4_di" bpmnElement="Task_4"><dc:Bounds x="790" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_5_di" bpmnElement="Task_5"><dc:Bounds x="950" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1"><dc:Bounds x="1112" y="159" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="1088" y="202" width="84" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1"><di:waypoint x="215" y="177" /><di:waypoint x="270" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2"><di:waypoint x="370" y="177" /><di:waypoint x="425" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3"><di:waypoint x="450" y="152" /><di:waypoint x="450" y="120" /><di:waypoint x="530" y="120" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4"><di:waypoint x="450" y="202" /><di:waypoint x="450" y="240" /><di:waypoint x="530" y="240" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5"><di:waypoint x="630" y="120" /><di:waypoint x="710" y="120" /><di:waypoint x="710" y="152" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6"><di:waypoint x="630" y="240" /><di:waypoint x="710" y="240" /><di:waypoint x="710" y="202" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_7_di" bpmnElement="Flow_7"><di:waypoint x="735" y="177" /><di:waypoint x="790" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_8_di" bpmnElement="Flow_8"><di:waypoint x="890" y="177" /><di:waypoint x="950" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_9_di" bpmnElement="Flow_9"><di:waypoint x="1050" y="177" /><di:waypoint x="1112" y="177" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
    }

    function generateApprovalProcessBPMN(userInput) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_Approval" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_Approval" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Approval Request Submitted">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Review Request Details">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_1" name="Amount Check">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_2" name="Manager Approval">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_3" name="Senior Manager Approval">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_2" name="Decision">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:incoming>Flow_6</bpmn:incoming>
      <bpmn:outgoing>Flow_7</bpmn:outgoing>
      <bpmn:outgoing>Flow_8</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_4" name="Process Approved Request">
      <bpmn:incoming>Flow_7</bpmn:incoming>
      <bpmn:outgoing>Flow_9</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_5" name="Send Rejection Notice">
      <bpmn:incoming>Flow_8</bpmn:incoming>
      <bpmn:outgoing>Flow_10</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Request Processed">
      <bpmn:incoming>Flow_9</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="EndEvent_2" name="Request Rejected">
      <bpmn:incoming>Flow_10</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_3" name="< $1000" sourceRef="Gateway_1" targetRef="Task_2" />
    <bpmn:sequenceFlow id="Flow_4" name=">= $1000" sourceRef="Gateway_1" targetRef="Task_3" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_2" targetRef="Gateway_2" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_3" targetRef="Gateway_2" />
    <bpmn:sequenceFlow id="Flow_7" name="Approved" sourceRef="Gateway_2" targetRef="Task_4" />
    <bpmn:sequenceFlow id="Flow_8" name="Rejected" sourceRef="Gateway_2" targetRef="Task_5" />
    <bpmn:sequenceFlow id="Flow_9" sourceRef="Task_4" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_10" sourceRef="Task_5" targetRef="EndEvent_2" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_Approval">
    <bpmndi:BPMNPlane id="BPMNPlane_Approval" bpmnElement="Process_Approval">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1"><dc:Bounds x="179" y="159" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="155" y="202" width="84" height="27" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1"><dc:Bounds x="270" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1" isMarkerVisible="true"><dc:Bounds x="425" y="152" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2_di" bpmnElement="Task_2"><dc:Bounds x="530" y="80" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_3_di" bpmnElement="Task_3"><dc:Bounds x="530" y="220" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_2_di" bpmnElement="Gateway_2" isMarkerVisible="true"><dc:Bounds x="685" y="152" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_4_di" bpmnElement="Task_4"><dc:Bounds x="790" y="80" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_5_di" bpmnElement="Task_5"><dc:Bounds x="790" y="220" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1"><dc:Bounds x="952" y="102" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="928" y="145" width="84" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_2_di" bpmnElement="EndEvent_2"><dc:Bounds x="952" y="242" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="928" y="285" width="84" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1"><di:waypoint x="215" y="177" /><di:waypoint x="270" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2"><di:waypoint x="370" y="177" /><di:waypoint x="425" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3"><di:waypoint x="450" y="152" /><di:waypoint x="450" y="120" /><di:waypoint x="530" y="120" /><bpmndi:BPMNLabel><dc:Bounds x="460" y="103" width="40" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4"><di:waypoint x="450" y="202" /><di:waypoint x="450" y="260" /><di:waypoint x="530" y="260" /><bpmndi:BPMNLabel><dc:Bounds x="460" y="273" width="50" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5"><di:waypoint x="630" y="120" /><di:waypoint x="710" y="120" /><di:waypoint x="710" y="152" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6"><di:waypoint x="630" y="260" /><di:waypoint x="710" y="260" /><di:waypoint x="710" y="202" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_7_di" bpmnElement="Flow_7"><di:waypoint x="710" y="152" /><di:waypoint x="710" y="120" /><di:waypoint x="790" y="120" /><bpmndi:BPMNLabel><dc:Bounds x="720" y="103" width="50" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_8_di" bpmnElement="Flow_8"><di:waypoint x="710" y="202" /><di:waypoint x="710" y="260" /><di:waypoint x="790" y="260" /><bpmndi:BPMNLabel><dc:Bounds x="720" y="273" width="45" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_9_di" bpmnElement="Flow_9"><di:waypoint x="890" y="120" /><di:waypoint x="952" y="120" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_10_di" bpmnElement="Flow_10"><di:waypoint x="890" y="260" /><di:waypoint x="952" y="260" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
    }

    function generateProcurementProcessBPMN(userInput) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_Procurement" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_Procurement" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Purchase Request Initiated">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Define Requirements">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_2" name="Vendor Research">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_3" name="Request Quotes">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_4" name="Evaluate Proposals">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_5" name="Select Vendor">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_6" name="Create Purchase Order">
      <bpmn:incoming>Flow_6</bpmn:incoming>
      <bpmn:outgoing>Flow_7</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_7" name="Monitor Delivery">
      <bpmn:incoming>Flow_7</bpmn:incoming>
      <bpmn:outgoing>Flow_8</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Procurement Complete">
      <bpmn:incoming>Flow_8</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Task_2" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_2" targetRef="Task_3" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_3" targetRef="Task_4" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_4" targetRef="Task_5" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_5" targetRef="Task_6" />
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Task_6" targetRef="Task_7" />
    <bpmn:sequenceFlow id="Flow_8" sourceRef="Task_7" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_Procurement">
    <bpmndi:BPMNPlane id="BPMNPlane_Procurement" bpmnElement="Process_Procurement">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1"><dc:Bounds x="179" y="159" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="155" y="202" width="84" height="27" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1"><dc:Bounds x="270" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2_di" bpmnElement="Task_2"><dc:Bounds x="420" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_3_di" bpmnElement="Task_3"><dc:Bounds x="570" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_4_di" bpmnElement="Task_4"><dc:Bounds x="720" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_5_di" bpmnElement="Task_5"><dc:Bounds x="870" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_6_di" bpmnElement="Task_6"><dc:Bounds x="1020" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_7_di" bpmnElement="Task_7"><dc:Bounds x="1170" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1"><dc:Bounds x="1322" y="159" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="1298" y="202" width="84" height="27" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1"><di:waypoint x="215" y="177" /><di:waypoint x="270" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2"><di:waypoint x="370" y="177" /><di:waypoint x="420" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3"><di:waypoint x="520" y="177" /><di:waypoint x="570" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4"><di:waypoint x="670" y="177" /><di:waypoint x="720" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5"><di:waypoint x="820" y="177" /><di:waypoint x="870" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6"><di:waypoint x="970" y="177" /><di:waypoint x="1020" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_7_di" bpmnElement="Flow_7"><di:waypoint x="1120" y="177" /><di:waypoint x="1170" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_8_di" bpmnElement="Flow_8"><di:waypoint x="1270" y="177" /><di:waypoint x="1322" y="177" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
    }

    function generateCustomerServiceBPMN(userInput) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_CustomerService" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_CustomerService" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Customer Issue Reported">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Log Issue Details">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_1" name="Issue Complexity">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_2" name="Resolve Simple Issue">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_3" name="Escalate to Specialist">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_4" name="Specialist Investigation">
      <bpmn:incoming>Flow_6</bpmn:incoming>
      <bpmn:outgoing>Flow_7</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_2" name="Resolution Status">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:incoming>Flow_7</bpmn:incoming>
      <bpmn:outgoing>Flow_8</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_5" name="Follow Up with Customer">
      <bpmn:incoming>Flow_8</bpmn:incoming>
      <bpmn:outgoing>Flow_9</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Issue Resolved">
      <bpmn:incoming>Flow_9</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_3" name="Simple" sourceRef="Gateway_1" targetRef="Task_2" />
    <bpmn:sequenceFlow id="Flow_4" name="Complex" sourceRef="Gateway_1" targetRef="Task_3" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_2" targetRef="Gateway_2" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_3" targetRef="Task_4" />
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Task_4" targetRef="Gateway_2" />
    <bpmn:sequenceFlow id="Flow_8" sourceRef="Gateway_2" targetRef="Task_5" />
    <bpmn:sequenceFlow id="Flow_9" sourceRef="Task_5" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_CustomerService">
    <bpmndi:BPMNPlane id="BPMNPlane_CustomerService" bpmnElement="Process_CustomerService">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1"><dc:Bounds x="179" y="159" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="155" y="202" width="84" height="27" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1"><dc:Bounds x="270" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1" isMarkerVisible="true"><dc:Bounds x="425" y="152" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2_di" bpmnElement="Task_2"><dc:Bounds x="530" y="80" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_3_di" bpmnElement="Task_3"><dc:Bounds x="530" y="220" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_4_di" bpmnElement="Task_4"><dc:Bounds x="680" y="220" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_2_di" bpmnElement="Gateway_2" isMarkerVisible="true"><dc:Bounds x="825" y="152" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_5_di" bpmnElement="Task_5"><dc:Bounds x="920" y="137" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1"><dc:Bounds x="1072" y="159" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="1048" y="202" width="84" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1"><di:waypoint x="215" y="177" /><di:waypoint x="270" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2"><di:waypoint x="370" y="177" /><di:waypoint x="425" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3"><di:waypoint x="450" y="152" /><di:waypoint x="450" y="120" /><di:waypoint x="530" y="120" /><bpmndi:BPMNLabel><dc:Bounds x="460" y="103" width="35" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4"><di:waypoint x="450" y="202" /><di:waypoint x="450" y="260" /><di:waypoint x="530" y="260" /><bpmndi:BPMNLabel><dc:Bounds x="460" y="273" width="43" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5"><di:waypoint x="630" y="120" /><di:waypoint x="850" y="120" /><di:waypoint x="850" y="152" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6"><di:waypoint x="630" y="260" /><di:waypoint x="680" y="260" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_7_di" bpmnElement="Flow_7"><di:waypoint x="780" y="260" /><di:waypoint x="850" y="260" /><di:waypoint x="850" y="202" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_8_di" bpmnElement="Flow_8"><di:waypoint x="875" y="177" /><di:waypoint x="920" y="177" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_9_di" bpmnElement="Flow_9"><di:waypoint x="1020" y="177" /><di:waypoint x="1072" y="177" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
    }

    function generateRacmData(processType) {
        const racmTemplates = {
            'refund': [
                {
                    stepNumber: '1',
                    processStep: 'Receive refund request from customer',
                    keyRisk: 'Fraudulent or invalid refund requests',
                    keyControl: 'Automated validation of purchase history and refund eligibility criteria',
                    controlOwner: 'Customer Service System',
                    frequency: 'Continuous',
                    controlType: 'Automated',
                    evidence: 'System validation logs and rejection reports',
                    riskLevel: 'High'
                },
                {
                    stepNumber: '2',
                    processStep: 'Review and approve refund request',
                    keyRisk: 'Unauthorized approval of high-value refunds',
                    keyControl: 'Multi-level approval workflow for refunds above $500 threshold',
                    controlOwner: 'Finance Manager',
                    frequency: 'Per incident',
                    controlType: 'Preventive',
                    evidence: 'Approval audit trail with digital signatures and timestamps',
                    riskLevel: 'High'
                },
                {
                    stepNumber: '3',
                    processStep: 'Process refund payment',
                    keyRisk: 'Payment processing errors or delays',
                    keyControl: 'Automated payment processing with SLA monitoring and exception alerts',
                    controlOwner: 'Payment Operations',
                    frequency: 'Daily',
                    controlType: 'Detective',
                    evidence: 'Payment processing reports and SLA compliance metrics',
                    riskLevel: 'Medium'
                },
                {
                    stepNumber: '4',
                    processStep: 'Notify customer of refund completion',
                    keyRisk: 'Customer not informed of refund status',
                    keyControl: 'Automated email notification with delivery confirmation',
                    controlOwner: 'Customer Service System',
                    frequency: 'Per incident',
                    controlType: 'Detective',
                    evidence: 'Email delivery logs and customer acknowledgment records',
                    riskLevel: 'Low'
                }
            ],
            'onboarding': [
                {
                    stepNumber: '1',
                    processStep: 'Create employee profile and documentation',
                    keyRisk: 'Incomplete or inaccurate employee information',
                    keyControl: 'Mandatory field validation and document verification checklist',
                    controlOwner: 'HR Administrator',
                    frequency: 'Per incident',
                    controlType: 'Preventive',
                    evidence: 'Completed onboarding forms with verification signatures',
                    riskLevel: 'Medium'
                },
                {
                    stepNumber: '2',
                    processStep: 'Provision system access and accounts',
                    keyRisk: 'Excessive or inappropriate access rights granted',
                    keyControl: 'Role-based access provisioning using pre-approved templates',
                    controlOwner: 'IT Security',
                    frequency: 'Per incident',
                    controlType: 'Preventive',
                    evidence: 'Access provisioning logs and role assignment records',
                    riskLevel: 'High'
                },
                {
                    stepNumber: '3',
                    processStep: 'Complete mandatory training programs',
                    keyRisk: 'Employee starts work without required training',
                    keyControl: 'Training completion tracking with system access restrictions until complete',
                    controlOwner: 'Learning & Development',
                    frequency: 'Per incident',
                    controlType: 'Preventive',
                    evidence: 'Training completion certificates and system access logs',
                    riskLevel: 'High'
                },
                {
                    stepNumber: '4',
                    processStep: 'Manager sign-off and orientation completion',
                    keyRisk: 'Employee not properly oriented to role and responsibilities',
                    keyControl: 'Mandatory manager sign-off on orientation checklist',
                    controlOwner: 'Direct Manager',
                    frequency: 'Per incident',
                    controlType: 'Detective',
                    evidence: 'Signed orientation checklist and manager confirmation',
                    riskLevel: 'Medium'
                }
            ],
            'approval': [
                {
                    riskId: 'R001',
                    riskDesc: 'Unauthorized approvals exceeding authority limits',
                    riskCategory: 'Financial',
                    impact: 'High',
                    likelihood: 'Medium',
                    inherentRisk: 'High',
                    controlId: 'C001',
                    controlDesc: 'System-enforced approval limits and escalation rules',
                    controlType: 'Preventive',
                    controlOwner: 'Finance Director',
                    testingFreq: 'Monthly',
                    residualRisk: 'Low'
                },
                {
                    riskId: 'R002',
                    riskDesc: 'Approval delays impacting business operations',
                    riskCategory: 'Operational',
                    impact: 'Medium',
                    likelihood: 'High',
                    inherentRisk: 'High',
                    controlId: 'C002',
                    controlDesc: 'Automated escalation and SLA monitoring',
                    controlType: 'Detective',
                    controlOwner: 'Process Owner',
                    testingFreq: 'Weekly',
                    residualRisk: 'Medium'
                }
            ],
            'generic': [
                {
                    riskId: 'R001',
                    riskDesc: 'Process execution errors due to unclear procedures',
                    riskCategory: 'Operational',
                    impact: 'Medium',
                    likelihood: 'Medium',
                    inherentRisk: 'Medium',
                    controlId: 'C001',
                    controlDesc: 'Standardized procedures and regular training',
                    controlType: 'Preventive',
                    controlOwner: 'Process Owner',
                    testingFreq: 'Quarterly',
                    residualRisk: 'Low'
                },
                {
                    riskId: 'R002',
                    riskDesc: 'Non-compliance with regulatory requirements',
                    riskCategory: 'Compliance',
                    impact: 'High',
                    likelihood: 'Low',
                    inherentRisk: 'Medium',
                    controlId: 'C002',
                    controlDesc: 'Regular compliance monitoring and audits',
                    controlType: 'Detective',
                    controlOwner: 'Compliance Team',
                    testingFreq: 'Quarterly',
                    residualRisk: 'Low'
                }
            ]
        };

        return racmTemplates[processType] || racmTemplates['generic'];
    }

    async function generatePlaceholderSopData(userInput, statusElement, spinnerElement) {
        const updateStatus = (text) => {
            if (statusElement) statusElement.textContent = text;
        };

        updateStatus('Analyzing your request...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Detect process type for intelligent generation
        const processType = detectProcessType(userInput);
        updateStatus(`Detected process type: ${processType}...`);
        await new Promise(resolve => setTimeout(resolve, 300));

        updateStatus('Drafting SOP title and structure...');
        const dynamicTitle = generateProcessTitle(processType, userInput);
        await new Promise(resolve => setTimeout(resolve, 500));

        updateStatus('Generating business process BPMN diagram...');
        const bpmnXml = generateBusinessProcessBPMN(processType, userInput);
        await new Promise(resolve => setTimeout(resolve, 800));

        updateStatus('Writing contextual SOP description...');
        const descriptionMd = generateContextualDescription(processType, userInput);
        await new Promise(resolve => setTimeout(resolve, 400));

        updateStatus('Generating actionable procedure steps...');
        const stepsMd = generateActionableProcedureSteps(processType, userInput);
        await new Promise(resolve => setTimeout(resolve, 600));

        updateStatus('Creating risk assessment and control measures...');
        const risksMd = generateRiskAssessment(processType);
        const controlsMd = generateControlMeasures(processType);
        await new Promise(resolve => setTimeout(resolve, 600));

        updateStatus('Finalizing footer information...');
        const footerData = {
            docId: "AI-GEN-" + new Date().toISOString().slice(0,10),
            version: "1.0 (AI Draft)",
            effectiveDate: new Date().toLocaleDateString(),
            reviewDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString(),
            approvedBy: "Pending Review",
            department: "AI Assisted"
        };
        await new Promise(resolve => setTimeout(resolve, 200));

        updateStatus('Generation complete!');

        // Generate RACM data
        updateStatus('Generating Risk and Control Matrix...');
        await new Promise(resolve => setTimeout(resolve, 300));
        const racmData = generateRacmData(processType);

        return {
            title: dynamicTitle,
            bpmnXml: bpmnXml,
            descriptionMd: descriptionMd,
            stepsMd: stepsMd,
            risksMd: risksMd,
            controlsMd: controlsMd,
            racmData: racmData,
            footerData: footerData
        };
    }

    function generateContextualDescription(processType, userInput) {
        const descriptions = {
            'refund': `This SOP establishes a standardized process for handling customer refund requests to ensure consistent, fair, and efficient resolution while maintaining customer satisfaction and financial accuracy.

**Purpose**: To provide clear guidelines for processing refund requests, ensuring compliance with company policies and regulatory requirements while delivering excellent customer service.

**Scope**: This procedure applies to all customer refund requests across all product lines and service offerings, including full refunds, partial refunds, and store credit scenarios.

**Key Stakeholders**: Customer service representatives, finance team, managers, and customers requesting refunds.`,

            'onboarding': `This SOP defines the comprehensive process for onboarding new employees to ensure they are properly integrated into the organization, equipped with necessary tools and knowledge, and positioned for success.

**Purpose**: To provide a structured approach to new employee integration that enhances productivity, ensures compliance, and creates a positive first impression of the organization.

**Scope**: This procedure applies to all new hires across all departments and levels, including full-time, part-time, and contract employees.

**Key Stakeholders**: HR team, IT department, direct managers, team members, and new employees.`,

            'approval': `This SOP establishes a clear approval workflow to ensure proper authorization, accountability, and compliance for business decisions and expenditures.

**Purpose**: To provide a structured approval process that maintains proper controls, ensures appropriate authorization levels, and creates an audit trail for business decisions.

**Scope**: This procedure applies to all approval requests requiring management authorization, including expenses, purchases, policy exceptions, and strategic decisions.

**Key Stakeholders**: Requesting employees, approving managers, finance team, and compliance officers.`,

            'generic': `This SOP provides a standardized approach to ensure consistent execution, quality outcomes, and compliance with organizational standards.

**Purpose**: To establish clear procedures that promote efficiency, reduce errors, and ensure consistent results across the organization.

**Scope**: This procedure applies to all relevant business activities and personnel involved in the process.

**Key Stakeholders**: All team members involved in the process execution and management oversight.`
        };

        return descriptions[processType] || descriptions['generic'];
    }

    function generateActionableProcedureSteps(processType, userInput) {
        const steps = {
            'refund': `1. **Receive and Validate Refund Request**
   - Log the refund request in the system with timestamp and customer details
   - Verify customer identity and purchase information
   - Confirm the request includes all required information (order number, reason, amount)

2. **Review Refund Eligibility**
   - Check the purchase date against refund policy timeframes
   - Verify the condition and return status of the product/service
   - Confirm the refund reason aligns with company policy

3. **Apply Policy Rules and Calculate Amount**
   - Determine refund eligibility based on company policies
   - Calculate the appropriate refund amount (full, partial, or store credit)
   - Document any deductions or fees that apply

4. **Obtain Required Approvals**
   - Route requests exceeding standard limits to management for approval
   - Document approval decisions and reasoning
   - Escalate policy exceptions to appropriate authority levels

5. **Process the Refund Payment**
   - Execute the refund through the appropriate payment method
   - Update customer account and order status
   - Generate refund confirmation and transaction records

6. **Communicate with Customer**
   - Send refund confirmation with details and timeline
   - Provide tracking information if applicable
   - Document all customer communications`,

            'onboarding': `1. **Pre-Arrival Preparation**
   - Prepare workspace, equipment, and access credentials
   - Schedule orientation sessions and training programs
   - Notify team members and stakeholders of new hire start date

2. **First Day Welcome and Orientation**
   - Conduct welcome meeting and facility tour
   - Complete required paperwork and compliance documentation
   - Provide employee handbook and policy overview

3. **IT Setup and System Access**
   - Create user accounts and email access
   - Install and configure necessary software and applications
   - Provide security training and access badge setup

4. **Role-Specific Training**
   - Conduct job-specific training sessions
   - Assign mentor or buddy for ongoing support
   - Review role expectations, goals, and performance metrics

5. **Integration and Follow-up**
   - Schedule regular check-ins during the first 90 days
   - Gather feedback on onboarding experience
   - Adjust training and support as needed`,

            'approval': `1. **Submit Approval Request**
   - Complete required approval forms with all necessary details
   - Attach supporting documentation and justification
   - Route request to appropriate approval authority

2. **Initial Review and Validation**
   - Verify request completeness and accuracy
   - Confirm budget availability and compliance requirements
   - Check against established policies and procedures

3. **Approval Decision Process**
   - Review request against approval criteria and limits
   - Consult with relevant stakeholders if needed
   - Document decision rationale and any conditions

4. **Communication and Implementation**
   - Notify requestor of approval decision
   - Provide implementation guidelines if approved
   - Update tracking systems and maintain audit trail`,

            'generic': `1. **Initiate Process**
   - Receive and document the initial request or trigger
   - Verify all required information is available
   - Log the process start in appropriate systems

2. **Execute Core Activities**
   - Follow established procedures and guidelines
   - Complete required tasks in the specified sequence
   - Document progress and any issues encountered

3. **Quality Review and Validation**
   - Verify outputs meet quality standards
   - Obtain necessary approvals or sign-offs
   - Address any identified issues or deficiencies

4. **Complete and Document**
   - Finalize all deliverables and documentation
   - Update relevant systems and records
   - Communicate completion to stakeholders`
        };

        return steps[processType] || steps['generic'];
    }

    function generateRiskAssessment(processType) {
        const risks = {
            'refund': `**High Risk Areas:**

1. **Fraudulent Refund Requests** (High Impact, Medium Probability)
   - Risk: Customers submitting false claims or manipulating return policies
   - Mitigation: Implement verification procedures, maintain purchase history records, set approval thresholds

2. **Processing Delays** (Medium Impact, High Probability)
   - Risk: Delayed refunds leading to customer dissatisfaction and potential legal issues
   - Mitigation: Establish clear timelines, automate where possible, monitor processing metrics

3. **Financial Loss from Policy Abuse** (High Impact, Low Probability)
   - Risk: Excessive refunds impacting profitability due to policy loopholes
   - Mitigation: Regular policy review, exception tracking, management oversight for large amounts

4. **Data Security Breaches** (High Impact, Low Probability)
   - Risk: Customer financial information compromised during refund processing
   - Mitigation: Secure payment processing, access controls, regular security audits`,

            'onboarding': `**High Risk Areas:**

1. **Incomplete Onboarding** (Medium Impact, Medium Probability)
   - Risk: New employees not receiving complete training or access, leading to reduced productivity
   - Mitigation: Standardized checklists, progress tracking, manager accountability

2. **Security Vulnerabilities** (High Impact, Low Probability)
   - Risk: Inappropriate access granted or security protocols not followed
   - Mitigation: Role-based access controls, security training, regular access reviews

3. **Compliance Violations** (High Impact, Low Probability)
   - Risk: Missing required training or documentation leading to regulatory issues
   - Mitigation: Compliance checklists, automated tracking, regular audits

4. **Poor First Impression** (Medium Impact, Medium Probability)
   - Risk: Disorganized onboarding leading to employee dissatisfaction and turnover
   - Mitigation: Structured program, feedback collection, continuous improvement`,

            'generic': `**High Risk Areas:**

1. **Process Deviation** (Medium Impact, Medium Probability)
   - Risk: Inconsistent execution leading to quality issues or compliance problems
   - Mitigation: Clear procedures, training, regular monitoring and feedback

2. **Resource Constraints** (Medium Impact, High Probability)
   - Risk: Insufficient time, personnel, or tools to complete process effectively
   - Mitigation: Resource planning, workload monitoring, escalation procedures

3. **Communication Failures** (Medium Impact, Medium Probability)
   - Risk: Poor communication leading to misunderstandings or delays
   - Mitigation: Clear communication protocols, documentation requirements, feedback loops`
        };

        return risks[processType] || risks['generic'];
    }

    function generateControlMeasures(processType) {
        const controls = {
            'refund': `**Key Performance Indicators (KPIs):**

1. **Processing Efficiency**
   - Average refund processing time: Target ≤ 3 business days
   - Refund approval rate: Monitor for trends (typical range 85-95%)
   - First-call resolution rate: Target ≥ 80%

2. **Financial Controls**
   - Refund amount as % of revenue: Monitor monthly trends
   - Average refund amount: Track for anomalies
   - Manager approval rate for exceptions: Target ≤ 10%

3. **Customer Satisfaction**
   - Customer satisfaction score for refund process: Target ≥ 4.0/5.0
   - Complaint escalation rate: Target ≤ 5%
   - Repeat refund requests: Monitor for patterns

**Monitoring and Review:**
- Weekly dashboard review with customer service manager
- Monthly trend analysis and policy effectiveness review
- Quarterly process improvement assessment
- Annual policy and procedure review`,

            'onboarding': `**Key Performance Indicators (KPIs):**

1. **Completion Metrics**
   - Onboarding checklist completion rate: Target 100%
   - Time to productivity: Target ≤ 30 days
   - Training completion rate: Target 100% within first week

2. **Quality Measures**
   - New hire satisfaction score: Target ≥ 4.0/5.0
   - Manager satisfaction with onboarding: Target ≥ 4.0/5.0
   - 90-day retention rate: Target ≥ 95%

3. **Compliance Tracking**
   - Required documentation completion: Target 100%
   - Security training completion: Target 100% within 3 days
   - System access setup time: Target ≤ 1 day

**Monitoring and Review:**
- Weekly new hire progress review with HR and managers
- Monthly onboarding effectiveness metrics review
- Quarterly feedback collection and process improvement
- Annual program evaluation and updates`,

            'generic': `**Key Performance Indicators (KPIs):**

1. **Process Efficiency**
   - Average completion time: Establish baseline and monitor trends
   - Error rate: Target ≤ 2%
   - Rework percentage: Target ≤ 5%

2. **Quality Measures**
   - Customer/stakeholder satisfaction: Target ≥ 4.0/5.0
   - Compliance rate: Target 100%
   - Output quality score: Target ≥ 95%

3. **Resource Utilization**
   - Process cost per transaction: Monitor trends
   - Resource utilization rate: Target 80-90%
   - Training completion rate: Target 100%

**Monitoring and Review:**
- Regular performance monitoring and reporting
- Monthly trend analysis and issue identification
- Quarterly process review and improvement initiatives
- Annual procedure evaluation and updates`
        };

        return controls[processType] || controls['generic'];
    }

    // Editing functionality
    function initializeEditingFeatures() {
        // Description editing
        const editDescriptionBtn = document.getElementById('editDescriptionBtn');
        const descriptionEditor = document.getElementById('descriptionEditor');
        const descriptionContainer = document.getElementById('descriptionContainer');
        const descriptionTextarea = document.getElementById('descriptionTextarea');
        const saveDescriptionEdit = document.getElementById('saveDescriptionEdit');
        const cancelDescriptionEdit = document.getElementById('cancelDescriptionEdit');

        if (editDescriptionBtn) {
            editDescriptionBtn.addEventListener('click', () => {
                enterEditMode('description', currentSopData.descriptionMd || '');
            });
        }

        if (saveDescriptionEdit) {
            saveDescriptionEdit.addEventListener('click', () => {
                saveEdit('description', descriptionTextarea.value);
            });
        }

        if (cancelDescriptionEdit) {
            cancelDescriptionEdit.addEventListener('click', () => {
                exitEditMode('description');
            });
        }


    }

    function enterEditMode(section, content) {
        const sectionMap = {
            'description': 'description'
        };

        const containerMap = {
            'description': 'descriptionContainer'
        };

        const mappedSection = sectionMap[section];
        const containerId = containerMap[section];

        const container = document.getElementById(containerId);
        const editor = document.getElementById(`${mappedSection}Editor`);
        const textarea = document.getElementById(`${mappedSection}Textarea`);

        if (container && editor && textarea) {
            container.style.display = 'none';
            editor.classList.remove('hidden');
            textarea.value = content;
            textarea.focus();
        }
    }

    function exitEditMode(section) {
        const sectionMap = {
            'description': 'description'
        };

        const containerMap = {
            'description': 'descriptionContainer'
        };

        const mappedSection = sectionMap[section];
        const containerId = containerMap[section];

        const container = document.getElementById(containerId);
        const editor = document.getElementById(`${mappedSection}Editor`);

        if (container && editor) {
            container.style.display = 'block';
            editor.classList.add('hidden');
        }
    }

    function saveEdit(section, content) {
        // Update the current SOP data
        const sectionMap = {
            'description': 'descriptionMd'
        };

        const dataKey = sectionMap[section];
        if (dataKey) {
            currentSopData[dataKey] = content;
        }

        // Update the display
        updateSectionDisplay(section, content);

        // Exit edit mode
        exitEditMode(section);

        // Show success message
        showEditSuccessMessage(section);
    }

    function updateSectionDisplay(section, content) {
        const containerMap = {
            'description': 'descriptionContainer'
        };

        const containerId = containerMap[section];
        const container = document.getElementById(containerId);
        if (!container) return;

        if (section === 'description') {
            // For description, use enhanced markdown parser
            container.innerHTML = parseMarkdownToHtml(content);
        } else {
            // Fallback for any other sections
            container.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: inherit;">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
        }
    }

    function parseMarkdownToHtml(markdown) {
        if (!markdown) return '';

        let html = markdown
            // Convert headers
            .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-slate-800 mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-slate-800 mt-6 mb-3">$1</h2>')
            .replace(/^\*\*(.*?)\*\*/gm, '<h2 class="text-xl font-semibold text-slate-800 mt-6 mb-3">$1</h2>')

            // Convert bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')

            // Convert numbered lists with sub-items
            .replace(/^(\d+)\.\s\*\*(.*?)\*\*/gm, '<div class="mb-4"><h4 class="font-semibold text-slate-800 mb-2">$1. $2</h4>')
            .replace(/^(\d+)\.\s(.*$)/gm, '<div class="mb-4"><h4 class="font-semibold text-slate-800 mb-2">$1. $2</h4>')

            // Convert sub-items (lines starting with spaces and dashes)
            .replace(/^\s+-\s(.*$)/gm, '<div class="ml-4 mb-1 text-slate-700">• $1</div>')

            // Convert bullet points
            .replace(/^-\s(.*$)/gm, '<div class="mb-2 text-slate-700">• $1</div>')

            // Convert emojis and special formatting
            .replace(/⚠️/g, '<span class="text-red-500">⚠️</span>')
            .replace(/📊/g, '<span class="text-blue-500">📊</span>')
            .replace(/⭐/g, '<span class="text-yellow-500">⭐</span>')

            // Convert line breaks to proper spacing
            .replace(/\n\n/g, '</div><div class="mb-4">')
            .replace(/\n/g, '<br>');

        // Wrap in container and close any open divs
        html = `<div class="space-y-2">${html}</div>`;

        // Clean up any unclosed divs
        html = html.replace(/<div class="mb-4"><h4[^>]*>[^<]*<\/h4>(?!<div)/g, (match) => match + '</div>');

        return html;
    }

    // Make parseMarkdownToHtml globally accessible for sync system
    window.parseMarkdownToHtml = parseMarkdownToHtml;

    function showEditSuccessMessage(section) {
        // Create a temporary success message
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        message.textContent = `${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully!`;
        document.body.appendChild(message);

        // Remove the message after 3 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    // Event Listeners for SOP Generation Modal
    if (closeSopGeneratorModalBtn) closeSopGeneratorModalBtn.addEventListener('click', closeSopModal);
    if (cancelSopGenerationBtn) cancelSopGenerationBtn.addEventListener('click', closeSopModal);
    if (generateSopBtn) generateSopBtn.addEventListener('click', handleSopGenerationRequest);
    if (loadInitialDescriptionBtn) {
        loadInitialDescriptionBtn.addEventListener('click', async () => {
            if (sopDescriptionInput && sopGeneratorStatus) {
                sopGeneratorStatus.textContent = 'Loading initial description...';
                if(sopGeneratorSpinner) sopGeneratorSpinner.classList.remove('hidden');
                try {
                    const response = await fetch('sop_content/description.md');
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} for initial description.`);
                    }
                    const markdownText = await response.text();
                    sopDescriptionInput.value = markdownText;
                    sopGeneratorStatus.textContent = 'Initial description loaded.';
                } catch (error) {
                    console.error('Error fetching initial description:', error);
                    sopGeneratorStatus.textContent = 'Error loading initial description.';
                } finally {
                    if(sopGeneratorSpinner) sopGeneratorSpinner.classList.add('hidden');
                }
            }
        });
    }

    // Initial content load
    loadInitialDiagram(); // Loads 'sop_content/initial_diagram.bpmn' by default
    loadDescriptionContent(); // Loads 'sop_content/description.md' by default
    loadProcedureStepsContent(); // Loads 'sop_content/procedure_steps.md' by default

    // Original event listeners for file upload/download (if still needed, ensure IDs are correct)
    const downloadXmlBtn = document.getElementById('downloadXmlBtn');
    const uploadXmlInput = document.getElementById('uploadXmlInput');

    if (downloadXmlBtn) {
        downloadXmlBtn.addEventListener('click', async () => {
            if (!bpmnViewer) {
                if (uploadStatus) uploadStatus.textContent = 'Viewer not ready.';
                return;
            }
            try {
                const { xml } = await bpmnViewer.saveXML({ format: true });
                const encodedData = encodeURIComponent(xml);
                const a = document.createElement('a');
                a.setAttribute('href', 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData);
                // Suggest filename based on current page title
                const currentTitle = pageTitleElement.textContent.replace(' - SOP', '').replace(/[^a-z0-9\s]/gi, '_').replace(/\s+/g, '_');
                a.setAttribute('download', `${currentTitle || 'diagram'}.bpmn`);
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                if (uploadStatus) uploadStatus.textContent = 'XML downloaded successfully.';
            } catch (err) {
                console.error('Error saving XML:', err);
                if (uploadStatus) uploadStatus.textContent = `Error downloading XML: ${err.message}`;
            }
        });
    }

    if (uploadXmlInput) {
        uploadXmlInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const newXml = e.target.result;
                    // For uploaded files, we directly use openDiagram, not loadInitialDiagram
                    openDiagram(newXml);
                };
                reader.onerror = function(e) {
                    console.error("File reading error:", e);
                    if (uploadStatus) uploadStatus.textContent = 'Error reading file.';
                }
                reader.readAsText(file);
                if (uploadStatus) uploadStatus.textContent = `Uploading ${file.name}...`;
            }
            event.target.value = null;
        });
    }

    // FAB Menu Logic
    function toggleFabMenu() {
        if (fabContainer) {
            fabContainer.classList.toggle('open');
            const isOpen = fabContainer.classList.contains('open');
            // Toggle visibility and accessibility of sub-buttons
            fabActionButtons.forEach(btn => {
                if (btn) {
                    if (isOpen) {
                        btn.classList.remove('hidden', 'opacity-0', 'scale-90', 'translate-y-2');
                        btn.setAttribute('aria-hidden', 'false');
                        btn.removeAttribute('tabindex'); // Make focusable
                    } else {
                        btn.classList.add('opacity-0', 'scale-90', 'translate-y-2');
                        // Delay hiding to allow animation
                        setTimeout(() => btn.classList.add('hidden'), 200);
                        btn.setAttribute('aria-hidden', 'true');
                        btn.setAttribute('tabindex', '-1'); // Make non-focusable
                    }
                }
            });
             // Change main FAB icon path for X
            if (mainFabIcon) {
                 if (isOpen) {
                    mainFabIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />'; // X Icon
                } else {
                    mainFabIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />'; // Plus Icon
                }
            }
        }
    }

    function downloadTextFile(content, filename, contentType = 'text/plain;charset=utf-8') {
        const element = document.createElement('a');
        element.setAttribute('href', `data:${contentType},${encodeURIComponent(content)}`);
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    async function handleSaveSopAsZip() {
        if (!window.JSZip) {
            alert("Error: JSZip library not found. Cannot create ZIP.");
            return;
        }
        if (uploadStatus) uploadStatus.textContent = "Preparing SOP for download...";
        const zip = new JSZip();
        const cleanTitle = (currentSopData.title || "Untitled_SOP").replace(/[^a-z0-9\s_]/gi, '').replace(/\s+/g, '_');
        const folderName = cleanTitle; // User will extract this folder

        // Ensure all data is available (it should be in currentSopData)
        const { title, subtitle, bpmnXml, descriptionMd, stepsMd, risksMd, controlsMd, racmData, footerData } = currentSopData;

        if (!bpmnXml || !descriptionMd || !stepsMd || !footerData) {
            alert("Error: SOP data is incomplete. Cannot save.");
            if (uploadStatus) uploadStatus.textContent = "Error: Incomplete SOP data.";
            return;
        }

        const metadata = { title, subtitle, footerData };

        zip.folder(folderName).file("diagram.bpmn", bpmnXml);
        zip.folder(folderName).file("description.md", descriptionMd);
        zip.folder(folderName).file("procedure_steps.md", stepsMd);
        if (risksMd) zip.folder(folderName).file("risks_mitigation.md", risksMd);
        if (controlsMd) zip.folder(folderName).file("control_measures.md", controlsMd);
        if (racmData) zip.folder(folderName).file("racm_data.json", JSON.stringify(racmData, null, 2));
        zip.folder(folderName).file("metadata.json", JSON.stringify(metadata, null, 2));

        try {
            const zipContent = await zip.generateAsync({type:"blob"});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipContent);
            link.download = `${cleanTitle}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            if (uploadStatus) uploadStatus.textContent = `SOP "${cleanTitle}" saved as ZIP.`;
        } catch (err) {
            console.error("Error generating ZIP:", err);
            if (uploadStatus) uploadStatus.textContent = "Error saving SOP as ZIP.";
            alert("Error generating ZIP file. See console for details.");
        }
        if (fabContainer && fabContainer.classList.contains('open')) toggleFabMenu();
    }

    function handleLoadSopFromFolderTrigger() {
        if (loadSopFolderInput) loadSopFolderInput.click();
        if (fabContainer && fabContainer.classList.contains('open')) toggleFabMenu();
    }

    async function processSelectedSopFolder(event) {
        const files = event.target.files;
        if (!files || files.length === 0) {
            if (uploadStatus) uploadStatus.textContent = "No folder selected or folder is empty.";
            return;
        }
        if (uploadStatus) uploadStatus.textContent = "Loading SOP from folder...";

        let diagramFile, descriptionFile, stepsFile, risksFile, controlsFile, racmFile, metadataFile;
        const folderName = files[0].webkitRelativePath.split('/')[0]; // Get the top-level folder name

        for (const file of files) {
            // Check if file is directly in the selected folder (or its immediate subfolder if structure is folderName/file.ext)
            const relativePath = file.webkitRelativePath;
            if (relativePath.startsWith(folderName + '/')) {
                const fileNameInFolder = relativePath.substring(folderName.length + 1);
                if (fileNameInFolder === 'diagram.bpmn') diagramFile = file;
                else if (fileNameInFolder === 'description.md') descriptionFile = file;
                else if (fileNameInFolder === 'procedure_steps.md') stepsFile = file;
                else if (fileNameInFolder === 'risks_mitigation.md') risksFile = file;
                else if (fileNameInFolder === 'control_measures.md') controlsFile = file;
                else if (fileNameInFolder === 'racm_data.json') racmFile = file;
                else if (fileNameInFolder === 'metadata.json') metadataFile = file;
            }
        }

        if (!diagramFile || !descriptionFile || !stepsFile || !metadataFile) {
            if (uploadStatus) uploadStatus.textContent = "Error: SOP folder is missing required files (diagram.bpmn, description.md, procedure_steps.md, metadata.json).";
            alert("Selected folder is not a valid SOP folder. Required files are missing.");
            return;
        }

        try {
            const readFileAsText = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (err) => reject(err);
                    reader.readAsText(file);
                });
            };

            const bpmnXml = await readFileAsText(diagramFile);
            const descriptionMd = await readFileAsText(descriptionFile);
            const stepsMd = await readFileAsText(stepsFile);
            const risksMd = risksFile ? await readFileAsText(risksFile) : '';
            const controlsMd = controlsFile ? await readFileAsText(controlsFile) : '';
            const racmJson = racmFile ? await readFileAsText(racmFile) : null;
            const racmData = racmJson ? JSON.parse(racmJson) : [];
            const metadataJson = await readFileAsText(metadataFile);
            const metadata = JSON.parse(metadataJson);

            // Update global state and page
            currentSopData = {
                title: metadata.title || folderName, // Fallback to folder name for title
                subtitle: metadata.subtitle || "Loaded from folder",
                bpmnXml,
                descriptionMd,
                stepsMd,
                risksMd,
                controlsMd,
                racmData,
                footerData: metadata.footerData
            };

            updatePageTitle(currentSopData.title, currentSopData.subtitle);
            updateFooter(currentSopData.footerData);
            openDiagram(currentSopData.bpmnXml);

            const descriptionContainer = document.getElementById('descriptionContainer');
            if (descriptionContainer) {
                descriptionContainer.innerHTML = parseMarkdownToHtml(currentSopData.descriptionMd);
            }


            // Update RACM data
            if (currentSopData.racmData && Array.isArray(currentSopData.racmData)) {
                racmData = [...currentSopData.racmData];
                renderRacmTable();
            }

            if (uploadStatus) uploadStatus.textContent = `SOP "${currentSopData.title}" loaded successfully.`;

        } catch (error) {
            console.error("Error processing SOP folder:", error);
            if (uploadStatus) uploadStatus.textContent = "Error loading SOP from folder.";
            alert(`Error processing SOP folder: ${error.message}`);
        }
        loadSopFolderInput.value = null; // Reset input for next selection
    }

    function handlePrintSop() {
        window.print();
        if (fabContainer && fabContainer.classList.contains('open')) {
            toggleFabMenu();
        }
    }

    // Assign event listeners for BPMN editing
    if (editDiagramBtn) editDiagramBtn.addEventListener('click', () => {
        console.log('Edit button clicked, current isEditMode:', window.isEditMode);
        if (window.isEditMode) {
            console.log('Calling exitEditMode...');
            window.exitEditMode();
        } else {
            console.log('Calling enterEditMode...');
            window.enterEditMode();
        }
    });
    if (cancelDiagramEdit) cancelDiagramEdit.addEventListener('click', window.exitEditMode);
    if (saveDiagramEdit) saveDiagramEdit.addEventListener('click', saveDiagramChanges);

    // Assign event listeners for sync buttons
    const syncBpmnBtn = document.getElementById('syncBpmnBtn');
    const syncDescriptionBtn = document.getElementById('syncDescriptionBtn');
    const syncRacmBtn = document.getElementById('syncRacmBtn');

    if (syncBpmnBtn) syncBpmnBtn.addEventListener('click', () => handleSyncRequest('bpmn'));
    if (syncDescriptionBtn) syncDescriptionBtn.addEventListener('click', () => handleSyncRequest('description'));
    if (syncRacmBtn) syncRacmBtn.addEventListener('click', () => handleSyncRequest('racm'));

    // Assign event listeners to FAB Menu buttons
    if (mainFabToggleBtn) mainFabToggleBtn.addEventListener('click', toggleFabMenu);
    if (generateSopFabBtn) generateSopFabBtn.addEventListener('click', () => {
        openSopModal();
        if (fabContainer && fabContainer.classList.contains('open')) toggleFabMenu();
    });
    if (saveSopZipFabBtn) saveSopZipFabBtn.addEventListener('click', handleSaveSopAsZip);
    if (loadSopFolderFabBtn) loadSopFolderFabBtn.addEventListener('click', handleLoadSopFromFolderTrigger);
    if (loadSopFolderInput) loadSopFolderInput.addEventListener('change', processSelectedSopFolder);
    if (printSopFabBtn) printSopFabBtn.addEventListener('click', handlePrintSop);

    // Initialize editing features
    initializeEditingFeatures();

    // Initialize RACM functionality
    initializeRACM();
});

// RACM (Risk and Control Matrix) functionality
let racmData = [];
let editingRacmIndex = -1;

function initializeRACM() {
    const editRacmBtn = document.getElementById('editRacmBtn');
    const addRacmRowBtn = document.getElementById('addRacmRowBtn');
    const saveRacmEdit = document.getElementById('saveRacmEdit');
    const cancelRacmEdit = document.getElementById('cancelRacmEdit');

    if (editRacmBtn) editRacmBtn.addEventListener('click', toggleRacmEditMode);
    if (addRacmRowBtn) addRacmRowBtn.addEventListener('click', addNewRacmRow);
    if (saveRacmEdit) saveRacmEdit.addEventListener('click', saveRacmEntry);
    if (cancelRacmEdit) cancelRacmEdit.addEventListener('click', cancelRacmEdit);

    // Load initial RACM data
    loadInitialRacmData();
}

function loadInitialRacmData() {
    // Default step-based RACM data for demonstration
    racmData = [
        {
            stepNumber: '1',
            processStep: 'Receive and validate request',
            keyRisk: 'Invalid or incomplete request data',
            keyControl: 'Automated validation checks and mandatory field verification',
            controlOwner: 'System Administrator',
            frequency: 'Continuous',
            controlType: 'Automated',
            evidence: 'System logs showing validation results and error messages',
            riskLevel: 'Medium'
        },
        {
            stepNumber: '2',
            processStep: 'Review and approve request',
            keyRisk: 'Unauthorized approval or approval delays',
            keyControl: 'Role-based approval workflow with escalation timers',
            controlOwner: 'Department Manager',
            frequency: 'Per incident',
            controlType: 'Preventive',
            evidence: 'Approval audit trail with timestamps and user IDs',
            riskLevel: 'High'
        },
        {
            stepNumber: '3',
            processStep: 'Execute process action',
            keyRisk: 'Process execution errors or failures',
            keyControl: 'Standardized procedures with quality checkpoints',
            controlOwner: 'Process Operator',
            frequency: 'Per incident',
            controlType: 'Detective',
            evidence: 'Process execution logs and quality check records',
            riskLevel: 'Medium'
        }
    ];

    renderRacmTable();
}

function renderRacmTable() {
    const tableBody = document.getElementById('racmTableBody');
    if (!tableBody) return;

    if (racmData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="11" class="border border-slate-300 px-3 py-4 text-center text-slate-500">No RACM entries found. Click "Add Row" to create the first entry.</td></tr>';
        return;
    }

    tableBody.innerHTML = racmData.map((entry, index) => `
        <tr class="hover:bg-slate-50">
            <td class="border border-slate-300 px-3 py-2 text-center font-medium">${entry.stepNumber || ''}</td>
            <td class="border border-slate-300 px-3 py-2">${entry.processStep || ''}</td>
            <td class="border border-slate-300 px-3 py-2">${entry.riskDescription || entry.keyRisk || ''}</td>
            <td class="border border-slate-300 px-3 py-2">${entry.controlDescription || entry.keyControl || ''}</td>
            <td class="border border-slate-300 px-3 py-2">${entry.controlOwner || ''}</td>
            <td class="border border-slate-300 px-3 py-2">${entry.controlFrequency || entry.frequency || ''}</td>
            <td class="border border-slate-300 px-3 py-2">
                <span class="px-2 py-1 rounded text-xs font-medium ${getControlTypeBadgeClass(entry.controlType)}">${entry.controlType || ''}</span>
            </td>
            <td class="border border-slate-300 px-3 py-2">${entry.evidenceAuditTest || entry.evidence || ''}</td>
            <td class="border border-slate-300 px-3 py-2">${entry.cosoComponent || ''}</td>
            <td class="border border-slate-300 px-3 py-2">
                <span class="px-2 py-1 rounded text-xs font-medium ${getRiskBadgeClass(entry.riskLevel)}">${entry.riskLevel || ''}</span>
            </td>
            <td class="border border-slate-300 px-3 py-2">
                <div class="flex space-x-1">
                    <button onclick="editRacmEntry(${index})" class="text-blue-600 hover:text-blue-800 text-xs" title="Edit">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="deleteRacmEntry(${index})" class="text-red-600 hover:text-red-800 text-xs" title="Delete">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getRiskBadgeClass(level) {
    switch (level?.toLowerCase()) {
        case 'high': return 'bg-red-100 text-red-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-green-100 text-green-800';
        default: return 'bg-slate-100 text-slate-800';
    }
}

function getControlTypeBadgeClass(type) {
    switch (type?.toLowerCase()) {
        case 'preventive': return 'bg-blue-100 text-blue-800';
        case 'detective': return 'bg-purple-100 text-purple-800';
        case 'corrective': return 'bg-orange-100 text-orange-800';
        default: return 'bg-slate-100 text-slate-800';
    }
}

function toggleRacmEditMode() {
    const racmEditor = document.getElementById('racmEditor');
    const editBtn = document.getElementById('editRacmBtn');

    if (racmEditor && editBtn) {
        const isHidden = racmEditor.classList.contains('hidden');
        if (isHidden) {
            racmEditor.classList.remove('hidden');
            editBtn.textContent = 'Cancel Edit';
        } else {
            racmEditor.classList.add('hidden');
            editBtn.innerHTML = `
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Edit Matrix
            `;
            clearRacmForm();
        }
    }
}

function addNewRacmRow() {
    editingRacmIndex = -1;
    clearRacmForm();
    const racmEditor = document.getElementById('racmEditor');
    if (racmEditor) {
        racmEditor.classList.remove('hidden');
    }
}

function editRacmEntry(index) {
    editingRacmIndex = index;
    const entry = racmData[index];

    // Populate form fields
    document.getElementById('racmStepNumber').value = entry.stepNumber || '';
    document.getElementById('racmProcessStep').value = entry.processStep || '';
    document.getElementById('racmKeyRisk').value = entry.keyRisk || '';
    document.getElementById('racmKeyControl').value = entry.keyControl || '';
    document.getElementById('racmControlOwner').value = entry.controlOwner || '';
    document.getElementById('racmFrequency').value = entry.frequency || '';
    document.getElementById('racmControlType').value = entry.controlType || '';
    document.getElementById('racmEvidence').value = entry.evidence || '';
    document.getElementById('racmRiskLevel').value = entry.riskLevel || '';

    const racmEditor = document.getElementById('racmEditor');
    if (racmEditor) {
        racmEditor.classList.remove('hidden');
    }
}

function deleteRacmEntry(index) {
    if (confirm('Are you sure you want to delete this RACM entry?')) {
        racmData.splice(index, 1);
        renderRacmTable();
    }
}

function saveRacmEntry() {
    const entry = {
        stepNumber: document.getElementById('racmStepNumber').value,
        processStep: document.getElementById('racmProcessStep').value,
        keyRisk: document.getElementById('racmKeyRisk').value,
        keyControl: document.getElementById('racmKeyControl').value,
        controlOwner: document.getElementById('racmControlOwner').value,
        frequency: document.getElementById('racmFrequency').value,
        controlType: document.getElementById('racmControlType').value,
        evidence: document.getElementById('racmEvidence').value,
        riskLevel: document.getElementById('racmRiskLevel').value
    };

    if (!entry.stepNumber || !entry.processStep || !entry.keyRisk) {
        alert('Please fill in at least Step Number, Process Step, and Key Risk');
        return;
    }

    if (editingRacmIndex >= 0) {
        racmData[editingRacmIndex] = entry;
    } else {
        racmData.push(entry);
    }

    renderRacmTable();
    clearRacmForm();

    const racmEditor = document.getElementById('racmEditor');
    if (racmEditor) {
        racmEditor.classList.add('hidden');
    }
}

function cancelRacmEdit() {
    clearRacmForm();
    const racmEditor = document.getElementById('racmEditor');
    if (racmEditor) {
        racmEditor.classList.add('hidden');
    }
}

function clearRacmForm() {
    const fields = ['racmStepNumber', 'racmProcessStep', 'racmKeyRisk', 'racmKeyControl',
                   'racmControlOwner', 'racmFrequency', 'racmControlType', 'racmEvidence', 'racmRiskLevel'];

    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });

    editingRacmIndex = -1;
}

function calculateInherentRisk(impact, likelihood) {
    const riskMatrix = {
        'High-High': 'High',
        'High-Medium': 'High',
        'High-Low': 'Medium',
        'Medium-High': 'High',
        'Medium-Medium': 'Medium',
        'Medium-Low': 'Low',
        'Low-High': 'Medium',
        'Low-Medium': 'Low',
        'Low-Low': 'Low'
    };

    return riskMatrix[`${impact}-${likelihood}`] || 'Medium';
}

function calculateResidualRisk(impact, likelihood) {
    // Simplified calculation - assumes controls reduce risk by one level
    const inherent = calculateInherentRisk(impact, likelihood);

    switch (inherent) {
        case 'High': return 'Medium';
        case 'Medium': return 'Low';
        case 'Low': return 'Low';
        default: return 'Medium';
    }
}

// --- AI Sync System ---

// Global variables for sync system
let currentSyncData = null;
let syncPreviewModal = null;
let syncPreviewContent = null;
let syncPreviewActions = null;
let closeSyncPreviewModalBtn = null;
let acceptSyncBtn = null;
let rejectSyncBtn = null;

// Initialize sync modal elements
function initializeSyncModal() {
    syncPreviewModal = document.getElementById('syncPreviewModal');
    syncPreviewContent = document.getElementById('syncPreviewContent');
    syncPreviewActions = document.getElementById('syncPreviewActions');
    closeSyncPreviewModalBtn = document.getElementById('closeSyncPreviewModalBtn');
    acceptSyncBtn = document.getElementById('acceptSyncBtn');
    rejectSyncBtn = document.getElementById('rejectSyncBtn');

    // Add event listeners
    if (closeSyncPreviewModalBtn) closeSyncPreviewModalBtn.addEventListener('click', closeSyncPreviewModal);
    if (rejectSyncBtn) rejectSyncBtn.addEventListener('click', closeSyncPreviewModal);
    if (acceptSyncBtn) acceptSyncBtn.addEventListener('click', applySyncChanges);
}

// Make sure to call initialization after DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSyncModal);
} else {
    initializeSyncModal();
}

// Validation function to ensure all RACM fields are properly populated
function validateAndFixRacmEntry(entry) {
    const fallbacks = {
        stepNumber: entry.stepNumber || '1',
        processStep: entry.processStep || 'Process Step',
        riskDescription: entry.riskDescription || 'Risk not specified - requires review',
        controlDescription: entry.controlDescription || 'Control not specified - requires review',
        controlOwner: entry.controlOwner || 'Process Owner',
        controlFrequency: entry.controlFrequency || 'As needed',
        controlType: entry.controlType || 'Preventive',
        evidenceAuditTest: entry.evidenceAuditTest || 'Evidence not specified - requires review',
        cosoComponent: entry.cosoComponent || 'Control Activities',
        riskLevel: entry.riskLevel || 'Medium'
    };

    // Check for undefined/null/empty values and replace with fallbacks
    const validatedEntry = {};
    Object.keys(fallbacks).forEach(key => {
        const value = entry[key];
        if (value === undefined || value === null || value === '' || value === 'undefined') {
            validatedEntry[key] = fallbacks[key];
            console.warn(`RACM field '${key}' was undefined/empty, using fallback: ${fallbacks[key]}`);
        } else {
            validatedEntry[key] = value;
        }
    });

    console.log('Validated RACM entry:', validatedEntry);
    return validatedEntry;
}

async function handleSyncRequest(changedSection) {
    console.log(`Sync requested for section: ${changedSection}`);

    try {
        // Show sync modal with loading state
        showSyncPreviewModal();

        // Collect current data from all sections
        const currentData = {
            bpmnXml: currentSopData.bpmnXml,
            description: currentSopData.descriptionMd,
            racmData: racmData || []
        };

        // Call OpenAI API for real sync suggestions
        const syncResult = await callOpenAISyncAPI(changedSection, currentData);

        // Display sync preview
        displaySyncPreview(changedSection, syncResult);

    } catch (error) {
        console.error('Error during sync:', error);
        showSyncError(error.message);
    }
}

async function callOpenAISyncAPI(changedSection, currentData) {
    console.log('Calling OpenAI API for sync suggestions...');

    try {
        const response = await fetch('/api/sync-sections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                changedSection,
                currentData
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('OpenAI sync result:', result);

        return result.syncResult;

    } catch (error) {
        console.error('Error calling OpenAI sync API:', error);

        // Fallback to simulation if API fails
        console.log('Falling back to simulation...');
        return await simulateSyncProcess(changedSection, currentData);
    }
}

async function simulateSyncProcess(changedSection, currentData) {
    // Fallback simulation for when OpenAI API is not available
    console.log('Using simulation fallback...');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate sync suggestions based on changed section
    const suggestions = {
        bpmn: {
            descriptionEnhancement: "Additional validation steps and enhanced security measures have been incorporated based on the updated BPMN process flow.",
            racmUpdates: [
                {
                    stepNumber: "1",
                    keyRisk: "Invalid or incomplete request data",
                    keyControl: "Automated validation checks and mandatory field verification",
                    frequency: "Continuous",
                    evidence: "System logs showing validation results and error messages",
                    riskLevel: "Medium"
                }
            ]
        },
        description: {
            descriptionEnhancement: "Enhanced validation procedures and security protocols have been integrated to strengthen the payment processing workflow based on the updated description requirements.",
            bpmnSuggestions: "Add validation checkpoints and approval gates to the BPMN diagram based on the updated description.",
            racmUpdates: [
                {
                    stepNumber: "2",
                    keyRisk: "Unauthorized approval or inadequate review",
                    keyControl: "Role-based approval workflow with escalation procedures",
                    frequency: "Per incident",
                    evidence: "Approval audit trail with timestamps and user IDs",
                    riskLevel: "High"
                }
            ]
        },
        racm: {
            descriptionEnhancement: "Enhanced risk considerations and control measures have been integrated based on the updated RACM analysis.",
            bpmnSuggestions: "Add control checkpoints and risk mitigation steps to the BPMN diagram."
        }
    };

    return suggestions[changedSection] || {};
}

function showSyncPreviewModal() {
    if (syncPreviewModal) {
        syncPreviewModal.classList.remove('hidden');
        // Reset content to loading state
        if (syncPreviewContent) {
            syncPreviewContent.innerHTML = `
                <div class="text-center text-slate-500">
                    <div class="spinner inline-block mr-2"></div>
                    Analyzing changes and generating sync suggestions...
                </div>
            `;
        }
        if (syncPreviewActions) {
            syncPreviewActions.classList.add('hidden');
        }
        // Trigger animation
        setTimeout(() => {
            const modalContent = syncPreviewModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }
        }, 10);
    }
}

function closeSyncPreviewModal() {
    if (syncPreviewModal) {
        const modalContent = syncPreviewModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('scale-95', 'opacity-0');
            modalContent.classList.remove('scale-100', 'opacity-100');
        }
        setTimeout(() => {
            syncPreviewModal.classList.add('hidden');
        }, 300);
    }
    currentSyncData = null;
}

function displaySyncPreview(changedSection, syncResult) {
    if (!syncPreviewContent) return;

    // Create context-specific messaging
    const sectionMessages = {
        bpmn: {
            title: "🔄 AI Analysis: Process Overview (BPMN Diagram)",
            subtitle: "Based on your BPMN diagram, here are suggested improvements for other sections:"
        },
        description: {
            title: "🔄 AI Analysis: Process Description",
            subtitle: "Based on your description, here are suggested improvements for other sections:"
        },
        racm: {
            title: "🔄 AI Analysis: Risk & Control Matrix",
            subtitle: "Based on your RACM matrix, here are suggested improvements for other sections:"
        }
    };

    const currentMessage = sectionMessages[changedSection] || sectionMessages.description;

    let previewHtml = `
        <div class="mb-4">
            <h4 class="text-lg font-semibold text-slate-700 mb-2">
                ${currentMessage.title}
            </h4>
            <p class="text-sm text-slate-600 mb-4">
                ${currentMessage.subtitle}
            </p>
        </div>
    `;

    // Show what will be updated with user-friendly names
    Object.keys(syncResult).forEach(section => {
        const sectionNames = {
            bpmnXml: '📊 Process Overview (BPMN Diagram)',
            bpmnSuggestions: '📊 Process Overview (BPMN Suggestions)',
            description: '📝 Process Description (Complete Replacement)',
            descriptionEnhancement: '📝 Process Description (AI Enhancement)',
            racmData: '🛡️ Risk & Control Matrix (New Entries)',
            racmUpdates: '🛡️ Risk & Control Matrix (AI Updates)'
        };

        const sectionName = sectionNames[section] || `📄 ${section.charAt(0).toUpperCase() + section.slice(1)}`;

        previewHtml += `
            <div class="mb-6 p-4 border border-slate-200 rounded-md">
                <h5 class="font-medium text-slate-700 mb-2">📝 ${sectionName}:</h5>
                <div class="bg-slate-50 p-3 rounded text-sm text-slate-600">
                    ${section === 'racmData' ?
                        `Will add ${syncResult[section].length} new RACM entries` :
                        section === 'racmUpdates' ?
                        (() => {
                            const currentDesc = currentSopData.descriptionMd || '';
                            const isCompletelyDifferentProcess =
                                (currentDesc.toLowerCase().includes('tea') && !racmData.some(entry => entry.processStep?.toLowerCase()?.includes('tea'))) ||
                                (currentDesc.toLowerCase().includes('manufacturing') && !racmData.some(entry => entry.processStep?.toLowerCase()?.includes('manufactur'))) ||
                                (currentDesc.toLowerCase().includes('cooking') && !racmData.some(entry => entry.processStep?.toLowerCase()?.includes('cook'))) ||
                                (currentDesc.toLowerCase().includes('service') && currentDesc.toLowerCase().includes('customer') && !racmData.some(entry => entry.processStep?.toLowerCase()?.includes('service')));

                            console.log('Preview Modal Debug:', {
                                currentDesc: currentDesc.substring(0, 50),
                                isCompletelyDifferentProcess,
                                racmUpdatesCount: syncResult[section].length
                            });

                            return isCompletelyDifferentProcess ?
                                `Will replace entire RACM matrix with ${syncResult[section].length} new entries for the updated process` :
                                `Will update ${syncResult[section].length} existing RACM entries with improved Key Risk, Key Control, Frequency, Evidence, and Risk Level`;
                        })() :
                        section === 'bpmnSuggestions' ?
                        `BPMN Suggestions: ${typeof syncResult[section] === 'string' ? syncResult[section].substring(0, 200) : JSON.stringify(syncResult[section]).substring(0, 200)}...` :
                        section === 'descriptionEnhancement' ?
                        `Enhancement: ${typeof syncResult[section] === 'string' ? syncResult[section].substring(0, 200) : JSON.stringify(syncResult[section]).substring(0, 200)}...` :
                        typeof syncResult[section] === 'string' ?
                        syncResult[section].substring(0, 200) + '...' :
                        JSON.stringify(syncResult[section]).substring(0, 200) + '...'
                    }
                </div>
            </div>
        `;
    });

    syncPreviewContent.innerHTML = previewHtml;

    // Store sync data for application
    currentSyncData = { changedSection, syncResult };

    // Show action buttons
    if (syncPreviewActions) {
        syncPreviewActions.classList.remove('hidden');
    }
}

function showSyncError(errorMessage) {
    if (syncPreviewContent) {
        syncPreviewContent.innerHTML = `
            <div class="text-center text-red-600">
                <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-lg font-medium">Sync Error</p>
                <p class="text-sm mt-2">${errorMessage}</p>
            </div>
        `;
    }
}

async function applySyncChanges() {
    if (!currentSyncData) return;

    const { changedSection, syncResult } = currentSyncData;

    try {
        // Apply changes to the appropriate sections
        if (syncResult.description) {
            // Complete replacement (for backward compatibility)
            currentSopData.descriptionMd = syncResult.description;
            const descriptionContainer = document.getElementById('descriptionContainer');
            if (descriptionContainer) {
                descriptionContainer.innerHTML = parseMarkdownToHtml(syncResult.description);
            }
        }

        if (syncResult.descriptionEnhancement) {
            // Enhancement mode - replace with improved description (not append)
            const currentDescription = currentSopData.descriptionMd || '';

            // Check if enhancement is actually an improvement or just repetitive content
            const enhancement = syncResult.descriptionEnhancement.trim();

            // Only apply if enhancement is meaningful and not already present
            if (enhancement && !currentDescription.toLowerCase().includes(enhancement.toLowerCase().substring(0, 50))) {
                // Replace with enhanced version instead of appending
                currentSopData.descriptionMd = enhancement;
                const descriptionContainer = document.getElementById('descriptionContainer');
                if (descriptionContainer) {
                    descriptionContainer.innerHTML = parseMarkdownToHtml(enhancement);
                }
            } else {
                console.log('Skipping repetitive or empty enhancement');
            }
        }

        if (syncResult.bpmnXml) {
            currentSopData.bpmnXml = syncResult.bpmnXml;
            openDiagram(syncResult.bpmnXml);
        }

        if (syncResult.bpmnSuggestions) {
            // For now, show BPMN suggestions in the upload status
            // In the future, this could be integrated with BPMN editing
            console.log('BPMN Suggestions:', syncResult.bpmnSuggestions);
        }

        if (syncResult.racmData && Array.isArray(syncResult.racmData)) {
            // Add new RACM entries (for backward compatibility)
            racmData = [...(racmData || []), ...syncResult.racmData];
            renderRacmTable();
        }

        if (syncResult.racmUpdates && Array.isArray(syncResult.racmUpdates)) {
            // Simplified detection logic for completely different processes
            const currentDesc = currentSopData.descriptionMd || '';
            const isCompletelyDifferentProcess =
                (currentDesc.toLowerCase().includes('tea') && !racmData.some(entry => entry.processStep?.toLowerCase()?.includes('tea'))) ||
                (currentDesc.toLowerCase().includes('manufacturing') && !racmData.some(entry => entry.processStep?.toLowerCase()?.includes('manufactur'))) ||
                (currentDesc.toLowerCase().includes('cooking') && !racmData.some(entry => entry.processStep?.toLowerCase()?.includes('cook'))) ||
                (currentDesc.toLowerCase().includes('service') && currentDesc.toLowerCase().includes('customer') && !racmData.some(entry => entry.processStep?.toLowerCase()?.includes('service')));

            console.log('RACM Update Debug:', {
                currentDesc: currentDesc.substring(0, 100),
                isCompletelyDifferentProcess,
                racmUpdatesCount: syncResult.racmUpdates.length,
                existingRacmCount: racmData.length
            });

            if (isCompletelyDifferentProcess) {
                // Force complete replacement for different processes
                console.log('Forcing complete RACM replacement for different process');
                racmData = syncResult.racmUpdates.map(update => validateAndFixRacmEntry({
                    stepNumber: update.stepNumber,
                    processStep: update.processStep || `Process Step ${update.stepNumber}`,
                    riskDescription: update.keyRisk,
                    controlDescription: update.keyControl,
                    controlOwner: 'Process Owner',
                    controlFrequency: update.frequency,
                    controlType: 'Preventive',
                    evidenceAuditTest: update.evidence,
                    cosoComponent: 'Control Activities',
                    riskLevel: update.riskLevel
                }));
            } else {
                // Update existing RACM entries (same process)
                console.log('Updating existing RACM entries for same process');
                syncResult.racmUpdates.forEach(update => {
                    const existingEntryIndex = racmData.findIndex(entry =>
                        entry.stepNumber === update.stepNumber
                    );

                    if (existingEntryIndex !== -1) {
                        // Update existing entry with validation
                        const existingEntry = racmData[existingEntryIndex];
                        const updatedEntry = {
                            ...existingEntry,
                            processStep: update.processStep || existingEntry.processStep,
                            riskDescription: update.keyRisk || existingEntry.riskDescription,
                            controlDescription: update.keyControl || existingEntry.controlDescription,
                            controlFrequency: update.frequency || existingEntry.controlFrequency,
                            evidenceAuditTest: update.evidence || existingEntry.evidenceAuditTest,
                            riskLevel: update.riskLevel || existingEntry.riskLevel
                        };
                        racmData[existingEntryIndex] = validateAndFixRacmEntry(updatedEntry);
                    } else {
                        // Add new entry if stepNumber doesn't exist
                        racmData.push(validateAndFixRacmEntry({
                            stepNumber: update.stepNumber,
                            processStep: update.processStep || `Process Step ${update.stepNumber}`,
                            riskDescription: update.keyRisk,
                            controlDescription: update.keyControl,
                            controlOwner: 'Process Owner',
                            controlFrequency: update.frequency,
                            controlType: 'Preventive',
                            evidenceAuditTest: update.evidence,
                            cosoComponent: 'Control Activities',
                            riskLevel: update.riskLevel
                        }));
                    }
                });
            }
            renderRacmTable();
        }

        // Close modal and show success message
        closeSyncPreviewModal();

        // Show success notification
        const uploadStatus = document.getElementById('uploadStatus');
        if (uploadStatus) {
            uploadStatus.textContent = `✅ Sync completed! Updated sections based on ${changedSection} changes.`;
            uploadStatus.className = 'text-sm text-green-600';
            setTimeout(() => {
                uploadStatus.textContent = '';
                uploadStatus.className = 'text-sm text-slate-600';
            }, 3000);
        }

    } catch (error) {
        console.error('Error applying sync changes:', error);
        showSyncError('Failed to apply changes: ' + error.message);
    }
}

// Make functions globally accessible
window.handleSyncRequest = handleSyncRequest;
window.showSyncPreviewModal = showSyncPreviewModal;
window.closeSyncPreviewModal = closeSyncPreviewModal;
window.applySyncChanges = applySyncChanges;