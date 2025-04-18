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
package org.graylog.plugins.views.search.engine;

import com.google.common.util.concurrent.ThreadFactoryBuilder;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.graylog.plugins.views.search.ExplainResults;
import org.graylog.plugins.views.search.Query;
import org.graylog.plugins.views.search.QueryMetadata;
import org.graylog.plugins.views.search.QueryMetadataDecorator;
import org.graylog.plugins.views.search.QueryResult;
import org.graylog.plugins.views.search.Search;
import org.graylog.plugins.views.search.SearchJob;
import org.graylog.plugins.views.search.elasticsearch.ElasticsearchQueryString;
import org.graylog.plugins.views.search.errors.QueryError;
import org.graylog.plugins.views.search.errors.SearchError;
import org.graylog.plugins.views.search.errors.SearchException;
import org.graylog2.Configuration;
import org.graylog2.storage.providers.ElasticsearchBackendProvider;
import org.joda.time.DateTimeZone;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static org.graylog.plugins.views.search.engine.validation.DataLakeSearchValidator.containsDataLakeSearchElements;

@Singleton
public class QueryEngine {
    private static final Logger LOG = LoggerFactory.getLogger(QueryEngine.class);
    private final Set<QueryMetadataDecorator> queryMetadataDecorators;
    private final QueryParser queryParser;

    // TODO proper thread pool with tunable settings
    private final Executor indexerJobsQueryPool;
    private final Executor dataLakeJobsQueryPool;
    private final ElasticsearchBackendProvider elasticsearchBackendProvider;
    private final Map<String, QueryBackend<? extends GeneratedQueryContext>> unversionedBackends;

    @Inject
    public QueryEngine(Configuration configuration,
                       ElasticsearchBackendProvider elasticsearchBackendProvider,
                       Map<String, QueryBackend<? extends GeneratedQueryContext>> unversionedBackends,
                       Set<QueryMetadataDecorator> queryMetadataDecorators,
                       QueryParser queryParser) {
        this.elasticsearchBackendProvider = elasticsearchBackendProvider;
        this.unversionedBackends = unversionedBackends;
        this.queryMetadataDecorators = queryMetadataDecorators;
        this.queryParser = queryParser;

        this.indexerJobsQueryPool = createThreadPool(
                configuration.searchQueryEngineIndexerJobsPoolSize(),
                configuration.searchQueryEngineIndexerJobsQueueSize(),
                "query-engine-indexer-jobs-%d");
        this.dataLakeJobsQueryPool = createThreadPool(
                configuration.searchQueryEngineDataLakeJobsPoolSize(),
                configuration.searchQueryEngineDataLakeJobsQueueSize(),
                "query-engine-data-lake-jobs-%d");
    }

    private Executor createThreadPool(final int poolSize,
                                      final int queueSize,
                                      final String nameFormat) {
        return new ThreadPoolExecutor(poolSize, poolSize,
                0L, TimeUnit.MILLISECONDS,
                queueSize > 0 ? new ArrayBlockingQueue<>(queueSize) : new LinkedBlockingQueue<>(),
                new ThreadFactoryBuilder()
                        .setNameFormat(nameFormat)
                        .build()
        );
    }

    public QueryMetadata parse(Search search, Query query) {
        final QueryMetadata parsedMetadata = queryParser.parse(query);

        return this.queryMetadataDecorators.stream()
                .reduce((decorator1, decorator2) -> (s, q, metadata) -> decorator1.decorate(s, q, decorator2.decorate(s, q, metadata)))
                .map(decorator -> decorator.decorate(search, query, parsedMetadata))
                .orElse(parsedMetadata);
    }

    public ExplainResults explain(SearchJob searchJob, Set<SearchError> validationErrors, DateTimeZone timezone) {
        final Map<String, ExplainResults.QueryExplainResult> queries = searchJob.getSearch().queries().stream()
                .collect(Collectors.toMap(Query::id, q -> {
                    var backend = getBackendForQuery(q);
                    final GeneratedQueryContext generatedQueryContext = backend.generate(q, Set.of(), timezone);

                    return backend.explain(searchJob, q, generatedQueryContext);
                }));

        return new ExplainResults(searchJob.getSearchId(), new ExplainResults.SearchResult(queries), validationErrors);
    }

    @WithSpan
    public SearchJob execute(SearchJob searchJob, Set<SearchError> validationErrors, DateTimeZone timezone) {
        final Set<Query> validQueries = searchJob.getSearch().queries()
                .stream()
                .filter(query -> !isQueryWithError(validationErrors, query))
                .collect(Collectors.toSet());


        validQueries.forEach(query -> searchJob.addQueryResultFuture(query.id(),
                // generate and run each query, making sure we never let an exception escape
                // if need be we default to an empty result with a failed state and the wrapped exception
                CompletableFuture.supplyAsync(() -> prepareAndRun(searchJob, query, validationErrors, timezone),
                                containsDataLakeSearchElements(query) ? dataLakeJobsQueryPool : indexerJobsQueryPool)
                        .handle((queryResult, throwable) -> {
                            if (throwable != null) {
                                final Throwable cause = throwable.getCause();
                                final SearchError error;
                                if (cause instanceof SearchException) {
                                    error = ((SearchException) cause).error();
                                } else {
                                    error = new QueryError(query, cause);
                                }
                                LOG.debug("Running query {} failed: {}", query.id(), cause);
                                searchJob.addError(error);
                                return QueryResult.failedQueryWithError(query, error);
                            }
                            return queryResult;
                        })
        ));

        LOG.debug("Search job {} executing", searchJob.getId());
        return searchJob.seal();
    }

    private QueryResult prepareAndRun(SearchJob searchJob, Query query, Set<SearchError> validationErrors, DateTimeZone timezone) {
        final var backend = getBackendForQuery(query);
        LOG.debug("[{}] Using {} to generate query", query.id(), backend);
        // with all the results done, we can execute the current query and eventually complete our own result
        // if any of this throws an exception, the handle in #execute will convert it to an error and return a "failed" result instead
        // if the backend already returns a "failed result" then nothing special happens here
        final GeneratedQueryContext generatedQueryContext = backend.generate(query, validationErrors, timezone);
        LOG.trace("[{}] Generated query {}, running it on backend {}", query.id(), generatedQueryContext, backend);
        final QueryResult result = backend.run(searchJob, query, generatedQueryContext);
        LOG.debug("[{}] Query returned {}", query.id(), result);
        if (!generatedQueryContext.errors().isEmpty()) {
            generatedQueryContext.errors().forEach(searchJob::addError);
        }
        return result;
    }

    private boolean isQueryWithError(Collection<SearchError> validationErrors, Query query) {
        return validationErrors.stream()
                .filter(q -> q instanceof QueryError)
                .map(q -> (QueryError) q)
                .map(QueryError::queryId)
                .anyMatch(id -> Objects.equals(id, query.id()));
    }

    private QueryBackend<? extends GeneratedQueryContext> getBackendForQuery(Query query) {
        var backendQuery = query.query();
        if (backendQuery.type().equals(ElasticsearchQueryString.NAME)) {
            return elasticsearchBackendProvider.get();
        }
        if (unversionedBackends.containsKey(backendQuery.type())) {
            return unversionedBackends.get(backendQuery.type());
        }
        throw new IllegalArgumentException("Unknown backend type: " + backendQuery.type());
    }
}
