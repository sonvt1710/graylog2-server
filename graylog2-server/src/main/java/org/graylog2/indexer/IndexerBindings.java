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
package org.graylog2.indexer;

import com.google.inject.assistedinject.FactoryModuleBuilder;
import com.google.inject.multibindings.Multibinder;
import org.graylog2.indexer.indexset.IndexSetService;
import org.graylog2.indexer.indexset.MongoIndexSetService;
import org.graylog2.indexer.indexset.template.requirement.EnterprisePluginRequirement;
import org.graylog2.indexer.indexset.template.requirement.IndexSetTemplateRequirement;
import org.graylog2.plugin.inject.Graylog2Module;
import org.graylog2.rest.resources.system.indexer.OpenIndexSetFilterFactory;

public class IndexerBindings extends Graylog2Module {
    @Override
    protected void configure() {
        bind(IndexSetService.class).to(MongoIndexSetService.class);

        install(new FactoryModuleBuilder().build(MongoIndexSet.Factory.class));
        bind(IndexSetRegistry.class).to(MongoIndexSetRegistry.class);

        Multibinder.newSetBinder(binder(), IndexSetTemplateRequirement.class).addBinding().to(EnterprisePluginRequirement.class);
        Multibinder.newSetBinder(binder(), OpenIndexSetFilterFactory.class);
    }
}
