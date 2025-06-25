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

    description: `You are an expert business process analyst. A process description has been updated.

Current Description: ${description || 'Not provided'}
Current BPMN: ${bpmnXml ? 'BPMN diagram exists' : 'No BPMN provided'}
Current RACM entries: ${JSON.stringify(racmData || [], null, 2)}

CRITICAL ANALYSIS: Look at the current description. If it describes a completely different process than what's in the current RACM entries, you MUST provide completely new RACM entries that match the new process.

For example:
- If current RACM shows "payment processing" but description is about "tea making", provide tea-making RACM entries
- If current RACM shows "accounts system" but description is about "manufacturing", provide manufacturing RACM entries

Please provide:
1. Enhanced description content that builds upon the existing description with additional insights and improvements
2. Comprehensive BPMN diagram suggestions that reflect the current process described
3. RACM entries that match the process described in the current description (not the old RACM entries)

Respond in JSON format:
{
  "descriptionEnhancement": "Additional content to enhance the existing description with new insights and improvements...",
  "bpmnSuggestions": "Comprehensive description of what the BPMN diagram should show for this process, including all major steps, decision points, and flow...",
  "racmUpdates": [
    {
      "stepNumber": "step number (1, 2, 3, etc.)",
      "processStep": "Name of the actual process step from the current description",
      "keyRisk": "Key risk for this specific process step",
      "keyControl": "Key control for this specific process step",
      "frequency": "Control frequency",
      "evidence": "Evidence/audit test",
      "riskLevel": "Risk level (Low/Medium/High)"
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
