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

import Routes from 'routing/Routes';
import PageNavigation from 'components/common/PageNavigation';
import { Row } from 'components/bootstrap';

const UsersPageNavigation = () => {
  const NAV_ITEMS = [
    { description: 'Users Overview', path: Routes.SYSTEM.USERS.OVERVIEW, permissions: 'users:list' },
    { description: 'Teams Overview', path: Routes.getPluginRoute('SYSTEM_TEAMS'), permissions: 'teams:list' },
    {
      description: 'Token Management',
      path: Routes.SYSTEM.USERS_TOKEN_MANAGEMENT.overview,
      permissions: 'users:tokenlist',
    },
  ];

  return (
    <Row>
      <PageNavigation items={NAV_ITEMS} />
    </Row>
  );
};

export default UsersPageNavigation;
