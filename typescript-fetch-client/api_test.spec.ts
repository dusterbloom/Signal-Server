/**
 * Signal Server API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: 1.0.0
 * 
 *
 * NOTE: This file is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the file manually.
 */

import * as api from "./api"
import { Configuration } from "./configuration"

const config: Configuration = {}

describe("AccountApi", () => {
  let instance: api.AccountApi
  beforeEach(function() {
    instance = new api.AccountApi(config)
  });

  test("accountExists", () => {
    const identifier: api.ServiceIdentifier = undefined
    return expect(instance.accountExists(identifier, {})).resolves.toBe(null)
  })
  test("changeNumber", () => {
    const body: api.ChangeNumberRequest = undefined
    const userAgent: string = "userAgent_example"
    return expect(instance.changeNumber(body, userAgent, {})).resolves.toBe(null)
  })
  test("confirmUsernameHash", () => {
    const body: api.ConfirmUsernameHashRequest = undefined
    return expect(instance.confirmUsernameHash(body, {})).resolves.toBe(null)
  })
  test("deleteAccount", () => {
    return expect(instance.deleteAccount({})).resolves.toBe(null)
  })
  test("deleteApnRegistrationId", () => {
    return expect(instance.deleteApnRegistrationId({})).resolves.toBe(null)
  })
  test("deleteGcmRegistrationId", () => {
    return expect(instance.deleteGcmRegistrationId({})).resolves.toBe(null)
  })
  test("deleteUsernameHash", () => {
    return expect(instance.deleteUsernameHash({})).resolves.toBe(null)
  })
  test("deleteUsernameLink", () => {
    return expect(instance.deleteUsernameLink({})).resolves.toBe(null)
  })
  test("distributePhoneNumberIdentityKeys", () => {
    const body: api.PhoneNumberIdentityKeyDistributionRequest = undefined
    const userAgent: string = "userAgent_example"
    return expect(instance.distributePhoneNumberIdentityKeys(body, userAgent, {})).resolves.toBe(null)
  })
  test("getAccountDataReport", () => {
    return expect(instance.getAccountDataReport({})).resolves.toBe(null)
  })
  test("lookupUsernameHash", () => {
    const usernameHash: string = "usernameHash_example"
    return expect(instance.lookupUsernameHash(usernameHash, {})).resolves.toBe(null)
  })
  test("lookupUsernameLink", () => {
    const uuid: string = "38400000-8cf0-11bd-b23e-10b96e4ef00d"
    return expect(instance.lookupUsernameLink(uuid, {})).resolves.toBe(null)
  })
  test("removeRegistrationLock", () => {
    return expect(instance.removeRegistrationLock({})).resolves.toBe(null)
  })
  test("reserveUsernameHash", () => {
    const body: api.ReserveUsernameHashRequest = undefined
    return expect(instance.reserveUsernameHash(body, {})).resolves.toBe(null)
  })
  test("setAccountAttributes", () => {
    const body: api.AccountAttributes = undefined
    const xSignalAgent: string = "xSignalAgent_example"
    return expect(instance.setAccountAttributes(body, xSignalAgent, {})).resolves.toBe(null)
  })
  test("setApnRegistrationId", () => {
    const body: api.ApnRegistrationId = undefined
    return expect(instance.setApnRegistrationId(body, {})).resolves.toBe(null)
  })
  test("setGcmRegistrationId", () => {
    const body: api.GcmRegistrationId = undefined
    return expect(instance.setGcmRegistrationId(body, {})).resolves.toBe(null)
  })
  test("setName", () => {
    const body: api.DeviceName = undefined
    const deviceId: string = B
    return expect(instance.setName(body, deviceId, {})).resolves.toBe(null)
  })
  test("setPhoneNumberDiscoverability", () => {
    const body: api.PhoneNumberDiscoverabilityRequest = undefined
    return expect(instance.setPhoneNumberDiscoverability(body, {})).resolves.toBe(null)
  })
  test("setRegistrationLock", () => {
    const body: api.RegistrationLock = undefined
    return expect(instance.setRegistrationLock(body, {})).resolves.toBe(null)
  })
  test("updateUsernameLink", () => {
    const body: api.EncryptedUsername = undefined
    return expect(instance.updateUsernameLink(body, {})).resolves.toBe(null)
  })
  test("whoAmI", () => {
    return expect(instance.whoAmI({})).resolves.toBe(null)
  })
})

