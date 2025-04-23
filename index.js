// index.js
const express = require('express');
const cors = require('cors');
const fishMain = require('./fishMain');
const dataStore = require('./firebase/dataStore');
const { loadSheet } = require('./fishDataLoad');
const { admin, db } = require('./firebase/firebaseConfig');

const app = express();
const PORT = 3000;

loadSheet();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/api/fish/start', (req, res) => {
    const result = fishMain.start();
    res.send(result);
});

app.post('/api/fish/end', async (req, res) => {
    const result = await fishMain.end(req.body.guid, req.body.suc); 
    res.send(result);
});

app.post(`/api/datastore/fishtank`, async (req, res) => {
    const result = await dataStore.getInventoryData(req.body.userId);
    res.send(result);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
