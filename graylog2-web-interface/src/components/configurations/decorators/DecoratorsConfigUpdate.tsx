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
import React, { useCallback, useState, useMemo } from 'react';
import cloneDeep from 'lodash/cloneDeep';

import useCurrentUser from 'hooks/useCurrentUser';
import { isPermitted } from 'util/PermissionsMixin';
import BootstrapModalWrapper from 'components/bootstrap/BootstrapModalWrapper';
import { Modal, Alert } from 'components/bootstrap';
import { IfPermitted, ModalSubmit } from 'components/common';
import type { Stream } from 'stores/streams/StreamsStore';
import DecoratorList from 'views/components/messagelist/decorators/DecoratorList';
import AddDecoratorButton from 'views/components/messagelist/decorators/AddDecoratorButton';
import type { Decorator } from 'views/components/messagelist/decorators/Types';
import useSendTelemetry from 'logic/telemetry/useSendTelemetry';
import useLocation from 'routing/useLocation';
import { getPathnameWithoutId } from 'util/URLUtils';
import { TELEMETRY_EVENT_TYPE } from 'logic/telemetry/Constants';

import StreamSelect, { DEFAULT_SEARCH_ID, DEFAULT_STREAM_ID } from './StreamSelect';
import formatDecorator from './FormatDecorator';

type Props = {
  streams: Array<Stream>;
  decorators: Array<Decorator>;
  types: { [key: string]: any };

  show?: boolean;
  onCancel: () => void;
  onSave: (newDecorators: Array<Decorator>) => unknown;
};

const _updateOrder = (
  orderedDecorators: Array<{
    id: string;
  }>,
  decorators: Array<Decorator>,
  onChange: (decorators: Array<Decorator>) => void,
) => {
  const newDecorators = cloneDeep(decorators);

  orderedDecorators.forEach((item, idx) => {
    const decorator = newDecorators.find((i) => i.id === item.id);

    if (decorator) {
      decorator.order = idx;
    }
  });

  onChange(newDecorators);
};

const DecoratorsConfigUpdate = ({ streams, decorators, types, show = false, onCancel, onSave }: Props) => {
  const [currentStream, setCurrentStream] = useState(DEFAULT_STREAM_ID);
  const [modifiedDecorators, setModifiedDecorators] = useState(decorators);
  const sendTelemetry = useSendTelemetry();
  const { pathname } = useLocation();
  const { permissions } = useCurrentUser();

  const canEditStream = useMemo(
    () => isPermitted(permissions, `streams:edit:${currentStream}`) || currentStream === DEFAULT_SEARCH_ID,
    [currentStream, permissions],
  );

  const onCreate = useCallback(
    ({ stream, ...rest }: Decorator) =>
      setModifiedDecorators([
        ...modifiedDecorators,
        {
          ...rest,
          stream: stream === DEFAULT_SEARCH_ID ? null : stream,
        },
      ]),
    [modifiedDecorators, setModifiedDecorators],
  );
  const onReorder = useCallback(
    (
      orderedDecorators: Array<{
        id: string;
      }>,
    ) => _updateOrder(orderedDecorators, modifiedDecorators, setModifiedDecorators),
    [modifiedDecorators, setModifiedDecorators],
  );
  const onSubmit = useCallback(() => {
    onSave(modifiedDecorators);

    sendTelemetry(TELEMETRY_EVENT_TYPE.CONFIGURATIONS.DECORATORS_UPDATED, {
      app_pathname: getPathnameWithoutId(pathname),
      app_section: 'decorators',
      app_action_value: 'configuration-save',
    });
  }, [onSave, modifiedDecorators, sendTelemetry, pathname]);

  const currentDecorators = modifiedDecorators.filter(
    (decorator) => (decorator.stream || DEFAULT_SEARCH_ID) === currentStream,
  );
  const decoratorItems = currentDecorators
    .sort((d1, d2) => d1.order - d2.order)
    .map((decorator) =>
      formatDecorator(decorator, modifiedDecorators, types, canEditStream ? setModifiedDecorators : undefined),
    );

  const nextOrder = currentDecorators.reduce((currentMax, decorator) => Math.max(currentMax, decorator.order), 0) + 1;

  const _onCancel = useCallback(() => {
    setModifiedDecorators(decorators);
    onCancel();
  }, [decorators, onCancel]);

  const modalTitle = 'Update Default Decorators Configuration';

  return (
    <BootstrapModalWrapper showModal={show} onHide={_onCancel}>
      <Modal.Header>
        <Modal.Title>{modalTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Select the stream for which you want to change the set of default decorators.</p>

        <StreamSelect onChange={setCurrentStream} value={currentStream} streams={streams} />

        {!canEditStream && currentStream && (
          <Alert bsStyle="warning">Read only access - you need permission to edit the selected stream</Alert>
        )}

        <IfPermitted permissions="decorators:create">
          <p>Select the type to create a new decorator for this stream:</p>
          <AddDecoratorButton
            stream={currentStream}
            nextOrder={nextOrder}
            decoratorTypes={types}
            onCreate={onCreate}
            showHelp={false}
            disabled={!canEditStream}
          />
        </IfPermitted>

        <p>Use drag and drop to change the execution order of the decorators.</p>

        <DecoratorList decorators={decoratorItems} onReorder={onReorder} />
      </Modal.Body>
      <Modal.Footer>
        <ModalSubmit
          onSubmit={onSubmit}
          onCancel={_onCancel}
          submitButtonText="Update configuration"
          disabledSubmit={!canEditStream}
        />
      </Modal.Footer>
    </BootstrapModalWrapper>
  );
};

export default DecoratorsConfigUpdate;
