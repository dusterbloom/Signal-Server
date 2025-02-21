# Signal Server and Contact Discovery Service (CDSI) Setup Guide - Updated February 21, 2025

This document provides guidance on setting up and running the Signal server and Contact Discovery Service (CDSI) in both test/development and production environments.  It is crucial to understand that running a Signal server is a complex undertaking involving multiple cloud services and significant configuration.

**Disclaimer:** Running a production Signal server is a *highly* complex task requiring expertise in cloud infrastructure, security, and distributed systems.  This guide provides a starting point, but extensive knowledge and customization are required.

## Table of Contents

1.  [Signal Server - Test Mode](#signal-server-test-mode)
    *   [Prerequisites](#test-prerequisites)
    *   [Automated Tests](#test-automated-tests)
    *   [Running the Test Server](#test-running-the-test-server)
2.  [CDSI - Development Mode](#cdsi-dev-mode)
    *   [Project Overview](#cdsi-project-overview)
    *   [Prerequisites](#cdsi-prerequisites)
    *   [Building CDSI](#cdsi-building)
    *   [Running CDSI in Dev Mode](#cdsi-running-dev)
3.  [Signal Server - Production Checklist](#signal-server-production)
    *   [Production Environment Overview](#production-overview)
    *   [Enclave Configuration](#production-enclave)
    *   [Security Setup](#production-security)
    *   [Data Sources](#production-data-sources)
    * [Up to date documentation](#up-to-date-documentation)

## 1. Signal Server - Test Mode<a name="signal-server-test-mode"></a>

This section describes how to run the Signal server in a limited-functionality test mode.  This is suitable for development and testing, but *not* for production use.

### 1.a Prerequisites<a name="test-prerequisites"></a>

*   Java Development Kit (JDK) 17 or later.
*   Maven.
*   Docker (optional, for metrics).

### 1.b Automated Tests<a name="test-automated-tests"></a>

Run the full suite of automated tests using Maven:

```bash
./mvnw verify
```

### 1.c Running the Test Server<a name="test-running-the-test-server"></a>

To run the server in test mode, use the `integration-test` goal with the `test-server` profile:

```bash
./mvnw clean integration-test -DskipTests=true -Ptest-server
```

**Explanation:**

*   `clean`: Cleans the target directory, ensuring a fresh build.
*   `integration-test`:  Executes integration tests.
*   `-DskipTests=true`:  Skips unit tests (since we're focusing on the server startup).
*   `-Ptest-server`: Activates the `test-server` profile, which uses the [test configuration][test.yml] and [test secrets][test secrets].

**Optional: Metrics (Statsd/Graphite)**

If you want to monitor metrics and don't mind ignoring warnings about missing metrics, you can run a local Statsd/Graphite container:

```bash
docker run -d --name statsd -p 8125:8125/udp graphiteapp/graphite-statsd
```

**Test Server Behavior:**

The test server (`LocalWhisperServerService`[lwss]) stubs out external registration clients. This means:

*   **Captcha:** The captcha requirement can be bypassed using `noop.noop.registration.noop`.
*   **Phone Verification:** Any string will be accepted as a valid phone verification code.

[lwss]: service/src/test/java/org/whispersystems/textsecuregcm/LocalWhisperServerService.java
[test.yml]: service/src/test/resources/config/test.yml
[test secrets]: service/src/test/resources/config/test-secrets-bundle.yml

---

## 2. CDSI - Development Mode<a name="cdsi-dev-mode"></a>

This section covers setting up and running the Contact Discovery Service (CDSI) in development mode.

### 2.a Project Overview<a name="cdsi-project-overview"></a>

CDSI (Contact Discovery Service on Icelake) is a secure service that allows Signal users to discover which of their contacts are also Signal users, without revealing their entire contact list to the server.  It uses Intel SGX (Software Guard Extensions) enclaves to protect user privacy.

**Project Structure:**

*   **Java Service (Micronaut):** Handles server-side logic and communication.
*   **SGX C Code:**  Performs the secure contact discovery computations within an SGX enclave.

### 2.b Prerequisites<a name="cdsi-prerequisites"></a>

*   **Git:** For cloning the repository and managing submodules.
*   **Java Development Kit (JDK) 17:**  Ensure `JAVA_HOME` is set correctly.
*   **Maven:** For building the Java service.
*   **OpenSSL 1.1.1:**  *Crucially*, CDSI requires OpenSSL 1.1.1.  Newer versions (like 3.x) are *not* compatible.
*   **libffi7:**
*   **Azure Client + libllvm11:**
*    **OpenEnclave**

**Installing Dependencies (Ubuntu 22.04 Example):**

```bash
# libffi7
wget http://mirrors.kernel.org/ubuntu/pool/main/libf/libffi/libffi7_3.3-4_amd64.deb
sudo dpkg -i libffi7_3.3-4_amd64.deb
sudo apt-get install -f

# LibSSL 1.1
wget http://security.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2.23_amd64.deb
sudo dpkg -i libssl1.1_1.1.1f-1ubuntu2.23_amd64.deb
sudo apt-get install -f

# Azure Client + libllvm11
sudo apt-get install az-dcap-client libllvm11

# OpenEnclave
sudo apt -y install open-enclave

# Maven
sudo apt install maven

# Java 17 OpenJDK
sudo apt update
sudo apt install openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
source ~/.bashrc
```

**OpenSSL 1.1.1 Installation (if the above doesn't work):**

```bash
# Download OpenSSL 1.1.1u (or the latest 1.1.1 release)
wget https://www.openssl.org/source/openssl-1.1.1u.tar.gz
tar xvzf openssl-1.1.1u.tar.gz
cd openssl-1.1.1u/
./config
make -j$(nproc)  # Use all available cores for faster compilation
sudo make install
sudo ldconfig
```

### 2.c Building CDSI<a name="cdsi-building"></a>

1.  **Initialize Submodules:**

    ```bash
    git submodule init
    git submodule update
    ```

2.  **Build and Verify:**

    ```bash
    mvn verify
    ```

### 2.d Running CDSI in Dev Mode<a name="cdsi-running-dev"></a>

```bash
./mvnw mn:run -Dmicronaut.environments=dev
```

This command starts the Micronaut application in the `dev` environment.

---

## 3. Signal Server - Production Checklist<a name="signal-server-production"></a>

**WARNING:** This section provides a high-level overview of production setup.  It is *not* a complete guide.  Running a production Signal server is extremely complex and requires significant expertise.

### 3.a Production Environment Overview<a name="production-overview"></a>

A production Signal deployment involves a multi-cloud setup, typically using:

*   **AWS:** For various services, including DynamoDB, Kinesis, and potentially others.
*   **Azure:**  *Required* for Intel SGX support (specifically, Azure Confidential Computing VMs).
*   **GCP:**  Used for some services (details may vary).
*   **Third-Party APIs:**  Twilio, Stripe, and potentially others for SMS verification, push notifications (Apple and Firebase), etc.

Complete list on [sample configuration](service/config/sample.yml)

**Key Challenges:**

*   **SGX Hardware:**  You *must* have access to hardware that supports Intel SGX.  This usually means using Azure Confidential Computing (we have that)
*   **Possible code Modification:**  You'll need to modify the client code (iOS, Android, Desktop, and libsignal) to point to your server instances.  This includes hardcoded URLs for CDSI and SVR2 (TODO Check if still true).
*   **No Official Documentation:** There's limited official documentation for a full production setup.

The most up-to-date community-maintained documentation can often be found in forks of the Signal server repository. For example:
[Most up to date Setup Guide](https://github.com/jtof-dev/signal-server/blob/main/docs/signal-server-configuration.md)


**One Extra Opportunity:**
Given we have no choice but to go through the pain of setting up a full production instance of Signal server, hereby propose to evaluate the use of more than just CDSI related endpoints.




### 3.b CDSI Enclave Configuration<a name="production-enclave"></a>
1. Build the enclave
```bash
./mvnw exec:exec@enclave-release
```
If the build is successful, you should see a `[build success]` message.

2. Configure the enclave, by setting the `enclaveId`, `availableEpcMemory`, and `loadFactor`.
```bash
enclave:
  enclaveId: unique-enclave-id
  availableEpcMemory: 32000000
  loadFactor: 1.6
```

### 3.c Security Setup<a name="production-security"></a>

Set up a strong, unique authentication secret:

```bash
authentication:
  sharedSecret: <your-secret-here>
```

Replace `<your-secret-here>` with your secure secret.

### 3.d CDSI Data Sources<a name="production-data-sources"></a>

Configure your data sources, including Cosmos DB (for rate limiting), Redis, and account data storage:

*   **Cosmos Database (Rate Limiting):**

    ```bash
    cosmos:
      database: your-database-name
      endpoint: https://your-cosmos-endpoint
    ```

*   **Redis Cluster:**

    ```bash
    redis:
      uris: redis://your-redis-server
    ```

*   **Account Data (Example using DynamoDB and Kinesis):**

    ```bash
    accountTable:
      region: your-aws-region
      tableName: your-dynamodb-table
      streamName: your-kinesis-stream
    ```
### 3.e Up to date documentation<a name="up-to-date-documentation"></a>
The most up-to-date community-maintained documentation can often be found in forks of the Signal server repository. For example:
[Most up to date Setup Guide](https://github.com/jtof-dev/signal-server/blob/main/docs/signal-server-configuration.md)




### EXTRA MATERIAL TO EASE UNDERSTANDING

# Using the CDSI

## Server-Side Steps
The CDSI needs to run along side a signal server. 
Both need shared secrets and share a common phone number database. 

## Signal Registration 
1. **Setup and Configuration**:
   - Configure server endpoints and shared secrets for both the Signal server and CDSI.

2. **Registration on device**:
   - Initiate a verification session using the user's phone number to start the registration process.

3. **Submit Captcha**:
   - After creating a session, submit a captcha to proceed with the verification.

4. **Request Verification Code**:
   - Request a verification code via SMS or another transport method to verify the user's phone number.

5. **Submit Verification Code**:
   - Submit the received verification code to verify the session and proceed with registration.

6. **Register the User**:
   - After successful verification, register the user by generating necessary keys and sending a registration request to the server.

## Signal login (refresh session) 



## Contact Discovery Steps

1. **Generate CDSI Credentials**:
   - Use the registered user's information to generate credentials specifically for accessing CDSI using the signal server `v2/directory/auth` endpoint 

2. **Connect to CDSI**:
   - Establish a WebSocket connection to the CDSI server using the generated credentials.

3. **Perform Contact Discovery**:
   - Use the CDSI connection to perform contact discovery, allowing the application to find and connect with other users.

<!-- # Signal server - TEST MODE

## Pre-requisites



## Automated tests

The full suite of automated tests can be run using Maven from the project root:

```sh
./mvnw verify
```

## Test server

The service can be run in a feature-limited test mode by running the Maven `integration-test`
goal with the `test-server` profile activated:

```sh
./mvnw clean integration-test -DskipTests=true -Ptest-server
```

On a cloud machine running Ubuntu 22.04, or if you simply want to ignore the metrics warnings in the logs.

```sh
docker run -d --name statsd -p 8125:8125/udp graphiteapp/graphite-statsd
```

```bash
./mvnw clean integration-test -DskipTests=true -Ptest-server
```

This runs [`LocalWhisperServerService`][lwss] with [test configuration][test.yml] and [secrets][test secrets]. External
registration clients are stubbed so that:

- a captcha requirement can be satisfied with `noop.noop.registration.noop`
- any string will be accepted for a phone verification code

[lwss]: service/src/test/java/org/whispersystems/textsecuregcm/LocalWhisperServerService.java

[test.yml]: service/src/test/resources/config/test.yml

[test secrets]: service/src/test/resources/config/test-secrets-bundle.yml



# CDSI Dev mode



📱 CDSI: Contact Discovery Service on Icelake 🧊
🏗️ Project Overview

CDSI is a secure contact discovery service designed to help users find and connect with their contacts safely and efficiently. Think of it like a digital phonebook that protects your privacy!


📂 Project Structure

📁 Root Directory
│
├── 🌐 Java Service (Micronaut)
│   └── Handles server-side operations
│
└── 🔒 SGX C Code
    └── Secure computation magic happens here

🛠️ Getting Started: Building the Project
Prerequisites

    💻 Git
    ☕ Java Development Kit
    🔧 Maven
    🔐 OpenSSL 1.1.1

Libffi7
```bash
wget http://mirrors.kernel.org/ubuntu/pool/main/libf/libffi/libffi7_3.3-4_amd64.deb
sudo dpkg -i libffi7_3.3-4_amd64.deb
sudo apt-get install -f
```

LibSSL
```bash
wget http://security.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2.23_amd64.deb
sudo dpkg -i libssl1.1_1.1.1f-1ubuntu2.23_amd64.deb
sudo apt-get install -f
```

Azure Client + libllvm11
```bash
 sudo apt-get install az-dcap-client libllvm11
```
OpenEnclave
```bash
sudo apt -y install open-enclave
```
Maven
```bash
sudo apt install maven
```
Java 17 OpenJDK
```bash
sudo apt update
sudo apt install openjdk-17-jdk

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

source ~/.bashrc  
```

🆘 OpenSSL Installation Troubleshoot

If you're on Ubuntu 22.04 and need OpenSSL 1.1.1:
```bash
# 📥 Download OpenSSL
wget https://www.openssl.org/source/openssl-1.1.1u.tar.gz

# 📦 Extract and install
tar xvzf openssl-1.1.1u.tar.gz
cd openssl-1.1.1u/
./config
make -j8
sudo make install -j8
sudo ldconfig
```

Build Steps
### 🔗 Initialize submodules
```bash

git submodule init
git submodule update
```

### 🏗️ Build and verify
```bash
mvn verify
```

### 🚀 Running the Service

```bash
./mvnw mn:run -Dmicronaut.environments=dev
```

# Production checklist for Signal server
(Signal Forum)[https://community.signalusers.org/c/development/server-development/24]

**Anyone considering doing this needs to go into it with eyes wide open. Installing signal server is a multicloud deployment using services on AWS, Azure and GCP along with a bunch of API services such as Twilio and Swipe. At least two components must run on platforms that support Intel SGX, which at this point is Azure and IBM Cloud. You will need to modify the code for iOS, Android, Desktop, and libsignal (there are hardcoded host urls for CDSI and SVR2) which is in Rust. There is no documentation but a few bread crumbs. You have to spend a ton of time reading the code to figure out what you need and how to configure it. I spent all of 2024 doing this and it is VERY difficult to do.**

(Most up to date Setup Guide)[https://github.com/jtof-dev/signal-server/blob/main/docs/signal-server-configuration.md]


# 🌍 Production Configuration Checklist

### 1. Build the enclave

```bash
./mvnw exec:exec@enclave-release [build success]
```
### 2. 🏭 Enclave Configuration
```bash
enclave:
  enclaveId: unique-enclave-id
  availableEpcMemory: 32000000
  loadFactor: 1.6
```


## 🔐 Security Setup

### 🔑 Authentication Secret
```bash
authentication:
  sharedSecret: <your-secret-here>
```

## 💾 Data Sources

### 🗃️ Cosmos Database (Rate Limiting)
```bash
cosmos:
  database: your-database-name
  endpoint: https://your-cosmos-endpoint
```
###🔴 Redis Cluster
```bash
redis:
  uris: redis://your-redis-server
```
###💽 Account Data
```bash
accountTable:
  region: your-aws-region
  tableName: your-dynamodb-table
  streamName: your-kinesis-stream
```
 -->
