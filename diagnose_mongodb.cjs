#!/usr/bin/env node

const dns = require('dns');
const net = require('net');
const https = require('https');

console.log('🔍 MongoDB Connection Diagnostics\n');

const hostname = 'fluentiai-cluster.fgkhlin.mongodb.net';
const port = 27017;

async function testDNSResolution() {
  console.log('1. Testing DNS resolution...');
  
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address, family) => {
      if (err) {
        console.log(`❌ DNS lookup failed: ${err.message}`);
        console.log(`   Code: ${err.code}`);
        resolve(false);
      } else {
        console.log(`✅ DNS resolved: ${address} (IPv${family})`);
        resolve(true);
      }
    });
  });
}

async function testTCPConnection() {
  console.log('\n2. Testing TCP connection...');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(10000);
    
    socket.connect(port, hostname, () => {
      console.log(`✅ TCP connection successful to ${hostname}:${port}`);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (err) => {
      console.log(`❌ TCP connection failed: ${err.message}`);
      console.log(`   Code: ${err.code}`);
      resolve(false);
    });
    
    socket.on('timeout', () => {
      console.log('❌ TCP connection timeout');
      socket.destroy();
      resolve(false);
    });
  });
}

async function testHTTPSConnection() {
  console.log('\n3. Testing HTTPS connection to MongoDB Atlas...');
  
  return new Promise((resolve) => {
    const req = https.get(`https://${hostname}`, {
      timeout: 10000
    }, (res) => {
      console.log(`✅ HTTPS connection successful (Status: ${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ HTTPS connection failed: ${err.message}`);
      console.log(`   Code: ${err.code}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('❌ HTTPS connection timeout');
      req.destroy();
      resolve(false);
    });
  });
}

async function testAlternateDNS() {
  console.log('\n4. Testing with alternate DNS servers...');
  
  const dnsServers = ['8.8.8.8', '1.1.1.1', '208.67.222.222'];
  
  for (const dnsServer of dnsServers) {
    console.log(`   Testing with DNS: ${dnsServer}`);
    
    await new Promise((resolve) => {
      const resolver = new dns.Resolver();
      resolver.setServers([dnsServer]);
      
      resolver.resolve4(hostname, (err, addresses) => {
        if (err) {
          console.log(`   ❌ Failed with ${dnsServer}: ${err.message}`);
        } else {
          console.log(`   ✅ Success with ${dnsServer}: ${addresses[0]}`);
        }
        resolve();
      });
    });
  }
}

async function checkNetworkConfiguration() {
  console.log('\n5. Network configuration check...');
  
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  console.log('   Active network interfaces:');
  for (const [name, nets] of Object.entries(interfaces)) {
    for (const net of nets) {
      if (!net.internal && net.family === 'IPv4') {
        console.log(`   - ${name}: ${net.address}`);
      }
    }
  }
}

async function suggestSolutions() {
  console.log('\n🔧 Suggested Solutions:\n');
  
  console.log('1. Network/Firewall Issues:');
  console.log('   - Check if port 27017 is blocked by firewall');
  console.log('   - Try connecting from a different network (mobile hotspot)');
  console.log('   - Contact your ISP about MongoDB Atlas connectivity');
  
  console.log('\n2. DNS Issues:');
  console.log('   - Flush DNS cache: ipconfig /flushdns (Windows)');
  console.log('   - Change DNS servers to 8.8.8.8 or 1.1.1.1');
  console.log('   - Try using IP address instead of hostname (if available)');
  
  console.log('\n3. MongoDB Atlas Issues:');
  console.log('   - Check MongoDB Atlas status page');
  console.log('   - Verify IP whitelist settings (add 0.0.0.0/0 for testing)');
  console.log('   - Check cluster region and select nearest one');
  
  console.log('\n4. Application Workarounds:');
  console.log('   - Continue development with local MongoDB');
  console.log('   - Use MongoDB connection pooling');
  console.log('   - Implement retry logic with exponential backoff');
  
  console.log('\n5. Alternative Connection String:');
  console.log('   mongodb+srv://FluentiAIadmin:bH3s2uTTsXryJLQ5@fluentiai-cluster.fgkhlin.mongodb.net/fluenti?retryWrites=true&w=majority&connectTimeoutMS=30000&socketTimeoutMS=60000&serverSelectionTimeoutMS=30000&family=4');
}

async function runDiagnostics() {
  try {
    const dnsOk = await testDNSResolution();
    const tcpOk = await testTCPConnection();
    const httpsOk = await testHTTPSConnection();
    
    await testAlternateDNS();
    await checkNetworkConfiguration();
    
    console.log('\n📊 Diagnosis Summary:');
    console.log(`   DNS Resolution: ${dnsOk ? '✅' : '❌'}`);
    console.log(`   TCP Connection: ${tcpOk ? '✅' : '❌'}`);
    console.log(`   HTTPS Connection: ${httpsOk ? '✅' : '❌'}`);
    
    if (!dnsOk || !tcpOk) {
      console.log('\n⚠️  Connection issues detected!');
      await suggestSolutions();
    } else {
      console.log('\n✅ Network connectivity appears normal');
      console.log('   The issue might be in MongoDB configuration or Atlas settings');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
  }
}

// Run diagnostics
runDiagnostics().then(() => {
  console.log('\n🏁 Diagnostics complete');
}).catch(console.error);
