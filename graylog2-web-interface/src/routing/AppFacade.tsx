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
import * as React from 'react';
import { useEffect, useMemo } from 'react';

import loadAsync from 'routing/loadAsync';
import ServerUnavailablePage from 'pages/ServerUnavailablePage';
import { useStore } from 'stores/connect';
import 'bootstrap/less/bootstrap.less';
import type { Store } from 'stores/StoreTypes';
import type { CurrentUserStoreState } from 'stores/users/CurrentUserStore';
import { CurrentUserStore } from 'stores/users/CurrentUserStore';
import { ServerAvailabilityStore } from 'stores/sessions/ServerAvailabilityStore';
import type { SessionStoreState } from 'stores/sessions/SessionStore';
import { SessionStore } from 'stores/sessions/SessionStore';
import GraylogThemeProvider from 'theme/GraylogThemeProvider';
import GlobalThemeStyles from 'theme/GlobalThemeStyles';
import Notifications from 'routing/Notifications';

const LoginPage = loadAsync(() => import(/* webpackChunkName: "LoginPage" */ 'pages/LoginPage'));
const LoadingPage = loadAsync(() => import(/* webpackChunkName: "LoadingPage" */ 'pages/LoadingPage'));
const LoggedInPage = loadAsync(() => import(/* webpackChunkName: "LoggedInPage" */ 'pages/LoggedInPage'));

const SERVER_PING_TIMEOUT = 20000;

const LoggedOutThemeProvider = ({ children }: React.PropsWithChildren) => (
  <GraylogThemeProvider userIsLoggedIn={false}>
    <GlobalThemeStyles />
    <Notifications />
    {children}
  </GraylogThemeProvider>
);

const AppFacade = () => {
  const currentUser = useStore(CurrentUserStore as Store<CurrentUserStoreState>, (state) => state?.currentUser);
  const server = useStore(ServerAvailabilityStore, (state) => state?.server);
  const username = useStore(SessionStore as Store<SessionStoreState>, (state) => state?.username ?? '');

  useEffect(() => {
    const interval = setInterval(ServerAvailabilityStore.ping, SERVER_PING_TIMEOUT);

    return () => clearInterval(interval);
  }, []);

  const ThemeProvider = useMemo(
    () => (server.up && username && currentUser ? React.Fragment : LoggedOutThemeProvider),
    [currentUser, server.up, username],
  );
  const content = useMemo(() => {
    if (server.up === false) {
      return <ServerUnavailablePage server={server} />;
    }

    if (!username) {
      return <LoginPage />;
    }

    if (!currentUser) {
      return <LoadingPage text="We are preparing the web interface for you..." />;
    }

    return <LoggedInPage />;
  }, [currentUser, server, username]);

  return <ThemeProvider>{content}</ThemeProvider>;
};

export default AppFacade;
