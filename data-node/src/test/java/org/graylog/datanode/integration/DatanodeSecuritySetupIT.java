/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
package org.graylog.datanode.integration;

import com.github.rholder.retry.RetryException;
import io.restassured.response.ValidatableResponse;
import org.apache.commons.lang3.RandomStringUtils;
import org.graylog.datanode.testinfra.DatanodeContainerizedBackend;
import org.graylog.security.certutil.csr.FilesystemKeystoreInformation;
import org.graylog.testing.restoperations.DatanodeRestApiWait;
import org.graylog.testing.restoperations.RestOperationParameters;
import org.graylog2.plugin.Tools;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.util.concurrent.ExecutionException;

import static io.restassured.RestAssured.given;
import static org.graylog.datanode.testinfra.DatanodeContainerizedBackend.IMAGE_WORKING_DIR;

public class DatanodeSecuritySetupIT {
    private static final Logger LOG = LoggerFactory.getLogger(DatanodeSecuritySetupIT.class);

    @TempDir
    static Path tempDir;
    private DatanodeContainerizedBackend backend;
    private KeyStore trustStore;
    private String containerHostname;

    @BeforeEach
    void setUp() throws IOException, GeneralSecurityException {
        containerHostname = "graylog-datanode-host-" + RandomStringUtils.random(8, "0123456789abcdef");
        // first generate a self-signed CA
        FilesystemKeystoreInformation ca = DatanodeSecurityTestUtils.generateCa(tempDir);
        trustStore = DatanodeSecurityTestUtils.buildTruststore(ca);

        // use the CA to generate transport certificate keystore
        final FilesystemKeystoreInformation transportCert = DatanodeSecurityTestUtils.generateTransportCert(tempDir, ca, containerHostname);
        // use the CA to generate HTTP certificate keystore
        final FilesystemKeystoreInformation httpCert = DatanodeSecurityTestUtils.generateHttpCert(tempDir, ca, containerHostname, Tools.getLocalCanonicalHostname());

        backend = new DatanodeContainerizedBackend(containerHostname, datanodeContainer -> {
            // provide the keystore files to the docker container
            datanodeContainer.withFileSystemBind(transportCert.location().toAbsolutePath().toString(), IMAGE_WORKING_DIR + "/config/datanode-transport-certificates.p12");
            datanodeContainer.withFileSystemBind(httpCert.location().toAbsolutePath().toString(), IMAGE_WORKING_DIR + "/config/datanode-https-certificates.p12");

            // configure transport security
            datanodeContainer.withEnv("GRAYLOG_DATANODE_TRANSPORT_CERTIFICATE", "datanode-transport-certificates.p12");
            datanodeContainer.withEnv("GRAYLOG_DATANODE_TRANSPORT_CERTIFICATE_PASSWORD", new String(transportCert.password()));
            datanodeContainer.withEnv("GRAYLOG_DATANODE_INSECURE_STARTUP", "false");

            // configure http security
            datanodeContainer.withEnv("GRAYLOG_DATANODE_HTTP_CERTIFICATE", "datanode-https-certificates.p12");
            datanodeContainer.withEnv("GRAYLOG_DATANODE_HTTP_CERTIFICATE_PASSWORD", new String(httpCert.password()));

            // this is the interface that we bind opensearch to. It must be 0.0.0.0 if we want
            // to be able to reach opensearch from outside the container and docker network (true?)
            datanodeContainer.withEnv("GRAYLOG_DATANODE_HTTP_BIND_ADDRESS", "0.0.0.0");

            // HOSTNAME is used to generate the SSL certificates and to communicate inside the
            // container and docker network, where we do the hostname validation.
            datanodeContainer.withCreateContainerCmdModifier(createContainerCmd -> createContainerCmd.withName(containerHostname));
            datanodeContainer.withEnv("GRAYLOG_DATANODE_HOSTNAME", containerHostname);

            datanodeContainer.withEnv("GRAYLOG_DATANODE_SINGLE_NODE_ONLY", "true");
        }).start();
    }

    @AfterEach
    void tearDown() {
        backend.stop();
    }

    @Test
    void testSecuredSetup() throws ExecutionException, RetryException {
        waitForOpensearchAvailableStatus(backend.getDatanodeRestPort(), trustStore);

        try {
            given().header("Authorization", DatanodeContainerizedBackend.JWT_AUTH_TOKEN.headerValue().get())
                    .trustStore(trustStore)
                    .get("https://localhost:" + backend.getOpensearchRestPort())
                    .then().assertThat()
                    .body("name", Matchers.equalTo(containerHostname))
                    .body("cluster_name", Matchers.equalTo("datanode-cluster"));
        } catch (Exception ex) {
            LOG.error("Error connecting to OpenSearch in the DataNode, showing logs:\n{}", backend.getLogs());
            throw ex;
        }
    }

    private ValidatableResponse waitForOpensearchAvailableStatus(final Integer datanodeRestPort, final KeyStore trustStore) throws ExecutionException, RetryException {

        try {
            return new DatanodeRestApiWait(
                    RestOperationParameters.builder()
                            .port(datanodeRestPort)
                            .truststore(trustStore)
                            .jwtAuthToken(DatanodeContainerizedBackend.JWT_AUTH_TOKEN)
                            .build())
                    .waitForAvailableStatus();
        } catch (Exception ex) {
            LOG.error("Error starting the DataNode, showing logs:\n" + backend.getLogs());
            throw ex;
        }
    }
}
