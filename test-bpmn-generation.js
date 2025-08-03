// Test the BPMN generation function
function generateSimpleBpmnFromSteps(steps) {
    if (!steps || steps.length === 0) {
        console.log('No steps provided, using simple fallback');
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

// Test with tea-making steps
const teaSteps = [
    "Step 1: Gather all necessary ingredients and equipment.",
    "Step 2: Boil water to the appropriate temperature.",
    "Step 3: Prepare tea leaves or tea bag.",
    "Step 4: Steep tea for the recommended time.",
    "Step 5: Add milk, sugar, or other additives if desired.",
    "Step 6: Serve the tea in a cup."
];

console.log('Testing BPMN generation with tea steps...');
const bpmnXml = generateSimpleBpmnFromSteps(teaSteps);

if (bpmnXml) {
    console.log('✅ BPMN XML generated successfully');
    console.log('Length:', bpmnXml.length, 'characters');
    console.log('First 200 chars:', bpmnXml.substring(0, 200));
    
    // Check for common BPMN elements
    const hasStartEvent = bpmnXml.includes('startEvent');
    const hasEndEvent = bpmnXml.includes('endEvent');
    const hasTasks = bpmnXml.includes('bpmn:task');
    const hasDiagram = bpmnXml.includes('BPMNDiagram');
    
    console.log('✅ Contains start event:', hasStartEvent);
    console.log('✅ Contains end event:', hasEndEvent);
    console.log('✅ Contains tasks:', hasTasks);
    console.log('✅ Contains diagram:', hasDiagram);
    
    // Count tasks
    const taskCount = (bpmnXml.match(/bpmn:task/g) || []).length;
    console.log('✅ Task count:', taskCount, '(expected:', teaSteps.length, ')');

    if (taskCount !== teaSteps.length) {
        console.log('\n🔍 Debugging task duplication...');
        const taskMatches = bpmnXml.match(/bpmn:task[^>]*>/g) || [];
        taskMatches.forEach((match, index) => {
            console.log(`Task ${index + 1}:`, match);
        });
    }

} else {
    console.log('❌ BPMN XML generation failed');
}

console.log('\nTesting with empty steps...');
const emptyBpmn = generateSimpleBpmnFromSteps([]);
console.log('Empty steps result:', emptyBpmn ? 'Generated fallback BPMN (correct)' : 'null (unexpected)');
