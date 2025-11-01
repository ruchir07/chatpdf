// test-api.js
const axios = require('axios');

const API_KEY = 'kg_your_api_key_here'; // Replace after creating
const API_SECRET = 'your_secret_here'; // Replace after creating

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'X-API-Key': API_KEY,
    'X-API-Secret': API_SECRET,
  },
});

async function testAPI() {
  try {
    // Test 1: List documents
    console.log('Testing GET /documents...');
    const docs = await api.get('/documents');
    console.log('Documents:', docs.data);

    // Test 2: Query
    if (docs.data.data.documents.length > 0) {
      console.log('\nTesting POST /query...');
      const chatId = docs.data.data.documents[0].id;
      const query = await api.post('/query', {
        question: 'What is this document about?',
        chatId,
      });
      console.log('Query Result:', query.data);
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAPI();