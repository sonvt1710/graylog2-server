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
import { useState } from 'react';
import styled from 'styled-components';
import { Formik, Form } from 'formik';

import type { CapabilitiesList } from 'logic/permissions/EntityShareState';
import type EntityShareState from 'logic/permissions/EntityShareState';
import type Grantee from 'logic/permissions/Grantee';
import { Spinner, IconButton } from 'components/common';
import type Capability from 'logic/permissions/Capability';
import type { CurrentState as CurrentGranteeState } from 'logic/permissions/SelectedGrantee';
import type SelectedGrantee from 'logic/permissions/SelectedGrantee';
import {
  GranteeListItemTitle,
  GranteeInfo,
  StyledGranteeIcon,
  GranteeListItemContainer,
} from 'components/permissions/CommonStyledComponents';

import CapabilitySelect from '../CapabilitySelect';

const StyledCapabilitySelect = styled(CapabilitySelect)`
  flex: 0.5;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  margin-left: 10px;
`;

type Props = {
  availableCapabilities: CapabilitiesList;
  currentGranteeState: CurrentGranteeState;
  grantee: SelectedGrantee;
  onDelete: (grantee: Grantee['id']) => Promise<EntityShareState | undefined | null>;
  onCapabilityChange: (payload: {
    granteeId: Grantee['id'];
    capabilityId: Capability['id'];
  }) => Promise<EntityShareState | undefined | null>;
};

const GranteesListItem = ({
  availableCapabilities,
  currentGranteeState,
  grantee: { id, capabilityId, type, title },
  onDelete,
  onCapabilityChange,
}: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);

    onDelete(id).then(() => setIsDeleting(false));
  };

  return (
    <Formik initialValues={{ capabilityId }} onSubmit={() => {}}>
      <Form>
        <GranteeListItemContainer $currentState={currentGranteeState}>
          <GranteeInfo title={title}>
            <StyledGranteeIcon type={type} />
            <GranteeListItemTitle>{title}</GranteeListItemTitle>
          </GranteeInfo>
          <StyledCapabilitySelect
            onChange={(newCapabilityId) => onCapabilityChange({ granteeId: id, capabilityId: newCapabilityId })}
            capabilities={availableCapabilities}
            title={`Change the capability for ${title}`}
          />
          <Actions>
            {isDeleting ? (
              <Spinner text="" />
            ) : (
              <IconButton name="delete" onClick={handleDelete} title={`Remove sharing for ${title}`} />
            )}
          </Actions>
        </GranteeListItemContainer>
      </Form>
    </Formik>
  );
};

export default GranteesListItem;
