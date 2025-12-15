// Script to check contractor matching status and manually match leads
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
    });
}

const db = admin.firestore();

async function main() {
    console.log('=== CHECKING CONTRACTORS ===\n');

    // Get all contractors
    const contractorSnap = await db.collection('users').where('role', '==', 'contractor').get();

    for (const doc of contractorSnap.docs) {
        const data = doc.data();
        console.log('Contractor:', data.displayName || data.email);
        console.log('  UID:', doc.id);
        console.log('  Verified:', data.verified);
        console.log('  StripeOnboardingComplete:', data.stripeOnboardingComplete);
        console.log('  Services:', data.services);
        console.log('  ServiceAreas:', data.serviceAreas);

        // Check if eligible for matching
        const eligible = data.verified === true && data.stripeOnboardingComplete === true;
        console.log('  Eligible for leads:', eligible);
        console.log('');
    }

    console.log('\n=== CHECKING LEADS ===\n');

    // Get all leads
    const leadSnap = await db.collection('leads').get();

    for (const doc of leadSnap.docs) {
        const data = doc.data();
        console.log('Lead:', doc.id);
        console.log('  Status:', data.status);
        console.log('  City:', data.address?.city);
        console.log('  ZIP:', data.address?.zip);
        console.log('  ProjectTypes:', data.projectType);
        console.log('  MatchedContractors:', data.matchedContractors || []);
        console.log('');
    }

    // Ask user if they want to manually match
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const answer = await new Promise(resolve => {
        rl.question('\nDo you want to manually match the first contractor to all leads? (y/n): ', resolve);
    });

    if (answer.toLowerCase() === 'y') {
        const contractor = contractorSnap.docs[0];
        if (!contractor) {
            console.log('No contractors found!');
            rl.close();
            return;
        }

        console.log(`\nMatching contractor ${contractor.id} to all leads...`);

        const batch = db.batch();

        for (const leadDoc of leadSnap.docs) {
            const leadRef = db.collection('leads').doc(leadDoc.id);
            batch.update(leadRef, {
                matchedContractors: admin.firestore.FieldValue.arrayUnion(contractor.id),
                status: 'matched',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('  Updated lead:', leadDoc.id);
        }

        await batch.commit();
        console.log('\nDone! All leads have been matched.');
    }

    rl.close();
}

main().catch(console.error);
