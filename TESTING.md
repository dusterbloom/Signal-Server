# Testing

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
