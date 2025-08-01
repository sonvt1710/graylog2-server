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
import { useEffect } from 'react';
import styled from 'styled-components';
import type { FormikProps } from 'formik';

import type { GRN } from 'logic/permissions/types';
import type EntityShareState from 'logic/permissions/EntityShareState';
import type SharedEntity from 'logic/permissions/SharedEntity';
import EntityShareDomain from 'domainActions/permissions/EntityShareDomain';
import type { EntitySharePayload } from 'actions/permissions/EntityShareActions';
import type {
  SelectionRequest,
  FormValues as GranteesSelectFormValues,
} from 'components/permissions/Grantee/GranteesSelector';
import GranteesSelector from 'components/permissions/Grantee/GranteesSelector';
import GranteesList from 'components/permissions/Grantee/GranteesList';
import usePluggableEntityCollectionGranteeList from 'hooks/usePluggableEntityCollectionGranteeList';

import ShareableEntityURL from './ShareableEntityURL';
import EntityShareValidationsDependencies from './EntityShareValidationsDependencies';

type Props = {
  entityGRN: GRN;
  description: string;
  entityType: SharedEntity['type'];
  entityTitle: SharedEntity['title'];
  entityShareState: EntityShareState;
  setDisableSubmit: (disabled: boolean) => void;
  granteesSelectFormRef: React.Ref<FormikProps<GranteesSelectFormValues>>;
  showShareableEntityURL?: boolean;
  entityTypeTitle?: string | null | undefined;
};

const Section = styled.div`
  margin-bottom: 25px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const GranteesSelectorHeadline = styled.h5`
  margin-bottom: 10px;
`;

const _filterAvailableGrantees = (availableGrantees, selectedGranteeCapabilities) => {
  const availableGranteeCapabilitiesUserIds = selectedGranteeCapabilities.entrySeq().map(([granteeGRN]) => granteeGRN);

  return availableGrantees.filter((grantee) => !availableGranteeCapabilitiesUserIds.includes(grantee.id));
};

const EntityShareSettings = ({
  entityShareState: {
    activeShares,
    availableGrantees,
    availableCapabilities,
    missingDependencies,
    selectedGranteeCapabilities,
    selectedGrantees,
    validationResults,
  },
  description,
  entityGRN,
  entityType,
  entityTitle,
  setDisableSubmit,
  granteesSelectFormRef,
  showShareableEntityURL = true,
  entityTypeTitle = null,
}: Props) => {
  const filteredGrantees = _filterAvailableGrantees(availableGrantees, selectedGranteeCapabilities);

  const CollectionGranteeList = usePluggableEntityCollectionGranteeList();

  useEffect(() => {
    setDisableSubmit(validationResults?.failed);
  }, [validationResults, setDisableSubmit]);

  const _handleSelection = ({ granteeId, capabilityId }: SelectionRequest) => {
    const newSelectedCapabilities = selectedGranteeCapabilities.merge({ [granteeId]: capabilityId });

    setDisableSubmit(true);

    const payload: EntitySharePayload = {
      selected_grantee_capabilities: newSelectedCapabilities,
    };

    return EntityShareDomain.prepare(entityType, entityTitle, entityGRN, payload);
  };

  const _handleDeletion = (granteeId: GRN) => {
    const newSelectedGranteeCapabilities = selectedGranteeCapabilities.remove(granteeId);

    setDisableSubmit(true);

    const payload: EntitySharePayload = {
      selected_grantee_capabilities: newSelectedGranteeCapabilities,
    };

    return EntityShareDomain.prepare(entityType, entityTitle, entityGRN, payload);
  };

  return (
    <>
      <Section>
        <GranteesSelectorHeadline>Add Collaborator</GranteesSelectorHeadline>
        <p>{description}</p>
        <GranteesSelector
          availableGrantees={filteredGrantees}
          availableCapabilities={availableCapabilities}
          onSubmit={_handleSelection}
          formRef={granteesSelectFormRef}
        />
      </Section>
      <Section>
        <GranteesList
          activeShares={activeShares}
          availableCapabilities={availableCapabilities}
          entityType={entityType}
          entityTypeTitle={entityTypeTitle}
          onDelete={_handleDeletion}
          onCapabilityChange={_handleSelection}
          selectedGrantees={selectedGrantees}
          title="Direct Collaborators"
        />
      </Section>
      {CollectionGranteeList && (
        <Section>
          <CollectionGranteeList
            title="Collection Collaborators"
            entityType={entityType}
            entityTypeTitle={entityTypeTitle}
            entityGRN={entityGRN}
          />
        </Section>
      )}
      <EntityShareValidationsDependencies
        missingDependencies={missingDependencies}
        validationResults={validationResults}
        availableGrantees={availableGrantees}
      />
      {showShareableEntityURL && (
        <Section>
          <ShareableEntityURL entityGRN={entityGRN} />
        </Section>
      )}
    </>
  );
};

export default EntityShareSettings;
