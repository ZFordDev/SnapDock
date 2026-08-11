declare module "marked-gfm-heading-id" {
  import type { MarkedExtension } from "marked";

  export interface GfmHeadingIdOptions {
    prefix?: string;
  }

  export function gfmHeadingId(options?: GfmHeadingIdOptions): MarkedExtension;
}
