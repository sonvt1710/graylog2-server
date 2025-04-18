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
import * as Immutable from 'immutable';
import { createSelector } from '@reduxjs/toolkit';
import { useMemo } from 'react';

import useViewsSelector from 'views/stores/useViewsSelector';
import type { QueryId } from 'views/logic/queries/Query';
import type Query from 'views/logic/queries/Query';
import { selectSearchQueries } from 'views/logic/slices/viewSelectors';

const selectQueriesAsMap = createSelector(selectSearchQueries, (queries) =>
  Immutable.OrderedMap<QueryId, Query>(queries.map((q) => [q.id, q])),
);

const useQueries = () => useViewsSelector(selectQueriesAsMap);

const useQueryFilters = () => {
  const queries = useQueries();

  return useMemo(() => queries.map((q) => q.filter).toMap(), [queries]);
};

export default useQueryFilters;
