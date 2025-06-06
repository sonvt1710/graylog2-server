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
package org.graylog.plugins.pipelineprocessor.rest;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSortedSet;
import jakarta.ws.rs.BadRequestException;
import org.apache.shiro.subject.Subject;
import org.graylog.plugins.pipelineprocessor.ast.Pipeline;
import org.graylog.plugins.pipelineprocessor.ast.Stage;
import org.graylog.plugins.pipelineprocessor.db.PaginatedPipelineService;
import org.graylog.plugins.pipelineprocessor.db.PipelineService;
import org.graylog.plugins.pipelineprocessor.db.PipelineStreamConnectionsService;
import org.graylog.plugins.pipelineprocessor.db.RuleDao;
import org.graylog.plugins.pipelineprocessor.db.RuleService;
import org.graylog.plugins.pipelineprocessor.parser.ParseException;
import org.graylog.plugins.pipelineprocessor.parser.PipelineRuleParser;
import org.graylog2.inputs.InputRoutingService;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnit;
import org.mockito.junit.MockitoRule;
import org.mockito.quality.Strictness;

import java.util.Collections;
import java.util.List;
import java.util.SortedSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.graylog.plugins.pipelineprocessor.ast.Stage.Match.ALL;
import static org.graylog.plugins.pipelineprocessor.ast.Stage.Match.EITHER;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class PipelineResourceTest {
    private static final String GRAYLOG_DELETABLE_SCOPE = "GRAYLOG_DELETABLE_SCOPE";
    @Rule
    public final MockitoRule mockitoRule = MockitoJUnit.rule().strictness(Strictness.STRICT_STUBS);

    @Mock
    private PipelineService pipelineService;

    @Mock
    private PaginatedPipelineService paginatedPipelineService;

    @Mock
    private PipelineRuleParser pipelineRuleParser;

    @Mock
    private PipelineStreamConnectionsService connectionsService;

    @Mock
    private InputRoutingService inputRoutingService;

    @Mock
    private RuleService ruleService;

    private PipelineResource pipelineResource;

    @Before
    public void setup() {
        pipelineResource = new PipelineTestResource(
                pipelineService, paginatedPipelineService, pipelineRuleParser, connectionsService, inputRoutingService, ruleService);
    }

    @Test
    public void shouldParseAPipelineSuccessfully() {
        final PipelineSource pipelineSource = PipelineSource.builder()
                .source("pipeline \"Graylog Git Pipline\"\nstage 0 match either\n" +
                        "rule \"geo loc of dev\"\nrule \"open source dev\"\nend")
                .stages(Collections.emptyList())
                .title("Graylog Git Pipeline")
                .build();
        final SortedSet stages = ImmutableSortedSet.of(
                Stage.builder()
                        .stage(0)
                        .ruleReferences(ImmutableList.of("geo loc of dev", "open source dev"))
                        .match(Stage.Match.EITHER)
                        .build()
        );
        final List<StageSource> expectedStages = ImmutableList.of(
                StageSource.create(0, Stage.Match.EITHER, ImmutableList.of(
                        "geo loc of dev", "open source dev"
                ))
        );
        final Pipeline pipeline = Pipeline.builder()
                .name("Graylog Git Pipeline")
                .stages(stages)
                .build();

        when(pipelineRuleParser.parsePipeline(pipelineSource.id(), pipelineSource.source()))
                .thenReturn(pipeline);

        final PipelineSource result = this.pipelineResource.parse(pipelineSource);
        verify(pipelineRuleParser).parsePipeline(pipelineSource.id(), pipelineSource.source());
        assertThat(result.source()).isEqualTo(pipelineSource.source());
        assertThat(result.stages()).isEqualTo(expectedStages);
    }

    @Test
    public void shouldNotParseAPipelineSuccessfullyIfRaisingAnError() {
        final PipelineSource pipelineSource = PipelineSource.builder()
                .source("foo")
                .stages(Collections.emptyList())
                .title("Graylog Git Pipeline")
                .build();

        when(pipelineRuleParser.parsePipeline(pipelineSource.id(), pipelineSource.source()))
                .thenThrow(new ParseException(Collections.emptySet()));

        assertThatExceptionOfType(BadRequestException.class)
                .isThrownBy(() -> this.pipelineResource.parse(pipelineSource));
    }

    @Test
    public void buildPipelineStringNoStage() {
        PipelineSource pipelineSource = PipelineSource.create(
                "id0", "DEFAULT", "title0", "description0", "",
                Collections.emptyList(),
                null, null);
        String pipelineString = PipelineUtils.createPipelineString(pipelineSource);
        assertThat(pipelineString).isEqualTo("pipeline \"title0\"\nend");
    }

    @Test
    public void buildPipelineStringSingleStage() {
        PipelineSource pipelineSource = PipelineSource.create(
                "id1", "DEFAULT", "title1", "description1", "",
                java.util.List.of(
                        StageSource.builder()
                                .stage(0).rules(java.util.List.of("rule1", "rule2")).match(EITHER).build()),
                null, null);
        String pipelineString = PipelineUtils.createPipelineString(pipelineSource);
        assertThat(pipelineString).isEqualTo("pipeline \"title1\"\nstage 0 match EITHER\nrule \"rule1\"\nrule \"rule2\"\nend");
    }

    @Test
    public void buildPipelineStringMultipleStages() {
        PipelineSource pipelineSource = PipelineSource.create(
                "id2", "DEFAULT", "title2", "description2", "",
                java.util.List.of(
                        StageSource.builder()
                                .stage(0).rules(java.util.List.of("rule1", "rule2")).match(EITHER).build(),
                        StageSource.builder()
                                .stage(1).rules(java.util.List.of("rule3", "rule4")).match(ALL).build()),
                null, null);
        String pipelineString = PipelineUtils.createPipelineString(pipelineSource);
        assertThat(pipelineString).isEqualTo(
                "pipeline \"title2\"\nstage 0 match EITHER\nrule \"rule1\"\nrule \"rule2\"\nstage 1 match ALL\nrule \"rule3\"\nrule \"rule4\"\nend");
    }

    @Test
    public void customPipelinesCannotUseSystemRules() {
        String ruleName = "my rules";
        RuleDao rule = mockRule(ruleName);
        when(ruleService.loadAllByScope(GRAYLOG_DELETABLE_SCOPE)).thenReturn(List.of(rule));
        PipelineSource pipelineSource = PipelineSource.create("id1", "DEFAULT", "title1", "description1",
                createPipelineSource(ruleName), List.of(), null, null);

        assertThatExceptionOfType(BadRequestException.class)
                .isThrownBy(() -> pipelineResource.createFromParser(pipelineSource))
                .withMessageContaining(ruleName);

        assertThatExceptionOfType(BadRequestException.class)
                .isThrownBy(() -> pipelineResource.update("id1", pipelineSource))
                .withMessageContaining(ruleName);
    }

    private String createPipelineSource(String ruleName) {
        return """
                pipeline "MyPipe"
                stage 0 match either
                rule "%s"
                end
                """.formatted(ruleName);
    }

    private RuleDao mockRule(String ruleName) {
        RuleDao rule = mock(RuleDao.class);
        when(rule.title()).thenReturn(ruleName);
        return rule;
    }

    private static class PipelineTestResource extends PipelineResource {
        PipelineTestResource(PipelineService pipelineService,
                             PaginatedPipelineService paginatedPipelineService,
                             PipelineRuleParser pipelineRuleParser,
                             PipelineStreamConnectionsService connectionsService,
                             InputRoutingService inputRoutingService,
                             RuleService ruleService) {
            super(pipelineService, paginatedPipelineService, pipelineRuleParser, connectionsService, inputRoutingService, ruleService);
        }

        @Override
        protected Subject getSubject() {
            final Subject mockSubject = mock(Subject.class);
            when(mockSubject.isPermitted(anyString())).thenReturn(true);
            lenient().when(mockSubject.getPrincipal()).thenReturn("test-user");
            return mockSubject;
        }
    }

}