describe("ArchiveApi", () => {
  let instance: api.ArchiveApi
  beforeEach(function() {
    instance = new api.ArchiveApi(config)
  });

  test("backup", () => {
    const xSignalZKAuth: string = "xSignalZKAuth_example"
    const xSignalZKAuthSignature: string = "xSignalZKAuthSignature_example"
    return expect(instance.backup(xSignalZKAuth, xSignalZKAuthSignature, {})).resolves.toBe(null)
  })
  test("backupInfo", () => {
    const xSignalZKAuth: string = "xSignalZKAuth_example"
    const xSignalZKAuthSignature: string = "xSignalZKAuthSignature_example"
    return expect(instance.backupInfo(xSignalZKAuth, xSignalZKAuthSignature, {})).resolves.toBe(null)
  })
  test("copyMedia", () => {
    const body: api.CopyMediaBatchRequest = undefined
    const xSignalZKAuth: string = "xSignalZKAuth_example"
    const xSignalZKAuthSignature: string = "xSignalZKAuthSignature_example"
    return expect(instance.copyMedia(body, xSignalZKAuth, xSignalZKAuthSignature, {})).resolves.toBe(null)
  })
  test("copyMedia1", () => {
    const body: api.CopyMediaRequest = undefined
    const xSignalZKAuth: string = "xSignalZKAuth_example"
    const xSignalZKAuthSignature: string = "xSignalZKAuthSignature_example"
    return expect(instance.copyMedia1(body, xSignalZKAuth, xSignalZKAuthSignature, {})).resolves.toBe(null)
  })
  test("deleteBackup", () => {
    const xSignalZKAuth: string = "xSignalZKAuth_example"
    const xSignalZKAuthSignature: string = "xSignalZKAuthSignature_example"
    return expect(instance.deleteBackup(xSignalZKAuth, xSignalZKAuthSignature, {})).resolves.toBe(null)
  })
  test("deleteMedia", () => {
    const body: api.DeleteMedia = undefined
    const xSignalZKAuth: string = "xSignalZKAuth_example"
    const xSignalZKAuthSignature: string = "xSignalZKAuthSignature_example"
    return expect(instance.deleteMedia(body, xSignalZKAuth, xSignalZKAuthSignature, {})).resolves.toBe(null)
  })
  test("getBackupZKCredentials", () => {
    const redemptionStartSeconds: number = 789
    const redemptionEndSeconds: number = 789
    return expect(instance.getBackupZKCredentials(redemptionStartSeconds, redemptionEndSeconds, {})).resolves.toBe(null)
  })
  test("listMedia", () => {
    const xSignalZKAuth: string = "xSignalZKAuth_example"
    const xSignalZKAuthSignature: string = "xSignalZKAuthSignature_example"
    const cursor: string = "cursor_example"
    const limit: number = 56
    return expect(instance.listMedia(xSignalZKAuth, xSignalZKAuthSignature, cursor, limit, {})).resolves.toBe(null)
  })
  test("readAuth", () => {
    const xSignalZKAuth: string = "xSignalZKAuth_example"
    const xSignalZKAuthSignature: string = "xSignalZKAuthSignature_example"
    const cdn: number = 56
    return expect(instance.readAuth(xSignalZKAuth, xSignalZKAuthSignature, cdn, {})).resolves.toBe(null)
  })
  test("redeemReceipt", () => {
    const body: api.RedeemBackupReceiptRequest = undefined
    return expect(instance.redeemReceipt(body, {})).resolves.toBe(null)
  })
  test("refresh", () => {
    const xSignalZKAuth: string = "xSignalZKAuth_example"
    const xSignalZKAuthSignature: string = "xSignalZKAuthSignature_example"
    return expect(instance.refresh(xSignalZKAuth, xSignalZKAuthSignature, {})).resolves.toBe(null)
  })
  test("setBackupId", () => {
    const body: api.SetBackupIdRequest = undefined
    return expect(instance.setBackupId(body, {})).resolves.toBe(null)
  })
  test("setPublicKey", () => {
    const body: api.SetPublicKeyRequest = undefined
    const xSignalZKAuth: string = "xSignalZKAuth_example"
    const xSignalZKAuthSignature: string = "xSignalZKAuthSignature_example"
    return expect(instance.setPublicKey(body, xSignalZKAuth, xSignalZKAuthSignature, {})).resolves.toBe(null)
  })
  test("uploadTemporaryAttachment", () => {
    const xSignalZKAuth: string = "xSignalZKAuth_example"
    const xSignalZKAuthSignature: string = "xSignalZKAuthSignature_example"
    return expect(instance.uploadTemporaryAttachment(xSignalZKAuth, xSignalZKAuthSignature, {})).resolves.toBe(null)
  })
})

