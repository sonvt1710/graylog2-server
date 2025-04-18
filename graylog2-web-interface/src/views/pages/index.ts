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
import loadAsync from 'routing/loadAsync';

const DashboardsPage = loadAsync(() => import(/* webpackChunkname: "DashboardsPage" */ './DashboardsPage'));

const NewSearchPage = loadAsync(() => import(/* webpackChunkName: "NewSearchPage" */ './NewSearchPage'));
const StreamSearchPage = loadAsync(() => import(/* webpackChunkName: "StreamSearchPage" */ './StreamSearchPage'));
const NewDashboardPage = loadAsync(() => import(/* webpackChunkName: "NewDashboardPage" */ './NewDashboardPage'));
const ShowViewPage = loadAsync(() => import(/* webpackChunkName: "ShowViewPage" */ './ShowViewPage'));
const EventReplaySearchPage = loadAsync(() => import(/* webpackChunkName: "ShowViewPage" */ './EventReplaySearchPage'));
const EventDefinitionReplaySearchPage = loadAsync(
  () => import(/* webpackChunkName: "ShowViewPage" */ './EventDefinitionReplaySearchPage'),
);
const BulkEventReplayPage = loadAsync(
  () => import(/* webpackChunkName: "BulkEventReplayPage" */ './BulkEventReplayPage'),
);

export {
  DashboardsPage,
  NewSearchPage,
  ShowViewPage,
  StreamSearchPage,
  NewDashboardPage,
  EventReplaySearchPage,
  EventDefinitionReplaySearchPage,
  BulkEventReplayPage,
};
