/**
 * Email inventory derived from current AuthCore account and organization flows.
 * This is metadata only: no jobs, event listeners or delivery wiring are added.
 * job-defined = matching queue contract exists (not proof of delivery integration).
 * recommended = existing project event warrants this notification; wiring is separate.
 * reserved = retain for a flow that is not currently implemented.
 * Send only after the described operation commits. Do not notify for normal refresh,
 * routine logout, every failed sign-in, or minor profile edits. Avoid duplicate messages.
 * All messages are transactional, with no tracking pixels or promotional content.
 * Sender identity, domain authentication, delivery policy and preferences belong to
 * the sending system. Rendering templates does not configure those responsibilities.
 */
export const EMAIL_TEMPLATE_CATALOG = [
  {
    file: "verification-email",
    function: "verificationEmailTemplate",
    trigger: "Account registration requests mailbox verification.",
    recipient: "Account email address.",
    status: "job-defined",
    source: "auth.service.ts registerUser; email.send_verification",
  },
  {
    file: "resend-verification-email",
    function: "resendVerificationEmailTemplate",
    trigger: "User requests another verification email.",
    recipient: "Account email address.",
    status: "job-defined",
    source: "auth.service.ts resendVerification; uses email.send_verification today",
  },
  {
    file: "password-reset-email",
    function: "passwordResetEmailTemplate",
    trigger: "User requests password recovery.",
    recipient: "Account email address.",
    status: "job-defined",
    source: "auth.service.ts forgotPassword; email.send_password_reset",
  },
  {
    file: "invitation-email",
    function: "invitationEmailTemplate",
    trigger: "Organization sends an invitation to a user or email address.",
    recipient: "Invited user or mailbox.",
    status: "job-defined",
    source:
      "invitation.service.ts sendInvite; email.send_invitation job exists, publishing remains TODO",
  },
  {
    file: "email-change-confirmation",
    function: "emailChangeConfirmationTemplate",
    trigger:
      "Future verified email-change request; send only after that flow is implemented.",
    recipient: "Proposed new mailbox.",
    status: "reserved",
    source: "Existing template retained; current email-change routes are absent",
  },
  {
    file: "welcome-email",
    function: "welcomeEmailTemplate",
    trigger: "Mailbox verification succeeds, once per account.",
    recipient: "Verified account mailbox.",
    status: "recommended",
    source: "auth.service.ts verifyEmail",
  },
  {
    file: "password-changed-email",
    function: "passwordChangedEmailTemplate",
    trigger: "An authenticated password change succeeds.",
    recipient: "Account mailbox.",
    status: "recommended",
    source: "auth.service.ts changePassword",
  },
  {
    file: "password-reset-complete-email",
    function: "passwordResetCompleteEmailTemplate",
    trigger: "Password recovery completes successfully.",
    recipient: "Account mailbox.",
    status: "recommended",
    source: "auth.service.ts resetPassword",
  },
  {
    file: "new-sign-in-email",
    function: "newSignInEmailTemplate",
    trigger:
      "Successful login from a newly recognized device or security-relevant context; not every refresh.",
    recipient: "Account mailbox.",
    status: "recommended",
    source:
      "auth.service.ts loginUser; session.device has name and IP; new-device detection needs integration",
  },
  {
    file: "sessions-revoked-email",
    function: "sessionsRevokedEmailTemplate",
    trigger:
      "Explicit session revocation completes; consolidate an all-session operation into one message.",
    recipient: "Account mailbox.",
    status: "recommended",
    source:
      "auth.service.ts revokeSession and revokeAllSessions; session.service.ts revokeAllExceptCurrent",
  },
  {
    file: "account-status-changed-email",
    function: "accountStatusChangedEmailTemplate",
    trigger:
      "A meaningful account status change succeeds; avoid duplicating welcome on initial verification.",
    recipient: "Account mailbox.",
    status: "recommended",
    source: "users.service.ts changeStatus and deactivateUser; USER_STATUSES",
  },
  {
    file: "account-deleted-email",
    function: "accountDeletedEmailTemplate",
    trigger: "Account deletion succeeds; capture recipient details before deleting.",
    recipient: "Deleted account mailbox.",
    status: "recommended",
    source: "users.service.ts deleteUser",
  },
  {
    file: "member-added-email",
    function: "memberAddedEmailTemplate",
    trigger:
      "Direct membership creation succeeds; invitation acceptance uses its own confirmation to avoid duplicates.",
    recipient: "Added member.",
    status: "recommended",
    source: "members/member.service.ts addMember; Member status defaults to invited",
  },
  {
    file: "member-role-changed-email",
    function: "memberRoleChangedEmailTemplate",
    trigger: "Member role change commits.",
    recipient: "Affected member.",
    status: "recommended",
    source: "members/member.service.ts changeRole",
  },
  {
    file: "member-status-changed-email",
    function: "memberStatusChangedEmailTemplate",
    trigger: "A member is activated, suspended or removed.",
    recipient: "Affected member.",
    status: "recommended",
    source: "members/member.service.ts activateMember, suspendMember and removeMember",
  },
  {
    file: "invitation-accepted-email",
    function: "invitationAcceptedEmailTemplate",
    trigger: "Invitation acceptance and active membership creation both commit.",
    recipient: "Inviter or designated organization administrator.",
    status: "recommended",
    source: "invitations/invitation.service.ts acceptInvite",
  },
  {
    file: "invitation-revoked-email",
    function: "invitationRevokedEmailTemplate",
    trigger: "A previously delivered pending invitation is revoked.",
    recipient: "Original invited mailbox.",
    status: "recommended",
    source: "invitations/invitation.service.ts revokeInvitation",
  },
  {
    file: "organization-created-email",
    function: "organizationCreatedEmailTemplate",
    trigger: "Organization creation commits.",
    recipient: "Organization creator.",
    status: "recommended",
    source: "organization.service.ts create",
  },
  {
    file: "organization-updated-email",
    function: "organizationUpdatedEmailTemplate",
    trigger:
      "Meaningful settings changes such as name, slug or frontend URL commit; batch fields in one message.",
    recipient: "Organization creator or designated administrators.",
    status: "recommended",
    source: "organization.service.ts update and updateSlug",
  },
  {
    file: "organization-deleted-email",
    function: "organizationDeletedEmailTemplate",
    trigger: "Organization soft deletion succeeds.",
    recipient: "Organization creator; affected members according to notification policy.",
    status: "recommended",
    source: "organization.service.ts deleteOrganization; repository softDelete",
  },
  {
    file: "api-key-created-email",
    function: "apiKeyCreatedEmailTemplate",
    trigger: "API key created operation commits.",
    recipient: "Organization creator or designated security administrators.",
    status: "recommended",
    source: "api-keys/api-key.service.ts create",
  },
  {
    file: "api-key-revoked-email",
    function: "apiKeyRevokedEmailTemplate",
    trigger: "API key revoked operation commits.",
    recipient: "Organization creator or designated security administrators.",
    status: "recommended",
    source: "api-keys/api-key.service.ts revokeById / revokeByKey",
  },
  {
    file: "api-key-deleted-email",
    function: "apiKeyDeletedEmailTemplate",
    trigger: "API key deleted operation commits.",
    recipient: "Organization creator or designated security administrators.",
    status: "recommended",
    source: "api-keys/api-key.service.ts softDeleteById / softDeleteByKey",
  },
  {
    file: "role-permissions-changed-email",
    function: "rolePermissionsChangedEmailTemplate",
    trigger:
      "A role permissions update commits; notify once per change, not each permission.",
    recipient: "Organization administrators; affected members if policy requires.",
    status: "recommended",
    source: "roles/role.service.ts updateRole; only when permissions actually change",
  },
  {
    file: "email-address-changed-email",
    function: "emailAddressChangedEmailTemplate",
    trigger: "Future verified email change commits; notify old and new mailboxes.",
    recipient: "Previous mailbox and confirmed new mailbox.",
    status: "reserved",
    source:
      "Companion to retained email-change-confirmation template; current change flow is absent",
  },
] as const;
