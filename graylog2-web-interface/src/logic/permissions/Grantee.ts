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
import * as Immutable from 'immutable';

import type { GranteeType } from 'logic/permissions/types';

import type { GranteeInterface } from './GranteeInterface';

type InternalState = GranteeType;

export default class Grantee implements GranteeInterface {
  _value: InternalState;

  constructor(id: InternalState['id'], title: InternalState['title'], type: InternalState['type']) {
    this._value = { id, title, type };
  }

  get id(): InternalState['id'] {
    return this._value.id;
  }

  get title(): InternalState['title'] {
    return this._value.title;
  }

  get type(): InternalState['type'] {
    return this._value.type;
  }

  toBuilder(): Builder {
    const { id, title, type } = this._value;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new Builder(Immutable.Map({ id, title, type }));
  }

  toJSON() {
    const { id, title, type } = this._value;

    return { id, title, type };
  }

  static fromJSON(value: GranteeType): Grantee {
    const { id, title, type } = value;

    return Grantee.builder().id(id).title(title).type(type).build();
  }

  static builder(): Builder {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new Builder();
  }
}

type InternalBuilderState = Immutable.Map<string, any>;

class Builder {
  value: InternalBuilderState;

  constructor(value: InternalBuilderState = Immutable.Map()) {
    this.value = value;
  }

  id(value: InternalState['id']): Builder {
    return new Builder(this.value.set('id', value));
  }

  title(value: InternalState['title']): Builder {
    return new Builder(this.value.set('title', value));
  }

  type(value: InternalState['type']): Builder {
    return new Builder(this.value.set('type', value));
  }

  build(): Grantee {
    const { id, title, type } = this.value.toObject();

    return new Grantee(id, title, type);
  }
}
