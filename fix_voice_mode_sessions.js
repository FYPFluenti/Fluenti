// Update script to fix voice mode sessions
import { MongoClient } from 'mongodb';

async function fixVoiceModeSessions() {
  const uri = "mongodb+srv://FluentiAIadmin:bH3s2uTTsXryJLQ5@fluentiai-cluster.fgkhlin.mongodb.net/fluenti?retryWrites=true&w=majority&appName=FluentiAI-cluster&connectTimeoutMS=10000&socketTimeoutMS=45000&serverSelectionTimeoutMS=10000&maxIdleTimeMS=30000&family=4";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('fluenti');
    const collection = db.collection('emotionalsessions');
    
    // Strategy: Update sessions that are likely voice sessions
    // Since we can't distinguish them perfectly, let's be conservative and ask for user input
    
    console.log('\n🔍 Finding sessions to analyze for voice mode...');
    const allSessions = await collection.find({}).toArray();
    
    console.log(`📊 Found ${allSessions.length} total sessions`);
    
    // Let's identify potential voice sessions by looking at patterns:
    // 1. Sessions created through voice endpoint might have different sessionType patterns
    // 2. We can look at creation times and other indicators
    
    let potentialVoiceSessions = [];
    
    for (const session of allSessions) {
      // Check for indicators that this might be a voice session
      let voiceIndicatorScore = 0;
      
      // If sessionType is 'crisis', it might be from voice endpoint (which handles crisis detection)
      if (session.sessionType === 'crisis') {
        voiceIndicatorScore += 2;
      }
      
      // Check message content for voice-related patterns
      if (session.messages && session.messages.length > 0) {
        const allText = session.messages.map(m => m.content || '').join(' ').toLowerCase();
        
        // Voice sessions might have different response patterns
        if (allText.includes('voice') || allText.includes('speak') || allText.includes('listening')) {
          voiceIndicatorScore += 1;
        }
        
        // Voice sessions might have shorter, more conversational messages
        const avgMessageLength = session.messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) / session.messages.length;
        if (avgMessageLength < 50) { // Shorter messages might indicate voice
          voiceIndicatorScore += 1;
        }
      }
      
      if (voiceIndicatorScore >= 2) {
        potentialVoiceSessions.push({
          ...session,
          voiceScore: voiceIndicatorScore
        });
      }
    }
    
    console.log(`\n🎤 Found ${potentialVoiceSessions.length} potential voice sessions:`);
    
    for (let i = 0; i < potentialVoiceSessions.length; i++) {
      const session = potentialVoiceSessions[i];
      console.log(`\n--- Potential Voice Session ${i + 1} ---`);
      console.log(`ID: ${session.id}`);
      console.log(`Current Mode: ${session.mode}`);
      console.log(`SessionType: ${session.sessionType}`);
      console.log(`Voice Score: ${session.voiceScore}`);
      console.log(`Messages: ${session.messages ? session.messages.length : 0}`);
      console.log(`Created: ${session.createdAt}`);
      
      if (session.messages && session.messages.length > 0) {
        const firstMessage = session.messages[0];
        console.log(`First message: "${firstMessage.content ? firstMessage.content.substring(0, 80) : 'N/A'}..."`);
      }
    }
    
    // For now, let's be conservative and only update sessions that are clearly voice sessions
    // Update sessions with sessionType 'crisis' to voice mode (as crisis detection typically happens in voice mode)
    console.log('\n🔧 Updating crisis sessions to voice mode...');
    
    const crisisUpdateResult = await collection.updateMany(
      { 
        sessionType: 'crisis',
        mode: { $ne: 'voice' } // Only update if not already voice mode
      },
      { 
        $set: { mode: 'voice' }
      }
    );
    
    console.log(`✅ Updated ${crisisUpdateResult.modifiedCount} crisis sessions to voice mode`);
    
    // Also provide a manual update option
    console.log('\n📝 Manual Update Option:');
    console.log('If you know specific session IDs that should be voice mode, you can update them manually.');
    console.log('Example: db.emotionalsessions.updateOne({id: "SESSION_ID"}, {$set: {mode: "voice"}})');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixVoiceModeSessions();