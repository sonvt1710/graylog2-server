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

import type { GranteeType, CapabilityType, SharedEntityType, ActiveShareType, GRN } from 'logic/permissions/types';
import { defaultCompare } from 'logic/DefaultCompare';

import Capability from './Capability';
import Grantee from './Grantee';
import ActiveShare from './ActiveShare';
import SharedEntity from './SharedEntity';
import SelectedGrantee from './SelectedGrantee';
import type { GranteeInterface } from './GranteeInterface';
import type { ValidationResultJSON } from './ValidationResult';
import ValidationResult from './ValidationResult';

export type GranteesList = Immutable.List<Grantee>;
export type CapabilitiesList = Immutable.List<Capability>;
export type ActiveShares = Immutable.List<ActiveShare> | null;
export type MissingDependencies = Immutable.Map<GRN, Immutable.List<SharedEntity>>;
export type SelectedGranteeCapabilities = Immutable.Map<GranteeType['id'], CapabilityType['id']>;
export type SelectedGrantees = Immutable.List<SelectedGrantee>;

const _missingDependenciesFromJSON = (missingDependenciesJSON): Immutable.Map<string, Immutable.List<SharedEntity>> => {
  let missingDependencies = Immutable.Map<string, Immutable.List<SharedEntity>>();

  Object.keys(missingDependenciesJSON).forEach((granteeGRN) => {
    const dependencyList = missingDependenciesJSON[granteeGRN];
    missingDependencies = missingDependencies.set(
      granteeGRN,
      dependencyList.map((dependency) => SharedEntity.fromJSON(dependency)),
    );
  });

  return missingDependencies;
};

const _sortAndOrderGrantees = <T extends GranteeInterface>(
  grantees: Immutable.List<T>,
  activeShares?: ActiveShares | undefined | null,
): Immutable.List<T> => {
  const granteesByType = grantees
    .filter(
      (grantee) => !activeShares || activeShares.findIndex((activeShare) => activeShare.grantee === grantee.id) >= 0,
    )
    .sort((granteeA, granteeB) => defaultCompare(granteeA.title, granteeB.title))
    .groupBy((grantee) => grantee.type);
  const newGrantees = grantees
    .filter(
      (grantee) => activeShares && activeShares.findIndex((activeShare) => activeShare.grantee === grantee.id) === -1,
    )
    .reverse();

  return Immutable.List<T>()
    .concat(
      newGrantees,
      granteesByType.get('error'),
      granteesByType.get('global'),
      granteesByType.get('team'),
      granteesByType.get('user'),
    )
    .filter((grantee) => !!grantee)
    .toList();
};

type InternalState = {
  entity: GRN;
  availableGrantees: GranteesList;
  availableCapabilities: CapabilitiesList;
  activeShares: ActiveShares;
  selectedGranteeCapabilities: SelectedGranteeCapabilities;
  missingDependencies: MissingDependencies;
  validationResults: ValidationResult;
};

export type EntityShareStateJson = {
  entity: InternalState['entity'];
  available_grantees: Array<GranteeType>;
  available_capabilities: Array<CapabilityType>;
  active_shares: Array<ActiveShareType>;
  selected_grantee_capabilities:
    | {
        [grantee: string]: Capability['id'];
      }
    | {};
  missing_permissions_on_dependencies: { [key: string]: Array<SharedEntityType> };
  validation_result: ValidationResultJSON;
};

export default class EntityShareState {
  _value: InternalState;

  constructor(
    entity: InternalState['entity'],
    availableGrantees: InternalState['availableGrantees'],
    availableCapabilities: InternalState['availableCapabilities'],
    activeShares: InternalState['activeShares'],
    selectedGranteeCapabilities: InternalState['selectedGranteeCapabilities'],
    missingDependencies: InternalState['missingDependencies'],
    validationResults: InternalState['validationResults'],
  ) {
    this._value = {
      entity,
      availableGrantees: _sortAndOrderGrantees<Grantee>(availableGrantees),
      availableCapabilities,
      activeShares,
      selectedGranteeCapabilities,
      missingDependencies,
      validationResults,
    };
  }

  get entity(): InternalState['entity'] {
    return this._value.entity;
  }

  get availableGrantees(): InternalState['availableGrantees'] {
    return this._value.availableGrantees;
  }

  get availableCapabilities(): InternalState['availableCapabilities'] {
    return this._value.availableCapabilities;
  }

  get activeShares(): InternalState['activeShares'] {
    return this._value.activeShares;
  }

  get selectedGranteeCapabilities(): InternalState['selectedGranteeCapabilities'] {
    return this._value.selectedGranteeCapabilities;
  }

