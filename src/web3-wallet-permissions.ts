interface Caveat {
  type: string;
  value: any;
}

interface Permission {
  invoker: string;
  parentCapability: string;
  caveats: Caveat[];
}

interface PermissionRequest {
  [methodName: string]: {
    [caveatName: string]: any;
  };
}

interface RequestedPermission {
  parentCapability: string;
  date?: number;
}

interface IdRequestedPermission extends RequestedPermission, Permission {
  readonly id: string;
}


export type {
  Caveat,
  Permission,
  PermissionRequest,
  RequestedPermission,
  IdRequestedPermission
};
