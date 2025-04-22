var admin = require("firebase-admin");
var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nomuhyu-default-rtdb.firebaseio.com"
});

const db = admin.database();    

module.exports = { admin, db };