describe("AttachmentsApi", () => {
  let instance: api.AttachmentsApi
  beforeEach(function() {
    instance = new api.AttachmentsApi(config)
  });

  test("getAttachmentUploadForm", () => {
    return expect(instance.getAttachmentUploadForm({})).resolves.toBe(null)
  })
})

describe("CallLinkApi", () => {
  let instance: api.CallLinkApi
  beforeEach(function() {
    instance = new api.CallLinkApi(config)
  });

  test("getCreateAuth", () => {
    const body: api.GetCreateCallLinkCredentialsRequest = undefined
    return expect(instance.getCreateAuth(body, {})).resolves.toBe(null)
  })
})

describe("CallingApi", () => {
  let instance: api.CallingApi
  beforeEach(function() {
    instance = new api.CallingApi(config)
  });

  test("getCallingRelays", () => {
    return expect(instance.getCallingRelays({})).resolves.toBe(null)
  })
})

describe("CertificateApi", () => {
  let instance: api.CertificateApi
  beforeEach(function() {
    instance = new api.CertificateApi(config)
  });

  test("getDeliveryCertificate", () => {
    const includeE164: boolean = true
    return expect(instance.getDeliveryCertificate(includeE164, {})).resolves.toBe(null)
  })
  test("getGroupAuthenticationCredentials", () => {
    const userAgent: string = "userAgent_example"
    const redemptionStartSeconds: number = 789
    const redemptionEndSeconds: number = 789
    return expect(instance.getGroupAuthenticationCredentials(userAgent, redemptionStartSeconds, redemptionEndSeconds, {})).resolves.toBe(null)
  })
})

describe("ChallengeApi", () => {
  let instance: api.ChallengeApi
  beforeEach(function() {
    instance = new api.ChallengeApi(config)
  });

  test("handleChallengeResponse", () => {
    const body: api.V1ChallengeBody = undefined
    const userAgent: string = "userAgent_example"
    return expect(instance.handleChallengeResponse(body, userAgent, {})).resolves.toBe(null)
  })
  test("requestPushChallenge", () => {
    return expect(instance.requestPushChallenge({})).resolves.toBe(null)
  })
})

describe("DeviceCheckApi", () => {
  let instance: api.DeviceCheckApi
  beforeEach(function() {
    instance = new api.DeviceCheckApi(config)
  });

  test("assertChallenge", () => {
    const action: string = "action_example"
    return expect(instance.assertChallenge(action, {})).resolves.toBe(null)
  })
  test("assertion", () => {
    const keyId: string = "keyId_example"
    const request: api.AssertionRequest = undefined
    const body: string = undefined
    return expect(instance.assertion(keyId, request, body, {})).resolves.toBe(null)
  })
  test("attest", () => {
    const keyId: string = "keyId_example"
    const body: string = undefined
    return expect(instance.attest(keyId, body, {})).resolves.toBe(null)
  })
  test("attestChallenge", () => {
    return expect(instance.attestChallenge({})).resolves.toBe(null)
  })
})

