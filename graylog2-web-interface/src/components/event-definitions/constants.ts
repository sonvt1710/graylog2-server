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
import type { Attribute, Sort } from 'stores/PaginationTypes';

export const SYSTEM_EVENT_DEFINITION_TYPE = 'system-notifications-v1';

const getEventDefinitionTableElements = (pluggableAttributes?: {
  attributeNames?: Array<string>;
  attributes?: Array<Attribute>;
}) => {
  const defaultLayout = {
    entityTableId: 'event_definitions',
    defaultPageSize: 20,
    defaultSort: { attributeId: 'title', direction: 'asc' } as Sort,
    defaultDisplayedAttributes: [
      'title',
      'description',
      'priority',
      'scheduling',
      'status',
      'matched_at',
      ...(pluggableAttributes?.attributeNames || []),
    ],
  };
  const columnOrder = [
    'title',
    'description',
    'priority',
    'matched_at',
    'status',
    'scheduling',
    ...(pluggableAttributes?.attributeNames || []),
  ];

  const additionalAttributes = [
    { id: 'scheduling', title: 'Scheduling', sortable: false },
    { id: 'matched_at', title: 'Last Matched', sortable: true },
    ...(pluggableAttributes?.attributes || []),
  ];

  return {
    defaultLayout,
    columnOrder,
    additionalAttributes,
  };
};

export default getEventDefinitionTableElements;
