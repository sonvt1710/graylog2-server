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
package org.graylog.security.entities;

import com.google.common.collect.ImmutableMultimap;
import com.google.common.collect.ImmutableSet;
import jakarta.inject.Inject;
import org.graylog.grn.GRN;
import org.graylog.security.Capability;
import org.graylog.security.CapabilityRegistry;
import org.graylog.security.GranteeAuthorizer;
import org.graylog2.plugin.security.Permission;

import java.util.Set;

public class EntityDependencyPermissionChecker {
    private final GranteeAuthorizer.Factory granteeAuthorizerFactory;
    private final CapabilityRegistry capabilityRegistry;

    @Inject
    public EntityDependencyPermissionChecker(GranteeAuthorizer.Factory granteeAuthorizerFactory,
                                             CapabilityRegistry capabilityRegistry) {
        this.granteeAuthorizerFactory = granteeAuthorizerFactory;
        this.capabilityRegistry = capabilityRegistry;
    }

    /**
     * Runs permission checks for the given dependencies for every selected grantee and returns the entities that
     * grantees cannot access.
     *
     * @param sharingUser      the sharing user
     * @param dependencies     the dependencies to check
     * @param selectedGrantees the selected grantees
     * @return dependencies that grantees cannot access, grouped by grantee
     */
    public ImmutableMultimap<GRN, EntityDescriptor> check(GRN sharingUser,
                                                          ImmutableSet<EntityDescriptor> dependencies,
                                                          Set<GRN> selectedGrantees) {
        final ImmutableMultimap.Builder<GRN, EntityDescriptor> deniedDependencies = ImmutableMultimap.builder();
        final GranteeAuthorizer sharerAuthorizer = granteeAuthorizerFactory.create(sharingUser);

        for (final GRN grantee : selectedGrantees) {
            // We only check for existing grants for the actual grantee. If the grantee is a team, we only check if
            // the team has a grant, not if any users in the team can access the dependency via other grants.
            // The same for the "everyone" grantee, we only check if  the "everyone" grantee has access to a dependency.
            final GranteeAuthorizer granteeAuthorizer = granteeAuthorizerFactory.create(grantee);

            for (final EntityDescriptor dependency : dependencies) {
                // We can only expose missing dependencies that the sharing user can read to avoid
                // leaking information to the sharing user.
                if (cannotView(sharerAuthorizer, dependency)) {
                    continue;
                }

                if (cannotView(granteeAuthorizer, dependency)) {
                    deniedDependencies.put(grantee, dependency);
                }
            }
        }

        return deniedDependencies.build();
    }

    private boolean cannotView(GranteeAuthorizer authorizer, EntityDescriptor dependency) {
        final Set<Permission> permissions = capabilityRegistry.getPermissions(Capability.VIEW, dependency.id().grnType());

        // TODO: This only looks at grants permissions, but should also check for permissions through roles
        return permissions.stream()
                .map(Permission::permission)
                .noneMatch(permission -> authorizer.isPermitted(permission, dependency.id()));
    }
}
