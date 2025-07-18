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
import React, { useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import styled, { css } from 'styled-components';
import debounce from 'lodash/debounce';

import { Button } from 'components/bootstrap';
import Icon from 'components/common/Icon';

const DEFAULT_SIZE = { width: 450, height: 400 };
const DEFAULT_STRING_SIZE = { width: DEFAULT_SIZE.width.toString(), height: DEFAULT_SIZE.height.toString() };
const halfWidth = Math.ceil(window.innerWidth / 2 - DEFAULT_SIZE.width / 2);
const halfHeight = Math.ceil(window.innerHeight / 2 - DEFAULT_SIZE.height / 2);
const stayOnScreenHeight = halfHeight < 0 ? 55 : halfHeight;
const DEFAULT_POSITION = {
  x: halfWidth,
  y: stayOnScreenHeight,
};

const InteractableModalWrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1030;
  pointer-events: none;
`;

const StyledRnd = styled(Rnd)(
  ({ theme }) => css`
    box-shadow:
      0 0 9px ${theme.colors.global.navigationBoxShadow},
      0 0 6px ${theme.colors.global.navigationBoxShadow},
      0 0 3px ${theme.colors.global.navigationBoxShadow};
    background-color: ${theme.colors.global.contentBackground};
    border: 1px solid ${theme.colors.variant.lightest.default};
    border-radius: 3px;
    flex-direction: column;
    display: flex !important;
    pointer-events: auto;
  `,
);

const Content = styled.div`
  flex: 1;
  padding: 0 15px;
`;

const Header = styled.header(
  ({ theme }) => css`
    padding: 6px 12px 9px;
    display: flex;
    align-items: center;
    background-color: ${theme.colors.variant.lightest.default};
    border-bottom: 1px solid ${theme.colors.variant.lighter.default};
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
    cursor: move;
  `,
);

const Title = styled.h3(
  ({ theme }) => css`
    color: ${theme.colors.text.primary};
    flex: 1;
  `,
);

const DragBars = styled(Icon)(
  ({ theme }) => css`
    color: ${theme.colors.variant.darker.default};
    margin-right: 9px;
  `,
);

const CloseButton = styled(Button)(
  ({ theme }) => css`
    && {
      color: ${theme.colors.variant.light.default};

      &:hover {
        color: ${theme.colors.variant.default};
      }
    }
  `,
);

/**
 * A resizable and draggable modal component
 *
 * Can be controlled or uncontrolled, using [`react-rnd`](https://github.com/bokuweb/react-rnd) under the hood
 */

type Coords = { x: number; y: number };
type Size = { width: string; height: string };

type Props = {
  className?: string;
  minHeight?: number;
  minWidth?: number;
  onClose?: () => void;
  onDrag?: (newCoords: Coords) => void;
  onResize?: (newSize: Size) => void;
  position?: Coords;
  size?: Size;
  title?: string;
  wrapperClassName?: string;
};

const InteractableModal = ({
  children = undefined,
  className = undefined,
  minHeight = DEFAULT_SIZE.height,
  minWidth = DEFAULT_SIZE.width,
  onClose = () => {},
  onDrag = () => {},
  onResize = () => {},
  position = DEFAULT_POSITION,
  size = DEFAULT_STRING_SIZE,
  title = '',
  wrapperClassName = undefined,
}: React.PropsWithChildren<Props>) => {
  const dragHandleRef = useRef(null);
  const [dragHandleClassName, setDragHandleClassName] = useState(null);
  const [dragPosition, setDragPosition] = useState(position);
  const [resizeSize, setResizeSize] = useState(size);

  const handleDragStop = (_event, { x, y }: Coords) => {
    setDragPosition({ x, y });
    onDrag({ x, y });
  };

  const handleResizeStop = (_event, direction, ref) => {
    const newSize: Size = {
      width: ref.style.width,
      height: ref.style.height,
    };
    let newCoords = { ...dragPosition };

    switch (direction) {
      case 'left':
      case 'topLeft':
      case 'top':
        newCoords = {
          x: dragPosition.x - (parseFloat(ref.style.width) - parseFloat(resizeSize.width)),
          y: dragPosition.y - (parseFloat(ref.style.height) - parseFloat(resizeSize.height)),
        };

        break;

      case 'bottomLeft':
        newCoords = {
          x: dragPosition.x - (parseFloat(ref.style.width) - parseFloat(resizeSize.width)),
          y: dragPosition.y,
        };

        break;

      case 'topRight':
        newCoords = {
          x: dragPosition.x,
          y: dragPosition.y - (parseFloat(ref.style.height) - parseFloat(resizeSize.height)),
        };

        break;

      default:
        break;
    }

    setResizeSize(newSize);
    onResize(newSize);
    handleDragStop(null, newCoords);
  };

  const handleBrowserResize = debounce(() => {
    const { x: currentX, y: currentY } = dragPosition;
    const { width, height } = resizeSize;
    const { innerWidth, innerHeight } = window;

    const boundingBox = {
      top: 0,
      bottom: parseFloat(height),
      left: 0,
      right: parseFloat(width),
    };

    const modalXWithNewWidth = innerWidth - boundingBox.right;
    const modalYWithNewHeight = innerHeight - boundingBox.bottom;

    const newCoords = {
      x: Math.max(Math.min(modalXWithNewWidth, currentX), boundingBox.left),
      y: Math.max(Math.min(modalYWithNewHeight, currentY), boundingBox.top),
    };

    handleDragStop(null, newCoords);
  }, 150);

  useEffect(() => {
    setDragHandleClassName(dragHandleRef.current.classList[0]);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleBrowserResize, false);

    return () => {
      window.removeEventListener('resize', handleBrowserResize);
    };
  }, [dragPosition, handleBrowserResize]);

  return (
    <InteractableModalWrapper className={wrapperClassName} role="dialog">
      <StyledRnd
        default={{ ...position, ...size }}
        minHeight={minHeight}
        minWidth={minWidth}
        maxHeight={window.innerHeight}
        maxWidth={window.innerWidth}
        dragHandleClassName={dragHandleClassName}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        position={dragPosition}
        size={resizeSize}
        className={className}
        bounds="window">
        <Header ref={dragHandleRef}>
          <Title>
            <DragBars name="drag_indicator" />
            {title}
          </Title>

          <CloseButton bsStyle="link" onClick={onClose} bsSize="small" title="Close">
            <Icon name="close" size="lg" />
          </CloseButton>
        </Header>

        <Content>{children}</Content>
      </StyledRnd>
    </InteractableModalWrapper>
  );
};

export default InteractableModal;
