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

import Modal from './Modal';

type Props = {
  backdrop?: boolean;
  bsSize?: 'lg' | 'large' | 'sm' | 'small';
  showModal: boolean;
  onHide: () => void;
  children: React.ReactNode;
};

const BootstrapModalWrapper = ({ showModal, children, onHide, bsSize = undefined, backdrop = undefined }: Props) => (
  <Modal show={showModal} onHide={onHide} bsSize={bsSize} backdrop={backdrop}>
    {children}
  </Modal>
);

export default BootstrapModalWrapper;
