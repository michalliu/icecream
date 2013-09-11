#!/bin/python
#-*- coding: UTF-8 -*-

import sqlite3,time

conn=sqlite3.connect('icecream.db')

def get_apiid_byname(api_name):
	cur = conn.cursor()
	cur.execute("SELECT api_id FROM api_req WHERE api_name='%s'" % api_name)
	data = cur.fetchone()
	if data:
		return data[0]
	return None

def get_apiname_byid(api_id):
	cur = conn.cursor()
	cur.execute("SELECT api_name FROM api_req WHERE api_id=%d" % api_id)
	data = cur.fetchone()
	if data:
		return data[0]
	return None

def save_api_req_result(version,sampl_id,api_name,api_result,req_time,req_end_time):
	"""
	保存数据到数据库中
	version 当前版本号,如 '2.0.6'
	sampl_id 当前本版取样id标识符,如'1'
	api_name 所请求的api名称,如'cpu_sampling'
	api_result 请求结果,任意文字
	req_time 请求开始时间，python时间戳
	req_end_time 请求结束时间，python时间戳
	"""

	def asctime(timestamp):
		s=time.strftime("%Y-%m-%d %H:%M:%S",timestamp)
		return s

	cur = conn.cursor()
	req_id=get_apiid_byname(api_name)
	sql="INSERT INTO api_req_data (qq_version,samp_id,api_req_id,api_req_result,api_req_time,api_end_time) VALUES ('%(qq_version)s','%(samp_id)s','%(api_req_id)d','%(api_req_result)s','%(api_req_time)s','%(api_end_time)s')" % {
		"qq_version": version,
		"samp_id": sampl_id,
		"api_req_id": req_id,
		"api_req_result": api_result,
		"api_req_time": asctime(req_time),
		"api_end_time": asctime(req_end_time),
		}
	cur.execute(sql)
	conn.commit()

def close():
	conn.close()

def main():
	#t=get_apiname_byid(1)
	#print t
	#print get_apiid_byname(t)
	save_api_req_result(version='2.0.6',
			sampl_id='1',
			api_name='cpu_sampling',
			api_result=u'失败',
			req_time=time.localtime(),
			req_end_time=time.localtime(),
			)

if __name__ == "__main__":
	main()
