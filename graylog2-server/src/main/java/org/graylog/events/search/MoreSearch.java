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
package org.graylog.events.search;

import com.google.auto.value.AutoValue;
import jakarta.inject.Inject;
import org.graylog.events.processor.EventProcessorException;
import org.graylog.plugins.views.search.IndexRangeContainsOneOfStreams;
import org.graylog.plugins.views.search.Parameter;
import org.graylog.plugins.views.search.ParameterProvider;
import org.graylog.plugins.views.search.elasticsearch.QueryStringDecorators;
import org.graylog.plugins.views.search.errors.EmptyParameterError;
import org.graylog.plugins.views.search.errors.SearchException;
import org.graylog.plugins.views.search.searchfilters.model.UsedSearchFilter;
import org.graylog2.indexer.ranges.IndexRange;
import org.graylog2.indexer.ranges.IndexRangeService;
import org.graylog2.indexer.results.ResultMessage;
import org.graylog2.indexer.searches.Sorting;
import org.graylog2.plugin.indexer.searches.timeranges.AbsoluteRange;
import org.graylog2.plugin.indexer.searches.timeranges.TimeRange;
import org.graylog2.plugin.streams.Stream;
import org.graylog2.streams.StreamService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Set;
import java.util.SortedSet;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

import static com.google.common.base.Preconditions.checkArgument;

/**
 * This class contains search helper for the events system.
 */
public class MoreSearch {
    private static final Logger LOG = LoggerFactory.getLogger(MoreSearch.class);

    private final StreamService streamService;
    private final IndexRangeService indexRangeService;
    private final QueryStringDecorators queryDecorators;
    private final MoreSearchAdapter moreSearchAdapter;

    @Inject
    public MoreSearch(StreamService streamService,
                      IndexRangeService indexRangeService,
                      QueryStringDecorators queryDecorators,
                      MoreSearchAdapter moreSearchAdapter) {
        this.streamService = streamService;
        this.indexRangeService = indexRangeService;
        this.queryDecorators = queryDecorators;
        this.moreSearchAdapter = moreSearchAdapter;
    }

    /**
     * Executes an events search for the given parameters.
     *
     * @param parameters             event search parameters
     * @param filterString           filter string
     * @param eventStreams           event streams to search in
     * @param forbiddenSourceStreams forbidden source streams
     * @return the result
     */
    // TODO: We cannot use Searches#search() at the moment because that method cannot handle multiple streams. (because of Searches#extractStreamId())
    //       We also cannot use the new search code at the moment because it doesn't do pagination.
    Result eventSearch(EventsSearchParameters parameters, String filterString, Set<String> eventStreams, Set<String> forbiddenSourceStreams) {
        checkArgument(parameters != null, "parameters cannot be null");
        checkArgument(!eventStreams.isEmpty(), "eventStreams cannot be empty");
        checkArgument(forbiddenSourceStreams != null, "forbiddenSourceStreams cannot be null");

        final Sorting.Direction sortDirection = parameters.sortDirection() == EventsSearchParameters.SortDirection.ASC ? Sorting.Direction.ASC : Sorting.Direction.DESC;
        final Sorting sorting = parameters.sortUnmappedType()
                .map(unmappedType -> new Sorting(parameters.sortBy(), sortDirection, unmappedType))
                .orElse(new Sorting(parameters.sortBy(), sortDirection));
        final String queryString = parameters.query().trim();
        final Set<String> affectedIndices = getAffectedIndices(eventStreams, parameters.timerange());

        if (affectedIndices == null || affectedIndices.isEmpty()) {
            return Result.builder()
                    .resultsCount(0)
                    .results(List.of())
                    .usedIndexNames(Set.of())
                    .duration(0)
                    .executedQuery(queryString)
                    .build();
        }
        return moreSearchAdapter.eventSearch(queryString, parameters.timerange(), affectedIndices, sorting, parameters.page(),
                parameters.perPage(), eventStreams, filterString, forbiddenSourceStreams, parameters.filter().extraFilters());
    }

    /**
     * Creates a histogram over events for the given parameters.
     *
     * @param parameters             event search parameters
     * @param filterString           filter string
     * @param eventStreams           event streams to search in
     * @param forbiddenSourceStreams forbidden source streams
     * @return the result
     */
    // TODO: We cannot use Searches#search() at the moment because that method cannot handle multiple streams. (because of Searches#extractStreamId())
    //       We also cannot use the new search code at the moment because it doesn't do pagination.
    Histogram histogram(EventsSearchParameters parameters, String filterString, Set<String> eventStreams, Set<String> forbiddenSourceStreams, ZoneId timeZone) {
        checkArgument(parameters != null, "parameters cannot be null");
        checkArgument(!eventStreams.isEmpty(), "eventStreams cannot be empty");
        checkArgument(forbiddenSourceStreams != null, "forbiddenSourceStreams cannot be null");

        final String queryString = parameters.query().trim();
        final Set<String> affectedIndices = getAffectedIndices(eventStreams, parameters.timerange());

        final var effectiveTimeRange = AbsoluteRange.create(parameters.timerange().getFrom(), parameters.timerange().getTo());
        if (affectedIndices == null || affectedIndices.isEmpty()) {
            return Histogram.empty();
        }
        return moreSearchAdapter.eventHistogram(queryString, effectiveTimeRange, affectedIndices, eventStreams,
                filterString, forbiddenSourceStreams, timeZone, parameters.filter().extraFilters());
    }

