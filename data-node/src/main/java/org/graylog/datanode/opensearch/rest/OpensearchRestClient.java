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
package org.graylog.datanode.opensearch.rest;

import jakarta.annotation.Nonnull;
import org.graylog.datanode.configuration.DatanodeConfiguration;
import org.graylog.datanode.opensearch.configuration.OpensearchConfiguration;
import org.graylog.shaded.opensearch2.org.apache.http.HttpHost;
import org.graylog.shaded.opensearch2.org.apache.http.HttpRequestInterceptor;
import org.graylog.shaded.opensearch2.org.opensearch.client.RestHighLevelClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

public class OpensearchRestClient {
    private static final Logger LOG = LoggerFactory.getLogger(OpensearchRestClient.class);

    public static RestHighLevelClient build(final OpensearchConfiguration configuration, final DatanodeConfiguration datanodeConfiguration, final TrustManager tm) {
        final HttpHost host = configuration.getRestBaseUrl();

        org.graylog.shaded.opensearch2.org.opensearch.client.RestClientBuilder builder = org.graylog.shaded.opensearch2.org.opensearch.client.RestClient.builder(host);
        if ("https".equals(host.getSchemeName())) {

            try {
                final var sslContext = SSLContext.getInstance("TLS");
                sslContext.init(null, new TrustManager[]{tm}, new SecureRandom());

                builder.setHttpClientConfigCallback(httpClientBuilder -> {
                    if (datanodeConfiguration.indexerJwtAuthToken().isJwtAuthEnabled()) {
                        httpClientBuilder.addInterceptorLast(jwtAuthHeaderInterceptor(datanodeConfiguration));
                    }
                    httpClientBuilder.setSSLContext(sslContext);
                    return httpClientBuilder;
                });
            } catch (NoSuchAlgorithmException | KeyManagementException ex) {
                LOG.error("Could not initialize SSL correctly: {}", ex.getMessage(), ex);
            }
        }
        return new RestHighLevelClient(builder);
    }

    @Nonnull
    private static HttpRequestInterceptor jwtAuthHeaderInterceptor(DatanodeConfiguration datanodeConfiguration) {
        return (request, context) ->
                datanodeConfiguration.indexerJwtAuthToken().headerValue().ifPresent(authToken -> request.addHeader("Authorization", authToken));
    }
}