describe("DevicesApi", () => {
  let instance: api.DevicesApi
  beforeEach(function() {
    instance = new api.DevicesApi(config)
  });

  test("createDeviceToken", () => {
    return expect(instance.createDeviceToken({})).resolves.toBe(null)
  })
  test("getDevices", () => {
    return expect(instance.getDevices({})).resolves.toBe(null)
  })
  test("linkDevice", () => {
    const body: api.LinkDeviceRequest = undefined
    const authorization: api.BasicAuthorizationHeader = undefined
    const userAgent: string = "userAgent_example"
    return expect(instance.linkDevice(body, authorization, userAgent, {})).resolves.toBe(null)
  })
  test("recordRestoreAccountRequest", () => {
    const token: string = "token_example"
    const body: api.RestoreAccountRequest = undefined
    return expect(instance.recordRestoreAccountRequest(token, body, {})).resolves.toBe(null)
  })
  test("recordTransferArchiveUploaded", () => {
    const body: api.TransferArchiveUploadedRequest = undefined
    return expect(instance.recordTransferArchiveUploaded(body, {})).resolves.toBe(null)
  })
  test("removeDevice", () => {
    const deviceId: string = B
    return expect(instance.removeDevice(deviceId, {})).resolves.toBe(null)
  })
  test("setCapabilities", () => {
    const body: { [key: string]: boolean; } = undefined
    return expect(instance.setCapabilities(body, {})).resolves.toBe(null)
  })
  test("setPublicKey1", () => {
    const body: api.SetPublicKeyRequest = undefined
    return expect(instance.setPublicKey1(body, {})).resolves.toBe(null)
  })
  test("waitForDeviceTransferRequest", () => {
    const token: string = "token_example"
    const timeout: number = 56
    return expect(instance.waitForDeviceTransferRequest(token, timeout, {})).resolves.toBe(null)
  })
  test("waitForLinkedDevice", () => {
    const tokenIdentifier: string = "tokenIdentifier_example"
    const timeout: number = 56
    const userAgent: string = "userAgent_example"
    return expect(instance.waitForLinkedDevice(tokenIdentifier, timeout, userAgent, {})).resolves.toBe(null)
  })
  test("waitForTransferArchive", () => {
    const timeout: number = 56
    const userAgent: string = "userAgent_example"
    return expect(instance.waitForTransferArchive(timeout, userAgent, {})).resolves.toBe(null)
  })
})

describe("DirectoryApi", () => {
  let instance: api.DirectoryApi
  beforeEach(function() {
    instance = new api.DirectoryApi(config)
  });

  test("getAuthToken", () => {
    return expect(instance.getAuthToken({})).resolves.toBe(null)
  })
})

describe("DonationsApi", () => {
  let instance: api.DonationsApi
  beforeEach(function() {
    instance = new api.DonationsApi(config)
  });

  test("redeemReceipt1", () => {
    const body: api.RedeemReceiptRequest = undefined
    return expect(instance.redeemReceipt1(body, {})).resolves.toBe(null)
  })
})

describe("KeepAliveApi", () => {
  let instance: api.KeepAliveApi
  beforeEach(function() {
    instance = new api.KeepAliveApi(config)
  });

  test("getKeepAlive", () => {
    const body: api.WebSocketSessionContext = undefined
    return expect(instance.getKeepAlive(body, {})).resolves.toBe(null)
  })
  test("getProvisioningKeepAlive", () => {
    return expect(instance.getProvisioningKeepAlive({})).resolves.toBe(null)
  })
})

describe("KeyTransparencyApi", () => {
  let instance: api.KeyTransparencyApi
  beforeEach(function() {
    instance = new api.KeyTransparencyApi(config)
  });

  test("getDistinguishedKey", () => {
    const lastTreeHeadSize: number = 789
    return expect(instance.getDistinguishedKey(lastTreeHeadSize, {})).resolves.toBe(null)
  })
  test("monitor", () => {
    const body: api.KeyTransparencyMonitorRequest = undefined
    return expect(instance.monitor(body, {})).resolves.toBe(null)
  })
  test("search", () => {
    const body: api.KeyTransparencySearchRequest = undefined
    return expect(instance.search(body, {})).resolves.toBe(null)
  })
})

describe("KeysApi", () => {
  let instance: api.KeysApi
  beforeEach(function() {
    instance = new api.KeysApi(config)
  });

  test("checkKeys", () => {
    const userAgent: string = "userAgent_example"
    return expect(instance.checkKeys(userAgent, {})).resolves.toBe(null)
  })
  test("getDeviceKeys", () => {
    const identifier: api.ServiceIdentifier = undefined
    const deviceId: string = "deviceId_example"
    const unidentifiedAccessKey: api.Anonymous = undefined
    const groupSendToken: api.GroupSendTokenHeader = undefined
    const userAgent: string = "userAgent_example"
    return expect(instance.getDeviceKeys(identifier, deviceId, unidentifiedAccessKey, groupSendToken, userAgent, {})).resolves.toBe(null)
  })
  test("getStatus", () => {
    const identity: string = "identity_example"
    return expect(instance.getStatus(identity, {})).resolves.toBe(null)
  })
  test("setKeys", () => {
    const identity: string = "identity_example"
    const userAgent: string = "userAgent_example"
    return expect(instance.setKeys(identity, userAgent, {})).resolves.toBe(null)
  })
})

