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
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { SearchParams } from 'stores/PaginationTypes';
import type { EventDefinition } from 'components/event-definitions/event-definitions-types';
import { EventDefinitionsStore } from 'stores/event-definitions/EventDefinitionsStore';
import { defaultOnError } from 'util/conditional/onError';

type Options = {
  enabled: boolean;
};

export const fetchEventDefinitions = (searchParams: SearchParams): Promise<EventDefinitionResult> =>
  EventDefinitionsStore.searchPaginated(searchParams.page, searchParams.pageSize, searchParams.query, {
    sort: searchParams?.sort.attributeId,
    order: searchParams?.sort.direction,
  }).then(({ elements, pagination, attributes }) => ({
    list: elements,
    pagination,
    attributes,
  }));

export const fetchEventDefinition = (eventDefinitionId: string): Promise<any> =>
  EventDefinitionsStore.get(eventDefinitionId).then(({ event_definition, context, is_mutable }) => ({
    eventDefinition: event_definition,
    context: context,
    is_mutable: is_mutable,
  }));

export const keyFn = (searchParams: SearchParams) => ['eventDefinition', 'overview', searchParams];

type EventDefinitionResult = {
  list: Array<EventDefinition>;
  pagination: { total: number };
  attributes: Array<{ id: string; title: string; sortable: boolean }>;
};

export const useGetEventDefinition = (eventDefinitionId: string) => {
  const { data, isFetching } = useQuery({
    queryKey: ['get-event-definition', eventDefinitionId],

    queryFn: () =>
      defaultOnError(
        fetchEventDefinition(eventDefinitionId),
        'Loading Event Definition failed with status',
        'Could not load Event definition',
      ),
  });

  return {
    data: isFetching ? null : data,
    isFetching,
  };
};

const useEventDefinitions = (searchParams: SearchParams, { enabled }: Options = { enabled: true }) => {
  const { data, refetch, isInitialLoading } = useQuery({
    queryKey: keyFn(searchParams),

    queryFn: () =>
      defaultOnError(
        fetchEventDefinitions(searchParams),
        'Loading Event Definitions failed with status',
        'Could not load Event definition',
      ),
    placeholderData: keepPreviousData,
    enabled,
  });

  return {
    data,
    refetch,
    isInitialLoading,
  };
};

export default useEventDefinitions;
