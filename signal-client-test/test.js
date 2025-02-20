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
