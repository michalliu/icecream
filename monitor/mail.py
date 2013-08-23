#!/bin/python
#-*- coding: UTF-8 -*-

import smtplib,os
from email.MIMEMultipart import MIMEMultipart
from email.MIMEBase import MIMEBase
from email.MIMEText import MIMEText
from email.MIMEImage import MIMEImage
from email.Utils import COMMASPACE, formatdate
from email import Encoders
from mail_cfg import SMTP_HOST,SMTP_HOST_ANONYMOUS,SMTP_LOGIN,SMTP_PASSWD

def send_mail(send_from, send_to, subject, html=None, text='text version is not available', images=[], files=[]):
	assert type(send_to)==list
	assert type(files)==list
	assert type(images)==list

	# Create the root message and fill in the from, to, and subject headers
	msgRoot = MIMEMultipart("related")
	msgRoot['From'] = send_from
	msgRoot['To'] = COMMASPACE.join(send_to)
	msgRoot['Date'] = formatdate(localtime=True)
	msgRoot['Subject'] = subject
	msgRoot.preamble = 'This is a multi-part message in MIME format.'

	# Encapsulate the plain and HTML versions of the message body in an
	# 'alternative' part, so message agents can decide which they want to display.
	msg = MIMEMultipart('alternative')
	msgRoot.attach(msg)

	msgText = MIMEText(text, _subtype='plain', _charset='UTF-8')
	msg.attach(msgText)
	
	# We reference the image in the IMG SRC attribute by the ID we give it below
	msgText = MIMEText(html, _subtype='html', _charset='UTF-8')
	msg.attach(msgText)

	for img in images:
		fp=open(img, 'rb')
		msgImg=MIMEImage(fp.read())
		msg.attach(msgImg)
		fp.close()

		msgImg.add_header('Content-ID',os.path.basename(img))
		msgRoot.attach(msgImg)

	for f in files:
		part = MIMEBase('application', "octet-stream")
		part.set_payload(open(f,'rb').read())
		Encoders.encode_base64(part)
		part.add_header('Content-Disposition', 'attachment; filename="%s"' % os.path.basename(f))
		msg.attach(part)

	smtp=smtplib.SMTP()
	#smtp.connect(SMTP_HOST)
	smtp.connect(SMTP_HOST_ANONYMOUS)
	smtp.login(SMTP_LOGIN,SMTP_PASSWD)
	smtp.sendmail(send_from, send_to, msgRoot.as_string())
	smtp.quit()

if __name__ == "__main__":
	send_mail(send_from="win8qqhelper@tencent.com",
			send_to=["michalliu@tencent.com"],
			subject="【Win8QQ项目】性能报告",
			html=u'<b>cpu使用情况</b><img src="cid:cpu_usage.png"/>',
			images=["cpu_usage.png"])
