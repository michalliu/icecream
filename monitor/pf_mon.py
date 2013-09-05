#!/usr/bin/python
#-*- coding: utf-8 -*-

import sys,os,exceptions
import urllib2,logging,json,re,time,shutil,zipfile
from rpy import r
from mail import send_mail

developers=("alvinshen","danneyyang","iscowei","louishliu","michalliu","cindytwu","gavincai","wadesheng","kingsan","robotding","stacyli","stargu")

api_host="http://127.0.0.1:8000/api/"
api_cpu_sampling=api_host+"cpu_sampling"
api_mem_sampling_login=api_host+"mem_sampling_login"
api_mem_sampling_aio=api_host+"mem_sampling_aio"
api_mem_sampling_buddy_list=api_host+"mem_sampling_buddy_list"
api_mem_sampling_group_list=api_host+"mem_sampling_group_list"
api_mem_sampling_qz=api_host+"mem_sampling_qz"

pic_cpu_usage="cpu_usage.png"

logger=None
start_time=None

def timeStart():
	global start_time
	start_time=time.time()

def timeEnd():
	logger.info('%s seconds' % (time.time()-start_time))

def initLogger():

	global logger

	logger = logging.getLogger('pf_mon')
	logger.setLevel(logging.DEBUG)

	fh = logging.FileHandler('log.txt')
	fh.setLevel(logging.DEBUG)

	ch = logging.StreamHandler()
	ch.setLevel(logging.DEBUG)

	formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

	fh.setFormatter(formatter)
	ch.setFormatter(formatter)

	logger.addHandler(fh)
	logger.addHandler(ch)

def initUrlLib():
	proxy_handler=urllib2.ProxyHandler({})
	opener=urllib2.build_opener(proxy_handler)
	urllib2.install_opener(opener)

def urlReq(url):
	logger.info('Request %s' % url)
	response=None

	timeStart()
	try:
		response=urllib2.urlopen(url,None,60 * 300)
	except:
		logger.error("URL request exception", exc_info=1)

	timeEnd()

	if response:
		text=response.read()
		logger.info(text)
		return text
	else:
		logger.info("Stoped")
		sys.exit(2)

def test():
	data=r.c([1.25,3.45,6.75,20.2,9.9])
	# draw image using rpy
	r.png("test.png", width=300,height=300)

	r.plot(data, type="o", col="blue", ylim=(0,100), pch=22, lty=1, axes=False, ann=False)
	r.axis(1, at=(1,2,3,4,5), lab=r.c("a","b","c","d","e"))
	r.axis(2, las=1, at=(0,50,100))
	r.box()

	r.title(main="CPU usage sampling result")
	r.title(xlab="Time")
	r.title(ylab="CPU")

	r.legend(1,100,r.c("trunk"), cex=0.8, col=r.c("blue"), pch=22, lty=1)
	r.dev_off()

def drawCpuUsage(d,xat,xlbs,pic):
	data=r.c(d)

	pch = 22         # point like like a square
	lty = 1          # line style solid line
	col = "blue"     # line color
	ltype = "o"      # line only http://stat.ethz.ch/R-manual/R-devel/library/graphics/html/plot.html
	ylim = (0,100)   # y domain
	xaxis=1
	yaxis=2
	vertical_text=2
	horizontal_text=1
	text_size=0.8
	yat=[x for x in range(0,110,10)]
	ylbs=["%d%%"%x for x in yat]
	legend_x=1
	legend_y=100

	# for r.text method
	warn_val=40      # val over this value will display a text on point
	xtext=[idx for idx,val in enumerate(d) if val > warn_val]    # text x pos
	ytext=[val for idx,val in enumerate(d) if val > warn_val]    # text y pos
	labtext=["%d%%"%val for idx,val in enumerate(d) if val > warn_val] # label for text

	# summary
	dmax=max(d)
	sumry="max %.2f%%" % dmax
	sumrycol="red" if dmax>50 else "green"

	# plot
	r.png(pic, width=900,height=450*0.6)
	r.plot(data, type=ltype, col=col, ylim=ylim, pch=pch, lty=lty, axes=False, ann=False)

	# draw text that over 40
	# http://stat.ethz.ch/R-manual/R-devel/library/graphics/html/text.html
	r.text(xtext, ytext, labels=labtext, pos=3, cex=0.8, col="red")

	# summary text
	r.mtext(sumry, side=3, cex=1, col=sumrycol)

	# axis
	r.axis(xaxis, las=vertical_text, at=xat, lab=r.c(xlbs))
	r.axis(yaxis, las=horizontal_text, at=yat, lab=r.c(ylbs))

	r.box()

	# titles
	r.title(main="CPU Sampling")
	r.title(xlab="Time")
	r.title(ylab="CPU Usage")

	# reference line
	# r.abline(h=50, col="gray") # at 50%

	# legend
	r.legend(legend_x, legend_y, r.c(("trunk")), col=col, cex=text_size, pch=pch, lty=lty)

	r.dev_off()

def processLabel(inStr):
	step = re.match(r'op_step(?P<step>\d+),(?P<totalstep>\d+)',inStr)
	if step:
		return "%s/%s" % step.group('step','totalstep')
	return inStr

def processCpuSamplingData(cpudata):
	data=[]
	at=[]
	labels=[]
	for idx,val in enumerate(cpudata):
		try:
			d=float(val)
			data.append(d)
		except exceptions.ValueError:
			data_pos=len(data)+1
			data_pos=max(1,data_pos)
			at.append(data_pos)
			labels.append(processLabel(val))

	logger.info('output image %s' % pic_cpu_usage)
	drawCpuUsage(data,at,labels,pic_cpu_usage)


