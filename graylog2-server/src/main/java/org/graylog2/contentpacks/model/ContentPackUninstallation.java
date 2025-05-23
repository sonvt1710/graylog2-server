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
package org.graylog2.contentpacks.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import org.graylog.security.GrantDTO;
import org.graylog2.contentpacks.model.entities.NativeEntityDescriptor;

import javax.annotation.Nullable;
import java.util.List;

@AutoValue
@JsonDeserialize(builder = ContentPackUninstallation.Builder.class)
public abstract class ContentPackUninstallation {
    private static final String FIELD_ENTITIES = "entities";
    private static final String FIELD_ENTITY_OBJECTS = "entity_objects";
    private static final String FIELD_FAILED_ENTITIES = "failed_entities";
    private static final String FIELD_SKIPPED_ENTITIES = "skipped_entities";
    private static final String FIELD_ENTITY_GRANTS = "entity_grants";

    @JsonProperty(FIELD_ENTITIES)
    public abstract ImmutableSet<NativeEntityDescriptor> entities();

    @Nullable
    @JsonProperty(FIELD_ENTITY_OBJECTS)
    public abstract ImmutableMap<ModelId, Object> entityObjects();

    @JsonProperty(FIELD_FAILED_ENTITIES)
    public abstract ImmutableSet<NativeEntityDescriptor> failedEntities();

    @JsonProperty(FIELD_SKIPPED_ENTITIES)
    public abstract ImmutableSet<NativeEntityDescriptor> skippedEntities();

    @JsonProperty(FIELD_ENTITY_GRANTS)
    public abstract ImmutableMap<ModelId, List<GrantDTO>> entityGrants();

    public static Builder builder() {
        return Builder.create();
    }

    public abstract Builder toBuilder();

    @AutoValue.Builder
    public static abstract class Builder {
        @JsonCreator
        public static Builder create() {
            return new AutoValue_ContentPackUninstallation.Builder().entityGrants(ImmutableMap.of());
        }

        @JsonProperty(FIELD_ENTITIES)
        public abstract Builder entities(ImmutableSet<NativeEntityDescriptor> entities);

        @JsonProperty(FIELD_ENTITY_OBJECTS)
        public abstract Builder entityObjects(ImmutableMap<ModelId, Object> entityObjects);

        @JsonProperty(FIELD_FAILED_ENTITIES)
        public abstract Builder failedEntities(ImmutableSet<NativeEntityDescriptor> failedEntities);

        @JsonProperty(FIELD_SKIPPED_ENTITIES)
        public abstract Builder skippedEntities(ImmutableSet<NativeEntityDescriptor> skippedEntities);

        @JsonProperty(FIELD_ENTITY_GRANTS)
        public abstract Builder entityGrants(ImmutableMap<ModelId, List<GrantDTO>> entityGrants);

        public abstract ContentPackUninstallation build();
    }
}
