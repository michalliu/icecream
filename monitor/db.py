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

def save_api_req_result(version,sampl_id,api_name,api_result,req_time,req_end_time, valid_flag=3):
	"""
	保存数据到数据库中
	version 当前版本号,如 '2.0.6'
	sampl_id 当前本版取样id标识符,如'1'
	api_name 所请求的api名称,如'cpu_sampling'
	api_result 请求结果,任意文字
	req_time 请求开始时间，python时间戳
	req_end_time 请求结束时间，python时间戳
    valid_flag 3 不确定 1 可用 0 无用 
	"""

	def asctime(timestamp):
		s=time.strftime("%Y-%m-%d %H:%M:%S",timestamp)
		return s

	cur = conn.cursor()
	req_id=get_apiid_byname(api_name)
	if not req_id:
		raise Exception("获取api_id失败,api %s 未注册" % api_name)
	sql="INSERT INTO api_req_data (qq_version,samp_id,api_req_id,api_req_result,api_req_time,api_end_time,valid_flag) VALUES ('%(qq_version)s','%(samp_id)s','%(api_req_id)d','%(api_req_result)s','%(api_req_time)s','%(api_end_time)s','%(valid_flag)d')" % {
		"qq_version": version,
		"samp_id": sampl_id,
		"api_req_id": req_id,
		"api_req_result": api_result,
		"api_req_time": asctime(req_time),
		"api_end_time": asctime(req_end_time),
		"valid_flag": valid_flag,
		}
	cur.execute(sql)
	conn.commit()

def update_api_req_result(version, sampl_id,api_name,api_result=None,req_time=None,req_end_time=None, valid_flag=None):
	"""
	更新数据
	version 当前版本号,如 '2.0.6'
	sampl_id 当前本版取样id标识符,如'1'
	api_name 所请求的api名称,如'cpu_sampling'
	"""

	def asctime(timestamp):
		s=time.strftime("%Y-%m-%d %H:%M:%S",timestamp)
		return s

	cur = conn.cursor()
	req_id=get_apiid_byname(api_name)
	if not req_id:
		raise Exception("获取api_id失败,api %s 未注册" % api_name)

	sql="UPDATE api_req_data SET "
	data = {}
	fields=[]

	if not api_result is None:
		fields.append("api_req_result='%(api_req_result)s'")
		data["api_req_result"] = api_result

	if not req_time is None:
		fields.append("api_req_time='%(api_req_time)s'")
		data["api_req_time"] = asctime(req_time)

	if not req_end_time is None:
		fields.append("api_end_time='%(api_end_time)s'")
		data["api_end_time"] = asctime(req_end_time)

	if not valid_flag is None:
		fields.append("valid_flag='%(valid_flag)d'")
		data["valid_flag"] = valid_flag
	
	if len(fields) > 0:
		sql += ', '.join(fields)
		sql += " WHERE qq_version='%(qq_version)s' AND samp_id='%(samp_id)s' AND api_req_id='%(api_req_id)d'"
		data["qq_version"] = version
		data["samp_id"] = sampl_id
		data["api_req_id"] = req_id
		sql = sql % data
		cur.execute(sql)
		conn.commit()

def query_api_data(version, sampl_id, api_name):
	"""
	提取数据
	version 前版本号,如 '2.0.6'
	sampl_id 当前本版取样id标识符,如'1'
	api_name 所请求的api名称,如'cpu_sampling'
	"""

	cur=conn.cursor();
	req_id=get_apiid_byname(api_name)
	sql="SELECT api_req_result FROM api_req_data WHERE qq_version='%(qq_version)s' AND samp_id=%(samp_id)d AND api_req_id=%(api_req_id)d AND valid_flag=1" % {
			"qq_version": version,
			"samp_id": int(sampl_id),
			"api_req_id": int(req_id)
			}
	cur.execute(sql)
	data = cur.fetchone()
	if data:
		return data[0]
	return None

def close():
	conn.close()

def main():
	#t=get_apiname_byid(1)
	#print t
	#print get_apiid_byname(t)
	#save_api_req_result(version='2.0.6',
	#		sampl_id=2,
	#		api_name='cpu_sampling',
	#		api_result=u'失败',
	#		req_time=time.localtime(),
	#		req_end_time=time.localtime(),
	#		)
	update_api_req_result(version='2.0.6',
			sampl_id=2,
			api_name='cpu_sampling',
			api_result=u'成功',
			req_time=time.localtime(),
			req_end_time=time.localtime(),
			valid_flag=1
			)
	#query_api_data(version='2.0.6',
	#		sampl_id=2,
	#		api_name='cpu_sampling'
	#		)

if __name__ == "__main__":
	main()
