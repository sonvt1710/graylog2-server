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
import styled, { css } from 'styled-components';

import { Table } from 'components/bootstrap';

const MessagesContainer = styled.div`
  width: 100%;
`;

const StyledTable = styled(Table)<{ $stickyHeader: boolean }>(
  ({ theme, $stickyHeader }) => css`
    position: relative;
    font-size: ${theme.fonts.size.small};
    margin: 0;
    border-collapse: collapse;
    width: 100%;
    word-break: break-all;

    thead {
      ${$stickyHeader
        ? `position: sticky;
    top: 0;
    z-index: 2`
        : ''}
    }

    td,
    th {
      position: relative;
    }

    > tbody td {
      background-color: ${theme.colors.global.contentBackground};
      color: ${theme.utils.contrastingColor(theme.colors.global.contentBackground)};
    }

    &.table-striped > tbody > tr:nth-of-type(odd) > td {
      background-color: ${theme.colors.global.contentBackground};
    }

    &.table-striped > tbody > tr:nth-of-type(even) > td {
      background-color: ${theme.colors.table.row.background};
    }

    tr {
      border: 0 !important;
    }

    tr.message-group {
      border-top: 0;
    }

    tbody.message-group-toggled {
      border-left: 7px solid ${theme.colors.variant.light.info};
    }

    tbody.message-highlight {
      border-left: 7px solid ${theme.colors.variant.light.success};
    }

    tr.fields-row {
      cursor: pointer;

      td {
        min-width: 50px;
        padding-top: 10px;
      }
    }

    tr.message-row td {
      border-top: 0;
      padding-top: 0;
      padding-bottom: 5px;
      font-family: ${theme.fonts.family.monospace};
      color: ${theme.colors.variant.dark.info};
    }

    tr.message-row {
      margin-bottom: 5px;
      cursor: pointer;
    }

    tr.message-detail-row {
      display: none;
    }

    tr.message-detail-row td {
      padding-top: 5px;
      border-top: 0;
    }

    tr.message-detail-row .row {
      margin-right: 0;
    }

    tr.message-detail-row div[class*='col-'] {
      padding-right: 0;
    }

    th i.sort-order-desc {
      position: relative;
      top: -1px;
    }

    th i.sort-order-item {
      margin-right: 2px;
      color: ${theme.colors.gray[10]};
      visibility: hidden;
    }

    th i.sort-order-active,
    th:hover i.sort-order-item {
      color: ${theme.colors.global.textAlt};
    }
  `,
);

type Props = {
  children: React.ReactNode;
  striped?: boolean;
  bordered?: boolean;
  stickyHeader?: boolean;
  condensed?: boolean;
};

const MessagesTable = ({
  children,
  condensed = true,
  striped = false,
  bordered = false,
  stickyHeader = false,
}: Props) => (
  <MessagesContainer>
    <StyledTable condensed={condensed} striped={striped} bordered={bordered} $stickyHeader={stickyHeader}>
      {children}
    </StyledTable>
  </MessagesContainer>
);

export default MessagesTable;
