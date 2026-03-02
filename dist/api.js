// src/api/api.ts
import { join as join2 } from "path";

// src/api/ExtensionBuilder.ts
import { dirname, join, resolve } from "path";
import { stat, mkdir, writeFile, readFile } from "fs/promises";
var ExtensionFileReader = class {
  absoluteSrcFilePath;
  lastModificationTimeMs;
  constructor(absoluteSrcFilePath) {
    this.absoluteSrcFilePath = absoluteSrcFilePath;
    this.lastModificationTimeMs = -Infinity;
  }
  async ensureFileExists() {
    try {
      await stat(this.absoluteSrcFilePath);
    } catch (err) {
      if (err?.code !== "ENOENT") throw err;
      await mkdir(dirname(this.absoluteSrcFilePath), { recursive: true });
      await writeFile(this.absoluteSrcFilePath, "");
    }
  }
  async read() {
    await this.ensureFileExists();
    const stats = await stat(this.absoluteSrcFilePath);
    const lastModificationTimeMs = stats.mtimeMs;
    const hasChanged = lastModificationTimeMs > this.lastModificationTimeMs;
    if (!hasChanged) return null;
    const data = (await readFile(this.absoluteSrcFilePath)).toString();
    this.lastModificationTimeMs = lastModificationTimeMs;
    return data;
  }
};
var ExtensionFileEmitter = class {
  absoluteDistFilePath;
  constructor(absoluteDistFilePath) {
    this.absoluteDistFilePath = absoluteDistFilePath;
  }
  async toFile(data) {
    await mkdir(dirname(this.absoluteDistFilePath), { recursive: true });
    await writeFile(this.absoluteDistFilePath, data);
    return this.absoluteDistFilePath;
  }
};
var ExtensionComponent = class {
  artifactsConfig;
  readers;
  emitters;
  constructor(name, absoluteSrcDirectoryPath, absoluteDistDirectoryPath, artifactsConfig = {}) {
    this.artifactsConfig = artifactsConfig;
    this.readers = {};
    this.emitters = {};
    for (const artifactExtension in this.artifactsConfig) {
      if (!this.artifactsConfig[artifactExtension]) continue;
      const fileName = `${name}.${artifactExtension}`;
      this.readers[artifactExtension] = new ExtensionFileReader(join(absoluteSrcDirectoryPath, name, fileName));
      this.emitters[artifactExtension] = new ExtensionFileEmitter(join(absoluteDistDirectoryPath, fileName));
    }
  }
  async build() {
    const emittedFilesPaths = [];
    for (const artifactExtension in this.artifactsConfig) {
      if (!this.artifactsConfig[artifactExtension]) continue;
      const data = await this.readers[artifactExtension].read();
      if (data === null) continue;
      const emittedFilePath = await this.emitters[artifactExtension].toFile(data);
      emittedFilesPaths.push(emittedFilePath);
    }
    return emittedFilesPaths;
  }
};
var ExtensionBuilder = class {
  components = [];
  constructor(srcDirectoryPath, distDirectoryPath, ...components) {
    const absoluteSrcDirectoryPath = resolve(srcDirectoryPath);
    const absoluteDistDirectoryPath = resolve(distDirectoryPath);
    components.forEach((component) => {
      const artifactsConfigWithDefaults = {
        js: true,
        html: false,
        css: false,
        ...component.artifactsConfig ?? {}
      };
      this.components.push(
        new ExtensionComponent(
          component.name,
          absoluteSrcDirectoryPath,
          absoluteDistDirectoryPath,
          artifactsConfigWithDefaults
        )
      );
    });
  }
  async build() {
    const emittedFilesPaths = (await Promise.all(
      [...this.components].flatMap((component) => {
        return component.build();
      })
    )).flat();
    return emittedFilesPaths.flat();
  }
};

// config.json
var config_default = {
  defaultDirectoryNameSrc: "src",
  defaultDirectoryNameDist: "dist"
};

// src/api/api.ts
function createExtensionBuilder(rootPath, artifactDirectoryNames = {}) {
  return new ExtensionBuilder(
    join2(rootPath, artifactDirectoryNames?.src ?? config_default.defaultDirectoryNameSrc),
    join2(rootPath, artifactDirectoryNames?.dist ?? config_default.defaultDirectoryNameDist),
    {
      name: "background"
    },
    {
      name: "popup",
      artifactsConfig: {
        html: true,
        js: true,
        css: true
      }
    },
    {
      name: "newtab",
      artifactsConfig: {
        html: true,
        js: true,
        css: true
      }
    }
  );
}
export {
  createExtensionBuilder
};
