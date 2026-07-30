import logging
import os
import smtplib
import ssl
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from socket import gaierror
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger()
logger.setLevel(os.getenv("WORMCAT_LOG_LEVEL", "WARNING").upper())

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_LOGIN = os.getenv("SMTP_LOGIN", "")
SMTP_PASSWD = os.getenv("SMTP_PASSWD", "")


def email_results(receiver: str, the_file: str) -> bool:
    file_path = Path(the_file)
    filename = file_path.stem

    subject = f"Wormcat Results for {filename}"
    sender = SMTP_LOGIN or "wormcat.emailer@gmail.com"
    message_text = """
Hello,

Your WormCat run has completed. Please find the results attached.

Note: This is an automated message — replies to this email are not monitored.

If you’d like to get in touch, please visit wormcat.com for contact information.

Thank you for using wormcat.com!
    """
    message = construct_message_with_attachment(subject, sender, receiver, message_text, the_file)
    return send_message_ssl(sender, receiver, message)


def email_error_results(receiver: str, run_number: str, error_message: str) -> bool:
    subject = f"Wormcat ERROR while executing {run_number}"
    sender = SMTP_LOGIN or "wormcat.emailer@gmail.com"
    message_text = f"""
Hello,

We are sorry to inform you that your WormCat run has failed to complete. Please find the error details below:

{error_message}

Note: This is an automated message — replies to this email are not monitored.

If you’d like to get in touch, please visit wormcat.com for contact information.

Thank you for using wormcat.com!
    """
    message = construct_message_with_html(subject, sender, receiver, message_text)
    return send_message_ssl(sender, receiver, message)


def construct_message_with_html(
    subject: str,
    sender: str,
    receiver: str,
    message_text: Optional[str] = None,
    message_html: Optional[str] = None,
) -> str:
    the_message = MIMEMultipart()
    the_message["Subject"] = subject
    the_message["To"] = receiver
    the_message["From"] = sender
    the_message.preamble = "I am not using a MIME-aware mail reader.\n"

    if message_text:
        the_message.attach(MIMEText(message_text, "plain"))
    if message_html:
        the_message.attach(MIMEText(message_html, "html"))

    return the_message.as_string()


def construct_message_with_attachment(
    subject: str, sender: str, receiver: str, message_text: str, the_file: str
) -> str:
    the_message = MIMEMultipart()
    the_message["Subject"] = subject
    the_message["To"] = receiver
    the_message["From"] = sender
    the_message.preamble = "I am not using a MIME-aware mail reader.\n"

    the_message.attach(MIMEText(message_text, "plain"))

    msg = MIMEBase("application", "zip")
    with open(the_file, "rb") as zip_file:
        msg.set_payload(zip_file.read())
    encoders.encode_base64(msg)

    filename = Path(the_file).name
    msg.add_header("Content-Disposition", "attachment", filename=filename)
    the_message.attach(msg)
    return the_message.as_string()


def send_message(sender: str, receiver: str, message: str) -> bool:
    smtp_login = os.getenv("SMTP_LOGIN", SMTP_LOGIN)
    smtp_passwd = os.getenv("SMTP_PASSWD", SMTP_PASSWD)
    smtp_server = os.getenv("SMTP_SERVER", SMTP_SERVER)

    if not smtp_login or not smtp_passwd:
        logger.warning(
            "SMTP credentials not set in environment (SMTP_LOGIN / SMTP_PASSWD). "
            "Skipping email delivery to %s.",
            receiver,
        )
        return False

    try:
        port = 587
        with smtplib.SMTP(smtp_server, port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_login, smtp_passwd)
            server.sendmail(sender, receiver, message)
        logger.info("SMTP email successfully sent to: %s", receiver)
        return True
    except (gaierror, ConnectionRefusedError):
        logger.error("Failed to connect to SMTP server %s:%s. Check network or settings.", smtp_server, port)
        return False
    except smtplib.SMTPServerDisconnected:
        logger.error("SMTP server disconnected unexpectedly. Check user/password credentials.")
        return False
    except smtplib.SMTPException as e:
        logger.error("SMTP error occurred while sending email to %s: %s", receiver, str(e))
        return False


def send_message_ssl(sender: str, receiver: str, message: str) -> bool:
    smtp_login = os.getenv("SMTP_LOGIN", SMTP_LOGIN)
    smtp_passwd = os.getenv("SMTP_PASSWD", SMTP_PASSWD)
    smtp_server = os.getenv("SMTP_SERVER", SMTP_SERVER)

    if not smtp_login or not smtp_passwd:
        logger.warning(
            "SMTP credentials not set in environment (SMTP_LOGIN / SMTP_PASSWD). "
            "Skipping SSL email delivery to %s.",
            receiver,
        )
        return False

    try:
        port = 465
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
            server.login(smtp_login, smtp_passwd)
            server.sendmail(sender, receiver, message)
        logger.info("SMTP SSL email successfully sent to: %s", receiver)
        return True
    except (gaierror, ConnectionRefusedError):
        logger.error("Failed to connect to SSL SMTP server %s:%s.", smtp_server, port)
        return False
    except smtplib.SMTPServerDisconnected:
        logger.error("SSL SMTP server disconnected unexpectedly. Check user/password credentials.")
        return False
    except smtplib.SMTPException as e:
        logger.error("SMTP SSL error occurred while sending email to %s: %s", receiver, str(e))
        return False