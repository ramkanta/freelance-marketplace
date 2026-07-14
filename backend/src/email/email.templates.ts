// Base URL for every clickable link inside emails (dashboard, order detail,
// legal pages, etc). Falls back to local dev if FRONTEND_URL isn't set —
// set it explicitly in production so email links don't point at localhost.
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/$/, '');
const link = (path: string) => `${FRONTEND_URL}${path}`;
const dashboardLink = (role: string) => link(role === 'freelancer' ? '/freelancer/dashboard' : '/customer/dashboard');
const orderLink = (orderId: string) => link(`/orders/${orderId}`);

const base = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <!-- Header -->
        <tr><td style="background:#4f46e5;border-radius:12px 12px 0 0;padding:28px 36px">
          <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">⚡ Servify</span>
          <span style="font-size:11px;color:#c7d2fe;margin-left:8px;font-weight:500">Escrow-Protected Marketplace</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center">
          <p style="margin:0;font-size:11px;color:#94a3b8">© 2026 Servify · All transactions are escrow-protected</p>
          <p style="margin:6px 0 0;font-size:11px;color:#94a3b8">
            <a href="${link('/privacy')}" style="color:#6366f1;text-decoration:none">Privacy Policy</a> &nbsp;·&nbsp;
            <a href="${link('/terms')}" style="color:#6366f1;text-decoration:none">Terms of Service</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const h1 = (text: string) =>
  `<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px">${text}</h1>`;

const p = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6">${text}</p>`;

const badge = (text: string, color = '#4f46e5') =>
  `<span style="display:inline-block;background:${color}15;color:${color};font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase">${text}</span>`;

const amount = (val: number | string) =>
  `<span style="font-size:28px;font-weight:800;color:#0f172a">₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">`;

const infoRow = (label: string, value: string) =>
  `<tr>
    <td style="padding:8px 0;font-size:13px;color:#94a3b8;width:140px;font-weight:600">${label}</td>
    <td style="padding:8px 0;font-size:13px;color:#0f172a;font-weight:600">${value}</td>
  </tr>`;

const table = (rows: string) =>
  `<table cellpadding="0" cellspacing="0" style="width:100%;margin:12px 0 24px">${rows}</table>`;

const btn = (text: string, url = '#', color = '#4f46e5') =>
  `<a href="${url}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;margin-top:8px">${text}</a>`;

const alertBox = (text: string, color = '#f59e0b') =>
  `<div style="background:${color}10;border-left:4px solid ${color};border-radius:0 8px 8px 0;padding:14px 18px;margin:16px 0">
    <p style="margin:0;font-size:13px;color:#0f172a;line-height:1.5">${text}</p>
  </div>`;

// ─── Templates ────────────────────────────────────────────────────────────────

