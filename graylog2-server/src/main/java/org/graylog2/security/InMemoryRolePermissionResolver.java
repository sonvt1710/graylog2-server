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
package org.graylog2.security;

import com.google.common.collect.ImmutableMap;
import com.google.common.eventbus.EventBus;
import com.google.common.eventbus.Subscribe;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.apache.shiro.authz.Permission;
import org.apache.shiro.authz.permission.AllPermission;
import org.apache.shiro.authz.permission.RolePermissionResolver;
import org.graylog.security.permissions.CaseSensitiveWildcardPermission;
import org.graylog2.shared.users.Role;
import org.graylog2.users.RoleChangedEvent;
import org.graylog2.users.RoleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nonnull;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Singleton
public class InMemoryRolePermissionResolver implements RolePermissionResolver {
    private static final Logger log = LoggerFactory.getLogger(InMemoryRolePermissionResolver.class);

    private final RoleService roleService;
    private final AtomicReference<ImmutableMap<String, Role>> idToRoleIndex = new AtomicReference<>(ImmutableMap.<String, Role>of());

    @Inject
    public InMemoryRolePermissionResolver(RoleService roleService,
                                          EventBus eventBus) {
        this.roleService = roleService;

        eventBus.register(this);
        // eagerly load rules
        updateRoles();
    }

    @Override
    public Collection<Permission> resolvePermissionsInRole(String roleId) {
        final Set<String> permissions = resolveStringPermission(roleId);

        return permissions.stream().map(p -> {
            if (p.equals("*")) {
                return new AllPermission();
            } else {
                return new CaseSensitiveWildcardPermission(p);
            }
        }).collect(Collectors.toList());
    }

    @Nonnull
    public Set<String> resolveStringPermission(String roleId) {
        final ImmutableMap<String, Role> index = idToRoleIndex.get();

        final Role role = index.get(roleId);
        if (role == null) {
            log.debug("Unknown role {}, cannot resolve permissions.", roleId);
            return Collections.emptySet();
        }

        final Set<String> permissions = role.getPermissions();
        if (permissions == null) {
            log.debug("Role {} has no permissions assigned, cannot resolve permissions.", roleId);
            return Collections.emptySet();
        }
        return permissions;
    }


    @Subscribe
    public void handleRoleChangedEvent(RoleChangedEvent event) {
        updateRoles();
    }

    private void updateRoles() {
        try {
            final Map<String, Role> index = roleService.loadAllIdMap();
            this.idToRoleIndex.set(ImmutableMap.copyOf(index));
        } catch (Exception e) {
            log.error("Could not find roles collection, no user roles updated.", e);
        }
    }
}
