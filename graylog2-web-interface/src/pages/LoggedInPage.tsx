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
import React from 'react';

import AppRouter from 'routing/AppRouter';
import ThemeAndUserProvider from 'contexts/ThemeAndUserProvider';
import StreamsProvider from 'contexts/StreamsProvider';
import DefaultQueryClientProvider from 'contexts/DefaultQueryClientProvider';
import TelemetryProvider from 'logic/telemetry/TelemetryProvider';
import NodesProvider from 'contexts/NodesProvider';
import InputsProvider from 'contexts/InputsProvider';
import SuggestReloadIfVersionChanged from 'routing/SuggestReloadIfVersionChanged';
import Notifications from 'routing/Notifications';

const LoggedInPage = () => (
  <DefaultQueryClientProvider>
    <ThemeAndUserProvider>
      <TelemetryProvider>
        <StreamsProvider>
          <NodesProvider>
            <InputsProvider>
              <Notifications />
              <AppRouter />
              <SuggestReloadIfVersionChanged />
            </InputsProvider>
          </NodesProvider>
        </StreamsProvider>
      </TelemetryProvider>
    </ThemeAndUserProvider>
  </DefaultQueryClientProvider>
);

export default LoggedInPage;
