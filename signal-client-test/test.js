const axios = require('axios');
const { KEMKeyPair, KyberPreKeyRecord, IdentityKeyPair, SignedPreKeyRecord } = require('@signalapp/libsignal-client');

const SIGNAL_SERVER = 'http://51.8.81.17:8080';
const CDSI_SERVER = 'http://51.8.81.17:8085';


// Helper function to generate PreKey IDs
function generatePreKeyId() {
    return Math.floor(Math.random() * 16777215) + 1;
}

// Key generation function
async function generateKeys() {
    console.log('🔑 Generating key pairs...');

    const registrationId = Math.floor(Math.random() * 16380) + 1;
    const pniRegistrationId = Math.floor(Math.random() * 16380) + 1;

    const aciIdentityKeyPair = IdentityKeyPair.generate();
    const pniIdentityKeyPair = IdentityKeyPair.generate();

    const aciSignedPreKeyId = generatePreKeyId();
    const aciSignedPreKey = SignedPreKeyRecord.new(
        aciSignedPreKeyId,
        Math.floor(Date.now() / 1000),
        aciIdentityKeyPair.publicKey,
        aciIdentityKeyPair.privateKey,
        aciIdentityKeyPair.privateKey.sign(aciIdentityKeyPair.publicKey.serialize())
    );

    const pniSignedPreKeyId = generatePreKeyId();
    const pniSignedPreKey = SignedPreKeyRecord.new(
        pniSignedPreKeyId,
        Math.floor(Date.now() / 1000),
        pniIdentityKeyPair.publicKey,
        pniIdentityKeyPair.privateKey,
        pniIdentityKeyPair.privateKey.sign(pniIdentityKeyPair.publicKey.serialize())
    );

    const aciKyberPreKeyId = generatePreKeyId();
    const aciKyberKeyPair = KEMKeyPair.generate();
    const aciKyberPreKey = KyberPreKeyRecord.new(
        aciKyberPreKeyId,
        Math.floor(Date.now() / 1000),
        aciKyberKeyPair,
        aciIdentityKeyPair.privateKey.sign(aciKyberKeyPair.getPublicKey().serialize())
    );

    const pniKyberPreKeyId = generatePreKeyId();
    const pniKyberKeyPair = KEMKeyPair.generate();
    const pniKyberPreKey = KyberPreKeyRecord.new(
        pniKyberPreKeyId,
        Math.floor(Date.now() / 1000),
        pniKyberKeyPair,
        pniIdentityKeyPair.privateKey.sign(pniKyberKeyPair.getPublicKey().serialize())
    );

    return {
        registrationId,
        pniRegistrationId,
        aciIdentityKey: {
            publicKey: Buffer.from(aciIdentityKeyPair.publicKey.serialize()).toString('base64'),
            privateKey: Buffer.from(aciIdentityKeyPair.privateKey.serialize()).toString('base64')
        },
        pniIdentityKey: {
            publicKey: Buffer.from(pniIdentityKeyPair.publicKey.serialize()).toString('base64'),
            privateKey: Buffer.from(pniIdentityKeyPair.privateKey.serialize()).toString('base64')
        },
        aciSignedPreKey: {
            keyId: aciSignedPreKey.id(),
            publicKey: Buffer.from(aciSignedPreKey.publicKey().serialize()).toString('base64'),
            signature: Buffer.from(aciSignedPreKey.signature()).toString('base64')
        },
        pniSignedPreKey: {
            keyId: pniSignedPreKey.id(),
            publicKey: Buffer.from(pniSignedPreKey.publicKey().serialize()).toString('base64'),
            signature: Buffer.from(pniSignedPreKey.signature()).toString('base64')
        },
        aciPqLastResortPreKey: {
            keyId: aciKyberPreKey.id(),
            publicKey: Buffer.from(aciKyberPreKey.publicKey().serialize()).toString('base64'),
            signature: Buffer.from(aciKyberPreKey.signature()).toString('base64')
        },
        pniPqLastResortPreKey: {
            keyId: pniKyberPreKey.id(),
            publicKey: Buffer.from(pniKyberPreKey.publicKey().serialize()).toString('base64'),
            signature: Buffer.from(pniKyberPreKey.signature()).toString('base64')
        }
    };
}

// Verification functions
async function createVerificationSession(phoneNumber) {
    console.log('📱 Creating verification session for:', phoneNumber);
    const response = await axios.post(`${SIGNAL_SERVER}/v1/verification/session`, {
        number: phoneNumber
    });
    console.log('✅ Session created');
    return response.data;
}

async function updateVerificationSession(sessionId) {
    console.log('🤖 Submitting captcha for session:', sessionId);
    const response = await axios.patch(
        `${SIGNAL_SERVER}/v1/verification/session/${sessionId}`,
        {
            captcha: "noop.noop.registration.noop"
        }
    );
    console.log('✅ Captcha verified');
    return response.data;
}

async function requestVerificationCode(sessionId, transport = 'SMS') {
    console.log(`📤 Requesting ${transport} verification code for session:`, sessionId);
    const response = await axios.post(
        `${SIGNAL_SERVER}/v1/verification/session/${sessionId}/code`,
        {
            transport: transport.toLowerCase(),
            client: "android-ng"
        }
    );
    console.log('✅ Verification code requested');
    return response.data;
}

async function submitVerificationCode(sessionId, code) {
    console.log('🔍 Submitting verification code for session:', sessionId);
    const response = await axios.put(
        `${SIGNAL_SERVER}/v1/verification/session/${sessionId}/code`,
        { code }
    );
    console.log('✅ Code verified');
    return response.data;
}

// Registration function
async function registerUser(phoneNumber, password, sessionId, fcmToken) {
    const keys = await generateKeys();
    
    const request = {
        sessionId,
        number: phoneNumber,
        password,
        deviceId: 1,
        accountAttributes: {
            fetchesMessages: true,
            registrationId: keys.registrationId,
            pniRegistrationId: keys.pniRegistrationId,
            name: null,
            capabilities: {
                pni: true,
                paymentActivation: false
            },
            fcmRegistrationId: fcmToken || "fcm-token-test"
        },
        aciIdentityKey: keys.aciIdentityKey.publicKey,
        pniIdentityKey: keys.pniIdentityKey.publicKey,
        aciSignedPreKey: keys.aciSignedPreKey,
        pniSignedPreKey: keys.pniSignedPreKey,
        aciPqLastResortPreKey: keys.aciPqLastResortPreKey,
        pniPqLastResortPreKey: keys.pniPqLastResortPreKey
    };

    const registrationResponse = await axios.post(
        `${SIGNAL_SERVER}/v1/registration`,
        request,
        {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${phoneNumber}:${password}`).toString('base64')}`,
                'Content-Type': 'application/json',
            }
        }
    );

    return registrationResponse.data;
}

// CDSI credentials generation
async function generateCdsiCredentials(password, uuid) {
    const basicAuth = Buffer.from(`${uuid}:${password}`).toString('base64');
    const auth = await axios.get(`${SIGNAL_SERVER}/v2/directory/auth`, {
        headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
        }
    });
    return auth.data;
}

