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
package org.graylog.security.entities;

import com.google.common.collect.ImmutableSet;
import com.google.common.graph.GraphBuilder;
import org.graylog.grn.GRN;
import org.graylog.grn.GRNDescriptor;
import org.graylog.grn.GRNDescriptorService;
import org.graylog.grn.GRNRegistry;
import org.graylog.grn.GRNType;
import org.graylog.grn.GRNTypes;
import org.graylog.security.DBGrantService;
import org.graylog.testing.GRNExtension;
import org.graylog.testing.mongodb.MongoDBExtension;
import org.graylog.testing.mongodb.MongoDBFixtures;
import org.graylog.testing.mongodb.MongoDBTestService;
import org.graylog.testing.mongodb.MongoJackExtension;
import org.graylog2.bindings.providers.MongoJackObjectMapperProvider;
import org.graylog2.contentpacks.ContentPackService;
import org.graylog2.contentpacks.model.ModelId;
import org.graylog2.contentpacks.model.ModelTypes;
import org.graylog2.contentpacks.model.entities.EntityDescriptor;
import org.graylog2.contentpacks.model.entities.EntityExcerpt;
import org.graylog2.database.MongoCollections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SuppressWarnings("UnstableApiUsage")
@ExtendWith(MongoDBExtension.class)
@ExtendWith(MongoJackExtension.class)
@ExtendWith(GRNExtension.class)
@ExtendWith(MockitoExtension.class)
@MongoDBFixtures("DefaultEntityDependencyResolverTest.json")
class DefaultEntityDependencyResolverTest {

    private EntityDependencyResolver entityDependencyResolver;
    private GRNRegistry grnRegistry;
    private ContentPackService contentPackService;
    private GRNDescriptorService grnDescriptorService;

    @BeforeEach
    void setUp(@Mock ContentPackService contentPackService,
               GRNRegistry grnRegistry,
               @Mock GRNDescriptorService grnDescriptorService,
               MongoDBTestService mongodb,
               MongoJackObjectMapperProvider objectMapperProvider) {

        this.grnRegistry = grnRegistry;
        DBGrantService dbGrantService = new DBGrantService(new MongoCollections(objectMapperProvider, mongodb.mongoConnection()));
        this.contentPackService = contentPackService;
        this.grnDescriptorService = grnDescriptorService;
        entityDependencyResolver = new DefaultEntityDependencyResolver(contentPackService, grnRegistry, grnDescriptorService, dbGrantService);
    }

    @Test
    @DisplayName("Try a regular depency resolve")
    void resolve() {
        final String TEST_TITLE = "Test Stream Title";
        final EntityExcerpt streamExcerpt = EntityExcerpt.builder()
                .type(ModelTypes.STREAM_V1)
                .id(ModelId.of("54e3deadbeefdeadbeefaffe"))
                .title(TEST_TITLE).build();
        when(contentPackService.listAllEntityExcerpts()).thenReturn(ImmutableSet.of(streamExcerpt));

        final EntityDescriptor streamDescriptor = EntityDescriptor.builder().type(ModelTypes.STREAM_V1).id(ModelId.of("54e3deadbeefdeadbeefaffe")).build();
        final var dependencyGraph = GraphBuilder.directed().<EntityDescriptor>build();
        dependencyGraph.addNode(streamDescriptor);
        when(contentPackService.resolveEntityDependencyGraph(any())).thenReturn(dependencyGraph);

        when(grnDescriptorService.getDescriptor(any(GRN.class))).thenAnswer(a -> {
            GRN grnArg = a.getArgument(0);
            return GRNDescriptor.builder().grn(grnArg).title("dummy").build();
        });
        final GRN dashboard = grnRegistry.newGRN("dashboard", "33e3deadbeefdeadbeefaffe");

        final ImmutableSet<org.graylog.security.entities.EntityDescriptor> missingDependencies = entityDependencyResolver.resolve(dashboard);
        assertThat(missingDependencies).hasSize(1);
        assertThat(missingDependencies.asList().get(0)).satisfies(descriptor -> {
            assertThat(descriptor.id().toString()).isEqualTo("grn::::stream:54e3deadbeefdeadbeefaffe");
            assertThat(descriptor.title()).isEqualTo(TEST_TITLE);

            assertThat(descriptor.owners()).hasSize(1);
            assertThat(descriptor.owners().asList().get(0).grn().toString()).isEqualTo("grn::::user:jane");
        });
    }

    @Test
    @DisplayName("Try resolve with a broken dependency")
    void resolveWithInclompleteDependency() {

        when(contentPackService.listAllEntityExcerpts()).thenReturn(ImmutableSet.of());
        final EntityDescriptor streamDescriptor = EntityDescriptor.builder().type(ModelTypes.STREAM_V1).id(ModelId.of("54e3deadbeefdeadbeefaffe")).build();
        final var dependencyGraph = GraphBuilder.directed().<EntityDescriptor>build();
        dependencyGraph.addNode(streamDescriptor);
        when(contentPackService.resolveEntityDependencyGraph(any())).thenReturn(dependencyGraph);

        when(grnDescriptorService.getDescriptor(any(GRN.class))).thenAnswer(a -> {
            GRN grnArg = a.getArgument(0);
            return GRNDescriptor.builder().grn(grnArg).title("dummy").build();
        });
        final GRN dashboard = grnRegistry.newGRN("dashboard", "33e3deadbeefdeadbeefaffe");

        final ImmutableSet<org.graylog.security.entities.EntityDescriptor> missingDependencies = entityDependencyResolver.resolve(dashboard);
        assertThat(missingDependencies).hasSize(1);
        assertThat(missingDependencies.asList().get(0)).satisfies(descriptor -> {
            assertThat(descriptor.id().toString()).isEqualTo("grn::::stream:54e3deadbeefdeadbeefaffe");
            assertThat(descriptor.title()).isEqualTo("unknown dependency: <grn::::stream:54e3deadbeefdeadbeefaffe>");
        });
    }