def cpuSampling():
	logger.info('Start CPU sampling')
	result=urlReq(api_cpu_sampling)
	jsonResult=json.loads(result)
	retCode=jsonResult['ret']
	data=jsonResult['data']
	if retCode == 0 and data != None:
		processCpuSamplingData(data)
	else:
		sys.exit(-1)

def processMemSamplingData(data):
	ma = mb = me = mc = md = n = None
	for idx,val in enumerate(data):
		if val == "op_start":
			ma = data[idx-1]
		elif re.match(r"op_step1,2,2,(?P<n>\d+)",val):
			mb = data[idx-1]
			n = re.match(r"op_step1,2,2,(?P<n>\d+)",val).group('n')
		elif val == "op_end":
			me = data[idx-1]
	if ma and mb and me and n:
		ma=int(ma)
		mb=int(mb)
		me=int(me)
		n=int(n)
		md = (me - mb) / (n - 1)
		mc = mb - ma - md
		logger.info("ma=%d,mb=%d,me=%d,n=%d" % (ma,mb,me,n))
		logger.info("mc=%d,md=%d" % (mc,md))
	else:
		logger.error("error while process memory sampling data")
	return (mc,md)

def memSampling(url):
	logger.info('Start Mem sampling')
	result=urlReq(url)
	jsonResult=json.loads(result)
	retCode=jsonResult['ret']
	data=jsonResult['data']
	if retCode == 0 and data != None:
		return processMemSamplingData(data)
	else:
		sys.exit(-1)

def sendMail(content):
	logger.info('send mail')
	send_mail(send_from="win8qqhelper@tencent.com",
			send_to=["%s@tencent.com" % rtx for rtx in developers],
			subject="【Win8QQ项目】性能报告",
			html=content,
			images=[pic_cpu_usage])

def initEnv():
	"""Standardlize enviroment"""
	appdata=os.getenv('LOCALAPPDATA')
	packages=os.path.join(appdata,'Packages')
	package_qq=[x for x in os.listdir(packages) if re.match(r"903DB504\.QQ",x)]
	saved_settings=os.path.join(os.getcwd(),'LocalState')

	if len(package_qq) == 0:
		logger.error('QQ is not found, may be not installed?')
		sys.exit(1)

	if os.path.isdir(saved_settings):
		logger.info('overwrite settings from %s' % saved_settings)
		qq_path=os.path.join(packages,package_qq[0])
		setting_folder=os.path.join(qq_path,'LocalState\\')
		if os.path.isdir(setting_folder):
			shutil.rmtree(setting_folder)
		# retain permissions and ownership
		# http://support.microsoft.com/kb/323007
		os.system(r"xcopy %s %s /O /X /E /H /K /Q" % (saved_settings, setting_folder))

def main():
	initLogger()
	initUrlLib()
	initEnv()

	sys.exit(0)
	#cpuSampling()
	mem_login=memSampling(api_mem_sampling_login)
	print mem_login
	sys.exit(0)
	mem_aio=memSampling(api_mem_sampling_aio)
	mem_buddy_list=memSampling(api_mem_sampling_buddy_list)
	mem_group_list=memSampling(api_mem_sampling_group_list)
	mem_qz=memSampling(api_mem_sampling_qz)

	# mail HTML content
	mailHtmlContent=u"""
	<html>
	<body>
	<h3>Win8QQ性能报告(测试版，数据仅供参考)</h3>
	<h4>一、CPU使用率</h4>
	<img src="cid:%(cpu_usage_pic)s"/>
	<h4>二、主要模块内存占用(KB)</h4>
	<table border=1 cellpadding=8 style="border:1px solid #333;border-collapse:collapse;">
		<thead>
			<tr>
				<th>模块</th>
				<th>内存使用</th>
				<th>内存泄露</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>登录</td>
				<td>%(login_mem)d</td>
				<td>%(login_leak)d</td>
			</tr>
			<tr>
				<td>会话(aio)</td>
				<td>%(aio_mem)d</td>
				<td>%(aio_leak)d</td>
			</tr>
			<tr>
				<td>联系人列表</td>
				<td>%(buddy_list_mem)d</td>
				<td>%(buddy_list_leak)d</td>
			</tr>
			<tr>
				<td>群列表</td>
				<td>%(group_list_mem)d</td>
				<td>%(group_list_leak)d</td>
			</tr>
			<tr>
				<td>动态</td>
				<td>%(qz_mem)d</td>
				<td>%(qz_leak)d</td>
			</tr>
		</tbody>
	</table>
	</body>
	</html>
	""" %  {
			"cpu_usage_pic":pic_cpu_usage,
			"login_mem":mem_login[0],
			"login_leak":mem_login[1],
			"aio_mem":mem_aio[0],
			"aio_leak":mem_aio[1],
			"buddy_list_mem":mem_buddy_list[0],
			"buddy_list_leak":mem_buddy_list[1],
			"group_list_mem":mem_group_list[0],
			"group_list_leak":mem_group_list[1],
			"qz_mem":mem_qz[0],
			"qz_leak":mem_qz[1],
		   }

	with open("mail.html","w+") as fp:
		fp.write(mailHtmlContent.encode("utf-8"))

	sendMail(mailHtmlContent)


if __name__ == '__main__':
	main()
