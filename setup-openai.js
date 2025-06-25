#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 OpenAI Setup for SOPMaker');
console.log('=============================\n');

rl.question('Please enter your OpenAI API key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ No API key provided. Exiting...');
    rl.close();
    return;
  }

  // Update .env file
  const envContent = `# OpenAI API Configuration
OPENAI_API_KEY=${apiKey.trim()}

# Server Configuration
PORT=3000
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ OpenAI API key saved to .env file');
  console.log('🚀 You can now start the server with: npm start');
  
  rl.close();
});