// Main test function
async function main() {
    try {
        const phoneNumber = '+18005550125';
        const password = 'your_password_here';

        // Step 1: Create verification session
        const session = await createVerificationSession(phoneNumber);
        console.log('📋 Session ID:', session.id);

        // Step 2: Submit captcha
        const updatedSession = await updateVerificationSession(session.id);
        
        if (updatedSession.allowedToRequestCode) {
            // Step 3: Request verification code
            await requestVerificationCode(session.id);

            // Step 4: Submit verification code
            const verificationCode = '550125'; // Example code
            const verifiedSession = await submitVerificationCode(session.id, verificationCode);

            if (verifiedSession.verified) {
                // Add a small delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                const registration = await registerUser(
                    phoneNumber, 
                    password, 
                    session.id, 
                    "fcm-token-test"
                );
                console.log('✅ Signal Server Registration complete:', registration);

                // Step 5: Generate Contact Discovery Service credentials
                const auth = await generateCdsiCredentials(password, registration.uuid);
                console.log('✅ Directory Auth complete:', auth);
            } else {
                throw new Error('Session verification failed');
            }
        } else {
            throw new Error('Session not allowed to request code: ' + 
                JSON.stringify(updatedSession.requestedInformation));
        }

    } catch (error) {
        console.error('\n❌ Error occurred:');
        console.error('   💥 Message:', error.message);
        if (error.response) {
            console.error('   📡 Status:', error.response.status);
            console.error('   💾 Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
main();


//     const SignalClient = require('@signalapp/libsignal-client');
//     const {
//         PrivateKey,
//         PreKeyRecord,
//         SignedPreKeyRecord,
//         IdentityKeyPair,
//     } = SignalClient; // Import necessary components
//     const axios = require('axios');
// const { log } = require('console');
//     const crypto = require('crypto'); // Used for profileKey

//     const SIGNAL_SERVER = 'http://51.8.81.17:8080'; // Your Signal server

//     // Helper functions
//     function generateRegistrationId() {
//         return Math.floor(Math.random() * 16380) + 1;
//     }

//     function generatePreKeyId() {
//         return Math.floor(Math.random() * 16777215) + 1;
//     }

//     // Generates a 32-byte random key (for the profile key)
//     function generateProfileKey() {
//         return crypto.randomBytes(32);
//     }

//     async function generateKeys() {
//         console.log('🔑 Generating key pairs...');

//         const registrationId = generateRegistrationId();
//         const timestamp = Date.now();

//         // Generate identity keys
//         const aciIdentityKeyPair = await IdentityKeyPair.generate();
//         const pniIdentityKeyPair = await IdentityKeyPair.generate();

//         // Generate ACI signed prekey
//         const aciSignedPreKeyId = generatePreKeyId();
//         const aciSignedPreKeyPair = PrivateKey.generate();
//         const aciSignedPreKeySignature = aciIdentityKeyPair.privateKey.sign(
//             aciSignedPreKeyPair.getPublicKey().serialize()
//         );
//         const aciSignedPreKey = SignedPreKeyRecord.new(
//             aciSignedPreKeyId,
//             timestamp,
//             aciSignedPreKeyPair.getPublicKey(),
//             aciSignedPreKeyPair,
//             aciSignedPreKeySignature
//         );

//         // Generate PNI signed prekey
//         const pniSignedPreKeyId = generatePreKeyId();
//         const pniSignedPreKeyPair = PrivateKey.generate();
//         const pniSignedPreKeySignature = pniIdentityKeyPair.privateKey.sign(
//             pniSignedPreKeyPair.getPublicKey().serialize()
//         );
//         const pniSignedPreKey = SignedPreKeyRecord.new(
//             pniSignedPreKeyId,
//             timestamp,
//             pniSignedPreKeyPair.getPublicKey(),
//             pniSignedPreKeyPair,
//             pniSignedPreKeySignature
//         );

//         // Generate Last Resort PreKeys
//         const aciLastResortPreKeyId = generatePreKeyId();
//         const aciLastResortPreKeyPair = PrivateKey.generate();
//         const aciLastResortPreKey = PreKeyRecord.new(
//             aciLastResortPreKeyId,
//             aciLastResortPreKeyPair.getPublicKey(),
//             aciLastResortPreKeyPair
//         );

//         const pniLastResortPreKeyId = generatePreKeyId();
//         const pniLastResortPreKeyPair = PrivateKey.generate();
//         const pniLastResortPreKey = PreKeyRecord.new(
//             pniLastResortPreKeyId,
//             pniLastResortPreKeyPair.getPublicKey(),
//             pniLastResortPreKeyPair
//         );

//         // Generate Profile Key
//         const profileKey = generateProfileKey();

//         console.log('✅ Key generation complete');

//         return {
//             registrationId,
//             aciIdentityKey: aciIdentityKeyPair,
//             pniIdentityKey: pniIdentityKeyPair,
//             aciSignedPreKey,
//             pniSignedPreKey,
//             aciLastResortPreKey,
//             pniLastResortPreKey,
//             profileKey, // Include the profileKey
//         };
//     }

//     async function createVerificationSession(phoneNumber) {
//         try {
//             console.log('📱 Creating verification session for:', phoneNumber);
//             const response = await axios.post(`${SIGNAL_SERVER}/v1/verification/session`, {
//                 number: phoneNumber
//             });
//             console.log('✅ Session created');
//             return response.data;
//         } catch (error) {
//             console.error('❌ Session creation failed:', error.message);
//             throw error;
//         }
//     }

//     async function requestVerificationCode(sessionId, transport = 'SMS') {
//         try {
//             console.log(`📤 Requesting ${transport} verification code for session:`, sessionId);
//             const response = await axios.post(
//                 `${SIGNAL_SERVER}/v1/verification/session/${sessionId}/code`,
//                 {
//                     transport: transport.toLocaleLowerCase(),
//                     client: "android-ng"
//                 }
//             );
//             console.log('✅ Verification code requested');
//             return response.data;
//         } catch (error) {
//             console.error('❌ Code request failed:', error.message);
//             if (error.response) {
//                 console.error('   📡 Status:', error.response.status);
//                 console.error('   💾 Response Data:', JSON.stringify(error.response.data, null, 2));
//             }
//             throw error;
//         }
//     }

//     async function submitVerificationCode(sessionId, code) {
//         try {
//             console.log('🔍 Submitting verification code for session:', sessionId);
//             const response = await axios.put(
//                 `${SIGNAL_SERVER}/v1/verification/session/${sessionId}/code`,
//                 { code }
//             );
//             console.log('✅ Code verified', response.status); 
//             return response.data;
//         } catch (error) {
//             console.error('❌ Code verification failed:', error.message);
//             throw error;
//         }
//     }

//     async function updateVerificationSession(sessionId, captcha) {
//         try {
//             console.log('🤖 Submitting captcha for session:', sessionId);
//             const response = await axios.patch(
//                 `${SIGNAL_SERVER}/v1/verification/session/${sessionId}`,
//                 {
//                     captcha: "noop.noop.registration.noop" // Use this for testing
//                 }
//             );
//             console.log('✅ Captcha verified');
//             return response.data;
//         } catch (error) {
//             console.error('❌ Captcha verification failed:', error.message);
//             if (error.response) {
//                 console.error('   📡 Status:', error.response.status);
//                 console.error('   💾 Response Data:', JSON.stringify(error.response.data, null, 2));
//             }
//             throw error;
//         }
//     }

//     async function registerUser(phoneNumber, password, keys, sessionId) {
//         try {
//             const auth = Buffer.from(`${phoneNumber}:${password}`).toString('base64');
//             console.log("Auth logs", auth)
            

//              // First, let's log the keys to verify they're being generated correctly
//         console.log('Debug - Keys:', {
//             aciLastResortPreKey: keys.aciLastResortPreKey,
//             pniLastResortPreKey: keys.pniLastResortPreKey
//         });
        
//         const registrationData = {
//             sessionId,
//             accountAttributes: {
//                 fetchesMessages: true,
//                 registrationId: keys.registrationId,
//                 pniRegistrationId: keys.registrationId,
//                 profileKey: keys.profileKey.toString('base64'), // Include profileKey, base64 encoded
//             },
//             // skipDeviceTransfer: true,
//             aciSignedPreKey: {
//             keyId: keys.aciSignedPreKey.id(),
//             publicKey: keys.aciSignedPreKey.publicKey().serialize().toString('base64'), // Simplified base64
//             signature: Buffer.from(keys.aciSignedPreKey.signature()).toString('base64')
//             },
//             pniSignedPreKey: {
//                 keyId: keys.pniSignedPreKey.id(),
//                 publicKey: keys.pniSignedPreKey.publicKey().serialize().toString('base64'), // Simplified base64
//                 signature: Buffer.from(keys.pniSignedPreKey.signature()).toString('base64')
//             },
//             // Not working 
//             // aciPqLastResortPreKey: {
//             //     keyId: keys.aciLastResortPreKey.id(),
//             //     publicKey: keys.aciLastResortPreKey.publicKey().serialize().toString('base64'), // Simplified base64
//             // },

//             // // aciPqLastResortPreKey: {
//             // //     keyId: keys.aciLastResortPreKey.id(),
//             // //     publicKey: keys.aciLastResortPreKey.publicKey().serialize('base64'),
//             // // },
//             deviceActivationRequest: {
//                 // aciSignedPreKey: {
//                 //     keyId: keys.aciSignedPreKey.id(),
//                 //     publicKey: keys.aciSignedPreKey.publicKey().serialize().toString('base64'), // Simplified base64
//                 //     signature: Buffer.from(keys.aciSignedPreKey.signature()).toString('base64')
//                 // },
//                 // pniSignedPreKey: {
//                 //     keyId: keys.pniSignedPreKey.id(),
//                 //     publicKey: keys.pniSignedPreKey.publicKey().serialize('base64'),
//                 //     signature: keys.pniSignedPreKey.signature('base64'),
//                 // },
//                 // aciPqLastResortPreKey: {
//                 //     keyId: keys.aciLastResortPreKey.id(),
//                 //     publicKey: keys.aciLastResortPreKey.publicKey().serialize('base64'),
//                 // },
//                 // pniPqLastResortPreKey: {
//                 //     keyId: keys.pniLastResortPreKey.id(),
//                 //     publicKey: keys.pniLastResortPreKey.publicKey().serialize('base64'),
//                 // },
//             },
//             aciIdentityKey: keys.aciIdentityKey.publicKey.serialize().toString('base64'), // Simplified base64 - IDENTITY KEY
//             pniIdentityKey: keys.pniIdentityKey.publicKey.serialize().toString('base64'),  // Simplified base64 - IDENTITY KEY

//         };

//             console.log('📦 Registration payload:', JSON.stringify(registrationData, null, 2));
    
//             const registrationResponse = await axios.post(
//                 `${SIGNAL_SERVER}/v1/registration`,
//                 registrationData,
//                 {
//                     headers: {
//                         'Authorization': `Basic ${auth}`,
//                         'Content-Type': 'application/json',
//                         'Accept': 'application/json',
//                         'User-Agent': 'Signal-Android/6.34.9', // Add user agent to match expected client
//                         'X-Signal-Agent': 'OWD', // Add signal agent identifier
//                     },
//                 }
//             );
    
//             return registrationResponse.data;
//         } catch (error) {
//             if (error.response) {
//                 console.error('   📡 Error status:', error.response.status);
//                 console.error('   💾 Response Data:', JSON.stringify(error.response.data, null, 2));
         
//             }
//             throw error;
//         }
//     }

//     async function main() {
//         try {
//             const phoneNumber = '+18005550123';
//             const password = 'your_password_here';

//             // Step 1: Create verification session
//             const session = await createVerificationSession(phoneNumber);
//             console.log('📋 Session ID:', session.id);

//             // Step 2: Submit captcha
//             const updatedSession = await updateVerificationSession(session.id);

//             if (updatedSession.allowedToRequestCode) {
//                 // Step 3: Request verification code
//                 await requestVerificationCode(session.id);

//                 // Step 4: Submit verification code
//                 const verificationCode = '550123'; // Example code
//                 const verifiedSession = await submitVerificationCode(session.id, verificationCode);

//                 if (verifiedSession.verified) {
//                     // Generate keys and complete registration
//                     const keys = await generateKeys();
//                     const registration = await registerUser(phoneNumber, password, keys, session.id);
//                     console.log('✅ Registration complete:', registration);
//                 } else {
//                     throw new Error('Session verification failed');
//                 }
//             } else {
//                 throw new Error('Session not allowed to request code: ' +
//                     JSON.stringify(updatedSession.requestedInformation));
//             }

//         } catch (error) {
//             console.error('\n❌ Error occurred:');
//             console.error('   💥 Message:', error.message);
//             if (error.response) {
//                 console.error('   📡 Status:', error.response.status);
//                 console.error('   💾 Response Data:', JSON.stringify(error.response.data, null, 2));
//             }
//         }
//     }

//     main();
// V2 Almost working
// const SignalClient = require('@signalapp/signal-client');
// const { 
//     PrivateKey, 
//     PublicKey,
//     PreKeyRecord,
//     SignedPreKeyRecord,
//     IdentityKeyPair
// } = SignalClient;
// const crypto = require('crypto');
// const axios = require('axios');

// const SIGNAL_SERVER = 'http://51.8.81.17:8080';



// // Helper functions
// function generateRegistrationId() {
//     return Math.floor(Math.random() * 16380) + 1;
// }

// function generatePreKeyId() {
//     return Math.floor(Math.random() * 16777215) + 1;
// }


// async function generateKeys() {
//     console.log('🔑 Generating key pairs...');
    
//     const registrationId = generateRegistrationId();
//     const timestamp = Date.now();
    
//     // Generate identity keys
//     const aciIdentityKeyPair = IdentityKeyPair.generate();
//     const pniIdentityKeyPair = IdentityKeyPair.generate();
    
//     // Generate signed prekeys
//     const aciSignedPreKeyPair = PrivateKey.generate();
//     const aciSignedPreKeyId = generatePreKeyId(); // Using the correct function
//     const aciSignedPreKeySignature = aciIdentityKeyPair.privateKey.sign(
//         aciSignedPreKeyPair.getPublicKey().serialize()
//     );
//     const aciSignedPreKey = SignedPreKeyRecord.new(
//         aciSignedPreKeyId,
//         timestamp,
//         aciSignedPreKeyPair.getPublicKey(),
//         aciSignedPreKeyPair,
//         aciSignedPreKeySignature
//     );

//     // Generate PNI signed prekey
//     const pniSignedPreKeyPair = PrivateKey.generate();
//     const pniSignedPreKeyId = generatePreKeyId(); // Using the correct function
//     const pniSignedPreKeySignature = pniIdentityKeyPair.privateKey.sign(
//         pniSignedPreKeyPair.getPublicKey().serialize()
//     );
//     const pniSignedPreKey = SignedPreKeyRecord.new(
//         pniSignedPreKeyId,
//         timestamp,
//         pniSignedPreKeyPair.getPublicKey(),
//         pniSignedPreKeyPair,
//         pniSignedPreKeySignature
//     );

//     // Generate Last Resort PreKeys
//     const aciLastResortPreKeyId = generatePreKeyId();
//     const aciLastResortPreKeyPrivate = PrivateKey.generate();
//     const aciLastResortPreKey = PreKeyRecord.new(
//         aciLastResortPreKeyId,
//         aciLastResortPreKeyPrivate.getPublicKey(),
//         aciLastResortPreKeyPrivate
//     );

//     const pniLastResortPreKeyId = generatePreKeyId();
//     const pniLastResortPreKeyPrivate = PrivateKey.generate();
//     const pniLastResortPreKey = PreKeyRecord.new(
//         pniLastResortPreKeyId,
//         pniLastResortPreKeyPrivate.getPublicKey(),
//         pniLastResortPreKeyPrivate
//     );

//     return {
//         registrationId,
//         aciIdentityKey: aciIdentityKeyPair,
//         pniIdentityKey: pniIdentityKeyPair,
//         aciSignedPreKey,
//         pniSignedPreKey,
//         aciLastResortPreKey,
//         pniLastResortPreKey
//     };
// }

// function generateRegistrationId() {
//     return Math.floor(Math.random() * 16380) + 1;
// }

// function generatePreKeyId() {
//     return Math.floor(Math.random() * 16777215) + 1;
// }

// async function createVerificationSession(phoneNumber) {
//     try {
//         console.log('📱 Creating verification session for:', phoneNumber);
//         const response = await axios.post(`${SIGNAL_SERVER}/v1/verification/session`, {
//             number: phoneNumber
//         });
//         console.log('✅ Session created');
//         return response.data;
//     } catch (error) {
//         console.error('❌ Session creation failed:', error.message);
//         throw error;
//     }
// }

// async function requestVerificationCode(sessionId, transport = 'SMS') {
//     try {
//         console.log(`📤 Requesting ${transport} verification code for session:`, sessionId);
//         const response = await axios.post(
//             `${SIGNAL_SERVER}/v1/verification/session/${sessionId}/code`,
//             {
//                 transport: transport.toLocaleLowerCase(),
//                 client: "android-ng"
//             }
//         );
//         console.log('✅ Verification code requested');
//         return response.data;
//     } catch (error) {
//         console.error('❌ Code request failed:', error.message);
//         if (error.response) {
//             console.error('   📡 Status:', error.response.status);
//             console.error('   💾 Response Data:', JSON.stringify(error.response.data, null, 2));
//         }
//         throw error;
//     }
// }

// async function submitVerificationCode(sessionId, code) {
//     try {
//         console.log('🔍 Submitting verification code for session:', sessionId);
//         const response = await axios.put(
//             `${SIGNAL_SERVER}/v1/verification/session/${sessionId}/code`,
//             { code }
//         );
//         console.log('✅ Code verified');
//         return response.data;
//     } catch (error) {
//         console.error('❌ Code verification failed:', error.message);
//         throw error;
//     }
// }

// async function updateVerificationSession(sessionId, captcha) {
//     try {
//         console.log('🤖 Submitting captcha for session:', sessionId);
//         const response = await axios.patch(
//             `${SIGNAL_SERVER}/v1/verification/session/${sessionId}`,
//             {
//                 captcha: "noop.noop.registration.noop" // Use this for testing
//             }
//         );
//         console.log('✅ Captcha verified');
//         return response.data;
//     } catch (error) {
//         console.error('❌ Captcha verification failed:', error.message);
//         if (error.response) {
//             console.error('   📡 Status:', error.response.status);
//             console.error('   💾 Response Data:', JSON.stringify(error.response.data, null, 2));
//         }
//         throw error;
//     }
// }

// async function registerUser(phoneNumber, password, keys, sessionId) {
//     try {
//         const auth = Buffer.from(`${phoneNumber}:${password}`).toString('base64');
        
//         const registrationData = {
//             sessionId,
//             accountAttributes: {
//                 fetchesMessages: true,
//                 registrationId: keys.registrationId,
//                 pniRegistrationId: keys.registrationId
//             },
//             skipDeviceTransfer: true,
//             deviceActivationRequest: {
//                 aciSignedPreKey: {
//                     keyId: keys.aciSignedPreKey.id(),
//                     publicKey: Buffer.from(keys.aciSignedPreKey.publicKey().serialize()).toString('base64'),
//                     signature: Buffer.from(keys.aciSignedPreKey.signature()).toString('base64')
//                 },
//                 pniSignedPreKey: {
//                     keyId: keys.pniSignedPreKey.id(),
//                     publicKey: Buffer.from(keys.pniSignedPreKey.publicKey().serialize()).toString('base64'),
//                     signature: Buffer.from(keys.pniSignedPreKey.signature()).toString('base64')
//                 },
//                 aciPqLastResortPreKey: {
//                     keyId: keys.aciLastResortPreKey.id(),
//                     publicKey: Buffer.from(keys.aciLastResortPreKey.publicKey().serialize()).toString('base64')
//                 },
//                 pniPqLastResortPreKey: {
//                     keyId: keys.pniLastResortPreKey.id(),
//                     publicKey: Buffer.from(keys.pniLastResortPreKey.publicKey().serialize()).toString('base64')
//                 }
//             },
//             aciIdentityKey: Buffer.from(keys.aciIdentityKey.publicKey.serialize()).toString('base64'),
//             pniIdentityKey: Buffer.from(keys.pniIdentityKey.publicKey.serialize()).toString('base64')
//         };

//         console.log('📦 Registration payload:', JSON.stringify(registrationData, null, 2));

//         const registrationResponse = await axios.post(
//             `${SIGNAL_SERVER}/v1/registration`,
//             registrationData,
//             {
//                 headers: {
//                     'Authorization': `Basic ${auth}`,
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json'
//                 }
//             }
//         );

//         return registrationResponse.data;
//     } catch (error) {
//         console.error('❌ Registration failed:', error.message);
//         if (error.response) {
//             console.error('   📡 Status:', error.response.status);
//             console.error('   💾 Response Data:', JSON.stringify(error.response.data, null, 2));
//         }
//         throw error;
//     }
// }

// async function main() {
//     try {
//         const phoneNumber = '+18005550123';
//         const password = 'your_password_here';

//         // Step 1: Create verification session
//         const session = await createVerificationSession(phoneNumber);
//         console.log('📋 Session ID:', session.id);

//         // Step 2: Submit captcha
//         const updatedSession = await updateVerificationSession(session.id);
        
//         if (updatedSession.allowedToRequestCode) {
//             // Step 3: Request verification code
//             await requestVerificationCode(session.id);

//             // Step 4: Submit verification code
//             const verificationCode = '550123'; // Example code
//             const verifiedSession = await submitVerificationCode(session.id, verificationCode);

//             if (verifiedSession.verified) {
//                 // Generate keys and complete registration
//                 const keys = await generateKeys();
//                 const registration = await registerUser(phoneNumber, password, keys, session.id);
//                 console.log('✅ Registration complete:', registration);
//             } else {
//                 throw new Error('Session verification failed');
//             }
//         } else {
//             throw new Error('Session not allowed to request code: ' + 
//                 JSON.stringify(updatedSession.requestedInformation));
//         }

//     } catch (error) {
//         console.error('\n❌ Error occurred:');
//         console.error('   💥 Message:', error.message);
//         if (error.response) {
//             console.error('   📡 Status:', error.response.status);
//             console.error('   💾 Response Data:', JSON.stringify(error.response.data, null, 2));
//         }
//     }
// }

// main();

// async function registerUser(phoneNumber, password, keys) {
//     try {
//         // Previous verification steps remain the same...
//         const sessionId = await createSession(phoneNumber);
//         console.log('📋 Session created:', sessionId);

//         const verificationSent = await sendVerification(sessionId);
//         console.log('📬 Verification sent:', verificationSent);

//         const code = phoneNumber.slice(-6);
//         await checkVerification(sessionId, code);

//         // Get session info to confirm verification
//         const sessionInfo = await getSession(sessionId);
//         if (!sessionInfo.verified) {
//             throw new Error('Session verification failed');
//         }

//         console.log('🔑 Preparing registration data...');
        
//         // Updated registration data structure based on OpenAPI spec
//         const registrationData = {
//             sessionId,
//             recoveryPassword: "password",
//             accountAttributes: {
//                 fetchesMessages: true,
//                 registrationId: Number(keys.registrationId),
//                 pniRegistrationId: Number(keys.registrationId),
//                 eachRegistrationIdValid: true,
//                 discoverableByPhoneNumber: true
//             },
//             skipDeviceTransfer: true,
//             // aciIdentityKey: {
//             //     publicKey: {
//             //         publicKeyBytes: Buffer.from(keys.aciIdentityKey.publicKey.serialize()).toString('base64'),
//             //         type: 0 // Assuming type 0 is the default
//             //     }
//             // },
//             // PNI Identity Key
//             // pniIdentityKey: {
//             //     publicKey: {
//             //         publicKeyBytes: Buffer.from(keys.pniIdentityKey.publicKey.serialize()).toString('base64'),
//             //         type: 0
//             //     }
//             // },
//             // aciSignedPreKey: {
//             //     keyId: Number(keys.aciSignedPreKey.id),
//             //     publicKey: Buffer.from(keys.aciSignedPreKey.publicKey.serialize()).toString('base64'),
//             //     signature: Buffer.from(keys.aciSignedPreKey.signature).toString('base64')
//             // },
//             valid: true
//         };

//         // Log the prepared data for debugging
//         console.log('📦 Prepared registration data:', JSON.stringify(registrationData, null, 2));

//         const auth = Buffer.from(`${phoneNumber}:${password}`).toString('base64');
//         console.log('🔐 Sending registration request to Signal server...');

//         const registrationResponse = await axios.post(
//             `${SIGNAL_SERVER}/v1/registration`,
//             registrationData,
//             {
//                 headers: {
//                     'Authorization': `Basic ${auth}`,
//                     'Content-Type': 'application/json',
//                     'User-Agent': 'Signal-Android/6.34.9',
//                     'Accept': 'application/json'
//                 }
//             }
//         );

//         console.log('✅ Registration successful:', registrationResponse.data);
//         return registrationResponse.data;
//     } catch (error) {
//         console.error('\n❌ Error occurred:');
//         if (error.response) {
//             console.error('   📡 Status:', error.response.status);
//             console.error('   💾 Response Data:', JSON.stringify(error.response.data, null, 2));
//         }
//         console.error('   💥 Message:', error.message);
//         throw error;
//     }
// }


// async function main() {
//     console.log('🚀 Initializing Signal Protocol test...\n');
    
//     try {
//         console.log('🔑 Generating key pairs...');
        
//         const registrationId = generateRegistrationId();
        
//         // Generate identity keys
//         const aciIdentityKeyPair = SignalClient.IdentityKeyPair.generate();
//         const pniIdentityKeyPair = SignalClient.IdentityKeyPair.generate();
        
//         // Generate ACI SignedPreKey
//         const aciSignedPreKeyId = generatePreKeyId();
//         const aciSignedPreKeyPrivate = SignalClient.PrivateKey.generate();
//         const aciSignedPreKeyPublic = aciSignedPreKeyPrivate.getPublicKey();
//         const aciSignedPreKeySignature = aciIdentityKeyPair.privateKey.sign(
//             aciSignedPreKeyPublic.serialize()
//         );

//         const aciSignedPreKey = {
//             id: aciSignedPreKeyId,
//             privateKey: aciSignedPreKeyPrivate,
//             publicKey: aciSignedPreKeyPublic,
//             signature: aciSignedPreKeySignature
//         };

//         // Generate PNI SignedPreKey
//         const pniSignedPreKeyId = generatePreKeyId();
//         const pniSignedPreKeyPrivate = SignalClient.PrivateKey.generate();
//         const pniSignedPreKeyPublic = pniSignedPreKeyPrivate.getPublicKey();
//         const pniSignedPreKeySignature = pniIdentityKeyPair.privateKey.sign(
//             pniSignedPreKeyPublic.serialize()
//         );

//         const pniSignedPreKey = {
//             id: pniSignedPreKeyId,
//             privateKey: pniSignedPreKeyPrivate,
//             publicKey: pniSignedPreKeyPublic,
//             signature: pniSignedPreKeySignature
//         };

//         // Generate Last Resort PreKeys
//         const aciLastResortPreKey = {
//             id: generatePreKeyId(),
//             privateKey: SignalClient.PrivateKey.generate()
//         };
//         aciLastResortPreKey.publicKey = aciLastResortPreKey.privateKey.getPublicKey();

//         const pniLastResortPreKey = {
//             id: generatePreKeyId(),
//             privateKey: SignalClient.PrivateKey.generate()
//         };
//         pniLastResortPreKey.publicKey = pniLastResortPreKey.privateKey.getPublicKey();

//         console.log('✅ Key generation complete\n');

//         // Register user with server
//         console.log('📱 Registering user with Signal server...');
//         const phoneNumber = '+18005550123';
//         const password = 'your_password_here';
        
//         const registrationKeys = {
//             registrationId,
//             aciIdentityKey: aciIdentityKeyPair,
//             pniIdentityKey: pniIdentityKeyPair,
//             aciSignedPreKey,
//             pniSignedPreKey,
//             aciLastResortPreKey,
//             pniLastResortPreKey
//         };

//         await registerUser(phoneNumber, password, registrationKeys);
//     } catch (error) {
//         console.error('\n❌ Error occurred:');
//         console.error('   💥 Message:', error.message);
//         console.error('   📍 Stack:', error.stack);
//     }
// }

// main();


// const SignalClient = require('@signalapp/signal-client');
// const crypto = require('crypto');
// const { 
//     ProtocolAddress, 
//     PreKeyBundle, 
//     PrivateKey, 
//     PublicKey,
//     PreKeyRecord,
//     SignedPreKeyRecord
// } = SignalClient;

// const axios = require('axios'); // Make sure to install axios

// const SIGNAL_SERVER = 'http://51.8.81.17:8080';

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

// // Helper functions
// function generateRegistrationId() {
//     // Generate a random 14-bit number (0 to 16383)
//     return Math.floor(Math.random() * 16383) + 1;
// }

// function generatePreKeyId() {
//     // Generate a random number between 1 and 16777215 (0xFFFFFF)
//     return Math.floor(Math.random() * 16777215) + 1;
// }

// function generateDeviceId() {
//     // Signal typically uses 1-5 for device IDs
//     return Math.floor(Math.random() * 5) + 1;
// }

// function generateUUID() {
//     return crypto.randomUUID();
// }

// async function verifyWithServer(keys) {
//     try {
//         // Register keys with server
//         const registrationResponse = await axios.post(`${SIGNAL_SERVER}/v2/keys`, {
//             identityKey: keys.identityKey.serialize().toString('base64'),
//             signedPreKey: {
//                 keyId: keys.signedPreKeyId,
//                 publicKey: keys.signedPreKeyPublic.serialize().toString('base64'),
//                 signature: keys.signature.toString('base64')
//             },
//             preKeys: keys.preKeys.map(pk => ({
//                 keyId: pk.id,
//                 publicKey: pk.key.publicKey().serialize().toString('base64')
//             }))
//         });

//         console.log('🔄 Server Registration Response:', registrationResponse.status);
        
//         // Verify registered keys
//         const verificationResponse = await axios.get(
//             `${SIGNAL_SERVER}/v2/keys/${keys.registrationId}/${keys.deviceId}`
//         );
        
//         return verificationResponse.data;
//     } catch (error) {
//         console.error('❌ Server verification failed:', error.message);
//         throw error;
//     }
// }

// async function verifyBundle(bundle) {
//     try {
//         // Verify PreKeyBundle with server
//         const bundleResponse = await axios.post(`${SIGNAL_SERVER}/v2/bundle/verify`, {
//             registrationId: bundle.registrationId(),
//             deviceId: bundle.deviceId(),
//             preKeyId: bundle.preKeyId(),
//             signedPreKeyId: bundle.signedPreKeyId(),
//             identityKey: bundle.identityKey().serialize().toString('base64'),
//             signedPreKeySignature: bundle.signedPreKeySignature().toString('base64')
//         });

//         return bundleResponse.data.isValid;
//     } catch (error) {
//         console.error('❌ Bundle verification failed:', error.message);
//         throw error;
//     }
// }

// axios.interceptors.response.use(
//     response => response,
//     error => {
//         console.error('\n🌐 Network Error Details:');
//         if (error.response) {
//             console.error('   📡 Status:', error.response.status);
//             console.error('   💾 Response Data:', JSON.stringify(error.response.data, null, 2));
//             console.error('   🔍 Request Data:', JSON.stringify(error.config.data, null, 2));
//         }
//         throw error;
//     }
// );


// // Validation helper functions
// function isValidBase64(str) {
//     try {
//         return Buffer.from(str, 'base64').toString('base64') === str;
//     } catch {
//         return false;
//     }
// }

// function validateKeyObject(obj, name, requiresSignature = true) {
//     if (!obj.keyId || typeof obj.keyId !== 'number') {
//         throw new Error(`Invalid keyId in ${name}`);
//     }
//     if (!obj.publicKey || !isValidBase64(obj.publicKey)) {
//         throw new Error(`Invalid publicKey in ${name}`);
//     }
//     if (requiresSignature && (!obj.signature || !isValidBase64(obj.signature))) {
//         throw new Error(`Invalid signature in ${name}`);
//     }
// }


// async function createSession(phoneNumber) {
//     try {
//         console.log('📱 Creating session for phone number:', phoneNumber);
        
//         const response = await axios.post('http://51.8.81.17:3000/create-session', {
//             phoneNumber
//         }, {
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });

//         return response.data.session_id;
//     } catch (error) {
//         console.error('❌ Session creation failed:', error.message);
//         throw error;
//     }
// }

// async function sendVerification(sessionId) {
//     try {
//         console.log('📤 Sending verification code for session:', sessionId);
        
//         const response = await axios.post('http://51.8.81.17:3000/send-verification', {
//             sessionId,
//             transport: "MESSAGE_TRANSPORT_SMS"
//         }, {
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });

//         return response.data.success;
//     } catch (error) {
//         console.error('❌ Verification send failed:', error.message);
//         throw error;
//     }
// }

// async function checkVerification(sessionId, code) {
//     try {
//         console.log('✅ Checking verification code for session:', sessionId);
        
//         const response = await axios.post('http://51.8.81.17:3000/check-verification', {
//             sessionId,
//             code
//         }, {
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });

//         return response.data.success;
//     } catch (error) {
//         console.error('❌ Verification check failed:', error.message);
//         throw error;
//     }
// }


// // Helper function to convert Buffer to base64
// function bufferToBase64(buffer) {
//     if (buffer && buffer.type === 'Buffer' && Array.isArray(buffer.data)) {
//         return Buffer.from(buffer.data).toString('base64');
//     } else if (Buffer.isBuffer(buffer)) {
//         return buffer.toString('base64');
//     }
//     // If it's already serialized
//     return buffer;
// }

// async function registerUser(phoneNumber, password, keys) {
//     try {
//         // Step 1: Create session
//         const sessionId = await createSession(phoneNumber);
//         console.log('📋 Session created:', sessionId);

//         // Step 2: Send verification
//         const verificationSent = await sendVerification(sessionId);
//         console.log('📬 Verification sent:', verificationSent);

//         // Step 3: Check verification (using the last 6 digits of phone number as the code)
//         const code = phoneNumber.slice(-6);
//         const verified = await checkVerification(sessionId, code);
//         console.log('✓ Verification status:', verified);

