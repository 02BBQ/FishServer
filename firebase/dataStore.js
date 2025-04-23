const { getDatabase, ref, set, get } = require("firebase/database");
const { admin, db } = require('./firebaseConfig');

exports.getInventoryData = async (userId) => {
    return await get(ref(db, `inventory/${userId}`)).then((snapshot) => {
        console.log(snapshot.val());
        if (snapshot.exists()) {
            return { fishes};
        } else {
            console.log("No data available");
            return null;
        }
    }).catch((error) => {
        console.error(error);
    });
}
