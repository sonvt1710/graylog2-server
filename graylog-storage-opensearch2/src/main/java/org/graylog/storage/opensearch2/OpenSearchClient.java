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
package org.graylog.storage.opensearch2;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.joschi.jadconfig.util.Duration;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.collect.Streams;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import org.graylog.shaded.opensearch2.org.apache.http.ContentTooLongException;
import org.graylog.shaded.opensearch2.org.apache.http.client.config.RequestConfig;
import org.graylog.shaded.opensearch2.org.opensearch.OpenSearchException;
import org.graylog.shaded.opensearch2.org.opensearch.OpenSearchStatusException;
import org.graylog.shaded.opensearch2.org.opensearch.action.search.MultiSearchRequest;
import org.graylog.shaded.opensearch2.org.opensearch.action.search.MultiSearchResponse;
import org.graylog.shaded.opensearch2.org.opensearch.action.search.SearchRequest;
import org.graylog.shaded.opensearch2.org.opensearch.action.search.SearchResponse;
import org.graylog.shaded.opensearch2.org.opensearch.action.support.PlainActionFuture;
import org.graylog.shaded.opensearch2.org.opensearch.client.Request;
import org.graylog.shaded.opensearch2.org.opensearch.client.RequestOptions;
import org.graylog.shaded.opensearch2.org.opensearch.client.Response;
import org.graylog.shaded.opensearch2.org.opensearch.client.ResponseException;
import org.graylog.shaded.opensearch2.org.opensearch.client.RestHighLevelClient;
import org.graylog.storage.errors.ResponseError;
import org.graylog2.indexer.BatchSizeTooLargeException;
import org.graylog2.indexer.IndexNotFoundException;
import org.graylog2.indexer.InvalidWriteTargetException;
import org.graylog2.indexer.MapperParsingException;
import org.graylog2.indexer.MasterNotDiscoveredException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nullable;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.google.common.base.Preconditions.checkArgument;

public class OpenSearchClient {
    private static final Pattern invalidWriteTarget = Pattern.compile("no write index is defined for alias \\[(?<target>[\\w_]+)\\]");

    private static final Logger LOG = LoggerFactory.getLogger(OpenSearchClient.class);

    private final RestHighLevelClient client;
    private final boolean compressionEnabled;
    private final Optional<Integer> indexerMaxConcurrentSearches;
    private final Optional<Integer> indexerMaxConcurrentShardRequests;
    private final ObjectMapper objectMapper;

    @Inject
    public OpenSearchClient(RestHighLevelClient client,
                            @Named("elasticsearch_compression_enabled") boolean compressionEnabled,
                            @Named("indexer_max_concurrent_searches") @Nullable Integer indexerMaxConcurrentSearches,
                            @Named("indexer_max_concurrent_shard_requests") @Nullable Integer indexerMaxConcurrentShardRequests,
                            ObjectMapper objectMapper) {
        this.client = client;
        this.compressionEnabled = compressionEnabled;
        this.indexerMaxConcurrentSearches = Optional.ofNullable(indexerMaxConcurrentSearches);
        this.indexerMaxConcurrentShardRequests = Optional.ofNullable(indexerMaxConcurrentShardRequests);
        this.objectMapper = objectMapper;
    }

    @VisibleForTesting
    public OpenSearchClient(RestHighLevelClient client, ObjectMapper objectMapper) {
        this(client, false, null, null, objectMapper);
    }

    public SearchResponse search(SearchRequest searchRequest, String errorMessage) {
        final MultiSearchRequest multiSearchRequest = new MultiSearchRequest()
                .add(searchRequest);

        final MultiSearchResponse result = this.execute((c, requestOptions) -> c.msearch(multiSearchRequest, requestOptions), errorMessage);

        return firstResponseFrom(result, errorMessage);
    }

    public SearchResponse singleSearch(SearchRequest searchRequest, String errorMessage) {
        return execute((c, requestOptions) -> c.search(searchRequest, requestOptions), errorMessage);
    }

