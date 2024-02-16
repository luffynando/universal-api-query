declare module 'dotprop' {
  // eslint-disable-next-line unicorn/prevent-abbreviations
  function getProp<T = unknown>(holder: unknown, propName: string): T;

  export = getProp;
}