//         if (verified) {
//             console.log('🔑 Preparing registration data...');
            
//             const auth = Buffer.from(`${phoneNumber}:${password}`).toString('base64');

//             // Properly format the registration data
//             const registrationData = {
//                 sessionId,
//                 recoveryPassword: null,
//                 deviceActivationRequest: {
//                     aciSignedPreKey: {
//                         keyId: Number(keys.aciSignedPreKey.id),
//                         publicKey: bufferToBase64(keys.aciSignedPreKey.publicKey.serialize()),
//                         signature: bufferToBase64(keys.aciSignedPreKey.signature)
//                     },
//                     pniSignedPreKey: {
//                         keyId: Number(keys.pniSignedPreKey.id),
//                         publicKey: bufferToBase64(keys.pniSignedPreKey.publicKey.serialize()),
//                         signature: bufferToBase64(keys.pniSignedPreKey.signature)
//                     },
//                     aciPqLastResortPreKey: {
//                         keyId: Number(keys.aciLastResortPreKey.id),
//                         publicKey: bufferToBase64(keys.aciLastResortPreKey.publicKey.serialize())
//                     },
//                     pniPqLastResortPreKey: {
//                         keyId: Number(keys.pniLastResortPreKey.id),
//                         publicKey: bufferToBase64(keys.pniLastResortPreKey.publicKey.serialize())
//                     }
//                 },
//                 accountAttributes: {
//                     fetchesMessages: true,
//                     registrationId: Number(keys.registrationId),
//                     eachRegistrationIdValid: true
//                 },
//                 skipDeviceTransfer: true,
//                 aciIdentityKey: bufferToBase64(keys.aciIdentityKey.publicKey.serialize()),
//                 pniIdentityKey: bufferToBase64(keys.pniIdentityKey.publicKey.serialize()),
//                 valid: true
//             };