    @Test
    @DisplayName("Try a stream reference dependency resolve")
    void resolveStreamReference() {
        final String TEST_TITLE = "Test Stream Title";
        final EntityExcerpt streamExcerpt = EntityExcerpt.builder()
                .type(ModelTypes.STREAM_V1)
                .id(ModelId.of("54e3deadbeefdeadbeefaffe"))
                .title(TEST_TITLE).build();
        final EntityExcerpt streamRefExcerpt = EntityExcerpt.builder()
                .type(ModelTypes.STREAM_REF_V1)
                .id(ModelId.of("54e3deadbeefdeadbeefaffe"))
                .title(TEST_TITLE).build();
        when(contentPackService.listAllEntityExcerpts()).thenReturn(ImmutableSet.of(streamExcerpt, streamRefExcerpt));

        final EntityDescriptor streamDescriptor = EntityDescriptor.builder().type(ModelTypes.STREAM_REF_V1).id(ModelId.of("54e3deadbeefdeadbeefaffe")).build();
        final var dependencyGraph = GraphBuilder.directed().<EntityDescriptor>build();
        dependencyGraph.addNode(streamDescriptor);
        when(contentPackService.resolveEntityDependencyGraph(any())).thenReturn(dependencyGraph);

        when(grnDescriptorService.getDescriptor(any(GRN.class))).thenAnswer(a -> {
            GRN grnArg = a.getArgument(0);
            return GRNDescriptor.builder().grn(grnArg).title("dummy").build();
        });
        final GRN dashboard = grnRegistry.newGRN("dashboard", "33e3deadbeefdeadbeefaffe");

        final ImmutableSet<org.graylog.security.entities.EntityDescriptor> missingDependencies = entityDependencyResolver.resolve(dashboard);
        assertThat(missingDependencies).hasSize(1);
        assertThat(missingDependencies.asList().get(0)).satisfies(descriptor -> {
            assertThat(descriptor.id().toString()).isEqualTo("grn::::stream:54e3deadbeefdeadbeefaffe");
            assertThat(descriptor.title()).isEqualTo(TEST_TITLE);

            assertThat(descriptor.owners()).hasSize(1);
            assertThat(descriptor.owners().asList().get(0).grn().toString()).isEqualTo("grn::::user:jane");
        });
    }

    @Test
    @DisplayName("Try resolve with an event procedure dependency")
    void resolveEventProcedureDependency() {
        final EntityDescriptor definitionDescriptor = EntityDescriptor.builder().type(ModelTypes.EVENT_DEFINITION_V1).id(ModelId.of("54e3deadbeefdeadbeefafff")).build();
        final EntityDescriptor procedureDescriptor = EntityDescriptor.builder().type(ModelTypes.EVENT_PROCEDURE_V1).id(ModelId.of("54e3deadbeefdeadbeefaffe")).build();
        final var dependencyGraph = GraphBuilder.directed().<EntityDescriptor>build();
        dependencyGraph.addNode(definitionDescriptor);
        dependencyGraph.putEdge(definitionDescriptor, procedureDescriptor);
        when(contentPackService.resolveEntityDependencyGraph(any())).thenReturn(dependencyGraph);

        final GRN definitionGrn = grnRegistry.newGRN("event_definition", "54e3deadbeefdeadbeefafff");
        grnRegistry.registerType(GRNType.create("event_procedure"));
        final ImmutableSet<org.graylog.security.entities.EntityDescriptor> missingDependencies = entityDependencyResolver.resolve(definitionGrn);
        assertThat(missingDependencies).hasSize(1);
    }

    @Test
    @DisplayName("Try to resolve with an output dependency")
    void resolveWithOutputDependency() {
        final var output1 = EntityDescriptor.builder().type(ModelTypes.OUTPUT_V1).id(ModelId.of("output-1-id")).build();
        final var output2 = EntityDescriptor.builder().type(ModelTypes.OUTPUT_V1).id(ModelId.of("output-2-id")).build();
        final var stream = EntityDescriptor.builder().type(ModelTypes.STREAM_V1).id(ModelId.of("stream-id")).build();
        // just for testing purposes, let's assume we'd allow event definitions to depend directly on outputs
        final var dashboard = EntityDescriptor.builder().type(ModelTypes.EVENT_DEFINITION_V1).id(ModelId.of("event-definition-id")).build();

        // we'll resolve this dependency graph for whatever entity we pass in
        final var dependencyGraph = GraphBuilder.directed().<EntityDescriptor>build();
        dependencyGraph.addNode(stream);
        dependencyGraph.addNode(dashboard);
        dependencyGraph.putEdge(stream, output1);
        dependencyGraph.putEdge(dashboard, output2);
        when(contentPackService.resolveEntityDependencyGraph(any())).thenReturn(dependencyGraph);

        // output1 should be ignored because it is only a dependency of the stream
        final var dependencies = entityDependencyResolver.resolve(grnRegistry.newGRN(GRNTypes.DASHBOARD, "dashboard-id"));
        assertThat(dependencies)
                .extracting(org.graylog.security.entities.EntityDescriptor::id)
                .containsExactlyInAnyOrder(grnRegistry.newGRN(GRNTypes.EVENT_DEFINITION, "event-definition-id"),
                        grnRegistry.newGRN(GRNTypes.STREAM, "stream-id"),
                        grnRegistry.newGRN(GRNTypes.OUTPUT, "output-2-id")
                );
    }
}
