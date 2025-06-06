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
import { forwardRef } from 'react';
import styled, { css } from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import { Button as MantineButton } from '@mantine/core';
import type { ButtonProps } from '@mantine/core';
import type { ComponentPropsWithoutRef, ComponentProps } from 'react';

type StyledMantineButtonProps = ComponentProps<'button'> &
  ButtonProps & {
    theme: DefaultTheme;
  };

const StyledButton = styled(MantineButton)<React.PropsWithChildren<StyledMantineButtonProps>>(
  ({ theme }: StyledMantineButtonProps) => css`
    ${theme.components.button}
  `,
);

interface HTMLButtonProps extends ComponentPropsWithoutRef<'button'> {
  children: React.ReactNode;
}

interface ReactRouterButtonProps {
  children: React.ReactNode;
  component: React.ReactElement;
  to: string;
}

export type Props = { type?: 'submit' | 'button' | 'reset' } & (
  | HTMLButtonProps
  | ReactRouterButtonProps
  | StyledMantineButtonProps
);

const Button = ({ type = 'button', children, ...otherProps }: Props, ref: React.ForwardedRef<HTMLButtonElement>) => (
  <StyledButton type={type} {...otherProps} ref={ref}>
    {children}
  </StyledButton>
);

export default forwardRef(Button);
