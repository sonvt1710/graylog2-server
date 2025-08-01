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
import { useCallback } from 'react';

import fetch from 'logic/rest/FetchProvider';
import useDataNodes from 'preflight/hooks/useDataNodes';
import { qualifyUrl } from 'util/URLUtils';
import Button from 'components/bootstrap/Button';
import UserNotification from 'util/UserNotification';

type Props = {
  setIsWaitingForStartup: React.Dispatch<React.SetStateAction<boolean>>;
  children?: React.ReactNode;
  compact?: boolean;
};

const ResumeStartupButton = ({ setIsWaitingForStartup, children = 'Resume startup', compact = false }: Props) => {
  const { data: dataNodes } = useDataNodes();

  const onResumeStartup = useCallback(() => {
    if (
      dataNodes?.length ||
      // eslint-disable-next-line no-alert
      window.confirm(
        'Are you sure you want to resume startup without a running Graylog data node? This will cause the configuration to fall back to using an Opensearch instance on localhost:9200.',
      )
    ) {
      const status = dataNodes?.length ? 'finish' : 'skip';

      fetch('POST', qualifyUrl(`/api/status/${status}-config`), undefined, false)
        .then(() => {
          setIsWaitingForStartup(true);
        })
        .catch((error) => {
          setIsWaitingForStartup(false);

          UserNotification.error(`Resuming startup failed with error: ${error}`, 'Could not resume startup');
        });
    }
  }, [dataNodes?.length, setIsWaitingForStartup]);

  return (
    <Button bsStyle="info" bsSize={compact ? 'xs' : 'small'} onClick={onResumeStartup}>
      {children}
    </Button>
  );
};

export default ResumeStartupButton;
