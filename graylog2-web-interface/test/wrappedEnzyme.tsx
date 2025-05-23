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
/// <reference types="jest-enzyme" />
import type * as React from 'react';
import type { ReactWrapper, ShallowWrapper } from 'enzyme';
import { configure, mount, shallow } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import 'jest-styled-components';

import WrappingContainer from './WrappingContainer';

configure({ adapter: new Adapter() });

export const shallowWithWrapper = <T,>(Component: React.ReactElement<T>, options: any = {}): ShallowWrapper<T> =>
  shallow(Component, {
    wrappingComponent: WrappingContainer,
    ...options,
  });

export const mountWithWrapper = <T,>(Component: React.ReactElement<T>, options: any = {}): ReactWrapper<T> =>
  mount(Component, {
    wrappingComponent: WrappingContainer,
    ...options,
  });

export * from 'enzyme';
export { mountWithWrapper as mount, shallowWithWrapper as shallow, mount as mountUnwrapped };
