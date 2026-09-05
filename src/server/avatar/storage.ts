import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  writeFile,
  unlink,
  readdir,
  stat,
} from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";

export interface AvatarStorage {
  put(bytes: Buffer): Promise<string>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}
export class LocalAvatarStorage implements AvatarStorage {
  readonly root: string;
  constructor(root = process.env.AVATAR_STORAGE_DIR || ".data/avatars") {
    this.root = resolve(root);
    const withinPublic = relative(resolve("public"), this.root);
    if (
      !withinPublic ||
      (!withinPublic.startsWith("..") && !isAbsolute(withinPublic))
    )
      throw new Error("AVATAR_STORAGE_DIR 不能位于 public 内");
  }
  private path(key: string) {
    if (!/^[a-f0-9-]{36}\.png$/.test(key)) throw new Error("无效资源键");
    return resolve(this.root, key);
  }
  async put(bytes: Buffer) {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const key = `${randomUUID()}.png`;
    await writeFile(this.path(key), bytes, { flag: "wx", mode: 0o600 });
    return key;
  }
  get(key: string) {
    return readFile(this.path(key));
  }
  async remove(key: string) {
    await unlink(this.path(key)).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
  async orphanKeys(olderThan: Date): Promise<string[]> {
    const files = await readdir(this.root).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const result = [];
    for (const key of files) {
      if (!/^[a-f0-9-]{36}\.png$/.test(key)) continue;
      const info = await stat(this.path(key)).catch(() => null);
      if (info && info.mtime < olderThan) result.push(key);
    }
    return result;
  }
}
