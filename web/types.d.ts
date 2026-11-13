declare module "bpmn-auto-layout" {
  export function layoutProcess(xml: string): Promise<string | { xml: string; warnings?: string[] }>;
}

declare module "bpmn-js/lib/Modeler";
declare module "bpmn-js-token-simulation";
declare module "bpmn-moddle";

