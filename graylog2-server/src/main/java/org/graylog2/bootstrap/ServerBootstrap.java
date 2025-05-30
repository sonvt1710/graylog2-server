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
package org.graylog2.bootstrap;

import com.github.rvesse.airline.annotations.Option;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSortedSet;
import com.google.common.util.concurrent.MoreExecutors;
import com.google.common.util.concurrent.Service;
import com.google.common.util.concurrent.ServiceManager;
import com.google.inject.AbstractModule;
import com.google.inject.Guice;
import com.google.inject.Injector;
import com.google.inject.Key;
import com.google.inject.Module;
import com.google.inject.ProvisionException;
import com.google.inject.TypeLiteral;
import com.google.inject.multibindings.MapBinder;
import com.google.inject.util.Types;
import org.graylog.security.certutil.CertificateAuthorityBindings;
import org.graylog2.Configuration;
import org.graylog2.audit.AuditActor;
import org.graylog2.audit.AuditEventSender;
import org.graylog2.bindings.ConfigurationModule;
import org.graylog2.bindings.NamedConfigParametersOverrideModule;
import org.graylog2.bootstrap.preflight.MongoDBPreflightCheck;
import org.graylog2.bootstrap.preflight.PasswordSecretPreflightCheck;
import org.graylog2.bootstrap.preflight.PreflightCheckException;
import org.graylog2.bootstrap.preflight.PreflightCheckService;
import org.graylog2.bootstrap.preflight.PreflightWebModule;
import org.graylog2.bootstrap.preflight.ServerPreflightChecksModule;
import org.graylog2.bootstrap.preflight.web.PreflightBoot;
import org.graylog2.cluster.leader.LeaderElectionService;
import org.graylog2.cluster.preflight.GraylogServerProvisioningBindings;
import org.graylog2.commands.AbstractNodeCommand;
import org.graylog2.configuration.IndexerDiscoveryModule;
import org.graylog2.indexer.client.IndexerHostsAdapter;
import org.graylog2.migrations.Migration;
import org.graylog2.migrations.MigrationType;
import org.graylog2.plugin.MessageBindings;
import org.graylog2.plugin.Plugin;
import org.graylog2.plugin.ServerStatus;
import org.graylog2.plugin.Tools;
import org.graylog2.plugin.inputs.MessageInput;
import org.graylog2.plugin.system.NodeId;
import org.graylog2.shared.bindings.FreshInstallDetectionModule;
import org.graylog2.shared.bindings.GenericBindings;
import org.graylog2.shared.bindings.GenericInitializerBindings;
import org.graylog2.shared.bindings.GuiceInjectorHolder;
import org.graylog2.shared.bindings.IsDevelopmentBindings;
import org.graylog2.shared.bindings.ObjectMapperModule;
import org.graylog2.shared.bindings.SchedulerBindings;
import org.graylog2.shared.bindings.ServerStatusBindings;
import org.graylog2.shared.bindings.SharedPeriodicalBindings;
import org.graylog2.shared.bindings.ValidatorModule;
import org.graylog2.shared.initializers.ServiceManagerListener;
import org.graylog2.shared.plugins.ChainingClassLoader;
import org.graylog2.shared.security.CertificateRenewalBindings;
import org.graylog2.shared.security.SecurityBindings;
import org.graylog2.shared.system.activities.Activity;
import org.graylog2.shared.system.activities.ActivityWriter;
import org.graylog2.shared.system.stats.SystemStatsModule;
import org.graylog2.storage.versionprobe.VersionProbeModule;
import org.jsoftbiz.utils.OS;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

import static com.google.common.base.Strings.isNullOrEmpty;
import static org.graylog2.audit.AuditEventTypes.NODE_STARTUP_COMPLETE;
import static org.graylog2.audit.AuditEventTypes.NODE_STARTUP_INITIATE;
import static org.graylog2.bootstrap.preflight.PreflightWebModule.FEATURE_FLAG_PREFLIGHT_WEB_ENABLED;

public abstract class ServerBootstrap extends AbstractNodeCommand {
    private static final Logger LOG = LoggerFactory.getLogger(ServerBootstrap.class);
    private boolean isFreshInstallation;

    private final Configuration configuration;

    protected ServerBootstrap(String commandName, Configuration configuration) {
        super(commandName, configuration);
        this.commandName = commandName;
        this.configuration = configuration;
    }