//             // Log the formatted data for debugging
//             console.log('📦 Formatted registration data:', JSON.stringify(registrationData, null, 2));

//             const registrationResponse = await axios.post(
//                 `${SIGNAL_SERVER}/v1/registration`,
//                 registrationData,
//                 {
//                     headers: {
//                         'Authorization': `Basic ${auth}`,
//                         'Content-Type': 'application/json',
//                         'User-Agent': 'Signal-Android/6.34.9',
//                         'Accept': 'application/json'
//                     }
//                 }
//             );

//             console.log('✅ Registration response:', registrationResponse.data);
//             return registrationResponse.data;
//         }
//     } catch (error) {
//         console.error('\n❌ Error occurred:');
//         if (error.response) {
//             console.error('   📡 Status:', error.response.status);
//             console.error('   💾 Response Data:', JSON.stringify(error.response.data, null, 2));
//             console.error('   🔍 Request Data:', error.config.data);
//         }
//         throw error;
//     }
// }

// function generateRegistrationId() {
//     // Generate a valid registration ID (must be between 1 and 16380)
//     return Math.floor(Math.random() * 16380) + 1;
// }

// // Update main() to use proper key generation
// async function main() {
//     console.log('🚀 Initializing Signal Protocol test...\n');
    
//     try {
//         console.log('🔑 Generating key pairs...');
        
