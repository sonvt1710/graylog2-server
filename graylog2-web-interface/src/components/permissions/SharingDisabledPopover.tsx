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

import HoverForHelp from 'components/common/HoverForHelp';

type Props = {
  type: string;
  description?: string;
};

const SharingDisabledPopover = ({ type, description = undefined }: Props) => {
  const getReadableType = (_type: string) => _type.replaceAll('_', ' ');

  return (
    <HoverForHelp title="Sharing not possible" pullRight={false}>
      {description || `Only owners of this ${getReadableType(type)} are allowed to share it.`}
    </HoverForHelp>
  );
};

export default SharingDisabledPopover;
