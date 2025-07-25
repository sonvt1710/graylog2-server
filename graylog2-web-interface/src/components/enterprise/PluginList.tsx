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
import React, { useMemo } from 'react';
import { PluginStore } from 'graylog-web-plugin/plugin';

import { StatusIcon } from 'components/common';
import useProductName from 'brand-customization/useProductName';

import style from './PluginList.css';

const PluginList = () => {
  const productName = useProductName();
  const ENTERPRISE_PLUGINS = useMemo(
    () => ({
      'graylog-plugin-enterprise': `${productName} Plugin Enterprise`,
    }),
    [productName],
  );

  const _formatPlugin = (pluginName: string) => {
    const plugin = PluginStore.get().filter((p) => p.metadata.name === pluginName)[0];

    return (
      <li key={pluginName} className={plugin ? 'text-success' : 'text-danger'}>
        <StatusIcon active={!!plugin} />
        &nbsp;
        {ENTERPRISE_PLUGINS[pluginName]} is {plugin ? 'installed' : 'not installed'}
      </li>
    );
  };

  const enterprisePluginList = Object.keys(ENTERPRISE_PLUGINS).map((pluginName) => _formatPlugin(pluginName));

  return (
    <>
      <p>This is the status of {productName} Enterprise modules in this cluster:</p>
      <ul className={style.enterprisePlugins}>{enterprisePluginList}</ul>
    </>
  );
};

export default PluginList;
