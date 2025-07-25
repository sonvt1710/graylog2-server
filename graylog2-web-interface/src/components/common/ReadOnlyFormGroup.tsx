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
import styled, { css } from 'styled-components';

import { Col, Row, HelpBlock } from 'components/bootstrap';
import { StatusIcon } from 'components/common';

const StyledRow = styled(Row)`
  &:not(:last-child) {
    margin-bottom: 7px;
  }
`;

type Props = {
  label: React.ReactElement | string;
  value: React.ReactNode;
  help?: string;
  className?: string;
};

const LabelCol = styled(Col)(
  ({ theme }) => css`
    font-weight: bold;

    @media (min-width: ${theme.breakpoints.min.md}) {
      text-align: right;
    }
  `,
);

const readableValue = (value: Props['value']): React.ReactNode => {
  if (typeof value === 'boolean') {
    return <StatusIcon active={value} />;
  }

  if (value) {
    return value;
  }

  return '-';
};

/** Displays the provided label and value with the same layout like the FormikFormGroup */
const ReadOnlyFormGroup = ({ label, value, help = undefined, className = undefined }: Props) => (
  <StyledRow className={className}>
    <LabelCol sm={3}>{label}</LabelCol>
    <Col sm={9} className="read-only-value-col">
      {readableValue(value)}
      {help && <HelpBlock>{help}</HelpBlock>}
    </Col>
  </StyledRow>
);

export default ReadOnlyFormGroup;
