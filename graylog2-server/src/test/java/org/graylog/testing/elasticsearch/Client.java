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
package org.graylog.testing.elasticsearch;

import org.graylog2.indexer.indices.Template;

import java.util.Map;
import java.util.Optional;

public interface Client {

    Optional<Map<String, Object>> findMessage(String index, String query);

    default void createIndex(String index) {
        createIndex(index, 1, 0);
    }

    void createIndex(String index, int shards, int replicas);

    default String createRandomIndex(String prefix) {
        final String indexName = prefix + System.nanoTime();

        createIndex(indexName);
        waitForGreenStatus(indexName);

        return indexName;
    }

    void deleteIndices(String... indices);

    void closeIndex(String index);

    boolean indicesExists(String... indices);

    void addAliasMapping(String indexName, String alias);

    void removeAliasMapping(String indexName, String alias);

    boolean templateExists(String templateName);

    void putTemplate(String templateName, Template source);

    void deleteTemplates(String... templates);

    void waitForGreenStatus(String... indices);

    void refreshNode();

    void bulkIndex(BulkIndexRequest bulkIndexRequest);

    void cleanUp();

    String fieldType(String testIndexName, String source);

    void putSetting(String setting, String value);

    void waitForIndexBlock(String index);

    void resetIndexBlock(String index);

    void setIndexBlock(String index);

    void updateMapping(String index, Map<String, Object> mapping);
    Map<String, Object> getMapping(String index);

    String getClusterSetting(String setting);

    void putFieldMapping(final String index, final String field, final String type);

    IndexState getStatus(String indexName);

    void openIndex(String indexName);

    default void setRequestCircuitBreakerLimit(String limit) {
        putSetting("indices.breaker.total.limit", limit);
    }
}