    public List<MultiSearchResponse.Item> msearch(List<SearchRequest> searchRequests, String errorMessage) {
        var multiSearchRequest = new MultiSearchRequest();

        indexerMaxConcurrentSearches.ifPresent(multiSearchRequest::maxConcurrentSearchRequests);
        indexerMaxConcurrentShardRequests.ifPresent(maxShardRequests -> searchRequests
                .forEach(request -> request.setMaxConcurrentShardRequests(maxShardRequests)));

        searchRequests.forEach(multiSearchRequest::add);

        final MultiSearchResponse result = this.execute((c, requestOptions) -> c.msearch(multiSearchRequest, requestOptions), errorMessage);

        return Streams.stream(result)
                .collect(Collectors.toList());
    }

    private SearchResponse firstResponseFrom(MultiSearchResponse result, String errorMessage) {
        checkArgument(result != null);
        checkArgument(result.getResponses().length == 1);

        final MultiSearchResponse.Item firstResponse = result.getResponses()[0];
        if (firstResponse.getResponse() == null) {
            throw exceptionFrom(firstResponse.getFailure(), errorMessage);
        }

        return firstResponse.getResponse();
    }

    public PlainActionFuture<MultiSearchResponse> cancellableMsearch(final List<SearchRequest> searchRequests) {
        var multiSearchRequest = new MultiSearchRequest();

        indexerMaxConcurrentSearches.ifPresent(multiSearchRequest::maxConcurrentSearchRequests);
        indexerMaxConcurrentShardRequests.ifPresent(maxShardRequests -> searchRequests
                .forEach(request -> request.setMaxConcurrentShardRequests(maxShardRequests)));

        searchRequests.forEach(multiSearchRequest::add);

        final PlainActionFuture<MultiSearchResponse> future = new PlainActionFuture<>();
        client.msearchAsync(multiSearchRequest, requestOptions(), future);

        return future;
    }

    public <R> R execute(ThrowingBiFunction<RestHighLevelClient, RequestOptions, R, IOException> fn) {
        return execute(fn, "An error occurred: ");
    }

    @WithSpan
    public <R> R execute(ThrowingBiFunction<RestHighLevelClient, RequestOptions, R, IOException> fn, String errorMessage) {
        try {
            return fn.apply(client, requestOptions());
        } catch (Exception e) {
            throw exceptionFrom(e, errorMessage);
        }
    }

    @WithSpan
    public <R> R executeWithIOException(ThrowingBiFunction<RestHighLevelClient, RequestOptions, R, IOException> fn, String errorMessage) throws IOException {
        try {
            return fn.apply(client, requestOptions());
        } catch (IOException e) {
            if (e.getCause() instanceof ContentTooLongException) {
                throw new BatchSizeTooLargeException(e.getMessage());
            }
            throw e;
        } catch (Exception e) {
            throw exceptionFrom(e, errorMessage);
        }
    }

    public JsonNode executeRequest(final Request request, final String errorMessage) {
        return execute((c, requestOptions) -> {
            final Response response = c.getLowLevelClient().performRequest(request);
            return objectMapper.readTree(response.getEntity().getContent());
        }, errorMessage);
    }

    private RequestOptions requestOptions() {
        return compressionEnabled
                ? RequestOptions.DEFAULT.toBuilder()
                .addHeader("Accept-Encoding", "gzip")
                .addHeader("Content-type", "application/json")
                .build()
                : RequestOptions.DEFAULT;
    }

