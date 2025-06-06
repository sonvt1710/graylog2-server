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
import type { SearchTypeOptions } from 'views/logic/search/GlobalOverride';
import GlobalOverride from 'views/logic/search/GlobalOverride';
import type { TimeRange } from 'views/logic/queries/Query';
import type { ViewsDispatch } from 'views/stores/useViewsDispatch';
import type { RootState, SearchExecutionResult, ExtraArguments } from 'views/types';
import { selectView, selectActiveQuery } from 'views/logic/slices/viewSelectors';
import SearchExecutionState from 'views/logic/search/SearchExecutionState';
import {
  selectGlobalOverride,
  selectParameterBindings,
  selectSearchExecutionResult,
} from 'views/logic/slices/searchExecutionSelectors';
import { executeWithExecutionState } from 'views/logic/slices/searchExecutionSlice';

const reexecuteSearchTypes =
  (searchTypes: SearchTypeOptions, effectiveTimerange?: TimeRange) =>
  (dispatch: ViewsDispatch, getState: () => RootState, { searchExecutors }: ExtraArguments) => {
    const state = getState();
    const activeQuery = selectActiveQuery(state);
    const globalOverride = selectGlobalOverride(state);
    const globalQuery = globalOverride?.query;
    const parameterBindings = selectParameterBindings(state);
    const view = selectView(state);
    const searchTypeIds = Object.keys(searchTypes);
    const newGlobalOverride: GlobalOverride = new GlobalOverride(
      effectiveTimerange,
      globalQuery,
      searchTypeIds,
      searchTypes,
    );

    const executionState = new SearchExecutionState(parameterBindings, newGlobalOverride);

    const handleSearchResult = ({ result: newPartialSearchResult }: SearchExecutionResult): SearchExecutionResult => {
      const { result: existingSearchResult } = selectSearchExecutionResult(getState());

      const updatedSearchTypes = newPartialSearchResult.getSearchTypesFromResponse(searchTypeIds);
      const updatedSearchResult = existingSearchResult
        .withErrors(newPartialSearchResult.result.errors)
        .updateSearchTypes(updatedSearchTypes);

      return { result: updatedSearchResult, widgetMapping: view.widgetMapping };
    };

    return dispatch(
      executeWithExecutionState({
        search: view.search,
        activeQuery,
        searchTypesToSearch: [],
        executionState,
        searchExecutors: {
          ...searchExecutors,
          resultMapper: handleSearchResult,
        },
        widgetMapping: view.widgetMapping,
      }),
    );
  };

export default reexecuteSearchTypes;
