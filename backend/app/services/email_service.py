import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import settings

logger = logging.getLogger(__name__)

def _send_raw_email(to_email: str, subject: str, html_content: str, text_content: str = ""):
    """
    Sends an email using configured SMTP settings.
    Catches and logs any exceptions so failures never break main business logic.
    """
    if not settings.EMAIL_ENABLED:
        logger.info(f"[EMAIL DISABLED] Would have sent '{subject}' to {to_email}")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        if not text_content:
            text_content = "Please view this email in an HTML-compatible email client."

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Connect to SMTP server
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()

        logger.info(f"Email sent successfully to {to_email}: '{subject}'")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}", exc_info=True)


def _base_template(content_html: str, preheader: str = "") -> str:
    """
    Wraps content inside Kaarmik Seek's unified email design system.
    """
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kaarmik Seek</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #F7F2EB;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #2D232E;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      table-layout: fixed;
      background-color: #F7F2EB;
      padding: 36px 12px;
    }}
    .main-card {{
      max-width: 580px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #EAE2D5;
      overflow: hidden;
      box-shadow: 0 12px 36px -10px rgba(74, 41, 75, 0.12);
    }}
    .header {{
      background: linear-gradient(135deg, #4A294B 0%, #5F2147 100%);
      padding: 28px 32px;
      text-align: center;
      position: relative;
    }}
    .header-logo {{
      display: inline-block;
      vertical-align: middle;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #FFFFFF;
      text-decoration: none;
    }}
    .header-sub {{
      margin: 4px 0 0;
      font-size: 11px;
      font-weight: 600;
      color: #C7A05A;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }}
    .body-content {{
      padding: 36px 32px 32px;
      line-height: 1.6;
    }}
    .btn {{
      display: inline-block;
      background: linear-gradient(135deg, #4A294B 0%, #5F2147 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 13px 28px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 6px 18px rgba(74, 41, 75, 0.25);
    }}
    .footer {{
      padding: 24px 32px;
      background-color: #FBF8F4;
      border-top: 1px solid #EAE2D5;
      text-align: center;
      font-size: 12px;
      color: #7D737F;
    }}
    .footer a {{
      color: #4A294B;
      text-decoration: underline;
    }}
  </style>
</head>
<body>
  {f'<div style="display:none;font-size:1px;color:#F7F2EB;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">{preheader}</div>' if preheader else ''}
  <div class="wrapper">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <div class="main-card">
            <div class="header">
              <span class="header-logo">Kaarmik Seek</span>
              <div class="header-sub">Campus recruitment, reimagined</div>
            </div>
            <div class="body-content">
              {content_html}
            </div>
            <div class="footer">
              <p style="margin: 0 0 8px;">
                © 2026 <strong>Kaarmik Seek</strong> · Transparent AI-Powered Campus Recruitment
              </p>
              <p style="margin: 0; font-size: 11px; color: #9E94A0;">
                You are receiving this notification because an account was registered with your email address.
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>"""


def send_welcome_email(to_email: str, full_name: str = ""):
    """
    Template 1: Welcome / Sign-up Email sent to new candidates.
    """
    display_name = full_name.strip() if full_name else to_email.split("@")[0]
    subject = "Welcome to Kaarmik Seek — Your Campus Career Journey Begins!"
    jobs_url = f"{settings.FRONTEND_URL}/jobs"
    profile_url = f"{settings.FRONTEND_URL}/profile"

    content = f"""
      <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #1E0E20; letter-spacing: -0.01em;">
        Welcome aboard, {display_name}! 👋
      </h2>
      <p style="margin: 0 0 20px; font-size: 14.5px; color: #4A4035; line-height: 1.65;">
        Your Kaarmik Seek account has been successfully created. We are excited to help you find internships and campus roles that actually match what you already know how to do.
      </p>

      <div style="background-color: #FBF8F4; border: 1px solid #EAE2D5; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #4A294B; font-weight: 700;">
          Here is how Kaarmik Seek works for you:
        </h3>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 6px 0; font-size: 13.5px; color: #3A2F3D; vertical-align: top; width: 24px;">✨</td>
            <td style="padding: 6px 0 6px 8px; font-size: 13.5px; color: #3A2F3D; vertical-align: top;">
              <strong>Real 5-Dimension Match Score:</strong> We compare your skills, courses, availability, and preferences with every role — no keyword guessing.
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13.5px; color: #3A2F3D; vertical-align: top;">📊</td>
            <td style="padding: 6px 0 6px 8px; font-size: 13.5px; color: #3A2F3D; vertical-align: top;">
              <strong>Zero Ghosting Pipeline:</strong> Track every application transparently from submission to final offer.
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13.5px; color: #3A2F3D; vertical-align: top;">📅</td>
            <td style="padding: 6px 0 6px 8px; font-size: 13.5px; color: #3A2F3D; vertical-align: top;">
              <strong>Direct Interview Invites:</strong> Meeting dates, video links, and recruiter notes delivered right to your inbox and dashboard.
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 32px 0 20px;">
        <a href="{jobs_url}" class="btn">Browse Open Roles & Get Matched &rarr;</a>
      </div>

      <p style="margin: 20px 0 0; font-size: 12.5px; color: #7D737F; text-align: center;">
        Tip: Complete your <a href="{profile_url}" style="color: #4A294B; font-weight: 600;">profile skills and resume</a> to unlock higher match scores.
      </p>
    """

    _send_raw_email(to_email, subject, _base_template(content, "Welcome to Kaarmik Seek — Start discovering matched campus roles"))


def send_application_received_email(
    student_email: str,
    student_name: str,
    job_title: str,
    company: str,
    job_id: str,
    match_score: int,
    stipend: str = "",
    location: str = ""
):
    """
    Template 2: Application Received notification sent immediately when candidate applies.
    """
    display_name = student_name.strip() if student_name else student_email.split("@")[0]
    subject = f"Application Received: {job_title} at {company}"
    apps_url = f"{settings.FRONTEND_URL}/applications"

    content = f"""
      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; background-color: #EDE6F0; color: #4A294B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 9999px;">
          Application Submitted
        </span>
      </div>

      <h2 style="margin: 0 0 10px; font-size: 21px; font-weight: 700; color: #1E0E20; letter-spacing: -0.01em;">
        Your application is in, {display_name}! 🚀
      </h2>
      <p style="margin: 0 0 22px; font-size: 14.5px; color: #4A4035; line-height: 1.6;">
        We have received your application for <strong>{job_title}</strong> at <strong>{company}</strong>. The hiring team has been notified and your profile has been added to their review queue.
      </p>

      <div style="background-color: #FBF8F4; border: 1px solid #EAE2D5; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <div style="font-size: 11px; font-weight: 700; color: #C7A05A; text-transform: uppercase; letter-spacing: 0.06em;">Position Applied</div>
              <div style="font-size: 17px; font-weight: 700; color: #1E0E20; margin: 2px 0;">{job_title}</div>
              <div style="font-size: 13.5px; color: #4A4035;">{company} {f'· {location}' if location else ''}</div>
              {f'<div style="font-size: 13px; color: #6E5F70; margin-top: 4px;">Stipend: <strong>{stipend}</strong></div>' if stipend else ''}
            </td>
            <td align="right" style="vertical-align: middle;">
              <div style="background: #FFFFFF; border: 2px solid #C7A05A; border-radius: 50%; width: 56px; height: 56px; text-align: center; display: inline-block; line-height: 52px; font-weight: 700; font-size: 16px; color: #4A294B;">
                {match_score}%
              </div>
              <div style="font-size: 10px; color: #7D737F; margin-top: 2px; text-align: center;">Match fit</div>
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #FFFFFF; border: 1px dashed #D6C7B8; border-radius: 10px; padding: 14px 16px; margin: 18px 0; text-align: center; font-size: 12.5px; color: #4A294B;">
        <strong>Live Pipeline Status:</strong> <span style="color: #065F46; font-weight: 700;">Applied ✓</span> &nbsp;&rarr;&nbsp; Shortlisting &nbsp;&rarr;&nbsp; Interview &nbsp;&rarr;&nbsp; Decision
      </div>

      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="{apps_url}" class="btn">Track Application in Dashboard &rarr;</a>
      </div>

      <p style="margin: 0; font-size: 12.5px; color: #7D737F; text-align: center;">
        We will notify you by email as soon as the recruiter reviews your dossier or schedules an interview.
      </p>
    """

    _send_raw_email(student_email, subject, _base_template(content, f"Application submitted for {job_title} at {company}"))


def send_status_update_email(
    student_email: str,
    student_name: str,
    job_title: str,
    company: str,
    new_status: str,
    note: str = "",
    interview_details: dict = None
):
    """
    Template 3: Stage / Status Change Notification sent when recruiter/admin updates applicant status.
    """
    display_name = student_name.strip() if student_name else student_email.split("@")[0]
    apps_url = f"{settings.FRONTEND_URL}/applications"
    norm_status = new_status.upper().strip()

    # Dynamic styling & messaging based on stage
    if norm_status == "INTERVIEW_SCHEDULED":
        subject = f"🎉 Interview Scheduled: {job_title} at {company}"
        status_label = "Interview Scheduled"
        badge_style = "background-color: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;"
        headline = "Great news! Your interview has been scheduled."
    elif norm_status == "OFFERED":
        subject = f"🏆 Congratulations! Job Offer for {job_title} at {company}"
        status_label = "Offer Extended"
        badge_style = "background-color: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0;"
        headline = "Congratulations! You have received a job offer."
    elif norm_status == "SHORTLISTED":
        subject = f"🌟 You've been Shortlisted: {job_title} at {company}"
        status_label = "Shortlisted"
        badge_style = "background-color: #EDE9FE; color: #5B21B6; border: 1px solid #DDD6FE;"
        headline = "Your profile was shortlisted by the hiring team!"
    elif norm_status == "REJECTED":
        subject = f"Application Update: {job_title} at {company}"
        status_label = "Application Archived"
        badge_style = "background-color: #FEE2E2; color: #991B1B; border: 1px solid #FECACA;"
        headline = "An update regarding your application."
    else:
        subject = f"Application Status Update: {job_title} at {company}"
        status_label = norm_status.replace("_", " ").title()
        badge_style = "background-color: #EDE6F0; color: #4A294B; border: 1px solid #D6C7B8;"
        headline = f"Your application status is now {status_label}."

    interview_box = ""
    if interview_details and (interview_details.get("date") or interview_details.get("location_or_link")):
        date_str = interview_details.get("date", "To be confirmed")
        time_str = interview_details.get("time", "")
        link_str = interview_details.get("location_or_link", "")
        notes_str = interview_details.get("notes", "")

        meeting_btn = ""
        if link_str.startswith("http"):
            meeting_btn = f"""
              <div style="margin-top: 14px;">
                <a href="{link_str}" style="display: inline-block; background-color: #4A294B; color: #FFFFFF !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600;">
                  Join Interview Meeting &rarr;
                </a>
              </div>
            """
        elif link_str:
            meeting_btn = f'<div style="font-size: 13px; color: #3A2F3D; margin-top: 6px;"><strong>Location / Link:</strong> {link_str}</div>'

        interview_box = f"""
          <div style="background-color: #FFFDF8; border: 1px solid #F3E6CB; border-left: 4px solid #C7A05A; border-radius: 10px; padding: 18px 20px; margin: 24px 0;">
            <div style="font-size: 12px; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
              📅 Scheduled Interview Details
            </div>
            <div style="font-size: 14.5px; color: #1E0E20; font-weight: 600;">
              Date & Time: {date_str} {f'at {time_str}' if time_str else ''}
            </div>
            {f'<div style="font-size: 13px; color: #4A4035; margin-top: 6px;"><strong>Recruiter Notes:</strong> {notes_str}</div>' if notes_str else ''}
            {meeting_btn}
          </div>
        """

    note_box = ""
    if note and norm_status != "INTERVIEW_SCHEDULED":
        note_box = f"""
          <div style="background-color: #FBF8F4; border-radius: 8px; padding: 14px 18px; margin: 18px 0; font-size: 13.5px; color: #4A4035; border-left: 3px solid #4A294B;">
            <strong>Recruiter Message:</strong> {note}
          </div>
        """

    content = f"""
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 12px; border-radius: 9999px; {badge_style}">
          {status_label}
        </span>
      </div>

      <h2 style="margin: 0 0 10px; font-size: 21px; font-weight: 700; color: #1E0E20; letter-spacing: -0.01em;">
        {headline}
      </h2>
      <p style="margin: 0 0 18px; font-size: 14.5px; color: #4A4035; line-height: 1.6;">
        Hi {display_name}, the hiring team for <strong>{job_title}</strong> at <strong>{company}</strong> has updated your application status.
      </p>

      {interview_box}
      {note_box}

      <div style="text-align: center; margin: 28px 0 18px;">
        <a href="{apps_url}" class="btn">Open Application Tracker &rarr;</a>
      </div>

      <p style="margin: 0; font-size: 12px; color: #7D737F; text-align: center;">
        View your full timeline and direct recruiter communications anytime on Kaarmik Seek.
      </p>
    """

    _send_raw_email(student_email, subject, _base_template(content, f"Status update for {job_title} at {company}: {status_label}"))
