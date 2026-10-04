import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://dulangathipul:22%2DK%2D7000%2DX@cluster1.zvqnh6t.mongodb.net/free-legion-vpn?retryWrites=true&w=majority';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db('free-legion-vpn');
  const collection = db.collection('settings');
  
  const initialServers = [
    { id: 'pub_fr', country: 'France', flag: 'fr', ip: '141.94.33.194', ping: '280ms Ping', sni: 'm.facebook.com', status: 'Maintenance', isOnline: false, isOffline: false, isMaintenance: true },
    { id: 'pub_de', country: 'Germany', flag: 'de', ip: '57.129.121.229', ping: '260ms Ping', sni: 'm.facebook.com', status: 'Offline', isOnline: false, isOffline: true, isMaintenance: false },
    { id: 'pub_gb', country: 'United Kingdom', flag: 'gb', ip: '54.36.162.84', ping: '270ms Ping', sni: 'm.facebook.com', status: 'Online', isOnline: true, isOffline: false, isMaintenance: false },
    { id: 'pub_nl', country: 'Netherlands', flag: 'nl', ip: '51.158.147.186', ping: '255ms Ping', sni: 'm.facebook.com', status: 'Maintenance', isOnline: false, isOffline: false, isMaintenance: true },
    { id: 'pub_it', country: 'Italy', flag: 'it', ip: '57.131.38.151', ping: '290ms Ping', sni: 'm.facebook.com', status: 'Maintenance', isOnline: false, isOffline: false, isMaintenance: true },
    { id: 'pub_ca', country: 'Canada', flag: 'ca', ip: '158.69.208.120', ping: '320ms Ping', sni: 'm.facebook.com', status: 'Maintenance', isOnline: false, isOffline: false, isMaintenance: true }
  ];

  const updateDoc = {
    public_servers: initialServers,
    updated_at: new Date().toISOString()
  };

  await collection.updateOne(
    { _id: 'global_settings' },
    { $set: updateDoc },
    { upsert: true }
  );

  const doc = await collection.findOne({ _id: 'global_settings' });
  console.log('SAVED TO ATLAS:', doc?._id, 'Servers:', doc?.public_servers?.map(s => s.country + ':' + s.status));
  await client.close();
}

run().catch(console.error);