describe("MessagesApi", () => {
  let instance: api.MessagesApi
  beforeEach(function() {
    instance = new api.MessagesApi(config)
  });

  test("getPendingMessages", () => {
    const xSignalReceiveStories: string = "xSignalReceiveStories_example"
    const userAgent: string = "userAgent_example"
    return expect(instance.getPendingMessages(xSignalReceiveStories, userAgent, {})).resolves.toBe(null)
  })
  test("removePendingMessage", () => {
    const uuid: string = "38400000-8cf0-11bd-b23e-10b96e4ef00d"
    return expect(instance.removePendingMessage(uuid, {})).resolves.toBe(null)
  })
  test("reportSpamMessage", () => {
    const source: string = "source_example"
    const messageGuid: string = "38400000-8cf0-11bd-b23e-10b96e4ef00d"
    const body: api.SpamReport = undefined
    const userAgent: string = "userAgent_example"
    return expect(instance.reportSpamMessage(source, messageGuid, body, userAgent, {})).resolves.toBe(null)
  })
  test("sendMessage", () => {
    const body: api.IncomingMessageList = undefined
    const destination: api.ServiceIdentifier = undefined
    const unidentifiedAccessKey: api.Anonymous = undefined
    const groupSendToken: api.GroupSendTokenHeader = undefined
    const userAgent: string = "userAgent_example"
    const story: boolean = true
    return expect(instance.sendMessage(body, destination, unidentifiedAccessKey, groupSendToken, userAgent, story, {})).resolves.toBe(null)
  })
  test("sendMultiRecipientMessage", () => {
    const body: api.SealedSenderMultiRecipientMessage = undefined
    const unidentifiedAccessKey: api.CombinedUnidentifiedSenderAccessKeys = undefined
    const groupSendToken: api.GroupSendTokenHeader = undefined
    const userAgent: string = "userAgent_example"
    const online: boolean = true
    const ts: number = 789
    const urgent: boolean = true
    const story: boolean = true
    return expect(instance.sendMultiRecipientMessage(body, unidentifiedAccessKey, groupSendToken, userAgent, online, ts, urgent, story, {})).resolves.toBe(null)
  })
})

describe("OneTimeDonationsApi", () => {
  let instance: api.OneTimeDonationsApi
  beforeEach(function() {
    instance = new api.OneTimeDonationsApi(config)
  });

  test("confirmPayPalBoost", () => {
    const body: api.ConfirmPayPalBoostRequest = undefined
    const userAgent: string = "userAgent_example"
    return expect(instance.confirmPayPalBoost(body, userAgent, {})).resolves.toBe(null)
  })
  test("createBoostPaymentIntent", () => {
    const body: api.CreateBoostRequest = undefined
    const userAgent: string = "userAgent_example"
    return expect(instance.createBoostPaymentIntent(body, userAgent, {})).resolves.toBe(null)
  })
  test("createBoostReceiptCredentials", () => {
    const body: api.CreateBoostReceiptCredentialsRequest = undefined
    const userAgent: string = "userAgent_example"
    return expect(instance.createBoostReceiptCredentials(body, userAgent, {})).resolves.toBe(null)
  })
  test("createPayPalBoost", () => {
    const body: api.CreatePayPalBoostRequest = undefined
    const userAgent: string = "userAgent_example"
    return expect(instance.createPayPalBoost(body, userAgent, {})).resolves.toBe(null)
  })
})

describe("PaymentsApi", () => {
  let instance: api.PaymentsApi
  beforeEach(function() {
    instance = new api.PaymentsApi(config)
  });

  test("getAuth", () => {
    return expect(instance.getAuth({})).resolves.toBe(null)
  })
  test("getConversions", () => {
    return expect(instance.getConversions({})).resolves.toBe(null)
  })
})

