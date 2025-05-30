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
package org.graylog.testing.datanode;


import org.graylog.testing.completebackend.PluginJarsProvider;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;

import java.util.Map;

public interface DatanodeDevContainerBuilder {
    DatanodeDevContainerBuilder mongoDbUri(final String mongoDbUri);
    DatanodeDevContainerBuilder passwordSecret(final String passwordSecret);

    DatanodeDevContainerBuilder rootUsername(String rootUsername);

    DatanodeDevContainerBuilder restPort(int restPort);

    DatanodeDevContainerBuilder openSearchHttpPort(int openSearchHttpPort);
    DatanodeDevContainerBuilder openSearchTransportPort(int openSearchTransportPort);

    DatanodeDevContainerBuilder nodeName(String nodeName);

    DatanodeDevContainerBuilder customizer(DatanodeDockerHooks hooks);

    DatanodeDevContainerBuilder network(Network network);

    DatanodeDevContainerBuilder env(Map<String, String> env);

    DatanodeDevContainerBuilder pluginJarsProvider(PluginJarsProvider pluginJarsProvider);

    GenericContainer<?> build();
}