export const templates = {

  // 1. Welcome on signup
  welcome: (name: string, role: string) => base(`
    ${h1(`Welcome to Servify, ${name}! 🎉`)}
    ${p(`Your ${role} account has been created successfully. You're now part of India's most secure freelance marketplace — every transaction is escrow-protected.`)}
    ${divider()}
    ${badge(role === 'freelancer' ? 'Freelancer Account' : 'Customer Account')}
    <br><br>
    ${role === 'freelancer'
      ? p('Complete your profile, list your services, and start receiving orders. Payments are guaranteed by our escrow vault.')
      : p('Browse expert freelancers across every digital discipline. Pay only when you approve the delivered work.')}
    ${btn('Go to Dashboard', dashboardLink(role))}
  `),

  // 2. Login security alert
  loginAlert: (name: string) => base(`
    ${h1('New sign-in detected')}
    ${p(`Hi ${name}, we noticed a new sign-in to your Servify account.`)}
    ${alertBox('If this was you, no action is needed. If you did not sign in, please contact support immediately at support@servify.in.', '#ef4444')}
  `),

  // 3. Wallet top-up
  walletDeposit: (name: string, depositAmount: number, newBalance: number) => base(`
    ${h1('Wallet Topped Up ✅')}
    ${p(`Hi ${name}, your Servify escrow wallet has been credited.`)}
    ${divider()}
    ${table(
      infoRow('Amount Added', `₹${Number(depositAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`) +
      infoRow('New Balance', `₹${Number(newBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`)
    )}
    ${p('Your wallet balance is ready to use for booking services. Funds are secured in our escrow vault.')}
    ${btn('Browse Services', link('/services'))}
  `),

  // 4a. Order confirmed (customer)
  orderConfirmedCustomer: (name: string, serviceTitle: string, orderAmount: number, orderId: string) => base(`
    ${h1('Order Confirmed 🔒')}
    ${p(`Hi ${name}, your order has been placed and funds are locked in escrow.`)}
    ${divider()}
    ${table(
      infoRow('Service', serviceTitle) +
      infoRow('Order ID', `#${orderId.slice(0, 8).toUpperCase()}`) +
      infoRow('Amount', `₹${Number(orderAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`) +
      infoRow('Status', 'In Escrow — Protected')
    )}
    ${alertBox('Your payment is safe. Funds will only be released to the freelancer once you approve the delivered work.', '#4f46e5')}
    ${btn('Track Order', orderLink(orderId))}
  `),

  // 4b. New order received (freelancer)
  orderReceivedFreelancer: (name: string, serviceTitle: string, orderAmount: number, commission: number, orderId: string) => base(`
    ${h1('New Order Received! 🎯')}
    ${p(`Hi ${name}, a customer has booked your service. Payment is secured in escrow.`)}
    ${divider()}
    ${table(
      infoRow('Service', serviceTitle) +
      infoRow('Order ID', `#${orderId.slice(0, 8).toUpperCase()}`) +
      infoRow('Order Value', `₹${Number(orderAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`) +
      infoRow('You Receive', `₹${Number(orderAmount - commission).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`) +
      infoRow('Platform Fee', `₹${Number(commission).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`)
    )}
    ${p('Deliver your best work and mark the order as delivered when complete. Payment releases instantly upon customer approval.')}
    ${btn('View Order', orderLink(orderId))}
  `),

  // 5. Delivery marked (customer)
  deliveryMarked: (name: string, serviceTitle: string, orderId: string) => base(`
    ${h1('Your Order Has Been Delivered 📦')}
    ${p(`Hi ${name}, the freelancer has marked your order as delivered.`)}
    ${divider()}
    ${table(
      infoRow('Service', serviceTitle) +
      infoRow('Order ID', `#${orderId.slice(0, 8).toUpperCase()}`)
    )}
    ${alertBox('Please review the work and either approve to release escrow funds, or raise a dispute within 14 days.', '#f59e0b')}
    ${btn('Review & Approve', orderLink(orderId))}
  `),

  // 6a. Delivery confirmed — freelancer gets paid
  deliveryConfirmedFreelancer: (name: string, serviceTitle: string, netAmount: number, orderId: string) => base(`
    ${h1('Payment Released to Your Wallet 💰')}
    ${p(`Hi ${name}, the customer approved your delivery. Funds have been released!`)}
    ${divider()}
    ${table(
      infoRow('Service', serviceTitle) +
      infoRow('Order ID', `#${orderId.slice(0, 8).toUpperCase()}`) +
      infoRow('Amount Received', `₹${Number(netAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`)
    )}
    ${p('You can withdraw your earnings to your bank account at any time from your dashboard.')}
    ${btn('View Earnings', link('/freelancer/dashboard'))}
  `),

  // 6b. Delivery confirmed — customer receipt
  deliveryConfirmedCustomer: (name: string, serviceTitle: string, orderId: string) => base(`
    ${h1('Order Complete ✅')}
    ${p(`Hi ${name}, you approved the delivery for "${serviceTitle}". Escrow funds have been released to the freelancer.`)}
    ${divider()}
    ${table(
      infoRow('Order ID', `#${orderId.slice(0, 8).toUpperCase()}`) +
      infoRow('Status', 'Completed')
    )}
    ${p('Would you like to leave a review? Your feedback helps other customers make better decisions.')}
    ${btn('Leave a Review', orderLink(orderId))}
  `),

  // 7a. Dispute filed — freelancer notification
  disputeFiledFreelancer: (name: string, serviceTitle: string, reason: string, orderId: string) => base(`
    ${h1('Dispute Raised on Your Order ⚠️')}
    ${p(`Hi ${name}, a dispute has been filed by the customer on order "${serviceTitle}".`)}
    ${divider()}
    ${table(
      infoRow('Order ID', `#${orderId.slice(0, 8).toUpperCase()}`) +
      infoRow('Reason', reason.slice(0, 80) + (reason.length > 80 ? '...' : ''))
    )}
    ${alertBox('Escrow funds are frozen until this dispute is resolved by our support team. You will be contacted for your response.', '#ef4444')}
    ${btn('View Dispute', orderLink(orderId))}
  `),

  // 7b. Dispute filed — customer confirmation
  disputeFiledCustomer: (name: string, serviceTitle: string, orderId: string) => base(`
    ${h1('Dispute Filed Successfully')}
    ${p(`Hi ${name}, your dispute for "${serviceTitle}" has been received. Our support team will review it shortly.`)}
    ${divider()}
    ${table(
      infoRow('Order ID', `#${orderId.slice(0, 8).toUpperCase()}`) +
      infoRow('Status', 'Under Review')
    )}
    ${alertBox('Escrow funds are frozen and protected while we mediate. Typical resolution time is 24–48 hours.', '#4f46e5')}
    ${btn('View Dispute', orderLink(orderId))}
  `),

  // 8. Dispute under review
  disputeUnderReview: (name: string, orderId: string) => base(`
    ${h1('Your Dispute is Under Review 🔍')}
    ${p(`Hi ${name}, a support agent has been assigned to your dispute and is reviewing the case.`)}
    ${divider()}
    ${table(infoRow('Order ID', `#${orderId.slice(0, 8).toUpperCase()}`))}
    ${p('You may be contacted to provide additional evidence. Please check your dashboard for updates.')}
    ${btn('View Dispute', orderLink(orderId))}
  `),

  // 9a. Dispute resolved — refund to customer
  disputeResolvedRefund: (name: string, refundAmount: number, orderId: string, note: string) => base(`
    ${h1('Dispute Resolved — Refund Issued ✅')}
    ${p(`Hi ${name}, your dispute has been resolved in your favour.`)}
    ${divider()}
    ${table(
      infoRow('Order ID', `#${orderId.slice(0, 8).toUpperCase()}`) +
      infoRow('Refund Amount', `₹${Number(refundAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`) +
      infoRow('Credited to', 'Your Servify Wallet')
    )}
    ${note ? alertBox(`Resolution note: ${note}`, '#10b981') : ''}
    ${p('The refunded amount is now available in your wallet.')}
    ${btn('View Wallet', link('/customer/dashboard'))}
  `),

  // 9b. Dispute resolved — release to freelancer
  disputeResolvedRelease: (name: string, releaseAmount: number, orderId: string, note: string) => base(`
    ${h1('Dispute Resolved — Payment Released 💰')}
    ${p(`Hi ${name}, the dispute has been resolved in your favour.`)}
    ${divider()}
    ${table(
      infoRow('Order ID', `#${orderId.slice(0, 8).toUpperCase()}`) +
      infoRow('Amount Released', `₹${Number(releaseAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`) +
      infoRow('Credited to', 'Your Servify Wallet')
    )}
    ${note ? alertBox(`Resolution note: ${note}`, '#10b981') : ''}
    ${btn('View Earnings', link('/freelancer/dashboard'))}
  `),

  // 9c. Dispute resolved — split
  disputeResolvedSplit: (name: string, yourAmount: number, orderId: string, note: string, role: string) => base(`
    ${h1('Dispute Resolved — Split Decision')}
    ${p(`Hi ${name}, the dispute has been resolved with a split decision.`)}
    ${divider()}
    ${table(
      infoRow('Order ID', `#${orderId.slice(0, 8).toUpperCase()}`) +
      infoRow('Your Share', `₹${Number(yourAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`)
    )}
    ${note ? alertBox(`Resolution note: ${note}`, '#f59e0b') : ''}
    ${btn('View Wallet', dashboardLink(role))}
  `),

  // 10. Dispute escalated
  disputeEscalated: (name: string, orderId: string) => base(`
    ${h1('Dispute Escalated to Senior Review')}
    ${p(`Hi ${name}, your dispute has been escalated to our senior support team for final review.`)}
    ${divider()}
    ${table(infoRow('Order ID', `#${orderId.slice(0, 8).toUpperCase()}`))}
    ${alertBox('Escalated disputes are typically resolved within 48 hours. Funds remain safely in escrow.', '#f59e0b')}
  `),

  // 11. Withdrawal initiated
  withdrawalInitiated: (name: string, withdrawAmount: number) => base(`
    ${h1('Withdrawal Initiated 🏦')}
    ${p(`Hi ${name}, your withdrawal request has been submitted and is being processed via RazorpayX.`)}
    ${divider()}
    ${table(infoRow('Amount', `₹${Number(withdrawAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`))}
    ${p('Funds typically arrive in your bank account within 1–2 business days depending on your bank.')}
    ${btn('View Withdrawal History', link('/freelancer/dashboard'))}
  `),

  // 12. Account banned
  accountBanned: (name: string) => base(`
    ${h1('Account Suspended')}
    ${p(`Hi ${name}, your Servify account has been suspended due to a violation of our Terms of Service.`)}
    ${alertBox('If you believe this is a mistake, please contact our support team at support@servify.in with your registered email address.', '#ef4444')}
  `),

  // 13. Account unbanned
  accountUnbanned: (name: string) => base(`
    ${h1('Account Reinstated ✅')}
    ${p(`Hi ${name}, your Servify account has been reinstated. You can now log in and continue using the platform.`)}
    ${p('Thank you for your patience. Please ensure future activity complies with our Terms of Service.')}
    ${btn('Sign In', link('/login'))}
  `),

  // 14. Role changed
  roleChanged: (name: string, newRole: string) => base(`
    ${h1('Your Account Role Has Been Updated')}
    ${p(`Hi ${name}, an administrator has updated your Servify account role.`)}
    ${divider()}
    ${table(infoRow('New Role', newRole.charAt(0).toUpperCase() + newRole.slice(1)))}
    ${p('Please log out and log back in for the change to take effect.')}
    ${btn('Sign In', link('/login'))}
  `),

  // 15. Password reset OTP
  passwordReset: (name: string, otp: string, email: string) => base(`
    ${h1('Reset Your Password 🔐')}
    ${p(`Hi ${name}, we received a request to reset your Servify password.`)}
    ${divider()}
    <div style="text-align:center;margin:28px 0">
      <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;font-weight:600;letter-spacing:1px;text-transform:uppercase">Your verification code</p>
      <div style="display:inline-block;background:#f1f5f9;border:2px dashed #6366f1;border-radius:12px;padding:20px 40px">
        <span style="font-size:40px;font-weight:800;color:#4f46e5;letter-spacing:12px;font-family:monospace">${otp}</span>
      </div>
      <p style="margin:12px 0 0;font-size:12px;color:#94a3b8">This code expires in <strong>15 minutes</strong></p>
    </div>
    <div style="text-align:center">
      ${btn('Enter Reset Code', link(`/reset-password?email=${encodeURIComponent(email)}`))}
    </div>
    ${alertBox('If you did not request a password reset, ignore this email. Your account remains secure.', '#ef4444')}
  `),

  // 16. Password successfully changed — security confirmation
  passwordChanged: (name: string) => base(`
    ${h1('Your Password Was Changed 🔒')}
    ${p(`Hi ${name}, this confirms your Servify account password was just changed successfully.`)}
    ${divider()}
    ${p('For your security, you have been signed out on all devices. Please sign in again with your new password.')}
    ${alertBox('If you did not make this change, contact support immediately at support@servify.in — your account may be compromised.', '#ef4444')}
    ${btn('Sign In', link('/login'))}
  `),
};
