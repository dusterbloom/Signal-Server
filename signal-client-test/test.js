const SignalClient = require('@signalapp/signal-client');
const crypto = require('crypto');
const { 
    ProtocolAddress, 
    PreKeyBundle, 
    PrivateKey, 
    PublicKey,
    PreKeyRecord,
    SignedPreKeyRecord
} = SignalClient;



// Implement the required stores extending the abstract classes
class InMemorySessionStore extends SignalClient.SessionStore {
    constructor() {
        super();
        this.sessions = new Map();
    }

    async saveSession(name, record) {
        this.sessions.set(name.toString(), record);
    }

    async getSession(name) {
        return this.sessions.get(name.toString()) || null;
    }

    async getExistingSessions(addresses) {
        return addresses.map(addr => this.sessions.get(addr.toString())).filter(Boolean);
    }
}

class InMemoryPreKeyStore extends SignalClient.PreKeyStore {
    constructor() {
        super();
        this.preKeys = new Map();
    }

    async savePreKey(id, record) {
        this.preKeys.set(id, record);
    }

    async getPreKey(id) {
        return this.preKeys.get(id);
    }

    async removePreKey(id) {
        this.preKeys.delete(id);
    }
}

class InMemorySignedPreKeyStore extends SignalClient.SignedPreKeyStore {
    constructor() {
        super();
        this.signedPreKeys = new Map();
    }

    async saveSignedPreKey(id, record) {
        this.signedPreKeys.set(id, record);
    }

    async getSignedPreKey(id) {
        return this.signedPreKeys.get(id);
    }
}

class InMemoryIdentityKeyStore extends SignalClient.IdentityKeyStore {
    constructor() {
        super();
        this.identityKeys = new Map();
        this.localRegistrationId = 1; // Should be randomly generated
        this.identityKey = null; // Should be properly initialized
    }

    async getIdentityKey() {
        return this.identityKey;
    }

    async getLocalRegistrationId() {
        return this.localRegistrationId;
    }

    async saveIdentity(name, key) {
        const existing = this.identityKeys.get(name.toString());
        this.identityKeys.set(name.toString(), key);
        return existing !== key;
    }

    async isTrustedIdentity(name, key, direction) {
        const existing = this.identityKeys.get(name.toString());
        return !existing || existing === key;
    }

    async getIdentity(name) {
        return this.identityKeys.get(name.toString()) || null;
    }
}

// Helper functions
function generateRegistrationId() {
    // Generate a random 14-bit number (0 to 16383)
    return Math.floor(Math.random() * 16383) + 1;
}

function generatePreKeyId() {
    // Generate a random number between 1 and 16777215 (0xFFFFFF)
    return Math.floor(Math.random() * 16777215) + 1;
}

function generateDeviceId() {
    // Signal typically uses 1-5 for device IDs
    return Math.floor(Math.random() * 5) + 1;
}

function generateUUID() {
    return crypto.randomUUID();
}

