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
package org.graylog.storage.opensearch2.blocks;

import org.graylog.shaded.opensearch2.org.opensearch.action.admin.indices.settings.get.GetSettingsResponse;
import org.graylog.shaded.opensearch2.org.opensearch.common.settings.Settings;
import org.graylog2.indexer.indices.blocks.IndicesBlockStatus;
import org.junit.Test;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

public class BlockSettingsParserTest {

    @Test
    public void noBlockedIndicesIdentifiedIfEmptyResponseParsed() {
        GetSettingsResponse emptyResponse = new GetSettingsResponse(Map.of(), Map.of());
        final IndicesBlockStatus indicesBlockStatus = BlockSettingsParser.parseBlockSettings(emptyResponse, Optional.empty());
        assertNotNull(indicesBlockStatus);
        assertEquals(0, indicesBlockStatus.countBlockedIndices());
    }

    @Test
    public void noBlockedIndicesIdentifiedIfEmptySettingsPresent() {
        var settingsBuilder = Map.of("index_0", Settings.builder().build());
        GetSettingsResponse emptySettingsResponse = new GetSettingsResponse(settingsBuilder, Map.of());
        final IndicesBlockStatus indicesBlockStatus = BlockSettingsParser.parseBlockSettings(emptySettingsResponse, Optional.empty());
        assertNotNull(indicesBlockStatus);
        assertEquals(0, indicesBlockStatus.countBlockedIndices());
    }

    @Test
    public void parserProperlyResponseWithMultipleIndicesWithDifferentBlockSettings() {
        var settingsBuilder =Map.of(
                "index_with_no_block_settings", Settings.builder().put("lalala", 42).build(),
                "index_with_false_block_setting", Settings.builder().put("index.blocks.read_only", false).build(),
                "index_with_true_block_setting", Settings.builder().put("index.blocks.read_only", true).build(),
                "index_with_multiple_true_block_settings", Settings.builder()
                        .put("index.blocks.read_only", true)
                        .put("index.blocks.read_only_allow_delete", true)
                        .build(),
                "index_with_mixed_block_settings", Settings.builder()
                        .put("index.blocks.read_only", false)
                        .put("index.blocks.read_only_allow_delete", true)
                        .build());
        GetSettingsResponse settingsResponse = new GetSettingsResponse(settingsBuilder, Map.of());
        final IndicesBlockStatus indicesBlockStatus = BlockSettingsParser.parseBlockSettings(settingsResponse, Optional.empty());
        assertNotNull(indicesBlockStatus);
        assertEquals(3, indicesBlockStatus.countBlockedIndices());
        final Set<String> blockedIndices = indicesBlockStatus.getBlockedIndices();

        assertFalse(blockedIndices.contains("index_with_no_block_settings"));
        assertFalse(blockedIndices.contains("index_with_false_block_setting"));

        assertTrue(blockedIndices.contains("index_with_true_block_setting"));
        Collection<String> indexBlocks = indicesBlockStatus.getIndexBlocks("index_with_true_block_setting");
        assertEquals(1, indexBlocks.size());
        assertTrue(indexBlocks.contains("index.blocks.read_only"));

        assertTrue(blockedIndices.contains("index_with_multiple_true_block_settings"));
        indexBlocks = indicesBlockStatus.getIndexBlocks("index_with_multiple_true_block_settings");
        assertEquals(2, indexBlocks.size());
        assertTrue(indexBlocks.contains("index.blocks.read_only"));
        assertTrue(indexBlocks.contains("index.blocks.read_only_allow_delete"));

        assertTrue(blockedIndices.contains("index_with_mixed_block_settings"));
        indexBlocks = indicesBlockStatus.getIndexBlocks("index_with_mixed_block_settings");
        assertEquals(1, indexBlocks.size());
        assertFalse(indexBlocks.contains("index.blocks.read_only"));
        assertTrue(indexBlocks.contains("index.blocks.read_only_allow_delete"));


    }


}