describe("ProfileApi", () => {
  let instance: api.ProfileApi
  beforeEach(function() {
    instance = new api.ProfileApi(config)
  });

  test("getProfile", () => {
    const identifier: api.AciServiceIdentifier = undefined
    const version: string = "version_example"
    const unidentifiedAccessKey: api.Anonymous = undefined
    return expect(instance.getProfile(identifier, version, unidentifiedAccessKey, {})).resolves.toBe(null)
  })
  test("getProfile1", () => {
    const identifier: api.AciServiceIdentifier = undefined
    const version: string = "version_example"
    const credentialRequest: string = "credentialRequest_example"
    const unidentifiedAccessKey: api.Anonymous = undefined
    const credentialType: string = "credentialType_example"
    return expect(instance.getProfile1(identifier, version, credentialRequest, unidentifiedAccessKey, credentialType, {})).resolves.toBe(null)
  })
  test("getUnversionedProfile", () => {
    const identifier: api.ServiceIdentifier = undefined
    const unidentifiedAccessKey: api.Anonymous = undefined
    const groupSendToken: api.GroupSendTokenHeader = undefined
    const userAgent: string = "userAgent_example"
    const ca: boolean = true
    return expect(instance.getUnversionedProfile(identifier, unidentifiedAccessKey, groupSendToken, userAgent, ca, {})).resolves.toBe(null)
  })
  test("runBatchIdentityCheck", () => {
    const body: api.BatchIdentityCheckRequest = undefined
    return expect(instance.runBatchIdentityCheck(body, {})).resolves.toBe(null)
  })
  test("setProfile", () => {
    const body: api.CreateProfileRequest = undefined
    return expect(instance.setProfile(body, {})).resolves.toBe(null)
  })
})

describe("ProvisioningApi", () => {
  let instance: api.ProvisioningApi
  beforeEach(function() {
    instance = new api.ProvisioningApi(config)
  });

  test("sendProvisioningMessage", () => {
    const body: api.ProvisioningMessage = undefined
    const destination: string = "destination_example"
    const userAgent: string = "userAgent_example"
    return expect(instance.sendProvisioningMessage(body, destination, userAgent, {})).resolves.toBe(null)
  })
})

describe("RegistrationApi", () => {
  let instance: api.RegistrationApi
  beforeEach(function() {
    instance = new api.RegistrationApi(config)
  });

  test("register", () => {
    const body: api.RegistrationRequest = undefined
    const authorization: api.BasicAuthorizationHeader = undefined
    const xSignalAgent: string = "xSignalAgent_example"
    const userAgent: string = "userAgent_example"
    return expect(instance.register(body, authorization, xSignalAgent, userAgent, {})).resolves.toBe(null)
  })
})

describe("RemoteConfigApi", () => {
  let instance: api.RemoteConfigApi
  beforeEach(function() {
    instance = new api.RemoteConfigApi(config)
  });

  test("getAll", () => {
    return expect(instance.getAll({})).resolves.toBe(null)
  })
})

describe("SecureStorageApi", () => {
  let instance: api.SecureStorageApi
  beforeEach(function() {
    instance = new api.SecureStorageApi(config)
  });

  test("getAuth1", () => {
    return expect(instance.getAuth1({})).resolves.toBe(null)
  })
})

describe("SecureValueRecoveryApi", () => {
  let instance: api.SecureValueRecoveryApi
  beforeEach(function() {
    instance = new api.SecureValueRecoveryApi(config)
  });

  test("authCheck", () => {
    const body: api.AuthCheckRequest = undefined
    return expect(instance.authCheck(body, {})).resolves.toBe(null)
  })
  test("getAuth2", () => {
    return expect(instance.getAuth2({})).resolves.toBe(null)
  })
})

describe("StickersApi", () => {
  let instance: api.StickersApi
  beforeEach(function() {
    instance = new api.StickersApi(config)
  });

  test("getStickersForm", () => {
    const count: number = 56
    return expect(instance.getStickersForm(count, {})).resolves.toBe(null)
  })
})

