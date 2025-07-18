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

import type { EventDefinition } from 'components/event-definitions/event-definitions-types';

// eslint-disable-next-line import/prefer-default-export
export const simpleEventDefinition: EventDefinition = {
  alert: false,
  config: {
    conditions: { expression: null },
    execute_every_ms: 60000,
    group_by: [],
    query: '',
    query_parameters: [],
    search_within_ms: 60000,
    series: [],
    streams: ['stream-id-1'],
    type: 'aggregation-v1',
    filters: [],
    _is_scheduled: true,
    event_limit: 1000,
  },
  updated_at: '2024-02-26T15:32:24.666Z',
  description: '',
  field_spec: {},
  id: 'event-definition-1-id',
  key_spec: [],
  notification_settings: {
    grace_period_ms: 0,
    backlog_size: 0,
  },
  notifications: [],
  priority: 2,
  storage: [
    {
      streams: ['stream-id-2'],
      type: 'persist-to-streams-v1',
    },
  ],
  title: 'Event Definition 1',
  _scope: 'DEFAULT',
  state: 'ENABLED',
  remediation_steps: '',
  event_procedure: '',
  matched_at: '',
  scheduler: {
    data: {
      type: '',
      timerange_from: 0,
      timerange_to: 0,
    },
    next_time: '',
    triggered_at: '',
    queued_notifications: 0,
    is_scheduled: false,
    status: 'runnable',
  },
};
