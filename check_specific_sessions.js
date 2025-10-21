// Check for specific session IDs from the logs
import { MongoClient } from 'mongodb';

async function checkSpecificSessions() {
  const uri = "mongodb+srv://FluentiAIadmin:bH3s2uTTsXryJLQ5@fluentiai-cluster.fgkhlin.mongodb.net/fluenti?retryWrites=true&w=majority&appName=FluentiAI-cluster&connectTimeoutMS=10000&socketTimeoutMS=45000&serverSelectionTimeoutMS=10000&maxIdleTimeMS=30000&family=4";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Connect to fluenti database
    const db = client.db('fluenti');
    const collection = db.collection('emotionalsessions');
    
    // Check for specific session IDs from the logs
    const sessionIds = [
      '68f6d4687233e160919c7d29',
      '68f6de5a905eb3900bbce9a3'
    ];
    
    console.log('🔍 Checking for specific session IDs from the logs:');
    
    for (const sessionId of sessionIds) {
      console.log(`\n--- Checking session: ${sessionId} ---`);
      
      // Check if it exists by id
      const sessionById = await collection.findOne({ "id": sessionId });
      console.log(`Query by id: ${sessionById ? '✅ Found' : '❌ Not found'}`);
      
      // Check if it exists by _id (ObjectId)
      try {
        const { ObjectId } = await import('mongodb');
        const sessionByObjectId = await collection.findOne({ "_id": new ObjectId(sessionId) });
        console.log(`Query by _id: ${sessionByObjectId ? '✅ Found' : '❌ Not found'}`);
        if (sessionByObjectId) {
          console.log(`  - Actual id: ${sessionByObjectId.id}`);
          console.log(`  - userId: ${sessionByObjectId.userId}`);
          console.log(`  - mode: ${sessionByObjectId.mode}`);
        }
      } catch (e) {
        console.log(`Query by _id: ❌ Invalid ObjectId format`);
      }
    }
    
    // Get the latest sessions to see the newest ones
    console.log('\n🔍 Latest 5 sessions:');
    const latestSessions = await collection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    
    for (let i = 0; i < latestSessions.length; i++) {
      const session = latestSessions[i];
      console.log(`Session ${i + 1}:`);
      console.log(`  _id: ${session._id}`);
      console.log(`  id: ${session.id}`);
      console.log(`  userId: ${session.userId}`);
      console.log(`  mode: ${session.mode}`);
      console.log(`  createdAt: ${session.createdAt}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkSpecificSessions();