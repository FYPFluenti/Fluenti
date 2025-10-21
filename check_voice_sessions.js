// Check for sessions that should be voice mode
import { MongoClient } from 'mongodb';

async function checkForVoiceSessions() {
  const uri = "mongodb+srv://admin:FXbkHPOm6lrsCPxT@cluster0.yluz6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('fluenti');
    const collection = db.collection('emotionalsessions');
    
    // Get all sessions to analyze patterns
    console.log('\n🔍 Analyzing all EmotionalSession documents for voice mode indicators:');
    const allSessions = await collection.find({}).toArray();
    
    console.log(`📊 Total sessions found: ${allSessions.length}`);
    
    for (let i = 0; i < allSessions.length; i++) {
      const session = allSessions[i];
      console.log(`\n--- Session ${i + 1} ---`);
      console.log(`ID: ${session.id}`);
      console.log(`Mode: ${session.mode}`);
      console.log(`SessionType: ${session.sessionType}`);
      console.log(`Messages: ${session.messages ? session.messages.length : 0}`);
      
      // Check if messages contain voice-related indicators
      if (session.messages && session.messages.length > 0) {
        const firstMessage = session.messages[0];
        const lastMessage = session.messages[session.messages.length - 1];
        
        console.log(`First message: "${firstMessage.content ? firstMessage.content.substring(0, 50) : 'N/A'}..."`);
        console.log(`Last message: "${lastMessage.content ? lastMessage.content.substring(0, 50) : 'N/A'}..."`);
        
        // Look for voice-related keywords or patterns
        const allText = session.messages.map(m => m.content || '').join(' ').toLowerCase();
        const voiceIndicators = ['voice', 'speak', 'said', 'listening', 'microphone', 'audio', 'pronunciation'];
        const foundIndicators = voiceIndicators.filter(indicator => allText.includes(indicator));
        
        if (foundIndicators.length > 0) {
          console.log(`🎤 Possible voice session - indicators: ${foundIndicators.join(', ')}`);
        }
      }
      
      console.log(`Created: ${session.createdAt}`);
    }
    
    // Show sessions by sessionType
    console.log('\n📈 Sessions by type:');
    const sessionTypes = {};
    allSessions.forEach(session => {
      const type = session.sessionType || 'undefined';
      sessionTypes[type] = (sessionTypes[type] || 0) + 1;
    });
    
    Object.entries(sessionTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} sessions`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkForVoiceSessions();