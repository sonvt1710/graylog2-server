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
import { useEffect, useState } from 'react';

import { DocumentTitle, PageHeader, Spinner } from 'components/common';
import ImportExtractors from 'components/extractors/ImportExtractors';
import type { ParamsContext } from 'routing/withParams';
import withParams from 'routing/withParams';
import { InputsActions } from 'stores/inputs/InputsStore';
import type { Input } from 'components/messageloaders/Types';
import useProductName from 'brand-customization/useProductName';
import MarketplaceLink from 'components/support/MarketplaceLink';

type Props = ParamsContext;

const ImportExtractorsPage = ({ params }: Props) => {
  const productName = useProductName();
  const [input, setInput] = useState<Input>();

  useEffect(() => {
    InputsActions.get(params.inputId).then((_input) => setInput(_input));
  }, [params.inputId]);

  const _isLoading = !input;

  if (_isLoading) {
    return <Spinner />;
  }

  return (
    <DocumentTitle title={`Import extractors to ${input.title}`}>
      <div>
        <PageHeader
          title={
            <span>
              Import extractors to <em>{input.title}</em>
            </span>
          }>
          <span>
            Exported extractors can be imported to an input.{' '}
            <MarketplaceLink
              prefix={`All you need is the JSON export of extractors from any
            other ${productName} setup or from`}
            />
          </span>
        </PageHeader>
        <ImportExtractors input={input} />
      </div>
    </DocumentTitle>
  );
};

export default withParams(ImportExtractorsPage);