//         const registrationId = generateRegistrationId();
        
//         // Generate ACI Identity Key
//         const aciIdentityKeyPair = SignalClient.IdentityKeyPair.generate();
        
//         // Generate PNI Identity Key
//         const pniIdentityKeyPair = SignalClient.IdentityKeyPair.generate();
        
//         // Generate ACI SignedPreKey with proper Buffer handling
//         const aciSignedPreKeyId = generatePreKeyId();
//         const aciSignedPreKeyPrivate = PrivateKey.generate();
//         const aciSignedPreKeyPublic = aciSignedPreKeyPrivate.getPublicKey();
//         const aciSignedPreKeySignature = aciIdentityKeyPair.privateKey.sign(
//             aciSignedPreKeyPublic.serialize()
//         );

//         const aciSignedPreKey = {
//             id: aciSignedPreKeyId,
//             privateKey: aciSignedPreKeyPrivate,
//             publicKey: aciSignedPreKeyPublic,
//             signature: aciSignedPreKeySignature
//         };

//         // Generate PNI SignedPreKey with proper Buffer handling
//         const pniSignedPreKeyId = generatePreKeyId();
//         const pniSignedPreKeyPrivate = PrivateKey.generate();
//         const pniSignedPreKeyPublic = pniSignedPreKeyPrivate.getPublicKey();
//         const pniSignedPreKeySignature = pniIdentityKeyPair.privateKey.sign(
//             pniSignedPreKeyPublic.serialize()
//         );

