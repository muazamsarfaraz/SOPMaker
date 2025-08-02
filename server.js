const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware for parsing JSON
app.use(express.json({ limit: '10mb' }));

// Get port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// OpenAI Integration
const OpenAI = require('openai');

let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI API initialized');
} else {
  console.log('⚠️  OpenAI API key not configured. Sync will use simulation mode.');
}

// Sync endpoint for AI-powered section synchronization
app.post('/api/sync-sections', async (req, res) => {
  try {
    const { changedSection, currentData } = req.body;

    if (!changedSection || !currentData) {
      return res.status(400).json({ error: 'Missing required fields: changedSection, currentData' });
    }

    console.log(`Processing sync request for section: ${changedSection}`);

    // Generate sync suggestions using OpenAI
    const syncResult = await generateSyncSuggestions(changedSection, currentData);

    res.json({
      success: true,
      changedSection,
      syncResult
    });

  } catch (error) {
    console.error('Error in sync endpoint:', error);
    res.status(500).json({
      error: 'Failed to generate sync suggestions',
      details: error.message
    });
  }
});

// Helper function to extract meaningful information from BPMN XML
function extractBpmnProcessInfo(bpmnXml) {
  if (!bpmnXml) return { steps: [], flow: 'No BPMN provided' };

  try {
    // Extract task names and start events from BPMN XML
    const taskMatches = bpmnXml.match(/name="([^"]+)"/g) || [];
    const steps = taskMatches.map(match => match.replace(/name="([^"]+)"/, '$1')).filter(step => step.length > 0);

    // Create a simple flow description
    const flow = steps.length > 0 ? `Process flow: ${steps.join(' → ')}` : 'No clear process flow identified';

    return { steps, flow };
  } catch (error) {
    console.error('Error parsing BPMN:', error);
    return { steps: [], flow: 'Error parsing BPMN diagram' };
  }
}

async function generateSyncSuggestions(changedSection, currentData) {
  const { bpmnXml, description, racmData } = currentData;

  // If OpenAI is not configured, return an error to trigger fallback
  if (!openai) {
    throw new Error('OpenAI API not configured. Using simulation mode.');
  }

  // Extract meaningful process information from BPMN
  const bpmnInfo = extractBpmnProcessInfo(bpmnXml);
  console.log('Extracted BPMN info:', bpmnInfo);

  // Create context-aware prompts based on which section changed
  const prompts = {
    bpmn: `You are an expert business process analyst. A BPMN diagram has been modified. Analyze the ACTUAL process and provide relevant suggestions.

CURRENT PROCESS DESCRIPTION:
"${description || 'Not provided'}"

BPMN PROCESS ANALYSIS:
${bpmnInfo.flow}
Process Steps Identified: ${bpmnInfo.steps.length > 0 ? bpmnInfo.steps.join(', ') : 'None clearly identified'}

EXISTING RACM: ${racmData && racmData.length > 0 ? racmData.length + ' entries' : 'None'}

CRITICAL INSTRUCTION: Look at the actual process steps from the BPMN diagram. Create suggestions that match these SPECIFIC steps, not generic templates.

TASK: Based on the ACTUAL BPMN process steps, provide:
1. A clear description of what this process does (based on the step names)
2. RACM entries for each major process step identified in the BPMN

Respond in JSON format:
{
  "descriptionEnhancement": "Clear description of what this specific process accomplishes based on the BPMN steps",
  "racmUpdates": [
    {
      "stepNumber": "1",
      "processStep": "Use the exact step name from BPMN",
      "keyRisk": "Specific risk for this exact step",
      "keyControl": "Specific control for this exact step",
      "frequency": "Realistic frequency for this type of step",
      "evidence": "Practical evidence for this specific step",
      "riskLevel": "Low/Medium/High"
    }
  ]
}`,

    description: `You are an expert business process analyst. Analyze the current process and provide intelligent improvements.

CURRENT PROCESS DESCRIPTION:
"${description || 'Not provided'}"

BPMN PROCESS ANALYSIS:
${bpmnInfo.flow}
Process Steps from BPMN: ${bpmnInfo.steps.length > 0 ? bpmnInfo.steps.join(', ') : 'None identified'}

CURRENT RACM ENTRIES: ${racmData && racmData.length > 0 ? racmData.length + ' entries exist' : 'None'}

CRITICAL INSTRUCTION: Use the ACTUAL process steps from the BPMN diagram to create relevant suggestions. Don't use generic templates.

TASK: Based on the ACTUAL process (description + BPMN steps), provide:
1. An IMPROVED description that clearly explains what this specific process does
2. RACM entries that match the actual process steps identified

Respond in JSON format:
{
  "descriptionEnhancement": "Clear, improved description of what this specific process accomplishes",
  "bpmnSuggestions": "Brief description of the key process flow",
  "racmUpdates": [
    {
      "stepNumber": "1",
      "processStep": "Use actual step name from BPMN or description",
      "keyRisk": "Specific risk for this exact process step",
      "keyControl": "Specific control for this exact process step",
      "frequency": "Realistic frequency for this step type",
      "evidence": "Specific evidence for this process step",
      "riskLevel": "Low/Medium/High"
    }
  ]
}`,

    racm: `You are an expert risk management analyst. The RACM has been updated. Provide intelligent suggestions for other sections.

CURRENT PROCESS DESCRIPTION:
"${description || 'Not provided'}"

UPDATED RACM: ${racmData && racmData.length > 0 ? `${racmData.length} risk/control entries` : 'None'}

TASK: Based on the RACM updates, provide:
1. An improved description that incorporates risk awareness
2. BPMN suggestions for control points

Keep suggestions specific to the actual process described.

Respond in JSON format:
{
  "descriptionEnhancement": "Improved description with risk considerations integrated naturally",
  "bpmnSuggestions": "Specific control checkpoints for this process"
}`
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert business process analyst specializing in SOPs, BPMN diagrams, and risk management. Always respond with valid JSON."
      },
      {
        role: "user",
        content: prompts[changedSection]
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  });

  try {
    let content = completion.choices[0].message.content;

    // Remove markdown code blocks if present - more robust approach
    content = content.replace(/```json\s*/gi, '').replace(/```\s*$/gm, '').replace(/```/g, '');

    // Find JSON content between braces
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    const response = JSON.parse(content.trim());
    return response;
  } catch (parseError) {
    console.error('Error parsing OpenAI response:', parseError);
    console.error('Raw content:', completion.choices[0].message.content);
    // Fallback to a structured response
    return {
      error: 'Failed to parse AI response',
      rawResponse: completion.choices[0].message.content
    };
  }
}

// Debug endpoint to check environment variables (remove in production)
app.get('/api/debug/env', (req, res) => {
  res.json({
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'Not set',
    openaiInitialized: !!openai
  });
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SOP Maker server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
