// Debug script to test MongoDB session lookup
import { MongoClient } from 'mongodb';

async function debugSessionLookup() {
  const uri = "mongodb+srv://FluentiAIadmin:bH3s2uTTsXryJLQ5@fluentiai-cluster.fgkhlin.mongodb.net/fluenti?retryWrites=true&w=majority&appName=FluentiAI-cluster&connectTimeoutMS=10000&socketTimeoutMS=45000&serverSelectionTimeoutMS=10000&maxIdleTimeMS=30000&family=4";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Connect to fluenti database
    const db = client.db('fluenti');
    const collection = db.collection('emotionalsessions');  // Correct collection name
    
    // Get some sample sessions to understand the structure
    console.log('\n🔍 Sample EmotionalSession documents:');
    const sampleSessions = await collection.find({}).limit(5).toArray();
    
    for (let i = 0; i < sampleSessions.length; i++) {
      const session = sampleSessions[i];
      console.log(`\nSession ${i + 1}:`);
      console.log(`  _id: ${session._id}`);
      console.log(`  id: ${session.id || 'N/A'}`);
      console.log(`  userId: ${session.userId || 'N/A'}`);
      console.log(`  mode: ${session.mode || 'N/A'}`);
      console.log(`  sessionType: ${session.sessionType || 'N/A'}`);
      console.log(`  messages: ${session.messages ? session.messages.length : 0} messages`);
      console.log(`  createdAt: ${session.createdAt || 'N/A'}`);
    }
    
    // Test query patterns
    if (sampleSessions.length > 0) {
      const testSession = sampleSessions[0];
      console.log(`\n🧪 Testing query patterns with session: ${testSession.id}`);
      
      // Test with id field
      const result1 = await collection.findOne({
        "id": testSession.id,
        "userId": testSession.userId
      });
      console.log(`Query 1 (id + userId): ${result1 ? '✅ Found' : '❌ Not found'}`);
      
      // Test with _id field  
      const result2 = await collection.findOne({
        "_id": testSession._id,
        "userId": testSession.userId
      });
      console.log(`Query 2 (_id + userId): ${result2 ? '✅ Found' : '❌ Not found'}`);
      
      // Test with just id
      const result3 = await collection.findOne({"id": testSession.id});
      console.log(`Query 3 (id only): ${result3 ? '✅ Found' : '❌ Not found'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugSessionLookup();