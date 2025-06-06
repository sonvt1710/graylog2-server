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

import DocsHelper from 'util/DocsHelper';
import DocumentationLink from 'components/support/DocumentationLink';
import { Col, Row, Alert } from 'components/bootstrap';
import { Icon } from 'components/common';

const PermissionsUpdateInfo = () => (
  <Row className="content">
    <Col xs={12}>
      <Alert bsStyle="info" title="Granting Permissions">
        Granting permissions for an entity like streams and dashboards can be configured using the{' '}
        <b>
          <Icon name="person_add" /> Share
        </b>{' '}
        button of an entity. You can find the button e.g. on the entities overview page. Learn more in the{' '}
        <DocumentationLink page={DocsHelper.PAGES.PERMISSIONS} text="documentation" />.
      </Alert>
    </Col>
  </Row>
);

export default PermissionsUpdateInfo;
