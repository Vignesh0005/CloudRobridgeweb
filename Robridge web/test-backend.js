const fetch = require('node-fetch');

async function testBackend() {
  console.log('Testing backend connectivity...\n');
  
  // Test Node.js server health
  try {
    console.log('1. Testing Node.js server (port 3001)...');
    const nodeResponse = await fetch('http://localhost:3001/api/health');
    const nodeData = await nodeResponse.json();
    console.log('✅ Node.js server is running:', nodeData);
  } catch (error) {
    console.log('❌ Node.js server error:', error.message);
    console.log('   Make sure to run: node server.js');
    return;
  }
  
  // Test Python backend health
  try {
    console.log('\n2. Testing Python backend (port 5000)...');
    const pythonResponse = await fetch('http://localhost:5000/health');
    const pythonData = await pythonResponse.json();
    console.log('✅ Python backend is running:', pythonData);
  } catch (error) {
    console.log('❌ Python backend error:', error.message);
    console.log('   Make sure to run: cd "Barcode generator&Scanner" && python start_server.py');
    return;
  }
  
  // Test rack endpoints
  try {
    console.log('\n3. Testing rack endpoints...');
    
    // Test rack stats
    const statsResponse = await fetch('http://localhost:3001/api/racks/stats');
    const statsData = await statsResponse.json();
    console.log('✅ Rack stats endpoint:', statsData);
    
    // Test rack list
    const racksResponse = await fetch('http://localhost:3001/api/racks');
    const racksData = await racksResponse.json();
    console.log('✅ Rack list endpoint:', racksData);
    
  } catch (error) {
    console.log('❌ Rack endpoints error:', error.message);
  }
  
  console.log('\n🎉 Backend test completed!');
}

testBackend().catch(console.error);
