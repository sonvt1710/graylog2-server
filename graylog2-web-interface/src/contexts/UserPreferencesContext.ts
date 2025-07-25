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
import type { ColorScheme } from '@graylog/sawmill';

import type { PREFERENCES_THEME_MODE } from 'theme/constants';

import { singleton } from '../logic/singleton';

export type UserPreferences = {
  enableSmartSearch: boolean;
  updateUnfocussed: boolean;
  searchSidebarIsPinned?: boolean;
  dashboardSidebarIsPinned?: boolean;
  'views.widgetSummary.doNotAskAgain'?: boolean;
  perspective?: string;
  [PREFERENCES_THEME_MODE]?: ColorScheme;
};

export const defaultUserPreferences = {
  enableSmartSearch: true,
  updateUnfocussed: false,
  searchSidebarIsPinned: false,
  dashboardSidebarIsPinned: false,
};

const UserPreferencesContext = React.createContext<UserPreferences>(defaultUserPreferences);
export default singleton('contexts.UserPreferencesContext', () => UserPreferencesContext);
