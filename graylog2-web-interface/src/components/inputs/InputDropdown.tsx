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
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import * as Immutable from 'immutable';

import { Button, Input } from 'components/bootstrap';
import Spinner from 'components/common/Spinner';
import useInputTypes from 'components/inputs/useInputTypes';

const LoaderContainer = styled.div`
  display: flex;
  flex-wrap: wrap;

  .form-group {
    margin: 0 15px 0 0;
  }
`;

const StyledInputDropdown = styled(Input)`
  min-width: 400px;
`;

const PLACEHOLDER = 'placeholder';

type InputType = {
  id: string;
  title: string;
  type: string;
};

const InputOption = ({ input }: { input: InputType }) => {
  const inputTypes = useInputTypes();
  const inputType = inputTypes[input.type] ?? 'Unknown Input Type';

  return <option value={input.id}>{`${input.title} (${inputType})`}</option>;
};

const _formatInput = (input: InputType) => <InputOption key={input.id} input={input} />;

const _sortByTitle = (input1: InputType, input2: InputType) => input1.title.localeCompare(input2.title);

const StaticInput = ({ input }: { input: InputType }) => (
  <StyledInputDropdown id={`${input.type}-select`} type="select" disabled>
    <InputOption input={input} />
  </StyledInputDropdown>
);

type Props = {
  disabled?: boolean;
  inputs?: Immutable.Map<string, InputType>;
  preselectedInputId?: string;
  onLoadMessage?: (inputId: string) => any;
  title: string;
};

const InputDropdown = ({
  disabled = false,
  inputs = Immutable.Map(),
  onLoadMessage = () => {},
  preselectedInputId = undefined,
  title,
}: Props) => {
  const [selectedInput, setSelectedInput] = useState(preselectedInputId || PLACEHOLDER);
  const onSelectedInputChange = useCallback((event) => setSelectedInput(event.target.value), []);
  const _onLoadMessage = useCallback(() => onLoadMessage(selectedInput), [onLoadMessage, selectedInput]);
  const preselectedInput = useMemo(() => inputs?.get(preselectedInputId), [inputs, preselectedInputId]);

  // When an input is pre-selected, show a static dropdown
  if (preselectedInput) {
    return (
      <LoaderContainer>
        <StaticInput input={preselectedInput} />

        <Button bsStyle="info" disabled={selectedInput === PLACEHOLDER} onClick={_onLoadMessage}>
          {title}
        </Button>
      </LoaderContainer>
    );
  }

  if (inputs) {
    const inputOptions = inputs.sort(_sortByTitle).map(_formatInput);

    return (
      <LoaderContainer>
        <StyledInputDropdown
          id="placeholder-select"
          type="select"
          aria-label="server input select"
          value={selectedInput}
          onChange={onSelectedInputChange}
          placeholder={PLACEHOLDER}>
          <option value={PLACEHOLDER}>Select an Input</option>
          {inputOptions.toArray()}
        </StyledInputDropdown>

        <Button bsStyle="info" disabled={disabled || selectedInput === PLACEHOLDER} onClick={_onLoadMessage}>
          {title}
        </Button>
      </LoaderContainer>
    );
  }

  return <Spinner />;
};

export default InputDropdown;
