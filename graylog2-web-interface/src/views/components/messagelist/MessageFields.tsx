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

import { MessageDetailsDefinitionList } from 'components/common';
import MessageField from 'views/components/messagelist/MessageField';
import FieldType from 'views/logic/fieldtypes/FieldType';
import type { FieldTypeMappingsList } from 'views/logic/fieldtypes/types';
import FieldTypeMapping from 'views/logic/fieldtypes/FieldTypeMapping';

import type { Message } from './Types';

type Props = {
  message: Message;
  fields: FieldTypeMappingsList;
};

const MessageDetailsDL = styled(MessageDetailsDefinitionList)(
  ({ theme }) => css`
    color: ${theme.colors.text.primary};

    dd {
      &:not(:last-child) {
        border-bottom: 1px solid ${theme.colors.gray[90]};
      }
    }
  `,
);

const MessageFields = ({ message, fields }: Props) => {
  const formattedFields = message.formatted_fields;
  const renderedFields = Object.keys(formattedFields)
    .sort()
    .map((key) => {
      const { type } = fields.find((t) => t.name === key, undefined, FieldTypeMapping.create(key, FieldType.Unknown));

      return <MessageField fieldName={key} fieldType={type} message={message} value={formattedFields[key]} />;
    });

  return <MessageDetailsDL className="message-details-fields">{renderedFields}</MessageDetailsDL>;
};

export default MessageFields;
