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
package org.graylog.datanode.opensearch.cli;

import com.github.rholder.retry.Attempt;
import com.github.rholder.retry.RetryException;
import com.github.rholder.retry.RetryListener;
import com.github.rholder.retry.RetryerBuilder;
import com.github.rholder.retry.StopStrategies;
import com.github.rholder.retry.WaitStrategies;
import jakarta.validation.constraints.NotNull;
import org.graylog.datanode.configuration.OpensearchConfigurationDir;
import org.graylog.datanode.configuration.OpensearchConfigurationException;
import org.graylog.datanode.opensearch.configuration.OpensearchConfiguration;
import org.graylog.datanode.process.CommandLineProcess;
import org.graylog.datanode.process.CommandLineProcessListener;
import org.graylog.datanode.process.ProcessInformation;
import org.graylog.datanode.process.ProcessListener;
import org.graylog.datanode.process.configuration.beans.OpensearchKeystoreItem;
import org.graylog.datanode.process.configuration.files.DatanodeConfigFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Closeable;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

public class OpensearchCommandLineProcess implements Closeable {
    private static final Logger LOG = LoggerFactory.getLogger(OpensearchCommandLineProcess.class);

    private final CommandLineProcess commandLineProcess;
    private final CommandLineProcessListener resultHandler;

    private void writeOpenSearchConfig(final OpensearchConfiguration config) {
        final OpensearchConfigurationDir confDir = config.getOpensearchConfigurationDir();
        config.configFiles().forEach(cf -> persistConfigFile(confDir, cf));
    }

    private static void persistConfigFile(OpensearchConfigurationDir confDir, DatanodeConfigFile cf) {
        try {
            final Path targetFile = confDir.createOpensearchProcessConfigurationFile(cf.relativePath());
            try (final FileOutputStream file = new FileOutputStream(targetFile.toFile())) {
                cf.write(file);
            }
        } catch (IOException e) {
            throw new OpensearchConfigurationException("Failed to create opensearch config file " + cf.relativePath(), e);
        }
    }

    public OpensearchCommandLineProcess(OpensearchConfiguration config, ProcessListener listener) {
        configureOpensearchKeystoreSecrets(config);
        final Path executable = config.getOpensearchDistribution().getOpensearchExecutable();
        writeOpenSearchConfig(config);
        logWarnings(config);
        resultHandler = new CommandLineProcessListener(listener);
        commandLineProcess = new CommandLineProcess(executable, List.of(), resultHandler, config.getEnv());
    }

    private void logWarnings(OpensearchConfiguration config) {
        if (!config.warnings().isEmpty()) {
            LOG.warn("Your system is overriding forbidden opensearch configuration properties. " +
                    "This may cause unexpected results and may break in any future release!");
        }
        config.warnings().forEach(LOG::warn);
    }

    private void configureOpensearchKeystoreSecrets(OpensearchConfiguration config) {
        final OpensearchCli opensearchCli = new OpensearchCli(config);
        LOG.info("Creating opensearch keystore");
        final String createdMessage = opensearchCli.keystore().create();
        LOG.info(createdMessage);
        final Collection<OpensearchKeystoreItem> keystoreItems = config.getKeystoreItems();
        keystoreItems.forEach((item) -> item.persist(opensearchCli.keystore()));
        LOG.info("Added {} keystore items", keystoreItems.size());
    }

    public void start() {
        commandLineProcess.start();
    }

    @Override
    public void close() {
        commandLineProcess.stop();
        resultHandler.stopListening();
        waitForProcessTermination();
    }

    private void waitForProcessTermination() {
        try {
            RetryerBuilder.newBuilder()
                    .retryIfResult(Boolean.TRUE::equals)
                    .withWaitStrategy(WaitStrategies.fixedWait(100, TimeUnit.MILLISECONDS))
                    .withStopStrategy(StopStrategies.stopAfterDelay(60, TimeUnit.SECONDS))
                    .withRetryListener(new RetryListener() {
                        @Override
                        public <V> void onRetry(Attempt<V> attempt) {
                            LOG.info("Process " + commandLineProcess.processInfo().pid() + " still alive, waiting for termination.  Retry #" + attempt.getAttemptNumber());
                        }
                    })
                    .build()
                    .call(() -> commandLineProcess.processInfo().alive());
            LOG.info("Process " + commandLineProcess.processInfo().pid() + " successfully terminated.");
        } catch (ExecutionException | RetryException e) {
            final String message = "Failed to terminate opensearch process " + commandLineProcess.processInfo().pid();
            LOG.error(message, e);
            throw new RuntimeException(message, e);
        }
    }

    @NotNull
    public ProcessInformation processInfo() {
        return commandLineProcess.processInfo();
    }
}
