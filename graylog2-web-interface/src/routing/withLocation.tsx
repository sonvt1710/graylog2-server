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
import { useMemo } from 'react';

import useLocation from 'routing/useLocation';

import useQuery from './useQuery';

export type Location<Query = { [key: string]: unknown | null | undefined }> = {
  query: Query;
  pathname: string;
  search: string;
};

export type LocationContext = {
  location: Location;
};

const withLocation =
  <Props extends LocationContext>(
    Component: React.ComponentType<Props>,
  ): React.ComponentType<Omit<Props, keyof LocationContext>> =>
  (props) => {
    const location = useLocation();
    const query = useQuery();
    const locationWithQuery: Location = useMemo(() => ({ ...location, query }), [location, query]);

    return <Component {...(props as Props)} location={locationWithQuery} />;
  };

export default withLocation;
