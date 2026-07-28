export type DomainErrorCode =
  | "SPACE_NOT_FOUND"
  | "NOT_SPACE_RESIDENT"
  | "SPACE_FULL"
  | "INVITATION_EXPIRED"
  | "INVITATION_ALREADY_USED"
  | "CANNOT_RESPOND_TO_OWN_LIFE_POINT"
  | "LIFE_POINT_NOT_VISIBLE"
  | "UPLOAD_VALIDATION_FAILED";

export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;
  abstract readonly statusCode: number;

  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class SpaceNotFoundError extends DomainError {
  readonly code = "SPACE_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("找不到这个 Space。");
  }
}

export class NotSpaceResidentError extends DomainError {
  readonly code = "NOT_SPACE_RESIDENT";
  readonly statusCode = 403;

  constructor() {
    super("你无法访问这个 Space。");
  }
}

export class SpaceFullError extends DomainError {
  readonly code = "SPACE_FULL";
  readonly statusCode = 409;

  constructor() {
    super("这个 Space 已经住满了。");
  }
}

export class InvitationExpiredError extends DomainError {
  readonly code = "INVITATION_EXPIRED";
  readonly statusCode = 410;

  constructor() {
    super("这份邀请已经过期。");
  }
}

export class InvitationAlreadyUsedError extends DomainError {
  readonly code = "INVITATION_ALREADY_USED";
  readonly statusCode = 409;

  constructor() {
    super("这份邀请已经使用过了。");
  }
}

export class CannotRespondToOwnLifePointError extends DomainError {
  readonly code = "CANNOT_RESPOND_TO_OWN_LIFE_POINT";
  readonly statusCode = 422;

  constructor() {
    super("不能回应自己留下的 Life Point。");
  }
}

export class LifePointNotVisibleError extends DomainError {
  readonly code = "LIFE_POINT_NOT_VISIBLE";
  readonly statusCode = 404;

  constructor() {
    super("无法查看这个 Life Point。");
  }
}

export class UploadValidationError extends DomainError {
  readonly code = "UPLOAD_VALIDATION_FAILED";
  readonly statusCode = 422;

  constructor(message = "这个文件暂时无法上传。", options?: ErrorOptions) {
    super(message, options);
  }
}
