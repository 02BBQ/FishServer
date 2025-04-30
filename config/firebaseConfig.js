/**
 * Firebase 설정
 * Firebase 관련 설정과 초기화를 관리합니다.
 */

var admin = require("firebase-admin");
var serviceAccount = require("../serviceAccountKey.json");

// Firebase 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nomuhyu-default-rtdb.firebaseio.com"
});

const db = admin.database();    

module.exports = { admin, db }; 