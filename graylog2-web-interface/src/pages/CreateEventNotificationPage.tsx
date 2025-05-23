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
import React from 'react';

import { Col, Row } from 'components/bootstrap';
import { DocumentTitle, PageHeader } from 'components/common';
import Routes from 'routing/Routes';
import DocsHelper from 'util/DocsHelper';
import { isPermitted } from 'util/PermissionsMixin';
import EventNotificationFormContainer from 'components/event-notifications/event-notification-form/EventNotificationFormContainer';
import EventsPageNavigation from 'components/events/EventsPageNavigation';
import useCurrentUser from 'hooks/useCurrentUser';
import useHistory from 'routing/useHistory';
import PageDescription from 'components/event-notifications/PageDescription';

const CreateEventDefinitionPage = () => {
  const currentUser = useCurrentUser();
  const history = useHistory();

  if (!isPermitted(currentUser.permissions, 'eventnotifications:create')) {
    history.push(Routes.NOTFOUND);
  }

  return (
    <DocumentTitle title="New Notification">
      <EventsPageNavigation />
      <PageHeader
        title="New Notification"
        documentationLink={{
          title: 'Alerts documentation',
          path: DocsHelper.PAGES.ALERTS,
        }}>
        <PageDescription />
      </PageHeader>

      <Row className="content">
        <Col md={12}>
          <EventNotificationFormContainer action="create" />
        </Col>
      </Row>
    </DocumentTitle>
  );
};

export default CreateEventDefinitionPage;