  get missingDependencies(): InternalState['missingDependencies'] {
    return this._value.missingDependencies;
  }

  get validationResults(): InternalState['validationResults'] {
    return this._value.validationResults;
  }

  get selectedGrantees() {
    const _userLookup = (userId: GRN) => this._value.availableGrantees.find((grantee) => grantee.id === userId);

    const granteesWithCapabilities: Immutable.List<SelectedGrantee> = this._value.selectedGranteeCapabilities
      .entrySeq()
      .map(([granteeId, roleId]) => {
        const grantee = _userLookup(granteeId);

        if (!grantee) {
          return SelectedGrantee.create(granteeId, `not found ${granteeId} (error)`, 'error', roleId);
        }

        return SelectedGrantee.create(grantee.id, grantee.title, grantee.type, roleId);
      })
      .toList();

    return _sortAndOrderGrantees<SelectedGrantee>(granteesWithCapabilities, this._value.activeShares);
  }

  toBuilder(): Builder {
    const {
      entity,
      availableGrantees,
      availableCapabilities,
      activeShares,
      selectedGranteeCapabilities,
      missingDependencies,
      validationResults,
    } = this._value;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new Builder(
      Immutable.Map({
        entity,
        availableGrantees,
        availableCapabilities,
        activeShares,
        selectedGranteeCapabilities,
        missingDependencies,
        validationResults,
      }),
    );
  }

  toJSON() {
    const {
      entity,
      availableGrantees = Immutable.List(),
      availableCapabilities = Immutable.List(),
      activeShares = Immutable.List(),
      selectedGranteeCapabilities = Immutable.Map(),
      missingDependencies = Immutable.Map(),
      validationResults,
    } = this._value;

    return {
      entity,
      available_grantees: availableGrantees.toJS(),
      available_capabilities: availableCapabilities.toJS(),
      active_shares: activeShares.toJS(),
      selected_grantee_capabilities: selectedGranteeCapabilities.toJS(),
      missing_permissions_on_dependencies: missingDependencies.toJS(),
      validation_result: validationResults,
    };
  }

  static fromJSON(value: EntityShareStateJson): EntityShareState {
    const {
      entity,
      available_grantees,
      available_capabilities,
      active_shares,
      selected_grantee_capabilities,
      missing_permissions_on_dependencies,
      validation_result,
    } = value;

    const availableGrantees = Immutable.fromJS(available_grantees.map((ag) => Grantee.fromJSON(ag)));
    const availableCapabilities = Immutable.fromJS(available_capabilities.map((ar) => Capability.fromJSON(ar)));
    const activeShares = Immutable.fromJS(active_shares.map((as) => ActiveShare.fromJSON(as)));
    const selectedGranteeCapabilities = Immutable.fromJS(selected_grantee_capabilities);
    const missingDependencies = _missingDependenciesFromJSON(missing_permissions_on_dependencies);
    const validationResults = ValidationResult.fromJSON(validation_result);

    return new EntityShareState(
      entity,
      availableGrantees,
      availableCapabilities,
      activeShares,
      selectedGranteeCapabilities,
      missingDependencies,
      validationResults,
    );
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

  entity(value: InternalState['entity']): Builder {
    return new Builder(this.value.set('entity', value));
  }

  availableGrantees(value: InternalState['availableGrantees']): Builder {
    return new Builder(this.value.set('availableGrantees', value));
  }

  availableCapabilities(value: InternalState['availableCapabilities']): Builder {
    return new Builder(this.value.set('availableCapabilities', value));
  }

  activeShares(value: InternalState['activeShares']): Builder {
    return new Builder(this.value.set('activeShares', value));
  }

  selectedGranteeCapabilities(value: InternalState['selectedGranteeCapabilities']): Builder {
    return new Builder(this.value.set('selectedGranteeCapabilities', value));
  }

  missingDependencies(value: InternalState['missingDependencies']): Builder {
    return new Builder(this.value.set('missingDependencies', value));
  }

  validationResults(value: InternalState['validationResults']): Builder {
    return new Builder(this.value.set('validationResults', value));
  }

  build(): EntityShareState {
    const {
      entity,
      availableGrantees,
      availableCapabilities,
      activeShares,
      selectedGranteeCapabilities,
      missingDependencies,
      validationResults,
    } = this.value.toObject();

    return new EntityShareState(
      entity,
      availableGrantees,
      availableCapabilities,
      activeShares,
      selectedGranteeCapabilities,
      missingDependencies,
      validationResults,
    );
  }
}
