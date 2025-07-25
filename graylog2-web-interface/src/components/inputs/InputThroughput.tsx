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
/* eslint-disable no-restricted-globals */
import React from 'react';
import numeral from 'numeral';
import styled, { css } from 'styled-components';

import NumberUtils from 'util/NumberUtils';
import { Icon, LinkToNode, Spinner } from 'components/common';
import type { ClusterMetric } from 'stores/metrics/MetricsStore';
import { MetricsActions, MetricsStore } from 'stores/metrics/MetricsStore';
import type { Input } from 'components/messageloaders/Types';
import connect from 'stores/connect';

const InputIO = styled.span(
  ({ theme }) => css`
    .total {
      color: ${theme.colors.gray[70]};
    }

    .value {
      font-family: ${theme.fonts.family.monospace};
    }

    .persec {
      margin-left: 3px;
    }

    .channel-direction {
      position: relative;
      left: -1px;
    }

    .channel-direction-down {
      position: relative;
      top: 1px;
    }

    .channel-direction-up {
      position: relative;
      top: -1px;
    }
  `,
);

const formatCount = (count: number) => numeral(count).format('0,0');

const getValueFromMetric = (metric) => {
  if (metric === null || metric === undefined) {
    return undefined;
  }

  switch (metric.type) {
    case 'meter':
      return metric.metric.rate.mean;
    case 'gauge':
      return metric.metric.value;
    case 'counter':
      return metric.metric.count;
    default:
      return undefined;
  }
};

const Connections = ({ openConnections, totalConnections }: { openConnections: number; totalConnections: number }) => (
  <span>
    Active connections: <span className="active">{formatCount(openConnections)} </span>(
    <span className="total">{formatCount(totalConnections)}</span> total)
    <br />
  </span>
);

const NetworkStats = ({ writtenBytes1Sec, writtenBytesTotal, readBytes1Sec, readBytesTotal }) => (
  <InputIO>
    <span>Network IO: </span>
    <span className="persec">
      <Icon name="arrow_drop_down" className="channel-direction channel-direction-down" />
      <span className="rx value">{NumberUtils.formatBytes(readBytes1Sec)} </span>

      <Icon name="arrow_drop_up" className="channel-direction channel-direction-up" />
      <span className="tx value">{NumberUtils.formatBytes(writtenBytes1Sec)}</span>
    </span>

    <span className="total">
      <span> (total: </span>
      <Icon name="arrow_drop_down" className="channel-direction channel-direction-down" />
      <span className="rx value">{NumberUtils.formatBytes(readBytesTotal)} </span>

      <Icon name="arrow_drop_up" className="channel-direction channel-direction-up" />
      <span className="tx value">{NumberUtils.formatBytes(writtenBytesTotal)}</span>
      <span> )</span>
    </span>
    <br />
  </InputIO>
);

type Props = {
  input: Input;
  metrics: ClusterMetric;
};
type State = {
  showDetails: boolean;
};

class InputThroughput extends React.Component<Props, State> {
  constructor(props: Readonly<Props>) {
    super(props);

    this.state = {
      showDetails: false,
    };
  }

  UNSAFE_componentWillMount() {
    this._metricNames().forEach((metricName) => MetricsActions.addGlobal(metricName));
  }

  componentWillUnmount() {
    this._metricNames().forEach((metricName) => MetricsActions.removeGlobal(metricName));
  }

  _toggleShowDetails = (evt) => {
    evt.preventDefault();

    this.setState(({ showDetails }) => ({ showDetails: !showDetails }));
  };

  _formatNodeDetails(nodeId, metrics) {
    const { input } = this.props;
    const openConnections = getValueFromMetric(metrics[this._prefix('open_connections')]);
    const totalConnections = getValueFromMetric(metrics[this._prefix('total_connections')]);
    const emptyMessages = getValueFromMetric(metrics[this._prefix('emptyMessages')]);
    const writtenBytes1Sec = getValueFromMetric(metrics[this._prefix('written_bytes_1sec')]);
    const writtenBytesTotal = getValueFromMetric(metrics[this._prefix('written_bytes_total')]);
    const readBytes1Sec = getValueFromMetric(metrics[this._prefix('read_bytes_1sec')]);
    const readBytesTotal = getValueFromMetric(metrics[this._prefix('read_bytes_total')]);

    return (
      <span key={input.id + nodeId}>
        <LinkToNode nodeId={nodeId} />
        <br />
        {!isNaN(writtenBytes1Sec) && (
          <NetworkStats
            writtenBytes1Sec={writtenBytes1Sec}
            writtenBytesTotal={writtenBytesTotal}
            readBytes1Sec={readBytes1Sec}
            readBytesTotal={readBytesTotal}
          />
        )}
        {!isNaN(openConnections) && (
          <Connections openConnections={openConnections} totalConnections={totalConnections} />
        )}
        {!isNaN(emptyMessages) && (
          <span>
            Empty messages discarded: {formatCount(emptyMessages)}
            <br />
          </span>
        )}
        {isNaN(writtenBytes1Sec) && isNaN(openConnections) && <span>No metrics available for this node</span>}
        <br />
      </span>
    );
  }

