export abstract class ArkSDKCacheable {
  protected accessor cache = new Map<
    string,
    { data: any; timestamp: number }
  >();
}