    @Option(name = {"-p", "--pidfile"}, description = "File containing the PID of Graylog")
    private String pidFile = TMPDIR + FILE_SEPARATOR + "graylog.pid";

    @Option(name = {"-np", "--no-pid-file"}, description = "Do not write a PID file (overrides -p/--pidfile)")
    private boolean noPidFile = false;

    protected abstract void startNodeRegistration(Injector injector);

    public String getPidFile() {
        return pidFile;
    }

    public boolean isNoPidFile() {
        return noPidFile;
    }

    private boolean isFreshInstallation() {
        return isFreshInstallation;
    }

    private void registerFreshInstallation() {
        this.isFreshInstallation = true;
    }

    @Override
    protected void beforeStart() {
        super.beforeStart();

        // Do not use a PID file if the user requested not to
        if (!isNoPidFile()) {
            savePidFile(getPidFile());
        }
    }

    @Override
    protected void beforeInjectorCreation(Set<Plugin> plugins) {
        runPreFlightChecks(plugins);
    }

    private void runPreFlightChecks(Set<Plugin> plugins) {
        if (configuration.getSkipPreflightChecks()) {
            LOG.info("Skipping preflight checks");
            return;
        }

        runMongoPreflightCheck();

        final List<Module> preflightCheckModules = plugins.stream().map(Plugin::preflightCheckModules)
                .flatMap(Collection::stream).collect(Collectors.toList());
        preflightCheckModules.add(new FreshInstallDetectionModule(isFreshInstallation()));
        preflightCheckModules.add(new AbstractModule() {
            @Override
            protected void configure() {
                // needed for the ObjectMapperModule, to avoid missing MessageInput.Factory
                MapBinder.newMapBinder(binder(),
                        TypeLiteral.get(String.class),
                        new TypeLiteral<MessageInput.Factory<? extends MessageInput>>() {
                        });
            }
        });
        preflightCheckModules.add(new ObjectMapperModule(chainingClassLoader));

        if (featureFlags.isOn(FEATURE_FLAG_PREFLIGHT_WEB_ENABLED)) {
            runPreflightWeb(preflightCheckModules);
        }

        final Injector preflightInjector = getPreflightInjector(preflightCheckModules);
        final PreflightCheckService preflightCheckService = preflightInjector.getInstance(PreflightCheckService.class);
        preflightCheckService.runChecks();
    }

    private void runPreflightWeb(List<Module> preflightCheckModules) {
        List<Module> modules = new ArrayList<>(preflightCheckModules);
        modules.add(new GraylogServerProvisioningBindings());
        modules.add(new PreflightWebModule(configuration));
        modules.add(new SchedulerBindings());

        final Injector preflightInjector = getPreflightInjector(modules);
        // explicitly call the PasswordSecretPreflightCheck also when showing preflight web to make sure
        // data node isn't provisioned with the wrong password_secret
        preflightInjector.getInstance(PasswordSecretPreflightCheck.class).runCheck();
        GuiceInjectorHolder.setInjector(preflightInjector);
        try {
            doRunWithPreflightInjector(preflightInjector);
        } finally {
            GuiceInjectorHolder.resetInjector();
        }
    }

