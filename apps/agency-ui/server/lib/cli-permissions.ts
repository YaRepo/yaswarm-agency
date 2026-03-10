import path from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";

const AGENCY_ROOT =
  process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";
const POLICY_PATH = path.join(AGENCY_ROOT, "config", "cli-permissions.json");

export type CliActorRole = "subagent" | "head" | "ceo" | "user";
export type CliAccessMode = "default" | "full";
export type ApprovalRole = "department_head" | "ceo" | "user" | "none";

export type CliPermissionPolicy = {
  allowSubagentFullAccess: boolean;
  requireHeadApprovalForSubagentEscalation: boolean;
  requireCeoApprovalForHeadEscalation: boolean;
  requireUserApprovalForCeoEscalation: boolean;
  ceoDefaultAccessMode: CliAccessMode;
  updatedAt: string;
};

export type PermissionDecision = {
  allow: boolean;
  approvalRequired: boolean;
  approverRole: ApprovalRole;
  reason: string;
};

export function defaultCliPermissionPolicy(): CliPermissionPolicy {
  return {
    allowSubagentFullAccess: false,
    requireHeadApprovalForSubagentEscalation: true,
    requireCeoApprovalForHeadEscalation: true,
    requireUserApprovalForCeoEscalation: false,
    ceoDefaultAccessMode: "full",
    updatedAt: new Date().toISOString(),
  };
}

export function readCliPermissionPolicy(): CliPermissionPolicy {
  if (!existsSync(POLICY_PATH)) {
    const p = defaultCliPermissionPolicy();
    writeCliPermissionPolicy(p);
    return p;
  }
  try {
    const parsed = JSON.parse(readFileSync(POLICY_PATH, "utf-8"));
    return { ...defaultCliPermissionPolicy(), ...parsed };
  } catch {
    const p = defaultCliPermissionPolicy();
    writeCliPermissionPolicy(p);
    return p;
  }
}

export function writeCliPermissionPolicy(policy: CliPermissionPolicy): void {
  const payload = { ...policy, updatedAt: new Date().toISOString() };
  writeFileSync(POLICY_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

export function evaluatePermission(params: {
  actorRole: CliActorRole;
  requestedAccess: CliAccessMode;
  policy: CliPermissionPolicy;
}): PermissionDecision {
  const { actorRole, requestedAccess, policy } = params;
  if (requestedAccess === "default") {
    return {
      allow: true,
      approvalRequired: false,
      approverRole: "none",
      reason: "Default access allowed by policy",
    };
  }

  if (actorRole === "subagent") {
    if (policy.allowSubagentFullAccess) {
      return {
        allow: true,
        approvalRequired: false,
        approverRole: "none",
        reason: "Sub-agent full access allowed by policy",
      };
    }
    if (policy.requireHeadApprovalForSubagentEscalation) {
      return {
        allow: false,
        approvalRequired: true,
        approverRole: "department_head",
        reason: "Sub-agent full access requires department head approval",
      };
    }
    return {
      allow: false,
      approvalRequired: false,
      approverRole: "none",
      reason: "Sub-agent full access denied by policy",
    };
  }

  if (actorRole === "head") {
    if (policy.requireCeoApprovalForHeadEscalation) {
      return {
        allow: false,
        approvalRequired: true,
        approverRole: "ceo",
        reason: "Department head full access requires CEO approval",
      };
    }
    return {
      allow: true,
      approvalRequired: false,
      approverRole: "none",
      reason: "Department head full access allowed by policy",
    };
  }

  if (actorRole === "ceo") {
    if (policy.requireUserApprovalForCeoEscalation) {
      return {
        allow: false,
        approvalRequired: true,
        approverRole: "user",
        reason: "CEO full access requires user approval",
      };
    }
    return {
      allow: true,
      approvalRequired: false,
      approverRole: "none",
      reason: "CEO full access allowed by policy",
    };
  }

  return {
    allow: false,
    approvalRequired: false,
    approverRole: "none",
    reason: "Unsupported actor role",
  };
}
