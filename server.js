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

async function generateSyncSuggestions(changedSection, currentData) {
  const { bpmnXml, description, racmData } = currentData;

  // If OpenAI is not configured, return an error to trigger fallback
  if (!openai) {
    throw new Error('OpenAI API not configured. Using simulation mode.');
  }

  // Create context-aware prompts based on which section changed
  const prompts = {
    bpmn: `You are an expert business process analyst. A BPMN diagram has been modified. Based on the current process flow, suggest enhancements to the Description and updates to the RACM (Risk and Control Matrix).

Current BPMN: ${bpmnXml ? bpmnXml.substring(0, 1000) + '...' : 'Not provided'}
Current Description: ${description || 'Not provided'}
Current RACM entries: ${JSON.stringify(racmData || [], null, 2)}

Please provide:
1. Enhanced description that builds upon the existing content and incorporates insights from the BPMN changes
2. Updates to existing RACM entries with improved Key Risk, Key Control, Frequency, Evidence, and Risk Level

Respond in JSON format:
{
  "descriptionEnhancement": "Additional content to enhance the existing description...",
  "racmUpdates": [
    {
      "stepNumber": "existing step number to update",
      "keyRisk": "Updated key risk description",
      "keyControl": "Updated key control description",
      "frequency": "Updated frequency",
      "evidence": "Updated evidence/audit test",
      "riskLevel": "Updated risk level (Low/Medium/High)"
    }
  ]
}`,

    description: `You are an expert business process analyst. A process description has been updated. Based on the new description, suggest updates to the BPMN diagram and enhancements to the RACM.

Current Description: ${description || 'Not provided'}
Current BPMN: ${bpmnXml ? 'BPMN diagram exists' : 'No BPMN provided'}
Current RACM entries: ${JSON.stringify(racmData || [], null, 2)}

Please provide:
1. Suggestions for BPMN diagram updates (describe what should be added/changed)
2. Updates to existing RACM entries with improved Key Risk, Key Control, Frequency, Evidence, and Risk Level

Respond in JSON format:
{
  "bpmnSuggestions": "Describe what should be updated in the BPMN diagram...",
  "racmUpdates": [
    {
      "stepNumber": "existing step number to update",
      "keyRisk": "Updated key risk description",
      "keyControl": "Updated key control description",
      "frequency": "Updated frequency",
      "evidence": "Updated evidence/audit test",
      "riskLevel": "Updated risk level (Low/Medium/High)"
    }
  ]
}`,

    racm: `You are an expert risk management analyst. The RACM (Risk and Control Matrix) has been updated. Based on the new risk and control information, suggest enhancements to the Description and BPMN diagram.

Current RACM entries: ${JSON.stringify(racmData || [], null, 2)}
Current Description: ${description || 'Not provided'}
Current BPMN: ${bpmnXml ? 'BPMN diagram exists' : 'No BPMN provided'}

Please provide:
1. Enhanced description that builds upon existing content and incorporates the new risk considerations
2. Suggestions for BPMN diagram updates to include control checkpoints

Respond in JSON format:
{
  "descriptionEnhancement": "Additional content to enhance the existing description with risk considerations...",
  "bpmnSuggestions": "Describe what control checkpoints should be added to the BPMN..."
}`
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
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
    const response = JSON.parse(completion.choices[0].message.content);
    return response;
  } catch (parseError) {
    console.error('Error parsing OpenAI response:', parseError);
    // Fallback to a structured response
    return {
      error: 'Failed to parse AI response',
      rawResponse: completion.choices[0].message.content
    };
  }
}

// Serve static files from the current directory
app.use(express.static(__dirname));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Debug endpoint to check environment variables (remove in production)
app.get('/api/debug/env', (req, res) => {
  res.json({
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'Not set',
    openaiInitialized: !!openai
  });
});

app.listen(PORT, () => {
  console.log(`SOP Maker server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
