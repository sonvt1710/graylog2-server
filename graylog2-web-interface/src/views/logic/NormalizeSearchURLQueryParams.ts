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
import { useMemo } from 'react';

import type { TimeRange, FilterType } from 'views/logic/queries/Query';
import type { QueryString } from 'views/logic/queries/types';
import {
  filtersForQuery,
  categoryFiltersForQuery,
  createElasticsearchQueryString,
  filtersToStreamSet,
  filtersToStreamCategorySet,
} from 'views/logic/queries/Query';
import type { TimeRangeQueryParameter } from 'views/logic/TimeRange';
import { timeRangeFromQueryParameter } from 'views/logic/TimeRange';
import { DEFAULT_RANGE_TYPE } from 'views/Constants';
import useQuery from 'routing/useQuery';

type StreamsQuery = {
  streams?: string;
};

type StreamCategoryQuery = {
  stream_categories?: string;
};

export type RawQuery = (TimeRangeQueryParameter | { relative?: string }) &
  StreamsQuery &
  StreamCategoryQuery & { q?: string };

const normalizeTimeRange = (query: {} | TimeRangeQueryParameter): TimeRange | undefined =>
  // eslint-disable-next-line no-nested-ternary
  query && 'rangetype' in query
    ? timeRangeFromQueryParameter(query)
    : 'relative' in query
      ? timeRangeFromQueryParameter({ ...query, rangetype: DEFAULT_RANGE_TYPE })
      : undefined;

const normalizeStreams = (query: StreamsQuery = {}): Array<string> => {
  const rawStreams = query.streams;

  if (rawStreams === undefined || rawStreams === null) {
    return [];
  }

  return String(rawStreams)
    .split(',')
    .map((stream) => stream.trim())
    .filter((stream) => stream !== '');
};

const normalizeStreamCategories = (query: StreamCategoryQuery = {}): Array<string> => {
  const rawCategories = query.stream_categories;

  if (rawCategories === undefined || rawCategories === null) {
    return [];
  }

  return String(rawCategories)
    .split(',')
    .map((category) => category.trim())
    .filter((category) => category !== '');
};

type NormalizedSearchURLQueryParams = {
  timeRange: TimeRange | undefined;
  streamsFilter: FilterType | undefined;
  streamCategoriesFilter: FilterType | undefined;
  queryString: QueryString | undefined;
};

const normalizeSearchURLQueryParams = (query: RawQuery): NormalizedSearchURLQueryParams => {
  const { q: queryString } = query ?? {};
  const timeRange = normalizeTimeRange(query);
  const streamsFilter = filtersForQuery(normalizeStreams(query));
  const streamCategoriesFilter = categoryFiltersForQuery(normalizeStreamCategories(query));

  return {
    timeRange,
    streamsFilter,
    streamCategoriesFilter,
    queryString: queryString ? createElasticsearchQueryString(queryString) : undefined,
  };
};

export const useSearchURLQueryParams = () => {
  const query = useQuery();

  return useMemo(() => {
    const { timeRange, queryString, streamsFilter, streamCategoriesFilter } = normalizeSearchURLQueryParams(query);

    return {
      timeRange,
      queryString,
      streams: filtersToStreamSet(streamsFilter).toArray(),
      streamCategories: filtersToStreamCategorySet(streamCategoriesFilter).toArray(),
    };
  }, [query]);
};

export default normalizeSearchURLQueryParams;
