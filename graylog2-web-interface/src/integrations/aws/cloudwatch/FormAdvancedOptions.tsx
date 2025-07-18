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
import React, { useContext } from 'react';

import ThrottlingCheckbox from 'integrations/components/ThrottlingCheckbox';
import { Input } from 'components/bootstrap';
import { FormDataContext } from 'integrations/aws/context/FormData';
import { AdvancedOptionsContext } from 'integrations/aws/context/AdvancedOptions';
import AdditionalFields from 'integrations/aws/common/AdditionalFields';

type FormAdvancedOptionsProps = {
  onChange: (...args: any[]) => void;
};

const FormAdvancedOptions = ({ onChange }: FormAdvancedOptionsProps) => {
  const { formData } = useContext(FormDataContext);
  const { isAdvancedOptionsVisible, setAdvancedOptionsVisibility } = useContext(AdvancedOptionsContext);

  const { awsCloudWatchBatchSize, overrideSource, awsCloudWatchThrottleEnabled, awsCloudWatchAddFlowLogPrefix } =
    formData;

  const handleToggle = (visible) => {
    setAdvancedOptionsVisibility(visible);
  };

  return (
    <AdditionalFields title="Advanced Options" visible={isAdvancedOptionsVisible} onToggle={handleToggle}>
      <ThrottlingCheckbox
        id="awsCloudWatchThrottleEnabled"
        defaultChecked={awsCloudWatchThrottleEnabled?.value}
        onChange={onChange}
      />

      <Input
        id="awsCloudWatchAddFlowLogPrefix"
        type="checkbox"
        value="enable-logprefix"
        defaultChecked={awsCloudWatchAddFlowLogPrefix && awsCloudWatchAddFlowLogPrefix.value}
        onChange={onChange}
        label="Add Flow Log field name prefix"
        help='Add field with the Flow Log prefix e. g. "src_addr" -> "flow_log_src_addr".'
      />

      <Input
        id="overrideSource"
        type="text"
        value={overrideSource?.value}
        onChange={onChange}
        label="Override Source (optional)"
        help="The message source is set to aws-kinesis-raw-logs by default. If desired, you may override it with a custom value."
      />

      <Input
        id="awsCloudWatchBatchSize"
        type="number"
        value={awsCloudWatchBatchSize.value || awsCloudWatchBatchSize.defaultValue}
        onChange={onChange}
        label="Kinesis Record batch size"
        help="The number of Kinesis records to fetch at a time. Each record may be up to 1MB in size. The AWS default is 10,000. Enter a smaller value to process smaller chunks at a time."
      />
    </AdditionalFields>
  );
};

export default FormAdvancedOptions;
