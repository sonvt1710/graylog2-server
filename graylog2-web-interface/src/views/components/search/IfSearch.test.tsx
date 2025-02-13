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
import { render, screen } from 'wrappedTestingLibrary';

import View from 'views/logic/views/View';
import { asMock } from 'helpers/mocking';
import useViewType from 'views/hooks/useViewType';

import IfSearch from './IfSearch';

jest.mock('views/hooks/useViewType');

describe('IfSearch', () => {
  beforeEach(() => {
    asMock(useViewType).mockReturnValue(undefined);
  });

  it('should render children with search context', async () => {
    asMock(useViewType).mockReturnValue(View.Type.Search);

    render(
      <>
        <span>I must not fear.</span>
        <IfSearch>
          <span>Fear is the mind-killer.</span>
        </IfSearch>
      </>,
    );

    await screen.findByText(/Fear is the mind-killer/i);
  });

  it('should not render children without context', () => {
    render(
      <>
        <span>I must not fear.</span>
        <IfSearch>
          <span>Fear is the mind-killer.</span>
        </IfSearch>
      </>,
    );

    expect(screen.queryByText(/Fear is the mind-killer/i)).toBeNull();
  });

  it('should not render children without search context', () => {
    asMock(useViewType).mockReturnValue(View.Type.Dashboard);

    render(
      <>
        <span>I must not fear.</span>
        <IfSearch>
          <span>Fear is the mind-killer.</span>
        </IfSearch>
      </>,
    );

    expect(screen.queryByText(/Fear is the mind-killer/i)).toBeNull();
  });
});
