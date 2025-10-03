import ArkSDKCore from '../../core/core.js';
import type { ArkSDKCommonProps } from '../../core/types.js';
import { version } from '../../version.js';
import { ArkSDKCacheable as ArkSDKCacheable } from './cacheable.js';

export abstract class ArkSDKModule extends ArkSDKCacheable {
  readonly core: ArkSDKCore;

  constructor(props: ArkSDKCommonProps) {
    super();
    const { core } = props;

    if (core) this.core = core;
    else this.core = new ArkSDKCore(props, version);
  }
}
