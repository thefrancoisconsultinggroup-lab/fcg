import {defineArrayMember, defineField, defineType} from "sanity";
import type {StringInputProps} from "sanity";

function SummitOrderActionsNotice(props: StringInputProps) {
  void props;

  return (
    <div style={{border: "1px solid #d8dee3", borderRadius: 8, padding: 16}}>
      <h3 style={{fontSize: 16, margin: "0 0 8px"}}>Protected order actions</h3>
      <p style={{lineHeight: 1.5, margin: "0 0 12px"}}>
        Cancel registration, issue full refund, issue partial refund, check PayPal/refund
        status, and resend confirmation actions must run through protected server-side
        endpoints.
      </p>
      <p style={{lineHeight: 1.5, margin: 0}}>
        This project does not currently expose a server-verifiable administrator session
        for Next.js API routes. Financial actions are intentionally disabled until admin
        authentication is integrated.
      </p>
    </div>
  );
}

const readOnly = true;

export const summitPaymentRecordType = defineType({
  name: "summitPaymentRecord",
  title: "Summit Order",
  type: "document",
  fields: [
    defineField({
      name: "adminActions",
      title: "Order actions",
      type: "string",
      readOnly,
      components: {input: SummitOrderActionsNotice},
    }),
    defineField({name: "id", title: "Registration reference", type: "string", readOnly}),
    defineField({
      name: "status",
      title: "Payment status",
      type: "string",
      readOnly,
      options: {
        list: [
          "pending",
          "pending_approval",
          "approval_pending",
          "approved",
          "payment_processing",
          "capture_pending",
          "verification_required",
          "awaiting_bank_transfer",
          "payment_under_review",
          "paid",
          "expired",
          "cancelled",
          "declined",
          "failed",
          "payment_failed",
          "refunded",
          "reversed",
          "manual_review",
          "retry_ready",
        ],
      },
    }),
    defineField({name: "paymentMethod", title: "Payment method", type: "string", readOnly}),
    defineField({name: "currency", title: "Currency", type: "string", readOnly}),
    defineField({name: "originalUsdAmount", title: "Original USD amount", type: "number", readOnly}),
    defineField({name: "configuredExchangeRate", title: "Configured exchange rate", type: "number", readOnly}),
    defineField({name: "amountDue", title: "Amount due", type: "number", readOnly}),
    defineField({name: "paymentReference", title: "Payment reference", type: "string", readOnly}),
    defineField({name: "paymentDueAt", title: "Payment due at", type: "datetime", readOnly}),
    defineField({name: "summitAccessUrl", title: "Private Summit access URL", type: "url", readOnly}),
    defineField({name: "paypalOrderId", title: "PayPal order ID", type: "string", readOnly}),
    defineField({name: "captureId", title: "PayPal capture ID", type: "string", readOnly}),
    defineField({name: "payerEmail", title: "PayPal payer email", type: "string", readOnly}),
    defineField({name: "createdAt", title: "Created at", type: "datetime", readOnly}),
    defineField({name: "updatedAt", title: "Updated at", type: "datetime", readOnly}),
    defineField({name: "capturedAt", title: "Captured at", type: "datetime", readOnly}),
    defineField({name: "bankTransferRequestedAt", title: "Bank transfer requested at", type: "datetime", readOnly}),
    defineField({name: "bankTransferReceivedAt", title: "Bank transfer received at", type: "datetime", readOnly}),
    defineField({name: "paymentVerifiedAt", title: "Payment verified at", type: "datetime", readOnly}),
    defineField({name: "expiredAt", title: "Expired at", type: "datetime", readOnly}),
    defineField({name: "cancelledAt", title: "Cancelled at", type: "datetime", readOnly}),
    defineField({name: "amountReceived", title: "Amount received", type: "number", readOnly}),
    defineField({name: "currencyReceived", title: "Currency received", type: "string", readOnly}),
    defineField({name: "bankTransactionReference", title: "Bank transaction reference", type: "string", readOnly}),
    defineField({name: "reconciliationNote", title: "Reconciliation note", type: "text", rows: 2, readOnly}),
    defineField({name: "cancellationReason", title: "Cancellation reason", type: "text", rows: 2, readOnly}),
    defineField({
      name: "paymentVerifiedBy",
      title: "Payment verified by",
      type: "object",
      readOnly,
      fields: [
        defineField({name: "id", title: "Verifier ID", type: "string"}),
        defineField({name: "name", title: "Verifier name", type: "string"}),
        defineField({name: "email", title: "Verifier email", type: "string"}),
      ],
    }),
    defineField({name: "localBankTransferEligibilityConfirmed", title: "TTD bank-transfer eligibility confirmed", type: "boolean", readOnly}),
    defineField({name: "localBankTransferEligibilityConfirmedAt", title: "Eligibility confirmed at", type: "datetime", readOnly}),
    defineField({
      name: "registration",
      title: "Registration details",
      type: "object",
      readOnly,
      fields: [
        defineField({name: "firstName", title: "First name", type: "string"}),
        defineField({name: "lastName", title: "Last name", type: "string"}),
        defineField({name: "email", title: "Email", type: "string"}),
        defineField({name: "phone", title: "Telephone", type: "string"}),
        defineField({name: "country", title: "Country", type: "string"}),
        defineField({name: "organization", title: "Company / organisation", type: "string"}),
        defineField({name: "role", title: "Job title / role", type: "string"}),
        defineField({name: "dietaryNotes", title: "Dietary notes", type: "text", rows: 2}),
        defineField({name: "accessibilityNeeds", title: "Accessibility needs", type: "text", rows: 2}),
        defineField({name: "hopes", title: "Submitted notes / hopes", type: "text", rows: 3}),
      ],
    }),
    defineField({
      name: "pricing",
      title: "Financial summary",
      type: "object",
      readOnly,
      fields: [
        defineField({name: "categoryLabel", title: "Registration category", type: "string"}),
        defineField({name: "rateLabel", title: "Rate / package", type: "string"}),
        defineField({name: "rateDetail", title: "Rate detail", type: "string"}),
        defineField({name: "rateValue", title: "Rate value", type: "string"}),
        defineField({name: "attendeeCount", title: "Actual number attending", type: "number"}),
        defineField({name: "corporateCapacity", title: "Corporate capacity", type: "number"}),
        defineField({name: "unitPrice", title: "Unit price", type: "number"}),
        defineField({name: "fixedPackagePrice", title: "Fixed package price", type: "number"}),
        defineField({name: "originalPrice", title: "Original price", type: "number"}),
        defineField({name: "total", title: "Original amount paid / due", type: "number"}),
      ],
    }),
    defineField({
      name: "policyAcceptance",
      title: "Policy acceptance",
      type: "object",
      readOnly,
      fields: [
        defineField({name: "accepted", title: "Accepted", type: "boolean"}),
        defineField({name: "acceptedAt", title: "Accepted at", type: "datetime"}),
        defineField({name: "termsVersion", title: "Terms version", type: "string"}),
        defineField({name: "termsEffectiveDate", title: "Terms effective date", type: "string"}),
        defineField({name: "privacyPolicyVersion", title: "Privacy Policy version", type: "string"}),
        defineField({name: "privacyPolicyEffectiveDate", title: "Privacy Policy effective date", type: "string"}),
        defineField({name: "refundPolicyVersion", title: "Refund Policy version", type: "string"}),
        defineField({name: "refundPolicyEffectiveDate", title: "Refund Policy effective date", type: "string"}),
      ],
    }),
    defineField({name: "attendeeConfirmationSentAt", title: "Attendee confirmation sent at", type: "datetime", readOnly}),
    defineField({name: "registrationConfirmationSentAt", title: "Registration confirmation sent at", type: "datetime", readOnly}),
    defineField({name: "adminNotificationSentAt", title: "Organiser notification sent at", type: "datetime", readOnly}),
    defineField({name: "bankTransferInstructionsSentAt", title: "Bank transfer instructions sent at", type: "datetime", readOnly}),
    defineField({name: "bankTransferAdminNotificationSentAt", title: "Awaiting-transfer organiser email sent at", type: "datetime", readOnly}),
    defineField({name: "accessEmailSentAt", title: "Summit access email sent at", type: "datetime", readOnly}),
    defineField({name: "confirmationSentAt", title: "Final confirmation sent at", type: "datetime", readOnly}),
    defineField({name: "lastPaymentErrorCode", title: "Safe payment error code", type: "string", readOnly}),
    defineField({name: "lastPaymentErrorMessage", title: "Safe payment error message", type: "string", readOnly}),
    defineField({
      name: "lastPaymentDiagnostics",
      title: "Safe PayPal diagnostics",
      type: "object",
      readOnly,
      fields: [
        defineField({name: "source", title: "Diagnostic source", type: "string"}),
        defineField({name: "recordedAt", title: "Recorded at", type: "datetime"}),
        defineField({name: "captureHttpStatus", title: "Capture HTTP status", type: "number"}),
        defineField({name: "paypalName", title: "PayPal name", type: "string"}),
        defineField({name: "paypalIssue", title: "PayPal issue", type: "string"}),
        defineField({name: "paypalDescription", title: "PayPal description", type: "text", rows: 2}),
        defineField({name: "paypalDebugId", title: "PayPal debug ID", type: "string"}),
        defineField({name: "paypalOrderId", title: "PayPal order ID", type: "string"}),
        defineField({name: "captureId", title: "PayPal capture ID", type: "string"}),
        defineField({name: "finalOrderStatus", title: "Final order status", type: "string"}),
        defineField({name: "finalCaptureStatus", title: "Final capture status", type: "string"}),
        defineField({name: "webhookEventId", title: "Webhook event ID", type: "string"}),
        defineField({name: "webhookEventType", title: "Webhook event type", type: "string"}),
        defineField({name: "webhookSummary", title: "Webhook summary", type: "text", rows: 2}),
      ],
    }),
    defineField({name: "manualReviewReason", title: "Manual review reason", type: "text", rows: 2, readOnly}),
    defineField({
      name: "refundHistory",
      title: "Refund history",
      type: "array",
      readOnly,
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({name: "idempotencyKey", title: "Operation / idempotency key", type: "string"}),
            defineField({name: "paypalRefundId", title: "PayPal refund ID", type: "string"}),
            defineField({name: "paypalCaptureId", title: "PayPal capture ID", type: "string"}),
            defineField({name: "requestedAmount", title: "Requested amount", type: "string"}),
            defineField({name: "currency", title: "Currency", type: "string"}),
            defineField({name: "type", title: "Refund type", type: "string"}),
            defineField({name: "status", title: "Refund status", type: "string"}),
            defineField({name: "reason", title: "Refund reason", type: "text", rows: 2}),
            defineField({name: "internalNote", title: "Internal note", type: "text", rows: 2}),
            defineField({name: "requestedAt", title: "Requested at", type: "datetime"}),
            defineField({name: "completedAt", title: "Completed at", type: "datetime"}),
            defineField({name: "lastReconciledAt", title: "Last reconciled at", type: "datetime"}),
            defineField({name: "failureCode", title: "Safe failure code", type: "string"}),
            defineField({name: "failureMessage", title: "Safe failure message", type: "string"}),
            defineField({name: "attendeeNotificationSentAt", title: "Attendee refund email sent at", type: "datetime"}),
            defineField({name: "adminNotificationSentAt", title: "Organiser refund email sent at", type: "datetime"}),
          ],
          preview: {
            select: {
              amount: "requestedAmount",
              status: "status",
              type: "type",
            },
            prepare: ({amount, status, type}) => ({
              title: `${type ?? "Refund"} ${amount ?? ""} USD`,
              subtitle: status,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: "auditHistory",
      title: "Audit history",
      type: "array",
      readOnly,
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({name: "action", title: "Action", type: "string"}),
            defineField({name: "message", title: "Message", type: "text", rows: 2}),
            defineField({name: "occurredAt", title: "Occurred at", type: "datetime"}),
            defineField({name: "reference", title: "Reference", type: "string"}),
            defineField({name: "adminId", title: "Admin ID", type: "string"}),
            defineField({name: "adminName", title: "Admin name", type: "string"}),
            defineField({name: "adminEmail", title: "Admin email", type: "string"}),
          ],
          preview: {
            select: {
              action: "action",
              occurredAt: "occurredAt",
            },
            prepare: ({action, occurredAt}) => ({title: action, subtitle: occurredAt}),
          },
        }),
      ],
    }),
    defineField({
      name: "paypalOrderHistory",
      title: "Previous PayPal order attempts",
      type: "array",
      readOnly,
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({name: "orderId", title: "PayPal order ID", type: "string"}),
            defineField({name: "status", title: "Stored status", type: "string"}),
            defineField({name: "recordedAt", title: "Recorded at", type: "datetime"}),
            defineField({name: "failureCode", title: "Safe failure code", type: "string"}),
            defineField({name: "failureReason", title: "Safe failure reason", type: "string"}),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      email: "registration.email",
      firstName: "registration.firstName",
      lastName: "registration.lastName",
      paymentMethod: "paymentMethod",
      paymentReference: "paymentReference",
      status: "status",
      total: "amountDue",
      currency: "currency",
    },
    prepare: ({currency, email, firstName, lastName, paymentMethod, paymentReference, status, total}) => ({
      title:
        `${paymentReference ? `${paymentReference} - ` : ""}${firstName ?? ""} ${lastName ?? ""}`.trim() ||
        email ||
        "Summit order",
      subtitle: `${status ?? "unknown"} - ${paymentMethod ?? "unknown"} - ${currency ?? "USD"} ${total ?? ""}`,
    }),
  },
  orderings: [
    {
      title: "Created descending",
      name: "createdDesc",
      by: [{field: "createdAt", direction: "desc"}],
    },
    {
      title: "Captured descending",
      name: "capturedDesc",
      by: [{field: "capturedAt", direction: "desc"}],
    },
    {
      title: "Awaiting bank transfer",
      name: "awaitingBankTransfer",
      by: [{field: "paymentDueAt", direction: "asc"}],
    },
  ],
});
