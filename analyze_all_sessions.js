// Detailed analysis of all sessions to identify voice mode sessions
import { MongoClient } from 'mongodb';

async function analyzeAllSessions() {
  const uri = "mongodb+srv://FluentiAIadmin:bH3s2uTTsXryJLQ5@fluentiai-cluster.fgkhlin.mongodb.net/fluenti?retryWrites=true&w=majority&appName=FluentiAI-cluster&connectTimeoutMS=10000&socketTimeoutMS=45000&serverSelectionTimeoutMS=10000&maxIdleTimeMS=30000&family=4";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('fluenti');
    const collection = db.collection('emotionalsessions');
    
    console.log('\n📋 Detailed Analysis of All Sessions:');
    const allSessions = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`📊 Total sessions found: ${allSessions.length}\n`);
    
    for (let i = 0; i < allSessions.length; i++) {
      const session = allSessions[i];
      console.log(`=== Session ${i + 1} ===`);
      console.log(`ID: ${session.id}`);
      console.log(`Mode: ${session.mode || 'undefined'}`);
      console.log(`SessionType: ${session.sessionType || 'undefined'}`);
      console.log(`Messages: ${session.messages ? session.messages.length : 0}`);
      console.log(`Created: ${session.createdAt ? new Date(session.createdAt).toLocaleString() : 'undefined'}`);
      console.log(`UserId: ${session.userId || 'undefined'}`);
      
      // Show first and last messages to understand the conversation
      if (session.messages && session.messages.length > 0) {
        const firstMsg = session.messages[0];
        const lastMsg = session.messages[session.messages.length - 1];
        
        console.log(`\n📝 First message (${firstMsg.role}): "${firstMsg.content ? firstMsg.content.substring(0, 100) : 'N/A'}${firstMsg.content && firstMsg.content.length > 100 ? '...' : ''}"`);
        
        if (session.messages.length > 1) {
          console.log(`📝 Last message (${lastMsg.role}): "${lastMsg.content ? lastMsg.content.substring(0, 100) : 'N/A'}${lastMsg.content && lastMsg.content.length > 100 ? '...' : ''}"`);
        }
        
        // Look for voice-related keywords
        const allText = session.messages.map(m => m.content || '').join(' ').toLowerCase();
        const voiceKeywords = ['voice', 'speak', 'said', 'listening', 'microphone', 'audio', 'pronunciation', 'vocal'];
        const foundKeywords = voiceKeywords.filter(keyword => allText.includes(keyword));
        
        if (foundKeywords.length > 0) {
          console.log(`🎤 Voice keywords found: ${foundKeywords.join(', ')}`);
        }
      }
      
      console.log(`-----------------------------------\n`);
    }
    
    // Summary by mode
    console.log('\n📊 Summary by Mode:');
    const modeCounts = {};
    allSessions.forEach(session => {
      const mode = session.mode || 'undefined';
      modeCounts[mode] = (modeCounts[mode] || 0) + 1;
    });
    
    Object.entries(modeCounts).forEach(([mode, count]) => {
      console.log(`  ${mode}: ${count} sessions`);
    });
    
    // Summary by sessionType
    console.log('\n📊 Summary by SessionType:');
    const typeCounts = {};
    allSessions.forEach(session => {
      const type = session.sessionType || 'undefined';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} sessions`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

analyzeAllSessions();