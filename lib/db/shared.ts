// The app's routes and forms speak in the same human-readable strings the
// Airtable single-selects used ("Package Option", "Sent"). The database
// stores lowercase/snake_case values instead, so these are the only two
// places that ever need to know both spellings.

export type LineItemKind = "Fixed" | "Package Option" | "Add-on";
type DbLineItemKind = "fixed" | "package_option" | "add_on";

const KIND_TO_DB: Record<LineItemKind, DbLineItemKind> = {
  Fixed: "fixed",
  "Package Option": "package_option",
  "Add-on": "add_on",
};

const KIND_FROM_DB: Record<DbLineItemKind, LineItemKind> = {
  fixed: "Fixed",
  package_option: "Package Option",
  add_on: "Add-on",
};

export function kindToDb(kind: LineItemKind): DbLineItemKind {
  return KIND_TO_DB[kind];
}

export function kindFromDb(kind: string | null): LineItemKind {
  return KIND_FROM_DB[(kind ?? "fixed") as DbLineItemKind] ?? "Fixed";
}

export type ProposalStatus = "Draft" | "Sent" | "Viewed" | "Signed" | "Invoiced" | "Paid";
type DbProposalStatus = "draft" | "sent" | "viewed" | "signed" | "invoiced" | "paid";

const STATUS_TO_DB: Record<ProposalStatus, DbProposalStatus> = {
  Draft: "draft",
  Sent: "sent",
  Viewed: "viewed",
  Signed: "signed",
  Invoiced: "invoiced",
  Paid: "paid",
};

const STATUS_FROM_DB: Record<DbProposalStatus, ProposalStatus> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  invoiced: "Invoiced",
  paid: "Paid",
};

export function statusToDb(status: ProposalStatus): DbProposalStatus {
  return STATUS_TO_DB[status];
}

export function statusFromDb(status: string): ProposalStatus {
  return STATUS_FROM_DB[status as DbProposalStatus] ?? "Draft";
}

export type FindingType = "Gain" | "Opportunity" | "Leak" | "Driver";
type DbFindingType = "gain" | "opportunity" | "leak" | "driver";

const FINDING_TYPE_TO_DB: Record<FindingType, DbFindingType> = {
  Gain: "gain",
  Opportunity: "opportunity",
  Leak: "leak",
  Driver: "driver",
};

const FINDING_TYPE_FROM_DB: Record<DbFindingType, FindingType> = {
  gain: "Gain",
  opportunity: "Opportunity",
  leak: "Leak",
  driver: "Driver",
};

export function findingTypeToDb(type: FindingType): DbFindingType {
  return FINDING_TYPE_TO_DB[type];
}

export function findingTypeFromDb(type: string): FindingType {
  return FINDING_TYPE_FROM_DB[type as DbFindingType] ?? "Opportunity";
}