    private void doRunWithPreflightInjector(Injector preflightInjector) {

        // always run preflight migrations, even if we skip the preflight web later
        runPreflightMigrations(preflightInjector);

        final PreflightBoot preflightBoot = preflightInjector.getInstance(PreflightBoot.class);

        if (!preflightBoot.shouldRunPreflightWeb()) {
            return;
        }

        LOG.info("Fresh installation detected, starting configuration webserver");

        final ServiceManager serviceManager = preflightInjector.getInstance(ServiceManager.class);
        final LeaderElectionService leaderElectionService = preflightInjector.getInstance(LeaderElectionService.class);

        try {
            leaderElectionService.startAsync().awaitRunning();
            serviceManager.startAsync().awaitHealthy();
            // wait till the marker document appears
            while (preflightBoot.shouldRunPreflightWeb()) {
                try {
                    LOG.debug("Preflight config still in progress, waiting for the marker document");
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
            }

        } finally {
            // check, if this is the leader before shutting down preflight in case we want to delay startup
            final var isLeader = leaderElectionService.isLeader();
            serviceManager.stopAsync().awaitStopped();
            leaderElectionService.stopAsync().awaitTerminated();

            try {
                // delay startup if we're not the leader to give the leader node a headstart on resume
                // so it can take care of mongo-collections etc.
                // and we prevent problems that occured if all nodes started exactly at the same time
                if (!isLeader) {
                    Thread.sleep(5000);
                }
            } catch (InterruptedException e) {
                LOG.warn("Tried to wait for a bit before resuming but got interrupted. Resuming anyway now. Error was: {}", e.getMessage());
            }
        }
    }

    private void runPreflightMigrations(Injector preflightInjector) {
        try {
            if (configuration.isLeader() && configuration.runMigrations()) {
                runMigrations(preflightInjector, MigrationType.PREFLIGHT);
            }
        } catch (Exception e) {
            LOG.error("Exception while running migrations", e);
            System.exit(1);
        }
    }

    private void runMongoPreflightCheck() {
        // The MongoDBPreflightCheck is not run via the PreflightCheckService,
        // because it also detects whether we are running on a fresh Graylog installation
        final Injector injector = getMongoPreFlightInjector();
        final MongoDBPreflightCheck mongoDBPreflightCheck = injector.getInstance(MongoDBPreflightCheck.class);
        try {
            mongoDBPreflightCheck.runCheck();
        } catch (PreflightCheckException e) {
            LOG.error("Preflight check failed with error: {}", e.getLocalizedMessage());
            throw e;
        }

        if (mongoDBPreflightCheck.isFreshInstallation()) {
            registerFreshInstallation();
        }
    }

    private Injector getMongoPreFlightInjector() {
        return Guice.createInjector(
                new IsDevelopmentBindings(),
                new NamedConfigParametersOverrideModule(jadConfig.getConfigurationBeans()),
                new ConfigurationModule(configuration)
        );
    }

    private Injector getPreflightInjector(List<Module> preflightCheckModules) {
        return Guice.createInjector(
                new VersionProbeModule(),
                binder -> binder.bind(IndexerHostsAdapter.class).toInstance(List::of),
                new IsDevelopmentBindings(),
                new NamedConfigParametersOverrideModule(jadConfig.getConfigurationBeans()),
                new ServerStatusBindings(capabilities()),
                new ConfigurationModule(configuration),
                new SystemStatsModule(configuration.isDisableNativeSystemStatsCollector()),
                new GraylogServerProvisioningBindings(),
                new IndexerDiscoveryModule(),
                new ServerPreflightChecksModule(),
                new CertificateAuthorityBindings(),
                (binder) -> binder.bind(ChainingClassLoader.class).toInstance(chainingClassLoader),
                binder -> preflightCheckModules.forEach(binder::install),
                this::featureFlagsBinding);
    }

    @Override
    protected void startCommand() {
        final AuditEventSender auditEventSender = injector.getInstance(AuditEventSender.class);
        final NodeId nodeId = injector.getInstance(NodeId.class);
        final String systemInformation = Tools.getSystemInformation();
        final Map<String, Object> auditEventContext = ImmutableMap.of(
                "version", version.toString(),
                "java", systemInformation,
                "node_id", nodeId.getNodeId()
        );
        auditEventSender.success(AuditActor.system(nodeId), NODE_STARTUP_INITIATE, auditEventContext);

        final OS os = OS.getOs();

        LOG.info("Graylog {} {} starting up", commandName, version);
        LOG.info("JRE: {}", systemInformation);
        LOG.info("Deployment: {}", configuration.getInstallationSource());
        LOG.info("OS: {}", os.getPlatformName());
        LOG.info("Arch: {}", os.getArch());
        LOG.info("Node ID: {}", nodeId);

        try {
            if (configuration.isLeader() && configuration.runMigrations()) {
                runMigrations(injector, MigrationType.STANDARD);
            }
        } catch (Exception e) {
            LOG.error("Exception while running migrations", e);
            System.exit(1);
        }

        final ServerStatus serverStatus = injector.getInstance(ServerStatus.class);
        serverStatus.initialize();

        startNodeRegistration(injector);

        final ActivityWriter activityWriter;
        final ServiceManager serviceManager;
        final Service leaderElectionService;
        try {
            activityWriter = injector.getInstance(ActivityWriter.class);
            serviceManager = injector.getInstance(ServiceManager.class);
            leaderElectionService = injector.getInstance(LeaderElectionService.class);
        } catch (ProvisionException e) {
            LOG.error("Guice error", e);
            annotateProvisionException(e);
            auditEventSender.failure(AuditActor.system(nodeId), NODE_STARTUP_INITIATE, auditEventContext);
            System.exit(-1);
            return;
        } catch (Exception e) {
            LOG.error("Unexpected exception", e);
            auditEventSender.failure(AuditActor.system(nodeId), NODE_STARTUP_INITIATE, auditEventContext);
            System.exit(-1);
            return;
        }

        Runtime.getRuntime().addShutdownHook(new Thread(injector.getInstance(shutdownHook())));

        // propagate default size to input plugins
        MessageInput.setDefaultRecvBufferSize(configuration.getUdpRecvBufferSizes());

        // Start services.
        final ServiceManagerListener serviceManagerListener = injector.getInstance(ServiceManagerListener.class);
        serviceManager.addListener(serviceManagerListener, MoreExecutors.directExecutor());
        try {
            leaderElectionService.startAsync().awaitRunning();
            serviceManager.startAsync().awaitHealthy();
        } catch (Exception e) {
            try {
                serviceManager.stopAsync().awaitStopped(configuration.getShutdownTimeout(), TimeUnit.MILLISECONDS);
            } catch (TimeoutException timeoutException) {
                LOG.error("Unable to shutdown properly on time. {}", serviceManager.servicesByState());
            }
            LOG.error("Graylog startup failed. Exiting. Exception was:", e);
            auditEventSender.failure(AuditActor.system(nodeId), NODE_STARTUP_INITIATE, auditEventContext);
            System.exit(-1);
        }
        LOG.info("Services started, startup times in ms: {}", serviceManager.startupTimes());

        activityWriter.write(new Activity("Started up.", Main.class));
        LOG.info("Graylog {} up and running.", commandName);
        auditEventSender.success(AuditActor.system(nodeId), NODE_STARTUP_COMPLETE, auditEventContext);

        // Block forever.
        try {
            Thread.currentThread().join();
        } catch (InterruptedException e) {
            return;
        }
    }

    public void runMigrations(Injector injector, MigrationType migrationType) {
        //noinspection unchecked
        final TypeLiteral<Set<Migration>> typeLiteral = (TypeLiteral<Set<Migration>>) TypeLiteral.get(Types.setOf(Migration.class));
        Set<Migration> migrations = injector.getInstance(Key.get(typeLiteral));

        LOG.info("Running {} migrations...", migrations.size());

        ImmutableSortedSet.copyOf(migrations).stream().filter(m -> m.migrationType() == migrationType).forEach(m -> {
            LOG.debug("Running migration <{}>", m.getClass().getCanonicalName());
            try {
                m.upgrade();
            } catch (Exception e) {
                if (configuration.ignoreMigrationFailures()) {
                    LOG.warn("Ignoring failure of migration <{}>: {}", m.getClass().getCanonicalName(), e.getMessage());
                } else {
                    throw e;
                }
            }
        });
    }

    protected void savePidFile(final String pidFile) {
        final String pid = Tools.getPID();
        final Path pidFilePath = Paths.get(pidFile);
        pidFilePath.toFile().deleteOnExit();

        try {
            if (isNullOrEmpty(pid) || "unknown".equals(pid)) {
                throw new Exception("Could not determine PID.");
            }

            Files.write(pidFilePath, pid.getBytes(StandardCharsets.UTF_8), StandardOpenOption.WRITE, StandardOpenOption.CREATE_NEW, LinkOption.NOFOLLOW_LINKS);
        } catch (Exception e) {
            LOG.error("Could not write PID file: " + e.getMessage(), e);
            System.exit(1);
        }
    }

    @Override
    protected List<Module> getSharedBindingsModules() {
        final List<Module> result = super.getSharedBindingsModules();

        result.add(new FreshInstallDetectionModule(isFreshInstallation()));
        result.add(new GenericBindings(isMigrationCommand()));
        result.add(new MessageBindings());
        result.add(new SecurityBindings());
        result.add(new ValidatorModule());
        result.add(new SharedPeriodicalBindings());
        result.add(new GenericInitializerBindings());
        result.add(new SystemStatsModule(configuration.isDisableNativeSystemStatsCollector()));
        result.add(new IndexerDiscoveryModule());
        result.add(new CertificateRenewalBindings());
        result.add(new GraylogServerProvisioningBindings());
        result.add(new CertificateAuthorityBindings());
        return result;
    }

    protected void annotateProvisionException(ProvisionException e) {
        annotateInjectorExceptions(e.getErrorMessages());
        throw e;
    }

    protected abstract Class<? extends Runnable> shutdownHook();
}
