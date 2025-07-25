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
import styled from 'styled-components';

import type UserOverview from 'logic/users/UserOverview';
import { StatusIcon } from 'components/common';
import Tooltip from 'components/common/Tooltip';

type Props = {
  authServiceEnabled: UserOverview['authServiceEnabled'];
  accountStatus: UserOverview['accountStatus'];
};

const Td = styled.td`
  width: 35px;
  text-align: center;
`;

const StatusCell = ({ accountStatus, authServiceEnabled }: Props) => (
  <Td>
    <Tooltip
      withArrow
      position="right"
      label={
        <>
          {`User is ${accountStatus}`}
          {!authServiceEnabled ? ' (authentication service is disabled)' : ''}
        </>
      }>
      <div>
        <StatusIcon active={accountStatus === 'enabled'} />
      </div>
    </Tooltip>
  </Td>
);

export default StatusCell;
