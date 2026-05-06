import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['1.1.1.1', '8.8.8.8']);

const run = async () => {
  try {
    await mongoose.connect('mongodb+srv://raunit_alert:alertops121@cluster12.ywcvfn6.mongodb.net/test?retryWrites=true&w=majority');
    console.log("Connected");
    await mongoose.connection.db.collection('users').dropIndex('username_1').catch(e => console.log(e.message));
    console.log("Index dropped");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
