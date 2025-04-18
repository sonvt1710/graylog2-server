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
import styled, { css } from 'styled-components';

import { LinkContainer, Link } from 'components/common/router';
import { MetricContainer, CounterRate } from 'components/metrics';
import { RelativeTime, OverlayTrigger, CountBadge, Spinner } from 'components/common';
import { Button, ButtonToolbar, Label } from 'components/bootstrap';
import Routes from 'routing/Routes';
import type { RuleType, PipelineSummary } from 'stores/rules/RulesStore';
import StringUtils from 'util/StringUtils';
import useGetPermissionsByScope from 'hooks/useScopePermissions';

type Props = {
  rule: RuleType;
  usingPipelines: Array<PipelineSummary>;
  onDelete: (rule: RuleType) => () => void;
};
const STRING_SIZE_LIMIT = 30;

const LimitedTd = styled.td(
  ({ theme }) => css`
    max-width: 250px;
    min-width: 250px;

    @media screen and (max-width: ${theme.breakpoints.max.md}) {
      white-space: normal !important;
    }
  `,
);
const DefaultLabel = styled(Label)(
  ({ theme }) => css`
    display: inline-flex;
    margin-left: ${theme.spacings.xxs};
    vertical-align: inherit;
  `,
);

const RuleListEntry = ({ rule, onDelete, usingPipelines }: Props) => {
  const { loadingScopePermissions, scopePermissions } = useGetPermissionsByScope(rule);
  const { id, title, description, created_at, modified_at } = rule;
  const pipelinesLength = usingPipelines.length;
  const isRuleBuilder = rule.rule_builder ? '?rule_builder=true' : '';
  const isManaged = scopePermissions && !scopePermissions?.is_mutable;
  const actions = (
    <ButtonToolbar>
      <LinkContainer to={`${Routes.SYSTEM.PIPELINES.RULE(id)}${isRuleBuilder}`}>
        <Button bsSize="xsmall">Edit</Button>
      </LinkContainer>
      <Button bsStyle="danger" bsSize="xsmall" onClick={onDelete(rule)} title="Delete rule">
        Delete
      </Button>
    </ButtonToolbar>
  );

  const _showPipelines = (pipelines: Array<PipelineSummary>) =>
    pipelines.map(({ id: pipelineId, title: pipelineTitle }, index) => (
      <React.Fragment key={pipelineId}>
        {pipelineTitle.length > STRING_SIZE_LIMIT ? (
          <OverlayTrigger placement="top" trigger="hover" overlay={pipelineTitle} rootClose>
            <Link to={Routes.SYSTEM.PIPELINES.PIPELINE(pipelineId)}>
              {StringUtils.truncateWithEllipses(pipelineTitle, STRING_SIZE_LIMIT)}
            </Link>
          </OverlayTrigger>
        ) : (
          <Link to={Routes.SYSTEM.PIPELINES.PIPELINE(pipelineId)}>{pipelineTitle}</Link>
        )}
        {index < pipelinesLength - 1 && ',  '}
      </React.Fragment>
    ));
  if (loadingScopePermissions) {
    return <Spinner text="Loading Rule" />;
  }

  return (
    <tr key={title}>
      <td>
        <Link to={`${Routes.SYSTEM.PIPELINES.RULE(id)}${isRuleBuilder}`}>{title}</Link>
        {isManaged && (
          <DefaultLabel bsStyle="default" bsSize="xsmall">
            Managed by Application
          </DefaultLabel>
        )}
      </td>
      <td className="limited">{description}</td>
      <td className="limited">
        <RelativeTime dateTime={created_at} />
      </td>
      <td className="limited">
        <RelativeTime dateTime={modified_at} />
      </td>
      <td>
        <MetricContainer name={`org.graylog.plugins.pipelineprocessor.ast.Rule.${id}.executed`} zeroOnMissing>
          <CounterRate suffix="msg/s" />
        </MetricContainer>
      </td>
      <td>
        <MetricContainer name={`org.graylog.plugins.pipelineprocessor.ast.Rule.${id}.failed`}>
          <CounterRate showTotal suffix="errors/s" hideOnMissing />
        </MetricContainer>
      </td>
      <LimitedTd>
        <CountBadge>{pipelinesLength}</CountBadge> {_showPipelines(usingPipelines)}
      </LimitedTd>
      <td className="actions">{actions}</td>
    </tr>
  );
};

export default RuleListEntry;