async function main() {
    console.log('🚀 Initializing Signal Protocol test...\n');
    
    try {
        console.log('📦 Creating storage instances...');
        const sessionStore = new InMemorySessionStore();
        const preKeyStore = new InMemoryPreKeyStore();
        const signedPreKeyStore = new InMemorySignedPreKeyStore();
        const identityKeyStore = new InMemoryIdentityKeyStore();
        console.log('✅ Storage instances created successfully\n');

        console.log('🔑 Generating identity key pair...');
        const identityKeyPair = SignalClient.IdentityKeyPair.generate();
        const deviceId = generateDeviceId();
        const registrationId = generateRegistrationId();
        console.log('✅ Identity key pair generated');
        console.log(`   📱 Device ID: ${deviceId}`);
        console.log(`   🔢 Registration ID: ${registrationId}\n`);

        // Generate multiple PreKeys
        console.log('🔐 Generating PreKeys...');
        const preKeyStartId = generatePreKeyId();
        const numberOfPreKeys = 100;
        const preKeys = [];
        
        for(let i = 0; i < numberOfPreKeys; i++) {
            const preKeyId = preKeyStartId + i;
            const preKeyPrivate = PrivateKey.generate();
            const preKeyPublic = preKeyPrivate.getPublicKey();
            const preKey = PreKeyRecord.new(preKeyId, preKeyPublic, preKeyPrivate);
            preKeys.push({ id: preKeyId, key: preKey });
            await preKeyStore.savePreKey(preKeyId, preKey);
        }
        console.log(`✅ Generated ${numberOfPreKeys} PreKeys starting from ID ${preKeyStartId}\n`);

        console.log('🔏 Generating SignedPreKey...');
        const signedPreKeyId = generatePreKeyId();
        const signedPreKeyPrivate = PrivateKey.generate();
        const signedPreKeyPublic = signedPreKeyPrivate.getPublicKey();
        const timestamp = Date.now();
        const signature = identityKeyPair.privateKey.sign(signedPreKeyPublic.serialize());
        const signedPreKey = SignedPreKeyRecord.new(
            signedPreKeyId,
            timestamp,
            signedPreKeyPublic,
            signedPreKeyPrivate,
            signature
        );
        console.log('✅ SignedPreKey generated\n');

        console.log('💾 Storing keys...');
        await signedPreKeyStore.saveSignedPreKey(signedPreKeyId, signedPreKey);
        identityKeyStore.identityKey = identityKeyPair.privateKey;
        console.log('✅ Keys stored successfully\n');

        console.log('📡 Creating protocol address...');
        const recipientUuid = generateUUID();
        const recipientAddress = ProtocolAddress.new(recipientUuid, deviceId);
        console.log('✅ Protocol address created');
        console.log(`   🆔 Recipient UUID: ${recipientUuid}\n`);

        // Use a random PreKey from our generated batch
        const randomPreKeyIndex = Math.floor(Math.random() * numberOfPreKeys);
        const selectedPreKey = preKeys[randomPreKeyIndex];

        console.log('🔒 Creating PreKeyBundle...');
        const preKeyBundle = PreKeyBundle.new(
            registrationId,
            deviceId,
            selectedPreKey.id,
            selectedPreKey.key.publicKey(),
            signedPreKeyId,
            signedPreKeyPublic,
            signature,
            identityKeyPair.publicKey
        );
        console.log('✅ PreKeyBundle created\n');

        console.log('🤝 Processing PreKeyBundle...');
        await SignalClient.processPreKeyBundle(
            preKeyBundle,
            recipientAddress,
            sessionStore,
            identityKeyStore
        );

        console.log('\n🎉 Success! Signal Protocol session created successfully!\n');
        
        // Display detailed session info
        console.log('📊 Session Details:');
        console.log('   📱 Device ID:', deviceId);
        console.log('   🔢 Registration ID:', registrationId);
        console.log('   🔑 PreKey ID Range:', `${preKeyStartId} to ${preKeyStartId + numberOfPreKeys - 1}`);
        console.log('   🎯 Selected PreKey ID:', selectedPreKey.id);
        console.log('   🔏 SignedPreKey ID:', signedPreKeyId);
        console.log('   ⏰ Timestamp:', new Date(timestamp).toISOString());
        console.log('   🆔 Recipient UUID:', recipientUuid);
        console.log('   💾 Total PreKeys stored:', preKeys.length);

    } catch (error) {
        console.error('\n❌ Error occurred:');
        console.error('   💥 Message:', error.message);
        console.error('   📍 Stack:', error.stack);
    }
}

// Add timestamp to console.log
const originalLog = console.log;
console.log = function() {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    originalLog.apply(console, [`[${timestamp}]`, ...arguments]);
};

main();


// const SignalClient = require('@signalapp/signal-client');
// const { 
//     ProtocolAddress, 
//     PreKeyBundle, 
//     PrivateKey, 
//     PublicKey,
//     PreKeyRecord,
//     SignedPreKeyRecord
// } = SignalClient;

// // Implement the required stores extending the abstract classes
// class InMemorySessionStore extends SignalClient.SessionStore {
//     constructor() {
//         super();
//         this.sessions = new Map();
//     }

//     async saveSession(name, record) {
//         this.sessions.set(name.toString(), record);
//     }

//     async getSession(name) {
//         return this.sessions.get(name.toString()) || null;
//     }

//     async getExistingSessions(addresses) {
//         return addresses.map(addr => this.sessions.get(addr.toString())).filter(Boolean);
//     }
// }

// class InMemoryPreKeyStore extends SignalClient.PreKeyStore {
//     constructor() {
//         super();
//         this.preKeys = new Map();
//     }

//     async savePreKey(id, record) {
//         this.preKeys.set(id, record);
//     }

//     async getPreKey(id) {
//         return this.preKeys.get(id);
//     }

//     async removePreKey(id) {
//         this.preKeys.delete(id);
//     }
// }

// class InMemorySignedPreKeyStore extends SignalClient.SignedPreKeyStore {
//     constructor() {
//         super();
//         this.signedPreKeys = new Map();
//     }

//     async saveSignedPreKey(id, record) {
//         this.signedPreKeys.set(id, record);
//     }

//     async getSignedPreKey(id) {
//         return this.signedPreKeys.get(id);
//     }
// }

