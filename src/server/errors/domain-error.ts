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
  | "PRESENCE_TEXT_INVALID"
  | "CANNOT_RESPOND_TO_OWN_LIFE_POINT"
  | "LIFE_POINT_NOT_VISIBLE"
  | "UPLOAD_VALIDATION_FAILED"
  | "AVATAR_UNAVAILABLE"
  | "AVATAR_INVALID_PHOTO"
  | "AVATAR_GENERATION_FAILED"
  | "AVATAR_NOT_AVAILABLE"
  | "AVATAR_BUSY"
  | "AVATAR_CONSENT_REQUIRED";

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
    super("Email is already registered.");
  }
}
export class InvalidCredentialsError extends DomainError {
  readonly code = "INVALID_CREDENTIALS";
  readonly statusCode = 401;
  constructor() {
    super("Credentials are invalid.");
  }
}
export class PasswordPolicyError extends DomainError {
  readonly code = "PASSWORD_POLICY";
  readonly statusCode = 422;
  constructor() {
    super("Password does not satisfy the configured policy.");
  }
}
export class AuthenticationRequiredError extends DomainError {
  readonly code = "AUTHENTICATION_REQUIRED";
  readonly statusCode = 401;
  constructor() {
    super("Authentication is required.");
  }
}
export class ActiveSpaceAlreadyExistsError extends DomainError {
  readonly code = "ACTIVE_SPACE_ALREADY_EXISTS";
  readonly statusCode = 409;
  constructor() {
    super("User already has an active Space.");
  }
}
export class SpaceInactiveError extends DomainError {
  readonly code = "SPACE_INACTIVE";
  readonly statusCode = 409;
  constructor() {
    super("Space is not active.");
  }
}
export class OwnerPermissionRequiredError extends DomainError {
  readonly code = "OWNER_PERMISSION_REQUIRED";
  readonly statusCode = 403;
  constructor() {
    super("Owner permission is required.");
  }
}
export class InvitationNotFoundError extends DomainError {
  readonly code = "INVITATION_NOT_FOUND";
  readonly statusCode = 404;
  constructor() {
    super("Invitation was not found.");
  }
}
export class InvitationRevokedError extends DomainError {
  readonly code = "INVITATION_REVOKED";
  readonly statusCode = 410;
  constructor() {
    super("Invitation has been revoked.");
  }
}
export class InvitationEmailMismatchError extends DomainError {
  readonly code = "INVITATION_EMAIL_MISMATCH";
  readonly statusCode = 403;
  constructor() {
    super("Authenticated email does not match the invitation.");
  }
}
export class ActiveResidentConflictError extends DomainError {
  readonly code = "ACTIVE_RESIDENT_CONFLICT";
  readonly statusCode = 409;
  constructor() {
    super("User has a conflicting active residency.");
  }
}
export class RateLimitExceededError extends DomainError {
  readonly code = "RATE_LIMIT_EXCEEDED";
  readonly statusCode = 429;
  constructor() {
    super("Rate limit exceeded.");
  }
}
export class TransactionConflictError extends DomainError {
  readonly code = "TRANSACTION_CONFLICT";
  readonly statusCode = 409;
  constructor() {
    super("Transaction conflict.");
  }
}

export class PresenceTextInvalidError extends DomainError {
  readonly code = "PRESENCE_TEXT_INVALID";
  readonly statusCode = 422;
  constructor() {
    super("Presence text must contain at most 120 Unicode characters.");
  }
}

export class SpaceNotFoundError extends DomainError {
  readonly code = "SPACE_NOT_FOUND";
  readonly statusCode = 404;

  constructor() {
    super("Space was not found.");
  }
}

export class NotSpaceResidentError extends DomainError {
  readonly code = "NOT_SPACE_RESIDENT";
  readonly statusCode = 403;

  constructor() {
    super("Active Space residency is required.");
  }
}

export class SpaceFullError extends DomainError {
  readonly code = "SPACE_FULL";
  readonly statusCode = 409;

  constructor() {
    super("Space has reached its active Resident capacity.");
  }
}

export class InvitationExpiredError extends DomainError {
  readonly code = "INVITATION_EXPIRED";
  readonly statusCode = 410;

  constructor() {
    super("Invitation has expired.");
  }
}

export class InvitationAlreadyUsedError extends DomainError {
  readonly code = "INVITATION_ALREADY_USED";
  readonly statusCode = 409;

  constructor() {
    super("Invitation has already been used.");
  }
}

export class CannotRespondToOwnLifePointError extends DomainError {
  readonly code = "CANNOT_RESPOND_TO_OWN_LIFE_POINT";
  readonly statusCode = 422;

  constructor() {
    super("A Resident cannot respond to their own Life Point.");
  }
}

export class LifePointNotVisibleError extends DomainError {
  readonly code = "LIFE_POINT_NOT_VISIBLE";
  readonly statusCode = 404;

  constructor() {
    super("Life Point is not visible to this Resident.");
  }
}

export class UploadValidationError extends DomainError {
  readonly code = "UPLOAD_VALIDATION_FAILED";
  readonly statusCode = 422;

  constructor(message = "Upload validation failed.", options?: ErrorOptions) {
    super(message, options);
  }
}

export class AvatarUnavailableError extends DomainError {
  readonly code = "AVATAR_UNAVAILABLE";
  readonly statusCode = 503;
  constructor() {
    super("AVATAR_UNAVAILABLE");
  }
}

export class AvatarInvalidPhotoError extends DomainError {
  readonly code = "AVATAR_INVALID_PHOTO";
  readonly statusCode = 422;
  constructor() {
    super("AVATAR_INVALID_PHOTO");
  }
}

export class AvatarGenerationFailedError extends DomainError {
  readonly code = "AVATAR_GENERATION_FAILED";
  readonly statusCode = 502;
  constructor() {
    super("AVATAR_GENERATION_FAILED");
  }
}

export class AvatarNotAvailableError extends DomainError {
  readonly code = "AVATAR_NOT_AVAILABLE";
  readonly statusCode = 404;
  constructor() {
    super("AVATAR_NOT_AVAILABLE");
  }
}

export class AvatarBusyError extends DomainError {
  readonly code = "AVATAR_BUSY";
  readonly statusCode = 409;
  constructor() {
    super("AVATAR_BUSY");
  }
}

export class AvatarConsentRequiredError extends DomainError {
  readonly code = "AVATAR_CONSENT_REQUIRED";
  readonly statusCode = 422;
  constructor() {
    super("AVATAR_CONSENT_REQUIRED");
  }
}
