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
package org.graylog2.migrations;

import com.google.inject.multibindings.Multibinder;
import org.graylog2.migrations.V20180214093600_AdjustDashboardPositionToNewResolution.Migration;
import org.graylog2.migrations.V20200803120800_GrantsMigrations.GrantsMetaMigration;
import org.graylog2.plugin.PluginModule;

public class MigrationsModule extends PluginModule {
    @Override
    protected void configure() {

        // The LegacyAuthServiceMigration is pluggable. This call ensures that there is always a binder present
        // even if there are no plugins registered for this migration.
        Multibinder.newSetBinder(binder(), V20201103145400_LegacyAuthServiceMigration.MigrationModule.class);

        addMigration(V19700101000000_GenerateClusterId.class);
        addMigration(V20151210140600_AddSearchesClusterConfigMigration.class);
        addMigration(V20161116172100_DefaultIndexSetMigration.class);
        addMigration(V20161116172200_CreateDefaultStreamMigration.class);
        addMigration(V20161122174500_AssignIndexSetsToStreamsMigration.class);
        addMigration(V20161215163900_MoveIndexSetDefaultConfig.class);
        addMigration(V20161216123500_DefaultIndexSetMigration.class);
        addMigration(V20170110150100_FixAlertConditionsMigration.class);
        addMigration(V20170607164210_MigrateReopenedIndicesToAliases.class);
        addMigration(Migration.class);
        addMigration(V2018070614390000_EnforceUniqueGrokPatterns.class);
        addMigration(V20180718155800_AddContentPackIdAndRev.class);
        addMigration(V20180924111644_AddDefaultGrokPatterns.class);
        addMigration(V20190705071400_AddEventIndexSetsMigration.class);
        addMigration(V20190730100900_AddAlertsManagerRole.class);
        addMigration(V20190730000000_CreateDefaultEventsConfiguration.class);
        addMigration(V20191121145100_FixDefaultGrokPatterns.class);
        addMigration(V20191129134600_CreateInitialUrlWhitelist.class);
        addMigration(V20191219090834_AddSourcesPage.class);
        addMigration(V20200102140000_UnifyEventSeriesId.class);
        addMigration(V20200226181600_EncryptAccessTokensMigration.class);
        addMigration(V20200722110800_AddBuiltinRoles.class);
        addMigration(GrantsMetaMigration.class);
        addMigration(V20201103145400_LegacyAuthServiceMigration.class);
        addMigration(V20211221144300_GeoIpResolverConfigMigration.class);
        addMigration(V20220719130704_ImprovedDefaultProcessingOrderMigration.class);
        addMigration(V20220623125450_AddJobTypeToJobTrigger.class);
        addMigration(V20220818112023_AddStreamMatcherToProcessingOrderMigration.class);
        addMigration(V202211021200_CreateDefaultIndexTemplate.class);
        addMigration(V20230113095300_MigrateGlobalPivotLimitsToGroupingsInViews.class);
        addMigration(V20230113095301_MigrateGlobalPivotLimitsToGroupingsInSearches.class);
        addMigration(V20230220095500_MigrateStartPageObjectReferencesToGRNbyRemoval.class);
        addMigration(V20230213160000_EncryptedInputConfigMigration.class);
        addMigration(V20230210102500_UniqueUserMigration.class);
        addMigration(V202305221200_MigrateTimerangeOptionsToTimerangePresets.class);
        addMigration(V20230523160600_PopulateEventDefinitionState.class);
        addMigration(V20230531135500_MigrateRemoveObsoleteItemsFromGrantsCollection.class);
        addMigration(V20230601104500_AddSourcesPageV2.class);
        addMigration(V20230904073300_MigrateThemePreferences.class);
        addMigration(V20240312140000_RemoveFieldTypeMappingsManagerRole.class);
        addMigration(V202404170856_UpdateIndexSetTemplates.class);
        addMigration(V20240927120300_DataNodeMigrationIndexSet.class);
        addMigration(V20250304102900_ScopeMigration.class);
        addMigration(V20250206105400_TokenManagementConfiguration.class);
        addMigration(V20250219134200_DefaultTTLForNewTokens.class);
        addMigration(V20250506090000_AddInputTypesPermissions.class);
        addMigration(V20250721090000_AddClusterConfigurationPermission.class);
    }
}
