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
import { useMemo, useState, useEffect, useCallback } from 'react';
import { v4 as uuid } from 'uuid';

import type { RefreshConfig } from 'views/components/contexts/AutoRefreshContext';
import AutoRefreshContext from 'views/components/contexts/AutoRefreshContext';

const AutoRefreshProvider = ({
  children = null,
  onRefresh,
  defaultRefreshConfig = null,
}: React.PropsWithChildren<{ defaultRefreshConfig?: RefreshConfig | null; onRefresh: () => void }>) => {
  const [refreshConfig, setRefreshConfig] = useState<RefreshConfig | null>(defaultRefreshConfig);
  const [animationId, setAnimationId] = useState<string | null>(defaultRefreshConfig?.enabled ? uuid() : null);
  const startAutoRefresh = useCallback((interval: number) => {
    if (interval > 0) {
      setRefreshConfig({ enabled: true, interval });
      setAnimationId(uuid());
    }
  }, []);
  const stopAutoRefresh = useCallback(() => {
    setRefreshConfig((cur) => ({ ...cur, enabled: false }));
    setAnimationId(null);
  }, []);

  useEffect(() => {
    let refreshInterval = null;

    if (refreshConfig?.enabled && refreshConfig?.interval > 0) {
      refreshInterval = setInterval(() => {
        setAnimationId(uuid());
        onRefresh();
      }, refreshConfig?.interval);
    }

    return () => {
      clearInterval(refreshInterval);
    };
  }, [refreshConfig?.enabled, refreshConfig?.interval, onRefresh, animationId]);

  const restartAutoRefresh = useCallback(() => {
    if (refreshConfig?.enabled) {
      setAnimationId(uuid());
    }
  }, [refreshConfig?.enabled]);

  const contextValue = useMemo(
    () => ({
      refreshConfig,
      startAutoRefresh,
      stopAutoRefresh,
      animationId,
      restartAutoRefresh,
    }),
    [animationId, refreshConfig, restartAutoRefresh, startAutoRefresh, stopAutoRefresh],
  );

  return <AutoRefreshContext.Provider value={contextValue}>{children}</AutoRefreshContext.Provider>;
};

export default AutoRefreshProvider;
