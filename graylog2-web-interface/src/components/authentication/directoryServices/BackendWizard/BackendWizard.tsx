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
import { useState, useRef, useEffect, useMemo } from 'react';
import compact from 'lodash/compact';
import camelCase from 'lodash/camelCase';
import mapKeys from 'lodash/mapKeys';
import mapValues from 'lodash/mapValues';
import type { FormikProps } from 'formik';

import { validateField } from 'util/FormsUtils';
import { getEnterpriseGroupSyncPlugin } from 'util/AuthenticationService';
import { Row, Col, Alert } from 'components/bootstrap';
import { Spinner } from 'components/common';
import AuthzRolesDomain from 'domainActions/roles/AuthzRolesDomain';
import Routes from 'routing/Routes';
import type { WizardSubmitPayload } from 'logic/authentication/directoryServices/types';
import Wizard from 'components/common/Wizard';
import type FetchError from 'logic/errors/FetchError';
import type { LoadResponse as LoadBackendResponse } from 'stores/authentication/AuthenticationStore';
import type { PaginatedRoles } from 'actions/roles/AuthzRolesActions';
import type { HistoryFunction } from 'routing/useHistory';
import useHistory from 'routing/useHistory';

import type { WizardStepsState, WizardFormValues, AuthBackendMeta } from './BackendWizardContext';
import BackendWizardContext from './BackendWizardContext';
import { FORM_VALIDATION as SERVER_CONFIG_VALIDATION, STEP_KEY as SERVER_CONFIG_KEY } from './ServerConfigStep';
import { FORM_VALIDATION as USER_SYNC_VALIDATION, STEP_KEY as USER_SYNC_KEY } from './UserSyncStep';
import { STEP_KEY as GROUP_SYNC_KEY } from './GroupSyncStep';
import wizardSteps from './wizardSteps';
import Sidebar from './Sidebar';

const FORMS_VALIDATION = {
  [SERVER_CONFIG_KEY]: SERVER_CONFIG_VALIDATION,
  [USER_SYNC_KEY]: USER_SYNC_VALIDATION,
};

const SubmitAllError = ({ error, backendId }: { error: FetchError; backendId: string | null | undefined }) => (
  <Row>
    <Col xs={9} xsOffset={3}>
      <Alert
        bsStyle="danger"
        style={{ wordBreak: 'break-word' }}
        title={`Failed to ${backendId ? 'edit' : 'create'} authentication service`}>
        {error?.message && (
          <>
            {error.message}
            <br />
            <br />
          </>
        )}
        {error?.additional?.res?.text}
      </Alert>
    </Col>
  </Row>
);

const _formatBackendValidationErrors = (backendErrors: { [inputNameJSON: string]: string[] }) => {
  const backendErrorStrings = mapValues(
    backendErrors,
    (errorArray) => `Server validation error: ${errorArray.join(' ')}`,
  );

  return mapKeys(backendErrorStrings, (_value, key) => camelCase(key));
};

export const _passwordPayload = (
  backendId: string | null | undefined,
  systemUserPassword: string | null | undefined,
) => {
  const _formatPayload = (password) => {
    if (!password) {
      return undefined;
    }

    return password;
  };

  // Only update password on edit if necessary,
  // if a users resets the previously defined password its form value is an empty string
  if (backendId) {
    if (systemUserPassword === undefined) {
      return { keep_value: true };
    }

    if (systemUserPassword === '') {
      return { delete_value: true };
    }

    return { set_value: _formatPayload(systemUserPassword) };
  }

  return _formatPayload(systemUserPassword);
};

const _prepareSubmitPayload =
  (stepsState, getUpdatedFormsValues) =>
  (overrideFormValues: WizardFormValues): WizardSubmitPayload => {
    // We need to ensure that we are using the actual form values
    // It is possible to provide already updated form values, so we do not need to get them twice
    const formValues = overrideFormValues ?? getUpdatedFormsValues();
    const {
      defaultRoles = '',
      description,
      serverHost,
      serverPort,
      systemUserDn,
      systemUserPassword,
      title,
      transportSecurity,
      userUniqueIdAttribute,
      userFullNameAttribute,
      userNameAttribute,
      emailAttributes,
      userSearchBase,
      userSearchPattern,
      verifyCertificates,
    } = formValues;
    const { serviceType, backendId } = stepsState.authBackendMeta;

    return {
      title,
      description,
      default_roles: defaultRoles.split(','),
      config: {
        servers: [{ host: serverHost, port: serverPort }],
        system_user_dn: systemUserDn,
        system_user_password: _passwordPayload(backendId, systemUserPassword),
        transport_security: transportSecurity,
        type: serviceType,
        email_attributes: emailAttributes,
        user_full_name_attribute: userFullNameAttribute,
        user_name_attribute: userNameAttribute,
        user_search_base: userSearchBase,
        user_search_pattern: userSearchPattern,
        user_unique_id_attribute: userUniqueIdAttribute,
        verify_certificates: verifyCertificates,
      },
    };
  };

