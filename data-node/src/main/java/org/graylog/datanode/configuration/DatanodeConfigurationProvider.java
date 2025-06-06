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
package org.graylog.datanode.configuration;

import jakarta.inject.Inject;
import jakarta.inject.Provider;
import jakarta.inject.Singleton;
import org.graylog.datanode.Configuration;
import org.graylog2.plugin.system.NodeId;
import org.graylog2.security.jwt.IndexerJwtAuthToken;

@Singleton
public class DatanodeConfigurationProvider implements Provider<DatanodeConfiguration> {

    private final DatanodeConfiguration datanodeConfiguration;

    @Inject
    public DatanodeConfigurationProvider(
            final Configuration localConfiguration,
            IndexerJwtAuthToken jwtAuthToken,
            OpensearchDistributionProvider opensearchDistributionProvider,
            NodeId nodeId) {
        datanodeConfiguration = new DatanodeConfiguration(
                opensearchDistributionProvider,
                DatanodeDirectories.fromConfiguration(localConfiguration, nodeId),
                localConfiguration.getProcessLogsBufferSize(),
                jwtAuthToken
        );
    }

    @Override
    public DatanodeConfiguration get() {
        return datanodeConfiguration;
    }
}
