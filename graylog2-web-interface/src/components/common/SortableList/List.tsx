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

import type { CustomContentRender, CustomListItemRender, ListItemType } from './types';
import SortableListItem from './SortableListItem';

export type Props<ItemType extends ListItemType> = {
  alignItemContent?: 'flex-start' | 'center';
  customContentRender?: CustomContentRender<ItemType>;
  customListItemRender?: CustomListItemRender<ItemType>;
  disableDragging?: boolean;
  displayOverlayInPortal?: boolean;
  items: Array<ItemType> | undefined;
};

const List = <ItemType extends ListItemType>({
  alignItemContent = undefined,
  customContentRender = undefined,
  customListItemRender = undefined,
  disableDragging = false,
  displayOverlayInPortal = false,
  items,
}: Props<ItemType>) => (
  <>
    {items?.map((item, index) => (
      <SortableListItem
        alignItemContent={alignItemContent}
        item={item}
        index={index}
        key={item.id}
        customContentRender={customContentRender}
        customListItemRender={customListItemRender}
        disableDragging={disableDragging}
        displayOverlayInPortal={displayOverlayInPortal}
      />
    ))}
  </>
);

export default React.memo(List);
