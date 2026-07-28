export type DomainErrorCode =
  | "EMAIL_ALREADY_REGISTERED"
  | "INVALID_CREDENTIALS"
  | "PASSWORD_POLICY"
  | "AUTHENTICATION_REQUIRED"
  | "ACTIVE_SPACE_ALREADY_EXISTS"
  | "SPACE_NOT_FOUND"
  | "SPACE_INACTIVE"
  | "NOT_SPACE_RESIDENT"
  | "OWNER_PERMISSION_REQUIRED"
  | "SPACE_FULL"
  | "INVITATION_NOT_FOUND"
  | "INVITATION_EXPIRED"
  | "INVITATION_REVOKED"
  | "INVITATION_ALREADY_USED"
  | "INVITATION_EMAIL_MISMATCH"
  | "ACTIVE_RESIDENT_CONFLICT"
  | "RATE_LIMIT_EXCEEDED"
  | "TRANSACTION_CONFLICT"
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

export class EmailAlreadyRegisteredError extends DomainError {
  readonly code = "EMAIL_ALREADY_REGISTERED";
  readonly statusCode = 409;
  constructor() {
    super("这个邮箱已经注册过了。");
  }
}
export class InvalidCredentialsError extends DomainError {
  readonly code = "INVALID_CREDENTIALS";
  readonly statusCode = 401;
  constructor() {
    super("邮箱或密码不正确，请慢慢再试一次。");
  }
}
export class PasswordPolicyError extends DomainError {
  readonly code = "PASSWORD_POLICY";
  readonly statusCode = 422;
  constructor() {
    super("密码需要在 15 到 128 个字符之间。");
  }
}
export class AuthenticationRequiredError extends DomainError {
  readonly code = "AUTHENTICATION_REQUIRED";
  readonly statusCode = 401;
  constructor() {
    super("请先登录，再继续回到我们的空间。");
  }
}
export class ActiveSpaceAlreadyExistsError extends DomainError {
  readonly code = "ACTIVE_SPACE_ALREADY_EXISTS";
  readonly statusCode = 409;
  constructor() {
    super("你已经住在一个 Space 里了。");
  }
}
export class SpaceInactiveError extends DomainError {
  readonly code = "SPACE_INACTIVE";
  readonly statusCode = 409;
  constructor() {
    super("这个 Space 现在无法加入。");
  }
}
export class OwnerPermissionRequiredError extends DomainError {
  readonly code = "OWNER_PERMISSION_REQUIRED";
  readonly statusCode = 403;
  constructor() {
    super("只有这个 Space 的 OWNER 可以这样做。");
  }
}
export class InvitationNotFoundError extends DomainError {
  readonly code = "INVITATION_NOT_FOUND";
  readonly statusCode = 404;
  constructor() {
    super("找不到这份邀请。");
  }
}
export class InvitationRevokedError extends DomainError {
  readonly code = "INVITATION_REVOKED";
  readonly statusCode = 410;
  constructor() {
    super("这份邀请已经撤销。");
  }
}
export class InvitationEmailMismatchError extends DomainError {
  readonly code = "INVITATION_EMAIL_MISMATCH";
  readonly statusCode = 403;
  constructor() {
    super("请使用收到邀请的邮箱登录。");
  }
}
export class ActiveResidentConflictError extends DomainError {
  readonly code = "ACTIVE_RESIDENT_CONFLICT";
  readonly statusCode = 409;
  constructor() {
    super("你已经住在另一个 Space 里了。");
  }
}
export class RateLimitExceededError extends DomainError {
  readonly code = "RATE_LIMIT_EXCEEDED";
  readonly statusCode = 429;
  constructor() {
    super("尝试有些频繁，请稍后再回来。");
  }
}
export class TransactionConflictError extends DomainError {
  readonly code = "TRANSACTION_CONFLICT";
  readonly statusCode = 409;
  constructor() {
    super("刚刚有人同时进行了操作，请再试一次。");
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
