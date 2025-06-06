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

import type { GradientColor, StaticColor } from 'views/logic/views/formatting/highlighting/HighlightingColor';
import type HighlightingColor from 'views/logic/views/formatting/highlighting/HighlightingColor';
import scaleForGradient from 'views/components/sidebar/highlighting/Scale';

const ColorPreviewBase = styled.div`
  height: 25px;
  width: 25px;
  margin-right: 0.4rem;

  border-radius: 4px;
  border: 1px solid rgb(0 126 255 / 24%);
`;

const StaticColorPreview = styled(ColorPreviewBase)(
  ({ color }) => css`
    background-color: ${color};
  `,
);

const colorsForGradient = (gradient: string, count = 5): Array<string> => scaleForGradient(gradient).colors(count);

export const GradientColorPreview = styled(ColorPreviewBase)<{ $gradient: string }>(({ $gradient }) => {
  const colors = colorsForGradient($gradient);

  return css`
    border: none;
    background: linear-gradient(
      0deg,
      ${colors.map((color, idx) => `${color} ${idx * (100 / colors.length)}%`).join(', ')}
    );
  `;
});

type Props = {
  color: HighlightingColor;
  onClick?: () => void;
};

const ColorPreview = ({ color, onClick = () => {} }: Props, ref: React.ForwardedRef<HTMLDivElement>) => {
  if (color.type === 'static') {
    return (
      <StaticColorPreview
        ref={ref}
        data-testid="static-color-preview"
        onClick={onClick}
        color={(color as StaticColor).color}
      />
    );
  }

  if (color.type === 'gradient') {
    return <GradientColorPreview ref={ref} onClick={onClick} $gradient={(color as GradientColor).gradient} />;
  }

  throw new Error(`Invalid highlighting color type: ${color}`);
};

export default React.forwardRef(ColorPreview);
