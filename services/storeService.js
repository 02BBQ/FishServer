const { update, ref, set, get } = require("firebase/database");
const { admin, db } = require('../config/firebaseConfig');
const fishDataService = require('./fishDataService');
const utilService = require('./utilService');

exports.buy = async (userId, itemId) => 
{
    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await get(userRef);

    if (!snapshot.exists()) return;

    const userData = userSnapshot.val();
    const money = userData.money || 0;

    const item = storeItemTable[itemId];

    if (!item)
    {
        console.error("Invalid item ID");
        return "Invalid item ID";
    }
    
    if (money < item.price)
    {
        console.error("Not enough money");
        return "Not enough money";
    }

    const newMoney = money - item.price;

    // Update user's money
    await update(userRef, { money: newMoney });

    // Add item to inventory or specific type
    const itemType = item.type || 'general'; // 기본적으로 'general' 타입
    const inventoryRef = ref(db, `users/${userId}/inventory/${itemType}/${itemId}`);

    await set(inventoryRef, itemId);

    console.log(`Item ${itemId} purchased successfully!`);
    return "Item ${itemId} purchased successfully!";
}