    private Set<String> getAffectedIndices(Set<String> streamIds, TimeRange timeRange) {
        final SortedSet<IndexRange> indexRanges = indexRangeService.find(timeRange.getFrom(), timeRange.getTo());

        // We support an empty streams list and return all affected indices in that case.
        if (streamIds.isEmpty()) {
            return indexRanges.stream()
                    .map(IndexRange::indexName)
                    .collect(Collectors.toSet());
        } else {
            final Set<Stream> streams = streamService.loadByIds(streamIds);
            final IndexRangeContainsOneOfStreams indexRangeContainsOneOfStreams = new IndexRangeContainsOneOfStreams();
            return indexRanges.stream()
                    .filter(ir -> indexRangeContainsOneOfStreams.test(ir, streams))
                    .map(IndexRange::indexName)
                    .collect(Collectors.toSet());
        }
    }

    /**
     * This scrolls results for the given query, streams and time range from Elasticsearch. The result is passed to
     * the given callback in batches. (using the given batch size)
     * <p>
     * The search will continue until it is done, an error occurs or the search is stopped by setting the
     * {@code continueScrolling} boolean to {@code false} from the {@link ScrollCallback}.
     * <p></p>
     * TODO: Elasticsearch has a default limit of 500 concurrent scrolls. Every caller of this method should check
     * if there is capacity to create a new scroll request. This can be done by using the ES nodes stats API.
     * See: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-scroll.html#scroll-search-context
     *
     * @param queryString    the search query string
     * @param streams        the set of streams to search in
     * @param filters        the set of search filters to search with
     * @param timeRange      the time range for the search
     * @param batchSize      the number of documents to retrieve at once
     * @param resultCallback the callback that gets executed for each batch
     */
    public void scrollQuery(String queryString, Set<String> streams, List<UsedSearchFilter> filters,
                            Set<Parameter> queryParameters, TimeRange timeRange, int batchSize,
                            ScrollCallback resultCallback) throws EventProcessorException {
        final Set<String> affectedIndices = getAffectedIndices(streams, timeRange);

        try {
            queryString = decorateQuery(queryString, queryParameters);
        } catch (SearchException e) {
            if (e.error() instanceof EmptyParameterError) {
                LOG.debug("Empty parameter from lookup table. Assuming non-matching query. Error: {}", e.getMessage());
                return;
            }
            throw e;
        }

        moreSearchAdapter.scrollEvents(queryString, timeRange, affectedIndices, streams, filters, batchSize, resultCallback::call);
    }

    /**
     * Substitute query string parameters using {@link QueryStringDecorators}.
     */
    private String decorateQuery(String queryString, Set<Parameter> queryParameters) {
        return queryDecorators.decorate(queryString, ParameterProvider.of(queryParameters));
    }


    /**
     * Helper to perform basic Lucene escaping of query string values
     *
     * @param searchString search string which may contain unescaped reserved characters
     * @return String where those characters that Lucene expects to be escaped are escaped by a
     * preceding <code>\</code>
     */
    public static String luceneEscape(String searchString) {
        StringBuilder result = new StringBuilder();
        if (searchString != null) {
            for (char c : searchString.toCharArray()) {
                // These characters are part of the query syntax and must be escaped
                if (c == '\\' || c == '+' || c == '-' || c == '!' || c == '(' || c == ')' || c == ':'
                        || c == '^' || c == '[' || c == ']' || c == '\"' || c == '{' || c == '}' || c == '~'
                        || c == '*' || c == '?' || c == '|' || c == '&' || c == '/') {
                    result.append('\\');
                }
                result.append(c);
            }
        }
        return result.toString();
    }

    /**
     * Callback that receives message batches from {@link #scrollQuery(String, Set, Set, TimeRange, int, ScrollCallback)}.
     */
    public interface ScrollCallback {
        /**
         * This will be called with message batches from a scroll query. To stop the scroll query, the
         * {@code continueScrolling} boolean can be set to {@code false}.
         *
         * @param messages          the message batch
         * @param continueScrolling the boolean that can be set to {@code false} to stop the scroll query
         */
        void call(List<ResultMessage> messages, AtomicBoolean continueScrolling) throws EventProcessorException;
    }

    @AutoValue
    public static abstract class Result {
        public abstract List<ResultMessage> results();

        public abstract long resultsCount();

        public abstract long duration();

        public abstract Set<String> usedIndexNames();

        public abstract String executedQuery();

        public static Builder builder() {
            return new AutoValue_MoreSearch_Result.Builder();
        }

        @AutoValue.Builder
        public abstract static class Builder {
            public abstract Builder results(List<ResultMessage> results);

            public abstract Builder resultsCount(long resultsCount);

            public abstract Builder duration(long duration);

            public abstract Builder usedIndexNames(Set<String> usedIndexNames);

            public abstract Builder executedQuery(String executedQuery);

            public abstract Result build();
        }
    }

    public record Histogram(EventsBuckets buckets) {
        public static Histogram empty() {
            return new Histogram(new EventsBuckets(List.of(), List.of()));
        }

        public record EventsBuckets(List<Bucket> events, List<Bucket> alerts) {}

        public record Bucket(ZonedDateTime startDate, Long count) {}
    }

}
