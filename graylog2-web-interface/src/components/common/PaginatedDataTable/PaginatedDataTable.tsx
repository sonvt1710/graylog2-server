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
import { useState, useEffect } from 'react';

import type { Pagination } from 'stores/PaginationTypes';
import DataTable from 'components/common/DataTable';
import PaginatedList from 'components/common/PaginatedList';

import Filter from './Filter';

const DEFAULT_PAGINATION = {
  page: 1,
  perPage: 10,
  query: '',
};

const _paginatedRows = (rows: Array<unknown>, perPage: number, currentPage: number) => {
  const begin = perPage * (currentPage - 1);
  const end = begin + perPage;

  return rows.slice(begin, end);
};

type Props = {
  /** DataTable class */
  className?: string;
  /**
   * Function that renders a row in the table. It receives two arguments: the row, and its index.
   * It usually returns a `<tr>` element with the formatted row.
   */
  dataRowFormatter: (row: unknown) => React.ReactElement;
  /** List of object keys to use as filter in the data filter input. Use an empty array to disable data filter. */
  filterKeys?: Array<string>;
  /**
   * Function that renders a single header cell in the table. It receives two arguments: the header, and its index.
   * It usually returns a `<th>` element with the header.
   * Default will wrap the headers in a <th> tag.
   */
  headerCellFormatter?: (header: string) => React.ReactElement;
  /** Array of values to be use as headers. The render is controlled by `headerCellFormatter`. */
  headers: Array<string>;
  /** Element id to use in the table container */
  id: string;
  /** Text or element to show when there is no data. */
  noDataText?: React.ReactNode;
  /** Initial pagination. */
  pagination?: Pagination;
  /** Adds a custom class to the row element. */
  rowClassName?: string;
  /** Array of objects to be rendered in the table. The render of those values is controlled by `dataRowFormatter`. */
  rows: Array<unknown>;
  /**
   * Indicates whether the table should use a bootstrap responsive table or not:
   * https://getbootstrap.com/docs/3.3/css/#tables-responsive
   *
   * The main reason to disable this is if the table is clipping a dropdown menu or another component in a table edge.
   */
  useResponsiveTable?: boolean;
};

type DataTablePagination = {
  perPage: number;
  page: number;
};

/**
 * Component that renders a paginated data table. Should only be used for lists which are not already paginated.
 * If you want to display a lists which gets paginated by the backend, wrap use the DataTable in combination with the PaginatedList.
 */
const PaginatedDataTable = ({
  // eslint-disable-next-line react/require-default-props
  rows = [],
  pagination: initialPagination = DEFAULT_PAGINATION,
  filterKeys = undefined,
  id,
  useResponsiveTable = false,
  ...rest
}: Props) => {
  const [{ perPage, page }, setPagination] = useState<DataTablePagination>(initialPagination);
  const [filteredRows, setFilteredRows] = useState(rows);
  const paginatedRows = _paginatedRows(filteredRows, perPage, page);

  useEffect(() => {
    setFilteredRows(rows);
    setPagination(initialPagination);
  }, [rows, initialPagination]);

  const _onPageChange = (newPage: number, newPerPage: number) => {
    setPagination({ page: newPage, perPage: newPerPage });
  };

  const _resetPagination = () => {
    setPagination({ perPage, page: initialPagination.page });
  };

  return (
    <PaginatedList
      totalItems={filteredRows.length}
      pageSize={perPage}
      activePage={page}
      onChange={_onPageChange}
      showPageSizeSelect
      useQueryParameter={false}>
      <DataTable
        {...rest}
        useResponsiveTable={useResponsiveTable}
        id={id}
        customFilter={
          <Filter
            id={id}
            filterKeys={filterKeys}
            setFilteredRows={setFilteredRows}
            rows={rows}
            resetPagination={_resetPagination}
          />
        }
        rows={paginatedRows}
      />
    </PaginatedList>
  );
};

export default PaginatedDataTable;
