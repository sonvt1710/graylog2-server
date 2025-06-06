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
package org.graylog2.plugin.inputs.codecs;

import org.graylog2.plugin.AbstractDescriptor;
import org.graylog2.plugin.Message;
import org.graylog2.plugin.configuration.Configuration;
import org.graylog2.plugin.configuration.ConfigurationRequest;
import org.graylog2.plugin.journal.RawMessage;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.Optional;

public interface Codec {

    /**
     * @param rawMessage
     * @return an empty Optional if RawMessage contains payload data that should not be decoded.
     * Otherwise, an Optional with a Message that can be processed further.
     * @throws org.graylog2.plugin.inputs.failure.InputProcessingException if an error occurs during decoding.
     */
    default Optional<Message> decodeSafe(@Nonnull RawMessage rawMessage) {
        return Optional.ofNullable(decode(rawMessage));
    }

    /**
     * @deprecated use {@link #decodeSafe(RawMessage)} instead.
     */
    @Deprecated
    @Nullable
    default Message decode(@Nonnull RawMessage rawMessage) {
        throw new UnsupportedOperationException("implement decodeSafe method");
    }

    @Nullable
    CodecAggregator getAggregator();

    String getName();

    @Nonnull
    Configuration getConfiguration();

    interface Factory<C> {
        C create(Configuration configuration);

        Config getConfig();

        Descriptor getDescriptor();
    }

    interface Config {
        String CK_OVERRIDE_SOURCE = "override_source";
        String CK_CHARSET_NAME = "charset_name";

        ConfigurationRequest getRequestedConfiguration();

        void overrideDefaultValues(@Nonnull ConfigurationRequest cr);
    }

    class Descriptor extends AbstractDescriptor {
        public Descriptor() {
            // We ensure old Codec plugins remain compatible by setting an empty name in here
            this("");
        }

        protected Descriptor(String name) {
            super(name, false, "");
        }
    }
}