//         const pniSignedPreKey = {
//             id: pniSignedPreKeyId,
//             privateKey: pniSignedPreKeyPrivate,
//             publicKey: pniSignedPreKeyPublic,
//             signature: pniSignedPreKeySignature
//         };

//         // Generate Last Resort PreKeys
//         const aciLastResortPreKey = {
//             id: generatePreKeyId(),
//             privateKey: PrivateKey.generate()
//         };
//         aciLastResortPreKey.publicKey = aciLastResortPreKey.privateKey.getPublicKey();

//         const pniLastResortPreKey = {
//             id: generatePreKeyId(),
//             privateKey: PrivateKey.generate()
//         };
//         pniLastResortPreKey.publicKey = pniLastResortPreKey.privateKey.getPublicKey();

//         console.log('✅ Key generation complete\n');

//         // Register user with server
//         console.log('📱 Registering user with Signal server...');
//         const phoneNumber = '+18005550123';
//         const password = 'open sesame';
        
//         const registrationKeys = {
//             registrationId,
//             aciIdentityKey: aciIdentityKeyPair,
//             pniIdentityKey: pniIdentityKeyPair,
//             aciSignedPreKey,
//             pniSignedPreKey,
//             aciLastResortPreKey,
//             pniLastResortPreKey
//         };

//         const registration = await registerUser(phoneNumber, password, registrationKeys);
//         console.log('✅ Registration successful:', registration);

//     } catch (error) {
//         console.error('\n❌ Error occurred:');
//         console.error('   💥 Message:', error.message);
//         console.error('   📍 Stack:', error.stack);
//     }
// }

// main();

// const SignalClient = require('@signalapp/signal-client');
// const crypto = require('crypto');
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

// // Helper functions
// function generateRegistrationId() {
//     // Generate a random 14-bit number (0 to 16383)
//     return Math.floor(Math.random() * 16383) + 1;
// }

// function generatePreKeyId() {
//     // Generate a random number between 1 and 16777215 (0xFFFFFF)
//     return Math.floor(Math.random() * 16777215) + 1;
// }

// function generateDeviceId() {
//     // Signal typically uses 1-5 for device IDs
//     return Math.floor(Math.random() * 5) + 1;
// }

// function generateUUID() {
//     return crypto.randomUUID();
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
//         const deviceId = generateDeviceId();
//         const registrationId = generateRegistrationId();
//         console.log('✅ Identity key pair generated');
//         console.log(`   📱 Device ID: ${deviceId}`);
//         console.log(`   🔢 Registration ID: ${registrationId}\n`);

//         // Generate multiple PreKeys
//         console.log('🔐 Generating PreKeys...');
//         const preKeyStartId = generatePreKeyId();
//         const numberOfPreKeys = 100;
//         const preKeys = [];
        
//         for(let i = 0; i < numberOfPreKeys; i++) {
//             const preKeyId = preKeyStartId + i;
//             const preKeyPrivate = PrivateKey.generate();
//             const preKeyPublic = preKeyPrivate.getPublicKey();
//             const preKey = PreKeyRecord.new(preKeyId, preKeyPublic, preKeyPrivate);
//             preKeys.push({ id: preKeyId, key: preKey });
//             await preKeyStore.savePreKey(preKeyId, preKey);
//         }
//         console.log(`✅ Generated ${numberOfPreKeys} PreKeys starting from ID ${preKeyStartId}\n`);

//         console.log('🔏 Generating SignedPreKey...');
//         const signedPreKeyId = generatePreKeyId();
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
//         console.log('✅ SignedPreKey generated\n', signedPreKey);

//         console.log('💾 Storing keys...');
//         await signedPreKeyStore.saveSignedPreKey(signedPreKeyId, signedPreKey);
//         identityKeyStore.identityKey = identityKeyPair.privateKey;
//         console.log('✅ Keys stored successfully\n');

//         console.log('📡 Creating protocol address...');
//         const recipientUuid = generateUUID();
//         const recipientAddress = ProtocolAddress.new(recipientUuid, deviceId);
//         console.log('✅ Protocol address created');
//         console.log(`   🆔 Recipient UUID: ${recipientUuid}\n`);

//         // Use a random PreKey from our generated batch
//         const randomPreKeyIndex = Math.floor(Math.random() * numberOfPreKeys);
//         const selectedPreKey = preKeys[randomPreKeyIndex];

//         console.log('🔒 Creating PreKeyBundle...');
//         const preKeyBundle = PreKeyBundle.new(
//             registrationId,
//             deviceId,
//             selectedPreKey.id,
//             selectedPreKey.key.publicKey(),
//             signedPreKeyId,
//             signedPreKeyPublic,
//             signature,
//             identityKeyPair.publicKey
//         );
//         console.log('✅ PreKeyBundle created\n', preKeyBundle);

//         console.log('🤝 Processing PreKeyBundle...');
//         await SignalClient.processPreKeyBundle(
//             preKeyBundle,
//             recipientAddress,
//             sessionStore,
//             identityKeyStore
//         );

