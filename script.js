document.addEventListener('DOMContentLoaded', function() {
    // Initial BPMN XML is now in initial_diagram.bpmn

    const diagramContainer = document.getElementById('diagram');
    const uploadStatus = document.getElementById('uploadStatus');
    let bpmnViewer;
    let bpmnModeler;
    let isEditMode = false;
    const loadingMessageElement = diagramContainer.querySelector('.loading-message');

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

    if (window.BpmnJS) {
        // Initialize viewer mode first (read-only)
        bpmnViewer = new window.BpmnJS({
            container: diagramContainer
        });

        // Don't initialize modeler until needed to avoid conflicts
        bpmnModeler = null;
    } else {
        console.error('BpmnJS library is not loaded. Check script tags.');
        if(loadingMessageElement && diagramContainer) { // check diagramContainer exists
            loadingMessageElement.innerHTML = '<div class="text-red-600 p-4 text-center">Error: BPMN Modeler library (BpmnJS) not found. Please check the script link.</div>';
            loadingMessageElement.style.display = 'flex';
        }
    }

    async function openDiagram(xml) {
        currentSopData.bpmnXml = xml; // Store current BPMN XML

        // Only use this function for viewer mode now
        // Edit mode handles its own diagram loading
        if (isEditMode) {
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

            const bjsContainerPost = diagramContainer.querySelector('.bjs-container');
            if (bjsContainerPost) bjsContainerPost.style.display = 'block';

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

    // BPMN Editing Functions
    async function enterEditMode() {
        if (!currentSopData.bpmnXml) {
            console.error('Cannot enter edit mode: no diagram loaded');
            return;
        }

        // Initialize modeler if not already done
        if (!bpmnModeler) {
            try {
                bpmnModeler = new window.BpmnJS({
                    container: diagramContainer
                });
            } catch (err) {
                console.error('Error initializing BPMN modeler:', err);
                return;
            }
        }

        isEditMode = true;

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

        // Load diagram in modeler
        try {
            await bpmnModeler.importXML(currentSopData.bpmnXml);
            if (loadingMessageElement) loadingMessageElement.style.display = 'none';
            if (uploadStatus) uploadStatus.textContent = 'Diagram ready for editing.';

            const canvas = bpmnModeler.get('canvas');
            canvas.zoom('fit-viewport', 'auto');
        } catch (err) {
            console.error('Error loading diagram in modeler:', err);
            if (uploadStatus) uploadStatus.textContent = `Error loading diagram for editing: ${err.message}`;
        }
    }

    async function exitEditMode() {
        isEditMode = false;

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

        // Reinitialize viewer
        try {
            bpmnViewer = new window.BpmnJS({
                container: diagramContainer
            });

            // Load diagram in viewer
            await bpmnViewer.importXML(currentSopData.bpmnXml);
            if (loadingMessageElement) loadingMessageElement.style.display = 'none';
            if (uploadStatus) uploadStatus.textContent = 'Diagram loaded successfully.';

            const canvas = bpmnViewer.get('canvas');
            canvas.zoom('fit-viewport', 'auto');
        } catch (err) {
            console.error('Error loading diagram in viewer:', err);
            if (uploadStatus) uploadStatus.textContent = `Error loading diagram: ${err.message}`;
        }
    }

    async function saveDiagramChanges() {
        if (!bpmnModeler || !isEditMode) {
            console.error('Cannot save: not in edit mode or modeler not ready');
            return;
        }

        try {
            const { xml } = await bpmnModeler.saveXML({ format: true });
            currentSopData.bpmnXml = xml;

            if (uploadStatus) uploadStatus.textContent = 'Diagram changes saved successfully.';

            // Exit edit mode and return to viewer
            exitEditMode();

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
            const generatedData = await generatePlaceholderSopData(userInput, sopGeneratorStatus, sopGeneratorSpinner);
            currentSopData = { ...generatedData }; // Update global state

            if (sopGeneratorStatus) sopGeneratorStatus.textContent = 'Updating page content...';
            await new Promise(resolve => setTimeout(resolve, 200));
            updatePageTitle(currentSopData.title, currentSopData.subtitle || "Generated SOP Content");
            updateFooter(currentSopData.footerData);
            openDiagram(currentSopData.bpmnXml);
            const descriptionContainer = document.getElementById('descriptionContainer');
            if (descriptionContainer) {
                descriptionContainer.innerHTML = parseMarkdownToHtml(currentSopData.descriptionMd);
            }
            const stepsContainer = document.getElementById('procedureStepsContainer');
            if (stepsContainer) {
                stepsContainer.innerHTML = parseProcedureStepsMarkdownToHtml(currentSopData.stepsMd);
            }

            // Update risks and controls sections with markdown parsing
            const risksContainer = document.getElementById('risksContainer');
            if (risksContainer && currentSopData.risksMd) {
                risksContainer.innerHTML = parseMarkdownToHtml(currentSopData.risksMd);
            }

            const controlsContainer = document.getElementById('controlsContainer');
            if (controlsContainer && currentSopData.controlsMd) {
                controlsContainer.innerHTML = parseMarkdownToHtml(currentSopData.controlsMd);
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

    // Process type detection and business logic
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

        return {
            title: dynamicTitle,
            bpmnXml: bpmnXml,
            descriptionMd: descriptionMd,
            stepsMd: stepsMd,
            risksMd: risksMd,
            controlsMd: controlsMd,
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

        // Procedure steps editing
        const editStepsBtn = document.getElementById('editStepsBtn');
        const stepsEditor = document.getElementById('stepsEditor');
        const stepsContainer = document.getElementById('procedureStepsContainer');
        const stepsTextarea = document.getElementById('stepsTextarea');
        const saveStepsEdit = document.getElementById('saveStepsEdit');
        const cancelStepsEdit = document.getElementById('cancelStepsEdit');

        if (editStepsBtn) {
            editStepsBtn.addEventListener('click', () => {
                enterEditMode('steps', currentSopData.stepsMd || '');
            });
        }

        if (saveStepsEdit) {
            saveStepsEdit.addEventListener('click', () => {
                saveEdit('steps', stepsTextarea.value);
            });
        }

        if (cancelStepsEdit) {
            cancelStepsEdit.addEventListener('click', () => {
                exitEditMode('steps');
            });
        }

        // Risks editing
        const editRisksBtn = document.getElementById('editRisksBtn');
        const risksEditor = document.getElementById('risksEditor');
        const risksContainer = document.getElementById('risksContainer');
        const risksTextarea = document.getElementById('risksTextarea');
        const saveRisksEdit = document.getElementById('saveRisksEdit');
        const cancelRisksEdit = document.getElementById('cancelRisksEdit');

        if (editRisksBtn) {
            editRisksBtn.addEventListener('click', () => {
                enterEditMode('risks', currentSopData.risksMd || '');
            });
        }

        if (saveRisksEdit) {
            saveRisksEdit.addEventListener('click', () => {
                saveEdit('risks', risksTextarea.value);
            });
        }

        if (cancelRisksEdit) {
            cancelRisksEdit.addEventListener('click', () => {
                exitEditMode('risks');
            });
        }

        // Controls editing
        const editControlsBtn = document.getElementById('editControlsBtn');
        const controlsEditor = document.getElementById('controlsEditor');
        const controlsContainer = document.getElementById('controlsContainer');
        const controlsTextarea = document.getElementById('controlsTextarea');
        const saveControlsEdit = document.getElementById('saveControlsEdit');
        const cancelControlsEdit = document.getElementById('cancelControlsEdit');

        if (editControlsBtn) {
            editControlsBtn.addEventListener('click', () => {
                enterEditMode('controls', currentSopData.controlsMd || '');
            });
        }

        if (saveControlsEdit) {
            saveControlsEdit.addEventListener('click', () => {
                saveEdit('controls', controlsTextarea.value);
            });
        }

        if (cancelControlsEdit) {
            cancelControlsEdit.addEventListener('click', () => {
                exitEditMode('controls');
            });
        }
    }

    function enterEditMode(section, content) {
        const sectionMap = {
            'description': 'description',
            'steps': 'steps',
            'risks': 'risks',
            'controls': 'controls'
        };

        const containerMap = {
            'description': 'descriptionContainer',
            'steps': 'procedureStepsContainer',
            'risks': 'risksContainer',
            'controls': 'controlsContainer'
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
            'description': 'description',
            'steps': 'steps',
            'risks': 'risks',
            'controls': 'controls'
        };

        const containerMap = {
            'description': 'descriptionContainer',
            'steps': 'procedureStepsContainer',
            'risks': 'risksContainer',
            'controls': 'controlsContainer'
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
            'description': 'descriptionMd',
            'steps': 'stepsMd',
            'risks': 'risksMd',
            'controls': 'controlsMd'
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
            'description': 'descriptionContainer',
            'steps': 'procedureStepsContainer',
            'risks': 'risksContainer',
            'controls': 'controlsContainer'
        };

        const containerId = containerMap[section];
        const container = document.getElementById(containerId);
        if (!container) return;

        if (section === 'steps') {
            // For procedure steps, use the existing markdown parser
            container.innerHTML = parseProcedureStepsMarkdownToHtml(content);
        } else if (section === 'risks' || section === 'controls' || section === 'description') {
            // For risks, controls, and description, use enhanced markdown parser
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
        const { title, subtitle, bpmnXml, descriptionMd, stepsMd, risksMd, controlsMd, footerData } = currentSopData;

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

        let diagramFile, descriptionFile, stepsFile, risksFile, controlsFile, metadataFile;
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
                footerData: metadata.footerData
            };

            updatePageTitle(currentSopData.title, currentSopData.subtitle);
            updateFooter(currentSopData.footerData);
            openDiagram(currentSopData.bpmnXml);

            const descriptionContainer = document.getElementById('descriptionContainer');
            if (descriptionContainer) {
                descriptionContainer.innerHTML = parseMarkdownToHtml(currentSopData.descriptionMd);
            }
            const stepsContainer = document.getElementById('procedureStepsContainer');
            if (stepsContainer) {
                stepsContainer.innerHTML = parseProcedureStepsMarkdownToHtml(currentSopData.stepsMd);
            }

            // Update risks and controls sections with markdown parsing
            const risksContainer = document.getElementById('risksContainer');
            if (risksContainer && currentSopData.risksMd) {
                risksContainer.innerHTML = parseMarkdownToHtml(currentSopData.risksMd);
            }

            const controlsContainer = document.getElementById('controlsContainer');
            if (controlsContainer && currentSopData.controlsMd) {
                controlsContainer.innerHTML = parseMarkdownToHtml(currentSopData.controlsMd);
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
        if (isEditMode) {
            exitEditMode();
        } else {
            enterEditMode();
        }
    });
    if (cancelDiagramEdit) cancelDiagramEdit.addEventListener('click', exitEditMode);
    if (saveDiagramEdit) saveDiagramEdit.addEventListener('click', saveDiagramChanges);

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
});