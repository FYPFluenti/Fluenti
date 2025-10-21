// Script to update existing EmotionalSession documents with missing mode field
import { MongoClient } from 'mongodb';

async function fixModeField() {
  const uri = "mongodb+srv://FluentiAIadmin:bH3s2uTTsXryJLQ5@fluentiai-cluster.fgkhlin.mongodb.net/fluenti?retryWrites=true&w=majority&appName=FluentiAI-cluster&connectTimeoutMS=10000&socketTimeoutMS=45000&serverSelectionTimeoutMS=10000&maxIdleTimeMS=30000&family=4";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Connect to fluenti database
    const db = client.db('fluenti');
    const collection = db.collection('emotionalsessions');
    
    // Find sessions without mode field or with null/undefined mode
    console.log('\n🔍 Finding sessions without mode field...');
    const sessionsWithoutMode = await collection.find({
      $or: [
        { mode: { $exists: false } },
        { mode: null },
        { mode: undefined }
      ]
    }).toArray();
    
    console.log(`Found ${sessionsWithoutMode.length} sessions without mode field`);
    
    if (sessionsWithoutMode.length > 0) {
      // Update all sessions without mode to have mode: 'chat' as default
      console.log('\n🔧 Updating sessions to add mode: "chat"...');
      const updateResult = await collection.updateMany(
        {
          $or: [
            { mode: { $exists: false } },
            { mode: null },
            { mode: undefined }
          ]
        },
        {
          $set: { mode: 'chat' }
        }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} sessions with mode: "chat"`);
      
      // Verify the update
      console.log('\n🔍 Verifying updates...');
      const sampleUpdatedSessions = await collection.find({}).limit(5).toArray();
      
      for (let i = 0; i < sampleUpdatedSessions.length; i++) {
        const session = sampleUpdatedSessions[i];
        console.log(`Session ${i + 1}: id=${session.id}, mode=${session.mode}, sessionType=${session.sessionType}`);
      }
      
    } else {
      console.log('✅ All sessions already have mode field');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixModeField();