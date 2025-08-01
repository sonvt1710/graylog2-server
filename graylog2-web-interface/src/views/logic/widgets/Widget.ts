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
import { Map, List } from 'immutable';
import * as Immutable from 'immutable';

import type { TimeRange } from 'views/logic/queries/Query';
import { singleton } from 'logic/singleton';
import generateId from 'logic/generateId';
import isDeepEqual from 'stores/isDeepEqual';
import type { FiltersType, SearchFilter } from 'views/types';
import type { QueryString } from 'views/logic/queries/types';

export type WidgetState = {
  id: string;
  type: string;
  config: any;
  filter: string | null | undefined;
  filters?: FiltersType;
  timerange: TimeRange | null | undefined;
  query: QueryString | null | undefined;
  streams: Array<string>;
  stream_categories: Array<string>;
  description?: string;
  context?: string;
};

interface DeserializesWidgets {
  fromJSON: (value: any) => Widget;
}

const isNullish = (o: any) => o === null || o === undefined;

class Widget {
  _value: WidgetState;

  static Builder: typeof Builder;

  constructor(
    id: string,
    type: string,
    config: any,
    filter?: string,
    timerange?: TimeRange,
    query?: QueryString,
    streams?: Array<string>,
    streamCategories?: Array<string>,
    filters?: FiltersType | Array<SearchFilter>,
    description?: string,
    context?: string,
  ) {
    this._value = {
      id,
      type,
      config,
      filter: filter === null ? undefined : filter,
      filters: List(filters),
      timerange,
      query,
      streams,
      stream_categories: streamCategories,
      description,
      context,
    };
  }

  get id(): string {
    return this._value.id;
  }

  get type(): string {
    return this._value.type;
  }

  get config() {
    return this._value.config;
  }

  get filter(): string | null | undefined {
    return this._value.filter;
  }

  get filters(): FiltersType | null | undefined {
    return this._value.filters;
  }

  get timerange(): TimeRange | null | undefined {
    return this._value.timerange;
  }

  get query(): QueryString | null | undefined {
    return this._value.query;
  }

  get streams(): Array<string> {
    return this._value.streams;
  }

  get streamCategories(): Array<string> {
    return this._value.stream_categories;
  }

  get description(): string | undefined {
    return this._value.description;
  }

  withDescription(description: string) {
    return this.toBuilder().description(description).build();
  }

  get context(): string | undefined {
    return this._value.context;
  }

  // eslint-disable-next-line class-methods-use-this
  get isExportable() {
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  get returnsAllRecords() {
    return false;
  }

  equals(other: any): boolean {
    if (other === undefined) {
      return false;
    }

    if (!(other instanceof Widget)) {
      return false;
    }

    return (
      this.id === other.id &&
      ((isNullish(this.filter) && isNullish(other.filter)) || isDeepEqual(this.filter, other.filter)) &&
      ((isNullish(this.filters) && isNullish(other.filters)) || isDeepEqual(this.filters, other.filters)) &&
      isDeepEqual(this.config, other.config) &&
      isDeepEqual(this.timerange, other.timerange) &&
      isDeepEqual(this.query, other.query) &&
      isDeepEqual(this.streams, other.streams) &&
      isDeepEqual(this.streamCategories, other.streamCategories) &&
      isDeepEqual(this.description, other.description) &&
      isDeepEqual(this.context, other.context)
    );
  }

  duplicate(newId: string): Widget {
    return this.toBuilder().id(newId).build();
  }

  toBuilder(): Builder {
    const { id, type, config, filter, filters, timerange, query, streams, stream_categories, description, context } =
      this._value;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new Builder(
      Map({ id, type, config, filter, filters, timerange, query, streams, stream_categories, description, context }),
    );
  }

  toJSON() {
    const { id, type, config, filter, filters, timerange, query, streams, stream_categories, description, context } =
      this._value;

    return {
      id,
      type: type.toLowerCase(),
      config,
      filter,
      filters,
      timerange,
      query,
      streams,
      stream_categories,
      description,
      context,
    };
  }

  static fromJSON(value: WidgetState): Widget {
    const { id, type, config, filter, filters, timerange, query, streams, stream_categories, description, context } =
      value;
    const implementingClass = Widget.__registrations[type.toLowerCase()];

    if (implementingClass) {
      return implementingClass.fromJSON(value);
    }

    return new Widget(
      id,
      type,
      config,
      filter,
      timerange,
      query,
      streams,
      stream_categories,
      filters,
      description,
      context,
    );
  }

  static empty() {
    return this.builder().build();
  }

  static builder() {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new Builder();
  }

  static __registrations: {
    [key: string]: DeserializesWidgets;
  } = {};

  static registerSubtype(type: string, implementingClass: DeserializesWidgets) {
    this.__registrations[type.toLowerCase()] = implementingClass;
  }
}

class Builder {
  value: Map<string, any>;

  constructor(value: Map<string, any> = Map()) {
    this.value = value;
  }

  id(value: string) {
    this.value = this.value.set('id', value);

    return this;
  }

  newId() {
    return this.id(generateId());
  }

  type(value: string) {
    this.value = this.value.set('type', value);

    return this;
  }

  config(value: any) {
    this.value = this.value.set('config', value);

    return this;
  }

  filter(value: string) {
    this.value = this.value.set('filter', value);

    return this;
  }

  filters(value: FiltersType | null | undefined) {
    this.value = this.value.set('filters', value ? Immutable.List(value) : value);

    return this;
  }

  timerange(value: TimeRange) {
    this.value = this.value.set('timerange', value);

    return this;
  }

  query(value: QueryString) {
    this.value = this.value.set('query', value);

    return this;
  }

  streams(value: Array<string>) {
    this.value = this.value.set('streams', value);

    return this;
  }

  streamCategories(value: Array<string>) {
    this.value = this.value.set('stream_categories', value);

    return this;
  }

  description(value: string) {
    this.value = this.value.set('description', value);

    return this;
  }

  context(value: string) {
    this.value = this.value.set('context', value);

    return this;
  }

  build(): Widget {
    const {
      id,
      type,
      config,
      filter,
      filters,
      timerange,
      query,
      streams,
      stream_categories: streamCategories,
      description,
      context,
    } = this.value.toObject();

    return new Widget(
      id,
      type,
      config,
      filter,
      timerange,
      query,
      streams,
      streamCategories,
      filters,
      description,
      context,
    );
  }
}

export const widgetAttributesForComparison: Array<keyof Widget> = [
  'id',
  'config',
  'filter',
  'timerange',
  'query',
  'streams',
  'streamCategories',
  'filters',
];

Widget.Builder = Builder;

const SingletonWidget = singleton('views.logic.widgets.Widget', () => Widget);
// eslint-disable-next-line @typescript-eslint/no-redeclare
type SingletonWidget = InstanceType<typeof Widget>;

export default SingletonWidget;
