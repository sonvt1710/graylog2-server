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
import styled from 'styled-components';

import { Row, Col } from 'components/bootstrap';
import { RelativeTime } from 'components/common';
import { MetricContainer, CounterRate } from 'components/metrics';
import type { PipelineType } from 'components/pipelines/types';

import PipelineForm from './PipelineForm';

const PipelineDl = styled.dl`
  & {
    margin-bottom: 0;
    margin-top: 10px;
  }

  & > dt {
    text-align: left;
    width: 160px;
  }

  & > dt::after {
    content: ':';
  }

  & > dd {
    margin-left: 120px;
  }
`;

type Props = {
  pipeline?: PipelineType;
  create?: boolean;
  onChange: (event) => void;
  onCancel?: () => void;
  disableEdit?: boolean;
};

const PipelineDetails = ({
  pipeline = undefined,
  create = false,
  onChange,
  onCancel = () => {},
  disableEdit = false,
}: Props) => {
  if (create) {
    return <PipelineForm create save={onChange} onCancel={onCancel} modal={false} />;
  }

  return (
    <div>
      <Row>
        <Col md={12}>
          <div className="pull-right">
            <PipelineForm pipeline={pipeline} save={onChange} disableEdit={disableEdit} />
          </div>
          <h2>Details</h2>
          <PipelineDl className="dl-horizontal">
            <dt>Title</dt>
            <dd>{pipeline.title}</dd>
            <dt>Description</dt>
            <dd>{pipeline.description}</dd>
            <dt>Created</dt>
            <dd>
              <RelativeTime dateTime={pipeline.created_at} />
            </dd>
            <dt>Last modified</dt>
            <dd>
              <RelativeTime dateTime={pipeline.modified_at} />
            </dd>
            <dt>Current throughput</dt>
            <dd>
              <MetricContainer name={`org.graylog.plugins.pipelineprocessor.ast.Pipeline.${pipeline.id}.executed`}>
                <CounterRate suffix="msg/s" />
              </MetricContainer>
            </dd>
          </PipelineDl>
        </Col>
      </Row>
      <hr />
    </div>
  );
};

export default PipelineDetails;