  _formatAllNodeDetails(metrics) {
    return (
      <span>
        <hr key="separator" />
        {Object.keys(metrics).map((nodeId) => this._formatNodeDetails(nodeId, metrics[nodeId]))}
      </span>
    );
  }

  _calculateMetrics(metrics) {
    const result = {};

    this._metricNames().forEach((metricName) => {
      result[metricName] = Object.keys(metrics).reduce((previous, nodeId) => {
        if (!metrics[nodeId][metricName]) {
          return previous;
        }

        const _value = getValueFromMetric(metrics[nodeId][metricName]);

        if (_value !== undefined) {
          return isNaN(previous) ? _value : previous + _value;
        }

        return previous;
      }, NaN);
    });

    return result;
  }

  _prefix(metric) {
    const { input } = this.props;

    return `${input.type}.${input.id}.${metric}`;
  }

  _metricNames() {
    return [
      this._prefix('incomingMessages'),
      this._prefix('emptyMessages'),
      this._prefix('open_connections'),
      this._prefix('total_connections'),
      this._prefix('written_bytes_1sec'),
      this._prefix('written_bytes_total'),
      this._prefix('read_bytes_1sec'),
      this._prefix('read_bytes_total'),
    ];
  }

  render() {
    const { metrics } = this.props;
    const { showDetails } = this.state;
    const { input } = this.props;

    if (!metrics) {
      return <Spinner />;
    }

    const calculatedMetrics = this._calculateMetrics(metrics);
    const incomingMessages = calculatedMetrics[this._prefix('incomingMessages')];
    const emptyMessages = calculatedMetrics[this._prefix('emptyMessages')];
    const openConnections = calculatedMetrics[this._prefix('open_connections')];
    const totalConnections = calculatedMetrics[this._prefix('total_connections')];
    const writtenBytes1Sec = calculatedMetrics[this._prefix('written_bytes_1sec')];
    const writtenBytesTotal = calculatedMetrics[this._prefix('written_bytes_total')];
    const readBytes1Sec = calculatedMetrics[this._prefix('read_bytes_1sec')];
    const readBytesTotal = calculatedMetrics[this._prefix('read_bytes_total')];

    return (
      <div className="graylog-input-metrics">
        <h3>Throughput / Metrics</h3>
        <span>
          {isNaN(incomingMessages) && isNaN(writtenBytes1Sec) && isNaN(openConnections) && (
            <i>No metrics available for this input</i>
          )}
          {!isNaN(incomingMessages) && (
            <span>
              1 minute average rate: {formatCount(incomingMessages)} msg/s
              <br />
            </span>
          )}
          {!isNaN(writtenBytes1Sec) && (
            <NetworkStats
              writtenBytes1Sec={writtenBytes1Sec}
              writtenBytesTotal={writtenBytesTotal}
              readBytes1Sec={readBytes1Sec}
              readBytesTotal={readBytesTotal}
            />
          )}
          {!isNaN(openConnections) && (
            <Connections openConnections={openConnections} totalConnections={totalConnections} />
          )}
          {!isNaN(emptyMessages) && (
            <span>
              Empty messages discarded: {formatCount(emptyMessages)}
              <br />
            </span>
          )}
          {!isNaN(writtenBytes1Sec) && input.global && (
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
            <a href="" onClick={this._toggleShowDetails}>
              {showDetails ? 'Hide' : 'Show'} details
            </a>
          )}
          {!isNaN(writtenBytes1Sec) && showDetails && this._formatAllNodeDetails(metrics)}
        </span>
      </div>
    );
  }
}

export default connect(InputThroughput, { metrics: MetricsStore }, (props) => ({
  ...props,
  metrics: props.metrics?.metrics,
}));
