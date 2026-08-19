export interface NeteaseApiTag {
  description: string;
  name: string;
  prefixes: string[];
  title: string;
}

export interface LegacyEndpointDoc {
  description?: string;
  examples: Map<string, string>;
  optional: Set<string>;
  parameterDescriptions: Map<string, string>;
  required: Set<string>;
  title: string;
}
