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
package org.graylog2.storage.providers;

import jakarta.inject.Inject;
import jakarta.inject.Provider;
import org.graylog.plugins.datanode.DatanodeUpgradeServiceAdapter;
import org.graylog2.indexer.datanode.RemoteReindexingMigrationAdapter;
import org.graylog2.storage.DetectedSearchVersion;
import org.graylog2.storage.SearchVersion;
import org.graylog2.storage.VersionAwareProvider;

import java.util.Map;

public class DatanodeUpgradeAdapterProvider extends VersionAwareProvider<DatanodeUpgradeServiceAdapter> {
    @Inject
    public DatanodeUpgradeAdapterProvider(@DetectedSearchVersion SearchVersion indexerVersion, Map<SearchVersion, Provider<DatanodeUpgradeServiceAdapter>> pluginBindings) {
        super(indexerVersion, pluginBindings);
    }
}