const _getInvalidStepKeys = (formValues, newBackendValidationErrors, excludedFields): Array<string> => {
  const validation = { ...FORMS_VALIDATION, [GROUP_SYNC_KEY]: {} };
  const enterpriseGroupSyncPlugin = getEnterpriseGroupSyncPlugin();
  const groupSyncValidation = enterpriseGroupSyncPlugin?.validation.GroupSyncValidation;

  if (groupSyncValidation && formValues.synchronizeGroups) {
    validation[GROUP_SYNC_KEY] = groupSyncValidation(formValues.teamSelectionType);
  }

  const invalidStepKeys = Object.entries(validation).map(([stepKey, formValidation]) => {
    const stepHasError = Object.entries(formValidation).some(([fieldName, fieldValidation]) => {
      if (excludedFields[fieldName]) {
        return false;
      }

      if (newBackendValidationErrors?.[fieldName]) {
        return true;
      }

      return !!validateField(fieldValidation)(formValues?.[fieldName]);
    });

    return stepHasError ? stepKey : undefined;
  });

  return compact(invalidStepKeys);
};

const _onSubmitAll = (
  stepsState,
  setSubmitAllError,
  onSubmit,
  getUpdatedFormsValues,
  getSubmitPayload,
  validateSteps,
  shouldUpdateGroupSync,
  history: HistoryFunction,
) => {
  const formValues = getUpdatedFormsValues();
  const invalidStepKeys = validateSteps(formValues, {});

  // Do not submit if there are invalid steps
  if (invalidStepKeys.length >= 1) {
    return Promise.resolve();
  }

  // Reset submit all errors
  setSubmitAllError(null);

  const payload = getSubmitPayload(formValues);
  const _submit = () =>
    onSubmit(payload, formValues, stepsState.authBackendMeta.serviceType, shouldUpdateGroupSync)
      .then(() => {
        history.push(Routes.SYSTEM.AUTHENTICATION.BACKENDS.OVERVIEW);
      })
      .catch((error) => {
        if (typeof error?.additional?.body?.errors === 'object') {
          const backendValidationErrors = _formatBackendValidationErrors(error.additional.body.errors);
          validateSteps(formValues, backendValidationErrors);
        } else {
          setSubmitAllError(error);
        }
      });

  if (stepsState.authBackendMeta.backendGroupSyncIsActive && !formValues.synchronizeGroups) {
    if (
      // eslint-disable-next-line no-alert
      window.confirm('Do you really want to remove the group synchronization config for this authentication service?')
    ) {
      return _submit();
    }

    return Promise.resolve();
  }

  return _submit();
};

const _setDefaultCreateRole = (roles, stepsState, setStepsState) => {
  const defaultCreateRoleId = roles?.find((role) => role.name === 'Reader')?.id;

  if (defaultCreateRoleId) {
    setStepsState({ ...stepsState, formValues: { ...stepsState.formValues, defaultRoles: defaultCreateRoleId } });
  }
};

type Props = {
  authBackendMeta: AuthBackendMeta;
  initialStepKey?: string;
  initialValues: WizardFormValues;
  excludedFields?: { [inputName: string]: boolean };
  help?: { [inputName: string]: React.ReactElement | string | null | undefined };
  onSubmit: (
    payload: WizardSubmitPayload,
    values: WizardFormValues,
    serviceType: AuthBackendMeta['serviceType'],
    shouldUpdateGroupSync?: boolean,
  ) => Promise<LoadBackendResponse>;
};

const _loadRoles = (setPaginatedRoles) => {
  const getUnlimited = { page: 1, perPage: 0, query: '' };

  AuthzRolesDomain.loadRolesPaginated(getUnlimited).then(setPaginatedRoles);
};

const BackendWizard = ({
  initialValues,
  initialStepKey = SERVER_CONFIG_KEY,
  onSubmit,
  authBackendMeta,
  help = undefined,
  excludedFields = {},
}: Props) => {
  const enterpriseGroupSyncPlugin = getEnterpriseGroupSyncPlugin();
  const MatchingGroupsProvider = enterpriseGroupSyncPlugin?.components.MatchingGroupsProvider;
  const [paginatedRoles, setPaginatedRoles] = useState<PaginatedRoles | undefined>();
  const [submitAllError, setSubmitAllError] = useState();
  const [stepsState, setStepsState] = useState<WizardStepsState>({
    activeStepKey: initialStepKey,
    authBackendMeta,
    backendValidationErrors: undefined,
    formValues: initialValues,
    invalidStepKeys: [],
  });
  const history = useHistory();

  const formRefs = {
    [SERVER_CONFIG_KEY]: useRef<FormikProps<WizardFormValues>>(null),
    [USER_SYNC_KEY]: useRef<FormikProps<WizardFormValues>>(null),
    [GROUP_SYNC_KEY]: useRef<FormikProps<WizardFormValues>>(null),
  };

  const wizardContextValue = useMemo(() => ({ ...stepsState, setStepsState }), [stepsState, setStepsState]);

  useEffect(() => _loadRoles(setPaginatedRoles), []);

  useEffect(() => {
    if (paginatedRoles && !authBackendMeta.backendId && !stepsState.formValues.defaultRoles) {
      _setDefaultCreateRole(paginatedRoles.list, stepsState, setStepsState);
    }
  }, [paginatedRoles, authBackendMeta.backendId, stepsState, setStepsState]);

  if (!paginatedRoles) {
    return <Spinner />;
  }

  const _getUpdatedFormsValues = () => {
    const activeForm = formRefs[stepsState.activeStepKey]?.current;

    return { ...stepsState.formValues, ...activeForm?.values };
  };

  const _validateSteps = (formValues: WizardFormValues, newBackendValidationErrors): Array<string> => {
    const invalidStepKeys = _getInvalidStepKeys(formValues, newBackendValidationErrors, excludedFields);

    if (invalidStepKeys.length >= 1) {
      const nextStepKey = invalidStepKeys.includes(stepsState.activeStepKey)
        ? stepsState.activeStepKey
        : invalidStepKeys[0];

      setStepsState({
        ...stepsState,
        backendValidationErrors: newBackendValidationErrors,
        activeStepKey: nextStepKey,
        formValues,
        invalidStepKeys,
      });
    }

    return invalidStepKeys;
  };

  const _getSubmitPayload = _prepareSubmitPayload(stepsState, _getUpdatedFormsValues);

  const _setActiveStepKey = (stepKey: string) => {
    const formValues = _getUpdatedFormsValues();
    let invalidStepKeys = [...stepsState.invalidStepKeys];

    // Only update invalid steps keys, we create them on submit all only
    if (invalidStepKeys.length >= 1) {
      invalidStepKeys = _getInvalidStepKeys(formValues, stepsState.backendValidationErrors, excludedFields);
    }

    setStepsState({
      ...stepsState,
      invalidStepKeys,
      formValues,
      activeStepKey: stepKey,
    });
  };

  const _handleSubmitAll = (shouldUpdateGroupSync?: boolean) =>
    _onSubmitAll(
      stepsState,
      setSubmitAllError,
      onSubmit,
      _getUpdatedFormsValues,
      _getSubmitPayload,
      _validateSteps,
      shouldUpdateGroupSync,
      history,
    );

  const steps = wizardSteps({
    formRefs,
    help,
    handleSubmitAll: _handleSubmitAll,
    invalidStepKeys: stepsState.invalidStepKeys,
    prepareSubmitPayload: _getSubmitPayload,
    excludedFields,
    roles: paginatedRoles.list,
    setActiveStepKey: _setActiveStepKey,
    submitAllError: submitAllError && <SubmitAllError error={submitAllError} backendId={authBackendMeta.backendId} />,
  });

  const wizard = (
    <Wizard
      activeStep={stepsState.activeStepKey}
      hidePreviousNextButtons
      horizontal
      justified
      onStepChange={_setActiveStepKey}
      steps={steps}>
      <Sidebar prepareSubmitPayload={_getSubmitPayload} />
    </Wizard>
  );

  return (
    <BackendWizardContext.Provider value={wizardContextValue}>
      {MatchingGroupsProvider ? (
        <MatchingGroupsProvider prepareSubmitPayload={_getSubmitPayload}>{wizard}</MatchingGroupsProvider>
      ) : (
        wizard
      )}
    </BackendWizardContext.Provider>
  );
};

export default BackendWizard;
