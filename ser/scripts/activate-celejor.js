const { db } = require('../firebase');

async function activateCelejor() {
    try {
        console.log('Searching for system with code "celejor"...');
        const snapshot = await db.collection('systems').where('code', '==', 'celejor').get();
        if (snapshot.empty) {
            console.error('System "celejor" not found in Firestore!');
            process.exit(1);
        }

        const docId = snapshot.docs[0].id;
        console.log(`Found Celejor system document ID: ${docId}`);
        
        await db.collection('systems').doc(docId).update({
            status: 'active',
            updatedAt: new Date()
        });

        console.log('Successfully updated Celejor status to "active"!');
        process.exit(0);
    } catch (err) {
        console.error('Error activating Celejor:', err);
        process.exit(1);
    }
}

activateCelejor();
