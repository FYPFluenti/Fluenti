// Test script to verify session continuation fix
import fetch from 'node-fetch';

async function testSessionContinuation() {
  try {
    console.log('🧪 Testing session continuation fix...');
    
    // Get a real session ID from the database
    const { MongoClient } = await import('mongodb');
    const uri = "mongodb+srv://FluentiAIadmin:bH3s2uTTsXryJLQ5@fluentiai-cluster.fgkhlin.mongodb.net/fluenti?retryWrites=true&w=majority&appName=FluentiAI-cluster&connectTimeoutMS=10000&socketTimeoutMS=45000&serverSelectionTimeoutMS=10000&maxIdleTimeMS=30000&family=4";
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db('fluenti');
    const collection = db.collection('emotionalsessions');
    
    // Get a session with messages
    const sessionWithMessages = await collection.findOne({ 
      userId: 'user-imCdZrt0-SiV2ZIeDLJ-h',
      messages: { $exists: true, $ne: [] }
    });
    
    if (!sessionWithMessages) {
      console.log('❌ No sessions with messages found');
      await client.close();
      return;
    }
    
    console.log('📝 Found session:', {
      id: sessionWithMessages.id,
      _id: sessionWithMessages._id,
      userId: sessionWithMessages.userId,
      messageCount: sessionWithMessages.messages.length,
      mode: sessionWithMessages.mode,
      firstMessage: sessionWithMessages.messages[0]?.content?.substring(0, 50) + '...'
    });
    
    await client.close();
    
    // Test the Python service with this session
    console.log('🔍 Testing Python service with session ID:', sessionWithMessages.id);
    
    const response = await fetch('http://localhost:5001/api/therapy/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What were we talking about?',
        sessionId: sessionWithMessages.id,  // Use the correct nanoid
        userId: sessionWithMessages.userId,
        language: 'en'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Session continuation test successful!');
      console.log('📋 Response:', result.response.substring(0, 200) + '...');
      
      if (result.response.includes('haven\'t discussed anything yet') || result.response.includes('beginning of our conversation')) {
        console.log('❌ Session context not loaded - still seeing "new conversation" response');
      } else {
        console.log('✅ Session context loaded successfully!');
      }
    } else {
      console.log('❌ Request failed:', response.status, await response.text());
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSessionContinuation();