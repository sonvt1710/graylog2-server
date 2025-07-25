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
import findIndex from 'lodash/findIndex';

import { Button, Modal, ButtonToolbar } from 'components/bootstrap';
import { DataTable, SearchForm, ModalSubmit, StatusIcon } from 'components/common';
import BootstrapModalWrapper from 'components/bootstrap/BootstrapModalWrapper';
import ContentPackEditParameter from 'components/content-packs/ContentPackEditParameter';
import ObjectUtils from 'util/ObjectUtils';

import ContentPackParameterListStyle from './ContentPackParameterList.css';
import ContentPackUtils from './ContentPackUtils';

type ContentPackParameterListProps = {
  contentPack: any;
  readOnly?: boolean;
  onDeleteParameter?: (...args: any[]) => void;
  onAddParameter?: (...args: any[]) => void;
  appliedParameter?: any;
};

class ContentPackParameterList extends React.Component<
  ContentPackParameterListProps,
  {
    [key: string]: any;
  }
> {
  static defaultProps = {
    readOnly: false,
    onDeleteParameter: () => {},
    onAddParameter: () => {},
    appliedParameter: {},
  };

  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
      filteredParameters: props.contentPack.parameters || [],
      filter: undefined,
    };
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    const { filter } = this.state;

    this._filterParameters(filter, newProps.contentPack.parameters);
  }

  _parameterApplied = (paramName) => {
    const { appliedParameter } = this.props;

    const entityIds = Object.keys(appliedParameter);

    /* eslint-disable-next-line no-restricted-syntax, guard-for-in */
    for (const i in entityIds) {
      const params = appliedParameter[entityIds[i]];

      if (findIndex(params, { paramName: paramName }) >= 0) {
        return true;
      }
    }

    return false;
  };

  _parameterRowFormatter = (parameter) => {
    const { onDeleteParameter, readOnly } = this.props;
    const parameterApplied = this._parameterApplied(parameter.name);
    const buttonTitle = parameterApplied ? 'Still in use' : 'Delete Parameter';

    return (
      <tr key={parameter.title}>
        <td className={ContentPackParameterListStyle.bigColumns}>{parameter.title}</td>
        <td>{parameter.name}</td>
        <td className={ContentPackParameterListStyle.bigColumns}>{parameter.description}</td>
        <td>{parameter.type}</td>
        <td>{ContentPackUtils.convertToString(parameter)}</td>
        <td>
          <StatusIcon active={parameterApplied} />
        </td>
        {!readOnly && (
          <td>
            <ButtonToolbar>
              <Button
                bsStyle="danger"
                bsSize="xs"
                title={buttonTitle}
                disabled={parameterApplied}
                onClick={() => {
                  onDeleteParameter(parameter);
                }}>
                Delete
              </Button>
              {this._parameterModal(parameter)}
            </ButtonToolbar>
          </td>
        )}
      </tr>
    );
  };

  _filterParameters = (filter, parametersArg?) => {
    const { contentPack } = this.props;
    const parameters = ObjectUtils.clone(parametersArg || contentPack.parameters);

    if (!filter || filter.length <= 0) {
      this.setState({ filteredParameters: parameters, filter: undefined });

      return;
    }

    const regexp = RegExp(filter, 'i');
    const filteredParameters = parameters.filter(
      (parameter) => regexp.test(parameter.title) || regexp.test(parameter.description) || regexp.test(parameter.name),
    );

    this.setState({ filteredParameters: filteredParameters, filter: filter });
  };

  _parameterModal(parameter?) {
    let editParameter;

    const { contentPack, onAddParameter } = this.props;
    const { showModal } = this.state;

    const closeModal = () => {
      this.setState({ showModal: false });
    };

    const openModal = () => {
      this.setState({ showModal: true });
    };

    const addParameter = () => {
      editParameter.addNewParameter();
    };

    const size = parameter ? 'xsmall' : 'small';
    const titleName = parameter ? 'Edit parameter' : 'Create parameter';
    const triggerButtonName = parameter ? 'Edit' : 'Create parameter';

    const modal = (
      <BootstrapModalWrapper showModal={showModal} onHide={closeModal} bsSize="large">
        <Modal.Header>
          <Modal.Title>Parameter</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ContentPackEditParameter
            ref={(node) => {
              editParameter = node;
            }}
            parameters={contentPack.parameters}
            onUpdateParameter={(newParameter) => {
              onAddParameter(newParameter, parameter);
              closeModal();
            }}
            parameterToEdit={parameter}
          />
        </Modal.Body>
        <Modal.Footer>
          <ModalSubmit onSubmit={addParameter} onCancel={closeModal} submitButtonText={titleName} />
        </Modal.Footer>
      </BootstrapModalWrapper>
    );

    return (
      <>
        <Button bsStyle="info" bsSize={size} title="Edit Modal" onClick={openModal}>
          {triggerButtonName}
        </Button>
        {modal}
      </>
    );
  }

  render() {
    const { readOnly } = this.props;
    const { filteredParameters } = this.state;

    const headers = readOnly
      ? ['Title', 'Name', 'Description', 'Value Type', 'Default Value', 'Used']
      : ['Title', 'Name', 'Description', 'Value Type', 'Default Value', 'Used', 'Action'];

    return (
      <div>
        <h2>Parameters list</h2>
        <br />
        {!readOnly && this._parameterModal()}
        {!readOnly && (
          <span>
            <br />
            <br />
          </span>
        )}
        <SearchForm
          onSearch={this._filterParameters}
          onReset={() => {
            this._filterParameters('');
          }}
        />
        <DataTable
          id="parameter-list"
          headers={headers}
          className={ContentPackParameterListStyle.scrollable}
          sortByKey="title"
          noDataText="To use parameters for content packs, at first a parameter must be created and can then be applied to a entity."
          filterKeys={[]}
          rows={filteredParameters}
          dataRowFormatter={this._parameterRowFormatter}
        />
      </div>
    );
  }
}

export default ContentPackParameterList;
