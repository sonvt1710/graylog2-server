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
import styled, { css } from 'styled-components';

import { LinkContainer } from 'components/common/router';
import { Row, Col, ButtonToolbar, Button } from 'components/bootstrap';
import Routes from 'routing/Routes';
import Spinner from 'components/common/Spinner';
import UserNotification from 'util/UserNotification';
import { DocumentTitle, PageHeader } from 'components/common';
import ContentPacksList from 'components/content-packs/ContentPacksList';
import ContentPackUploadControls from 'components/content-packs/ContentPackUploadControls';
import { ContentPacksActions } from 'stores/content-packs/ContentPacksStore';
import useContentPacks from 'components/content-packs/hooks/useContentPacks';
import MarketplaceLink from 'components/support/MarketplaceLink';

const ConfigurationBundles = styled.div(
  ({ theme }) => css`
    font-size: ${theme.fonts.size.body};
    font-weight: normal;
    margin-top: 15px;
  `,
);

const ContentPacksPage = () => {
  const { data, isInitialLoading, refetch } = useContentPacks();

  const _deleteContentPack = useCallback(
    (contentPackId: string) => {
      // eslint-disable-next-line no-alert
      if (window.confirm('You are about to delete this Content Pack, are you sure?')) {
        ContentPacksActions.delete(contentPackId).then(
          () => {
            UserNotification.success('Content Pack deleted successfully.', 'Success');
            refetch();
          },
          (error) => {
            let err_message = error.message;
            const err_body = error.additional.body;

            if (err_body && err_body.message) {
              err_message = error.additional.body.message;
            }

            UserNotification.error(`Deleting bundle failed: ${err_message}`, 'Error');
          },
        );
      }
    },
    [refetch],
  );

  const _installContentPack = useCallback(
    (contentPackId: string, contentPackRev: string, parameters: unknown) => {
      ContentPacksActions.install(contentPackId, contentPackRev, parameters).then(
        () => {
          UserNotification.success('Content Pack installed successfully.', 'Success');
          refetch();
        },
        (error) => {
          UserNotification.error(`Installing content pack failed with status: ${error}.
         Could not install Content Pack with ID: ${contentPackId}`);
        },
      );
    },
    [refetch],
  );

  if (isInitialLoading) {
    return <Spinner />;
  }

  const { content_packs: contentPacks, content_packs_metadata: contentPackMetadata } = data;

  return (
    <DocumentTitle title="Content Packs">
      <span>
        <PageHeader
          title="Content Packs"
          topActions={<Button bsStyle="info">Content Packs</Button>}
          actions={
            <ButtonToolbar>
              <ContentPackUploadControls />
              <LinkContainer to={Routes.SYSTEM.CONTENTPACKS.CREATE}>
                <Button bsStyle="success">Create a content pack</Button>
              </LinkContainer>
            </ButtonToolbar>
          }>
          <span>
            Content Packs accelerate the set up process for a specific data source. A Content Pack can include
            inputs/extractors, streams, and dashboards.
            <br />
            <MarketplaceLink prefix="Find more Content Packs in" />
          </span>
        </PageHeader>

        <Row className="content">
          <Col md={12}>
            <ConfigurationBundles>
              <ContentPacksList
                contentPacks={contentPacks}
                contentPackMetadata={contentPackMetadata}
                onDeletePack={_deleteContentPack}
                onInstall={_installContentPack}
              />
            </ConfigurationBundles>
          </Col>
        </Row>
      </span>
    </DocumentTitle>
  );
};

export default ContentPacksPage;