    public static RuntimeException exceptionFrom(Exception e, String errorMessage) {
        if (e instanceof OpenSearchException openSearchException) {
            if (isIndexNotFoundException(openSearchException)) {
                return IndexNotFoundException.create(errorMessage + openSearchException.getResourceId(), openSearchException.getIndex().getName());
            }
            if (isMasterNotDiscoveredException(openSearchException)) {
                return new MasterNotDiscoveredException();
            }
            if (isInvalidWriteTargetException(openSearchException)) {
                final Matcher matcher = invalidWriteTarget.matcher(openSearchException.getMessage());
                if (matcher.find()) {
                    final String target = matcher.group("target");
                    return InvalidWriteTargetException.create(target);
                }
            }
            if (isBatchSizeTooLargeException(openSearchException)) {
                return new BatchSizeTooLargeException(openSearchException.getMessage());
            }
            if (isMapperParsingExceptionException(openSearchException)) {
                return new MapperParsingException(openSearchException.getMessage());
            }
        } else if (e instanceof IOException && e.getCause() instanceof ContentTooLongException) {
            return new BatchSizeTooLargeException(e.getMessage());
        }
        return new OpenSearchException(errorMessage, e);
    }

    private static boolean isInvalidWriteTargetException(OpenSearchException openSearchException) {
        try {
            final ParsedOpenSearchException parsedException = ParsedOpenSearchException.from(openSearchException.getMessage());
            return parsedException.reason().startsWith("no write index is defined for alias");
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean isMasterNotDiscoveredException(OpenSearchException openSearchException) {
        try {
            final ParsedOpenSearchException parsedException = ParsedOpenSearchException.from(openSearchException.getMessage());
            return parsedException.type().equals("master_not_discovered_exception")
                    || (parsedException.type().equals("cluster_block_exception") && parsedException.reason().contains("no master"));
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean isIndexNotFoundException(OpenSearchException openSearchException) {
        return openSearchException.getMessage().contains("index_not_found_exception");
    }

    private static boolean isMapperParsingExceptionException(OpenSearchException openSearchException) {
        return openSearchException.getMessage().contains("mapper_parsing_exception");
    }

    private static boolean isBatchSizeTooLargeException(OpenSearchException openSearchException) {
        if (openSearchException instanceof OpenSearchStatusException statusException) {
            if (statusException.getCause() instanceof ResponseException responseException) {
                return (responseException.getResponse().getStatusLine().getStatusCode() == 429);
            }
        }

        try {
            final ParsedOpenSearchException parsedException = ParsedOpenSearchException.from(openSearchException.getMessage());
            if (parsedException.type().equals("search_phase_execution_exception")) {
                ParsedOpenSearchException parsedCause = ParsedOpenSearchException.from(openSearchException.getRootCause().getMessage());
                return parsedCause.reason().contains("Batch size is too large");
            }
        } catch (Exception e) {
            return false;
        }
        return false;
    }

    public static RequestOptions withTimeout(RequestOptions requestOptions, Duration timeout) {
        final RequestConfig.Builder requestConfigBuilder = (requestOptions == null || requestOptions.getRequestConfig() == null)
                ? RequestConfig.custom()
                : RequestConfig.copy(requestOptions.getRequestConfig());
        final RequestConfig requestConfigWithTimeout = requestConfigBuilder
                .setSocketTimeout(Math.toIntExact(timeout.toMilliseconds()))
                .build();
        final RequestOptions.Builder requestOptionsBuilder = requestOptions == null
                ? RequestOptions.DEFAULT.toBuilder()
                : requestOptions.toBuilder();
        return requestOptionsBuilder
                .setRequestConfig(requestConfigWithTimeout)
                .build();

    }

    public Optional<ResponseError> parseResponseException(OpenSearchException ex) {
        if (ex.getCause() != null) {
            final Throwable[] suppressed = ex.getCause().getSuppressed();
            if (suppressed.length > 0) {
                final Throwable realCause = suppressed[0];
                if (realCause instanceof ResponseException) {
                    try {
                        final ResponseError err = objectMapper.readValue(((ResponseException) realCause).getResponse().getEntity().getContent(), ResponseError.class);
                        return Optional.of(err);
                    } catch (IOException ioe) {
                        LOG.warn("Failed to parse exception", ioe);
                    }
                }
            }
        }
        return Optional.empty();
    }
}
