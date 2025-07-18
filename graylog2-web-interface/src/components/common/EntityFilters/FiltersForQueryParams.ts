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
import type { UrlQueryFilters } from 'components/common/EntityFilters/types';

// Transform filters, so they can be used as URL query params, for example for the PaginationURL helper.
const FiltersForQueryParams = (filters: UrlQueryFilters) => {
  if (!filters) {
    return undefined;
  }

  return filters
    .entrySeq()
    .flatMap<string, string>(([attributeId, filterValues]) => filterValues.map((value) => `${attributeId}:${value}`))
    .toArray();
};

export default FiltersForQueryParams;
