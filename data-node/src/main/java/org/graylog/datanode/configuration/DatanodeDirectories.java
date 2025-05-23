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
package org.graylog.datanode.configuration;

import jakarta.annotation.Nonnull;
import org.graylog.datanode.Configuration;
import org.graylog2.plugin.system.NodeId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nullable;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileAttribute;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

/**
 * This is a collection of pointers to directories used to store data, logs and configuration of the managed opensearch.
 */
public class DatanodeDirectories {

    private static final Logger LOG = LoggerFactory.getLogger(DatanodeDirectories.class);

    /**
     * The execute bit for directories means that owner can traverse these and access their content.
     */
    protected static final FileAttribute<Set<PosixFilePermission>> DIRECTORY_PERMISSIONS = PosixFilePermissions.asFileAttribute(Set.of(PosixFilePermission.OWNER_WRITE, PosixFilePermission.OWNER_READ, PosixFilePermission.OWNER_EXECUTE));

    private final Path dataTargetDir;
    private final Path logsTargetDir;
    private final Path configurationSourceDir;
    private final Path configurationTargetDir;

    public DatanodeDirectories(Path dataTargetDir, Path logsTargetDir, @Nullable Path configurationSourceDir, Path configurationTargetDir) {
        this.dataTargetDir = dataTargetDir;
        this.logsTargetDir = logsTargetDir;
        this.configurationSourceDir = configurationSourceDir;
        this.configurationTargetDir = configurationTargetDir;
    }

    public static DatanodeDirectories fromConfiguration(Configuration configuration, NodeId nodeId) {
        final DatanodeDirectories directories = new DatanodeDirectories(
                backwardsCompatible(configuration.getOpensearchDataLocation(), nodeId, "opensearch_data_location"),
                backwardsCompatible(configuration.getOpensearchLogsLocation(), nodeId, "opensearch_logs_location"),
                configuration.getDatanodeConfigurationLocation(),
                backwardsCompatible(configuration.getOpensearchConfigLocation(), nodeId, "opensearch_config_location")
        );

        LOG.info("Opensearch of the node {} uses following directories as its storage: {}", nodeId.getNodeId(), directories);
        return directories;
    }

    /**
     * Originally we created a subdir named by the node ID for each of the data/config/logs directories and automatically
     * used that subdir. Later we discovered that this won't allow us to run rolling upgrades for opensearch, as we
     * are unable to point the configuration to an exact directory. This method works as a backwards compatible
     * fallback, detecting the presence of the node ID subdir and using it, if available. It also logs a warning with
     * configuration change suggestion.
     * TODO: Remove in 6.0 release
     */
    @Deprecated(forRemoval = true)
    @Nonnull
    protected static Path backwardsCompatible(@Nonnull Path path, NodeId nodeId, String configProperty) {
        final Path nodeIdSubdir = path.resolve(nodeId.getNodeId());
        if(Files.exists(nodeIdSubdir) && Files.isDirectory(nodeIdSubdir)) {
            LOG.warn("Caution, this datanode instance uses old format of directories. Please configure {} to point directly to {}", configProperty, nodeIdSubdir.toAbsolutePath());
            return nodeIdSubdir;
        }
        return path;
    }

    /**
     * This directory is used by the managed opensearch to store its data in it.
     * Read-write permissions required.
     */
    public Path getDataTargetDir() {
        return dataTargetDir.toAbsolutePath();
    }

    /**
     * This directory is used by the managed opensearch to store its logs in it.
     * Read-write permissions required.
     */
    public Path getLogsTargetDir() {
        return logsTargetDir.toAbsolutePath();
    }

    /**
     * This directory is provided by system admin to the datanode. We read our configuration from this location,
     * we read certificates from here. We'll never write anything to it.
     * Read-only permissions required.
     */
    public Optional<Path> getConfigurationSourceDir() {
        return Optional.ofNullable(configurationSourceDir).map(Path::toAbsolutePath);
    }

    public Optional<Path> resolveConfigurationSourceFile(String filename) {
        return resolveConfigurationSourceFile(Path.of(filename));
    }

    @Nonnull
    public Optional<Path> resolveConfigurationSourceFile(Path filePath) {
        if (filePath.isAbsolute()) {
            return Optional.of(filePath).filter(Files::exists);
        } else {
            return getConfigurationSourceDir().map(dir -> dir.resolve(filePath)).filter(Files::exists);
        }
    }

    /**
     * This directory is used by us to store all runtime-generated configuration of datanode. This
     * could be truststores, private keys, certificates and other generated config files.
     * We also synchronize and generate opensearch configuration into a subdir of this dir, see {@link #createUniqueOpensearchProcessConfigurationDir()}
     * Read-write permissions required.
     */
    public Path getConfigurationTargetDir() {
        return configurationTargetDir.toAbsolutePath();
    }

    @Nonnull
    static Path createRestrictedAccessFile(Path resolvedPath) throws IOException {
        Files.deleteIfExists(resolvedPath);
        final Set<PosixFilePermission> permissions = Set.of(PosixFilePermission.OWNER_WRITE, PosixFilePermission.OWNER_READ);
        final FileAttribute<Set<PosixFilePermission>> fileAttributes = PosixFilePermissions.asFileAttribute(permissions);
        return Files.createFile(resolvedPath, fileAttributes);
    }


    /**
     * This is a subdirectory of {@link #getConfigurationTargetDir()}. It's used by us to synchronize and generate opensearch
     * configuration. Opensearch is then instructed to accept this dir as its base configuration dir (OPENSEARCH_PATH_CONF env property).
      * Opensearch configuration is always regenerated during runtime, so the target dir may be temp and deleted when
     * the JVM terminates. This prevents concurrency collisions, outdated files, need to remove existing but not needed.
     */
    public OpensearchConfigurationDir createUniqueOpensearchProcessConfigurationDir() {
        final Path configRootDir = getConfigurationTargetDir();
        try {
            final Path opensearchConfigDir = Files.createTempDirectory(configRootDir, "opensearch", DIRECTORY_PERMISSIONS);
            // the process configuration dir can be safely removed when this JVM terminates. It will be generated
            // again next time we'll start a process.
            Runtime.getRuntime().addShutdownHook(new ConfigDirRemovalThread(opensearchConfigDir));
            return new OpensearchConfigurationDir(opensearchConfigDir);
        } catch (IOException e) {
            throw new OpensearchConfigurationException("Failed to create opensearch configuration directory", e);
        }
    }



    @Override
    public String toString() {
        return "DatanodeDirectories{" +
                "dataTargetDir='" + getDataTargetDir() + '\'' +
                ", logsTargetDir='" + getLogsTargetDir() + '\'' +
                ", configurationSourceDir='" + getConfigurationSourceDir() + '\'' +
                ", configurationTargetDir='" + getConfigurationTargetDir() + '\'' +
                '}';
    }
}
