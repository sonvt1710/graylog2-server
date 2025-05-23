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
package org.graylog.plugins.pipelineprocessor.db;

import org.graylog2.database.NotFoundException;

import java.util.Collection;
import java.util.Optional;

public interface RuleService {
    default RuleDao save(RuleDao rule) {
        return save(rule, true);
    }

    RuleDao save(RuleDao rule, boolean checkMutability);

    RuleDao load(String id) throws NotFoundException;

    RuleDao loadByName(String name) throws NotFoundException;

    default Optional<RuleDao> findByName(String name) {
        try {
           RuleDao ruleDao = this.loadByName(name);
           return Optional.of(ruleDao);
        } catch (NotFoundException e) {
            return Optional.empty();
        }
    }

    /**
     * Returns all rules with given source pattern.
     * This method is only implemented in the MongoDB implementation.
     */
    default Collection<RuleDao> loadBySourcePattern(String sourcePattern) {
        throw new UnsupportedOperationException("loadBySourcePattern is not implemented");
    }

    Collection<RuleDao> loadAll();

    Collection<RuleDao> loadAllByTitle(String regex);

    Collection<RuleDao> loadAllByScope(String scope);

    void delete(String id);

    default void delete(RuleDao rule) {
        delete(rule.id());
    }

    Collection<RuleDao> loadNamed(Collection<String> ruleNames);
}
