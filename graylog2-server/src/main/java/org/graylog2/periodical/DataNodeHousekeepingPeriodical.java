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
package org.graylog2.periodical;

import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.graylog2.cluster.nodes.DataNodeDto;
import org.graylog2.cluster.nodes.NodeService;
import org.graylog2.notifications.Notification;
import org.graylog2.notifications.NotificationService;
import org.graylog2.plugin.periodical.Periodical;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nonnull;
import java.util.Map;

/**
 * Data nodes set their status in their own periodical while running.
 * If a data node is stopped/crashed, we want to keep it in the list of data nodes but set their status to `UNAVAILABLE`.
 * We also check if there are data nodes with outdated version running.
 */
@Singleton
public class DataNodeHousekeepingPeriodical extends Periodical {

    private static final Logger LOG = LoggerFactory.getLogger(DataNodeHousekeepingPeriodical.class);
    private final NodeService<DataNodeDto> nodeService;
    private final NotificationService notificationService;

    @Inject
    public DataNodeHousekeepingPeriodical(NodeService<DataNodeDto> nodeService,
                                          NotificationService notificationService) {
        this.nodeService = nodeService;
        this.notificationService = notificationService;
    }

    @Override
    public void doRun() {
        // drop outdated nodes
        nodeService.dropOutdated();

        Map<String, DataNodeDto> nodes = nodeService.allActive();
        if (!nodes.isEmpty() && !nodes.values().stream()
                .allMatch(DataNodeDto::isCompatibleWithVersion)) {
            final Notification notification = notificationService.buildNow()
                    .addType(Notification.Type.DATA_NODE_VERSION_MISMATCH)
                    .addSeverity(Notification.Severity.NORMAL);
            notificationService.publishIfFirst(notification);
        }

    }

    @Override
    @Nonnull
    protected Logger getLogger() {
        return LOG;
    }

    @Override
    public boolean runsForever() {
        return false;
    }

    @Override
    public boolean stopOnGracefulShutdown() {
        return true;
    }

    @Override
    public boolean leaderOnly() {
        return true;
    }

    @Override
    public boolean startOnThisNode() {
        return true;
    }

    @Override
    public boolean isDaemon() {
        return true;
    }

    @Override
    public int getInitialDelaySeconds() {
        return 0;
    }

    @Override
    public int getPeriodSeconds() {
        return 2;
    }
}