describe("SubscriptionsApi", () => {
  let instance: api.SubscriptionsApi
  beforeEach(function() {
    instance = new api.SubscriptionsApi(config)
  });

  test("createPayPalPaymentMethod", () => {
    const body: api.CreatePayPalBillingAgreementRequest = undefined
    const subscriberId: string = "subscriberId_example"
    const userAgent: string = "userAgent_example"
    return expect(instance.createPayPalPaymentMethod(body, subscriberId, userAgent, {})).resolves.toBe(null)
  })
  test("createPaymentMethod", () => {
    const subscriberId: string = "subscriberId_example"
    const type: string = "type_example"
    const userAgent: string = "userAgent_example"
    return expect(instance.createPaymentMethod(subscriberId, type, userAgent, {})).resolves.toBe(null)
  })
  test("createSubscriptionReceiptCredentials", () => {
    const body: api.GetReceiptCredentialsRequest = undefined
    const subscriberId: string = "subscriberId_example"
    const userAgent: string = "userAgent_example"
    return expect(instance.createSubscriptionReceiptCredentials(body, subscriberId, userAgent, {})).resolves.toBe(null)
  })
  test("deleteSubscriber", () => {
    const subscriberId: string = "subscriberId_example"
    return expect(instance.deleteSubscriber(subscriberId, {})).resolves.toBe(null)
  })
  test("getBankMandate", () => {
    const bankTransferType: string = "bankTransferType_example"
    return expect(instance.getBankMandate(bankTransferType, {})).resolves.toBe(null)
  })
  test("getConfiguration", () => {
    return expect(instance.getConfiguration({})).resolves.toBe(null)
  })
  test("getSubscriptionInformation", () => {
    const subscriberId: string = "subscriberId_example"
    return expect(instance.getSubscriptionInformation(subscriberId, {})).resolves.toBe(null)
  })
  test("setAppStoreSubscription", () => {
    const subscriberId: string = "subscriberId_example"
    const originalTransactionId: string = "originalTransactionId_example"
    return expect(instance.setAppStoreSubscription(subscriberId, originalTransactionId, {})).resolves.toBe(null)
  })
  test("setDefaultPaymentMethodForIdeal", () => {
    const subscriberId: string = "subscriberId_example"
    const setupIntentId: string = "setupIntentId_example"
    return expect(instance.setDefaultPaymentMethodForIdeal(subscriberId, setupIntentId, {})).resolves.toBe(null)
  })
  test("setDefaultPaymentMethodWithProcessor", () => {
    const subscriberId: string = "subscriberId_example"
    const processor: string = "processor_example"
    const paymentMethodToken: string = "paymentMethodToken_example"
    return expect(instance.setDefaultPaymentMethodWithProcessor(subscriberId, processor, paymentMethodToken, {})).resolves.toBe(null)
  })
  test("setPlayStoreSubscription", () => {
    const subscriberId: string = "subscriberId_example"
    const purchaseToken: string = "purchaseToken_example"
    return expect(instance.setPlayStoreSubscription(subscriberId, purchaseToken, {})).resolves.toBe(null)
  })
  test("setSubscriptionLevel", () => {
    const subscriberId: string = "subscriberId_example"
    const level: number = 789
    const currency: string = "currency_example"
    const idempotencyKey: string = "idempotencyKey_example"
    return expect(instance.setSubscriptionLevel(subscriberId, level, currency, idempotencyKey, {})).resolves.toBe(null)
  })
  test("updateSubscriber", () => {
    const subscriberId: string = "subscriberId_example"
    return expect(instance.updateSubscriber(subscriberId, {})).resolves.toBe(null)
  })
})

describe("VerificationApi", () => {
  let instance: api.VerificationApi
  beforeEach(function() {
    instance = new api.VerificationApi(config)
  });

  test("createSession", () => {
    const body: api.CreateVerificationSessionRequest = undefined
    return expect(instance.createSession(body, {})).resolves.toBe(null)
  })
  test("getSession", () => {
    const sessionId: string = "sessionId_example"
    return expect(instance.getSession(sessionId, {})).resolves.toBe(null)
  })
  test("requestVerificationCode", () => {
    const body: api.VerificationCodeRequest = undefined
    const sessionId: string = "sessionId_example"
    const userAgent: string = "userAgent_example"
    const acceptLanguage: string = "acceptLanguage_example"
    return expect(instance.requestVerificationCode(body, sessionId, userAgent, acceptLanguage, {})).resolves.toBe(null)
  })
  test("updateSession", () => {
    const body: api.UpdateVerificationSessionRequest = undefined
    const sessionId: string = "sessionId_example"
    const userAgent: string = "userAgent_example"
    return expect(instance.updateSession(body, sessionId, userAgent, {})).resolves.toBe(null)
  })
  test("verifyCode", () => {
    const body: api.SubmitVerificationCodeRequest = undefined
    const sessionId: string = "sessionId_example"
    const userAgent: string = "userAgent_example"
    return expect(instance.verifyCode(body, sessionId, userAgent, {})).resolves.toBe(null)
  })
})