// class InMemoryIdentityKeyStore extends SignalClient.IdentityKeyStore {
//     constructor() {
//         super();
//         this.identityKeys = new Map();
//         this.localRegistrationId = 1; // Should be randomly generated
//         this.identityKey = null; // Should be properly initialized
//     }

//     async getIdentityKey() {
//         return this.identityKey;
//     }

//     async getLocalRegistrationId() {
//         return this.localRegistrationId;
//     }

//     async saveIdentity(name, key) {
//         const existing = this.identityKeys.get(name.toString());
//         this.identityKeys.set(name.toString(), key);
//         return existing !== key;
//     }

//     async isTrustedIdentity(name, key, direction) {
//         const existing = this.identityKeys.get(name.toString());
//         return !existing || existing === key;
//     }

//     async getIdentity(name) {
//         return this.identityKeys.get(name.toString()) || null;
//     }
// }
// async function main() {
//     console.log('🚀 Initializing Signal Protocol test...\n');
    
//     try {
//         console.log('📦 Creating storage instances...');
//         const sessionStore = new InMemorySessionStore();
//         const preKeyStore = new InMemoryPreKeyStore();
//         const signedPreKeyStore = new InMemorySignedPreKeyStore();
//         const identityKeyStore = new InMemoryIdentityKeyStore();
//         console.log('✅ Storage instances created successfully\n');

//         console.log('🔑 Generating identity key pair...');
//         const identityKeyPair = SignalClient.IdentityKeyPair.generate();
//         const deviceId = 1;
//         const registrationId = 1;
//         console.log('✅ Identity key pair generated\n');

//         console.log('🔐 Generating PreKey...');
//         const preKeyId = 1;
//         const preKeyPrivate = PrivateKey.generate();
//         const preKeyPublic = preKeyPrivate.getPublicKey();
//         const preKey = PreKeyRecord.new(preKeyId, preKeyPublic, preKeyPrivate);
//         console.log('✅ PreKey generated\n');

//         console.log('🔏 Generating SignedPreKey...');
//         const signedPreKeyId = 1;
//         const signedPreKeyPrivate = PrivateKey.generate();
//         const signedPreKeyPublic = signedPreKeyPrivate.getPublicKey();
//         const timestamp = Date.now();
//         const signature = identityKeyPair.privateKey.sign(signedPreKeyPublic.serialize());
//         const signedPreKey = SignedPreKeyRecord.new(
//             signedPreKeyId,
//             timestamp,
//             signedPreKeyPublic,
//             signedPreKeyPrivate,
//             signature
//         );
//         console.log('✅ SignedPreKey generated\n');

//         console.log('💾 Storing keys...');
//         await preKeyStore.savePreKey(preKeyId, preKey);
//         await signedPreKeyStore.saveSignedPreKey(signedPreKeyId, signedPreKey);
//         identityKeyStore.identityKey = identityKeyPair.privateKey;
//         console.log('✅ Keys stored successfully\n');

//         console.log('📡 Creating protocol address...');
//         const recipientAddress = ProtocolAddress.new("recipientId", deviceId);
//         console.log('✅ Protocol address created\n');

//         console.log('🔒 Creating PreKeyBundle...');
//         const preKeyBundle = PreKeyBundle.new(
//             registrationId,
//             deviceId,
//             preKeyId,
//             preKeyPublic,
//             signedPreKeyId,
//             signedPreKeyPublic,
//             signature,
//             identityKeyPair.publicKey
//         );
//         console.log('✅ PreKeyBundle created\n');

//         console.log('🤝 Processing PreKeyBundle...');
//         await SignalClient.processPreKeyBundle(
//             preKeyBundle,
//             recipientAddress,
//             sessionStore,
//             identityKeyStore
//         );

//         console.log('\n🎉 Success! Signal Protocol session created successfully!\n');
        
//         // Display session info
//         console.log('📊 Session Details:');
//         console.log('   📱 Device ID:', deviceId);
//         console.log('   🔢 Registration ID:', registrationId);
//         console.log('   🔑 PreKey ID:', preKeyId);
//         console.log('   🔏 SignedPreKey ID:', signedPreKeyId);
//         console.log('   ⏰ Timestamp:', new Date(timestamp).toISOString());

//     } catch (error) {
//         console.error('\n❌ Error occurred:');
//         console.error('   💥 Message:', error.message);
//         console.error('   📍 Stack:', error.stack);
//     }
// }

// // Add timestamp to console.log
// const originalLog = console.log;
// console.log = function() {
//     const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
//     originalLog.apply(console, [`[${timestamp}]`, ...arguments]);
// };

// main();