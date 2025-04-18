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
import * as Immutable from 'immutable';
import { act, render, fireEvent, waitFor, screen } from 'wrappedTestingLibrary';

import QueryTitleEditModal from './QueryTitleEditModal';

describe('QueryTitleEditModal', () => {
  const modalHeadline = 'Editing dashboard page title';

  const openModal = (modalRef, currentTitle = 'CurrentTitle') => {
    if (modalRef) {
      act(() => {
        modalRef.open(currentTitle);
      });
    }
  };

  it('shows after triggering open action', async () => {
    let modalRef;
    const { queryByText } = render(
      <QueryTitleEditModal
        ref={(ref) => {
          modalRef = ref;
        }}
        onTitleChange={() => Promise.resolve(Immutable.Map())}
      />,
    );

    // Modal should not be visible initially
    expect(queryByText(modalHeadline)).toBeNull();

    openModal(modalRef);

    // Modal should be visible
    await screen.findByText(modalHeadline);
  });

  it('has correct initial input value', async () => {
    let modalRef;
    render(
      <QueryTitleEditModal
        ref={(ref) => {
          modalRef = ref;
        }}
        onTitleChange={() => Promise.resolve(Immutable.Map())}
      />,
    );

    openModal(modalRef);

    const titleInput = await screen.findByRole('textbox', { name: /Title/i });

    expect(titleInput).toHaveValue('CurrentTitle');
  });

  it('updates query title and closes', async () => {
    let modalRef;
    const onTitleChangeFn = jest.fn();
    render(
      <QueryTitleEditModal
        ref={(ref) => {
          modalRef = ref;
        }}
        onTitleChange={onTitleChangeFn}
      />,
    );

    openModal(modalRef);
    const titleInput = await screen.findByRole('textbox', { name: /Title/i });

    expect(titleInput).toHaveValue('CurrentTitle');

    const saveButton = await screen.findByRole('button', { name: /update title/i });

    fireEvent.change(titleInput, { target: { value: 'NewTitle' } });
    fireEvent.click(saveButton);

    expect(onTitleChangeFn).toHaveBeenCalledTimes(1);
    expect(onTitleChangeFn).toHaveBeenCalledWith('NewTitle');

    // Modal should not be visible anymore
    await waitFor(() => {
      expect(screen.queryByText(modalHeadline)).toBeNull();
    });
  });

  it('closes on click on cancel', async () => {
    let modalRef;
    const onTitleChangeFn = jest.fn();
    const { getByText, queryByText, findByText } = render(
      <QueryTitleEditModal
        ref={(ref) => {
          modalRef = ref;
        }}
        onTitleChange={onTitleChangeFn}
      />,
    );

    openModal(modalRef);

    // Modal should be visible
    await findByText(modalHeadline);

    // Modal should not be visible after click on cancel
    const cancelButton = getByText('Cancel');

    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(queryByText(modalHeadline)).not.toBeInTheDocument();
    });
  });
});
