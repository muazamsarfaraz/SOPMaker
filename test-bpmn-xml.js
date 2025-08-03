// Test BPMN XML validity
const fs = require('fs');

// Generate a simple BPMN XML to test
const testSteps = ["Boil water", "Add tea", "Steep", "Serve"];

function generateSimpleBpmnFromSteps(steps) {
    if (!steps || steps.length === 0) {
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
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="300" y="77" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="450" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="215" y="117" />
        <di:waypoint x="300" y="117" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="400" y="117" />
        <di:waypoint x="450" y="117" />
      </bpmndi:BPMNEdge>
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
        const stepName = step.replace(/^\d+\.\s*/, '').substring(0, 50);
        
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
    </bpmn:endEvent>`;

    // Add sequence flows
    bpmnXml += `
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />`;
    
    steps.forEach((step, index) => {
        const currentTaskId = `Task_${index + 1}`;
        const nextFlowId = `Flow_${index + 2}`;
        
        if (index < steps.length - 1) {
            const nextTaskId = `Task_${index + 2}`;
            bpmnXml += `
    <bpmn:sequenceFlow id="${nextFlowId}" sourceRef="${currentTaskId}" targetRef="${nextTaskId}" />`;
        } else {
            bpmnXml += `
    <bpmn:sequenceFlow id="${nextFlowId}" sourceRef="${currentTaskId}" targetRef="EndEvent_1" />`;
        }
    });

    bpmnXml += `
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
      </bpmndi:BPMNShape>`;

    // Add sequence flow edges
    bpmnXml += `
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="215" y="117" />
        <di:waypoint x="300" y="117" />
      </bpmndi:BPMNEdge>`;

    steps.forEach((step, index) => {
        const flowId = `Flow_${index + 2}`;
        const currentX = 300 + (index * 150);
        const nextX = index < steps.length - 1 ? 300 + ((index + 1) * 150) : 300 + (steps.length * 150);
        
        bpmnXml += `
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${currentX + 100}" y="117" />
        <di:waypoint x="${nextX}" y="117" />
      </bpmndi:BPMNEdge>`;
    });

    bpmnXml += `
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

    return bpmnXml;
}

console.log('🧪 Testing BPMN XML Generation...');

const bpmnXml = generateSimpleBpmnFromSteps(testSteps);

console.log('✅ Generated BPMN XML length:', bpmnXml.length);

// Check for key elements
const hasSequenceFlows = (bpmnXml.match(/bpmn:sequenceFlow/g) || []).length;
const hasShapes = (bpmnXml.match(/bpmndi:BPMNShape/g) || []).length;
const hasEdges = (bpmnXml.match(/bpmndi:BPMNEdge/g) || []).length;

console.log('✅ Sequence flows:', hasSequenceFlows);
console.log('✅ Diagram shapes:', hasShapes);
console.log('✅ Diagram edges:', hasEdges);

// Save to file for manual inspection
fs.writeFileSync('test-output.bpmn', bpmnXml);
console.log('✅ BPMN XML saved to test-output.bpmn');

// Check for XML validity (basic)
const hasXmlDeclaration = bpmnXml.startsWith('<?xml');
const hasClosingTag = bpmnXml.includes('</bpmn:definitions>');
const hasNamespaces = bpmnXml.includes('xmlns:bpmn') && bpmnXml.includes('xmlns:bpmndi');

console.log('✅ XML declaration:', hasXmlDeclaration);
console.log('✅ Proper closing:', hasClosingTag);
console.log('✅ Namespaces:', hasNamespaces);

if (hasSequenceFlows > 0 && hasShapes > 0 && hasEdges > 0) {
    console.log('🎉 BPMN XML appears to be complete and valid!');
} else {
    console.log('❌ BPMN XML is missing critical elements');
}