//         console.log('\n🎉 Success! Signal Protocol session created successfully!\n');
        
//         // Display detailed session info
//         console.log('📊 Session Details:');
//         console.log('   📱 Device ID:', deviceId);
//         console.log('   🔢 Registration ID:', registrationId);
//         console.log('   🔑 PreKey ID Range:', `${preKeyStartId} to ${preKeyStartId + numberOfPreKeys - 1}`);
//         console.log('   🎯 Selected PreKey ID:', selectedPreKey.id);
//         console.log('   🔏 SignedPreKey ID:', signedPreKeyId);
//         console.log('   ⏰ Timestamp:', new Date(timestamp).toISOString());
//         console.log('   🆔 Recipient UUID:', recipientUuid);
//         console.log('   💾 Total PreKeys stored:', preKeys.length);
        

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


// // const SignalClient = require('@signalapp/signal-client');
// // const { 
// //     ProtocolAddress, 
// //     PreKeyBundle, 
// //     PrivateKey, 
// //     PublicKey,
// //     PreKeyRecord,
// //     SignedPreKeyRecord
// // } = SignalClient;

// // // Implement the required stores extending the abstract classes
// // class InMemorySessionStore extends SignalClient.SessionStore {
// //     constructor() {
// //         super();
// //         this.sessions = new Map();
// //     }

// //     async saveSession(name, record) {
// //         this.sessions.set(name.toString(), record);
// //     }

// //     async getSession(name) {
// //         return this.sessions.get(name.toString()) || null;
// //     }

// //     async getExistingSessions(addresses) {
// //         return addresses.map(addr => this.sessions.get(addr.toString())).filter(Boolean);
// //     }
// // }

// // class InMemoryPreKeyStore extends SignalClient.PreKeyStore {
// //     constructor() {
// //         super();
// //         this.preKeys = new Map();
// //     }

// //     async savePreKey(id, record) {
// //         this.preKeys.set(id, record);
// //     }

// //     async getPreKey(id) {
// //         return this.preKeys.get(id);
// //     }

// //     async removePreKey(id) {
// //         this.preKeys.delete(id);
// //     }
// // }

// // class InMemorySignedPreKeyStore extends SignalClient.SignedPreKeyStore {
// //     constructor() {
// //         super();
// //         this.signedPreKeys = new Map();
// //     }

// //     async saveSignedPreKey(id, record) {
// //         this.signedPreKeys.set(id, record);
// //     }

// //     async getSignedPreKey(id) {
// //         return this.signedPreKeys.get(id);
// //     }
// // }

// // class InMemoryIdentityKeyStore extends SignalClient.IdentityKeyStore {
// //     constructor() {
// //         super();
// //         this.identityKeys = new Map();
// //         this.localRegistrationId = 1; // Should be randomly generated
// //         this.identityKey = null; // Should be properly initialized
// //     }

// //     async getIdentityKey() {
// //         return this.identityKey;
// //     }

// //     async getLocalRegistrationId() {
// //         return this.localRegistrationId;
// //     }

// //     async saveIdentity(name, key) {
// //         const existing = this.identityKeys.get(name.toString());
// //         this.identityKeys.set(name.toString(), key);
// //         return existing !== key;
// //     }

// //     async isTrustedIdentity(name, key, direction) {
// //         const existing = this.identityKeys.get(name.toString());
// //         return !existing || existing === key;
// //     }

// //     async getIdentity(name) {
// //         return this.identityKeys.get(name.toString()) || null;
// //     }
// // }
// // async function main() {
// //     console.log('🚀 Initializing Signal Protocol test...\n');
    
// //     try {
// //         console.log('📦 Creating storage instances...');
// //         const sessionStore = new InMemorySessionStore();
// //         const preKeyStore = new InMemoryPreKeyStore();
// //         const signedPreKeyStore = new InMemorySignedPreKeyStore();
// //         const identityKeyStore = new InMemoryIdentityKeyStore();
// //         console.log('✅ Storage instances created successfully\n');

// //         console.log('🔑 Generating identity key pair...');
// //         const identityKeyPair = SignalClient.IdentityKeyPair.generate();
// //         const deviceId = 1;
// //         const registrationId = 1;
// //         console.log('✅ Identity key pair generated\n');

// //         console.log('🔐 Generating PreKey...');
// //         const preKeyId = 1;
// //         const preKeyPrivate = PrivateKey.generate();
// //         const preKeyPublic = preKeyPrivate.getPublicKey();
// //         const preKey = PreKeyRecord.new(preKeyId, preKeyPublic, preKeyPrivate);
// //         console.log('✅ PreKey generated\n');

// //         console.log('🔏 Generating SignedPreKey...');
// //         const signedPreKeyId = 1;
// //         const signedPreKeyPrivate = PrivateKey.generate();
// //         const signedPreKeyPublic = signedPreKeyPrivate.getPublicKey();
// //         const timestamp = Date.now();
// //         const signature = identityKeyPair.privateKey.sign(signedPreKeyPublic.serialize());
// //         const signedPreKey = SignedPreKeyRecord.new(
// //             signedPreKeyId,
// //             timestamp,
// //             signedPreKeyPublic,
// //             signedPreKeyPrivate,
// //             signature
// //         );
// //         console.log('✅ SignedPreKey generated\n');

// //         console.log('💾 Storing keys...');
// //         await preKeyStore.savePreKey(preKeyId, preKey);
// //         await signedPreKeyStore.saveSignedPreKey(signedPreKeyId, signedPreKey);
// //         identityKeyStore.identityKey = identityKeyPair.privateKey;
// //         console.log('✅ Keys stored successfully\n');

// //         console.log('📡 Creating protocol address...');
// //         const recipientAddress = ProtocolAddress.new("recipientId", deviceId);
// //         console.log('✅ Protocol address created\n');

// //         console.log('🔒 Creating PreKeyBundle...');
// //         const preKeyBundle = PreKeyBundle.new(
// //             registrationId,
// //             deviceId,
// //             preKeyId,
// //             preKeyPublic,
// //             signedPreKeyId,
// //             signedPreKeyPublic,
// //             signature,
// //             identityKeyPair.publicKey
// //         );
// //         console.log('✅ PreKeyBundle created\n');

// //         console.log('🤝 Processing PreKeyBundle...');
// //         await SignalClient.processPreKeyBundle(
// //             preKeyBundle,
// //             recipientAddress,
// //             sessionStore,
// //             identityKeyStore
// //         );

// //         console.log('\n🎉 Success! Signal Protocol session created successfully!\n');
        
// //         // Display session info
// //         console.log('📊 Session Details:');
// //         console.log('   📱 Device ID:', deviceId);
// //         console.log('   🔢 Registration ID:', registrationId);
// //         console.log('   🔑 PreKey ID:', preKeyId);
// //         console.log('   🔏 SignedPreKey ID:', signedPreKeyId);
// //         console.log('   ⏰ Timestamp:', new Date(timestamp).toISOString());

// //     } catch (error) {
// //         console.error('\n❌ Error occurred:');
// //         console.error('   💥 Message:', error.message);
// //         console.error('   📍 Stack:', error.stack);
// //     }
// // }

// // // Add timestamp to console.log
// // const originalLog = console.log;
// // console.log = function() {
// //     const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
// //     originalLog.apply(console, [`[${timestamp}]`, ...arguments]);
// // };

// // main();
