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

const BackgroundColor = styled.span<{ $color: string }>(
  ({ theme, $color }) => css`
    background-color: ${$color};
    color: ${theme.utils.contrastingColor($color)};
    width: fit-content;
  `,
);

type Props = {
  color: string;
};

const Highlight = ({ children = undefined, color }: React.PropsWithChildren<Props>) => (
  <BackgroundColor $color={color}>{children}</BackgroundColor>
);

export default Highlight;
