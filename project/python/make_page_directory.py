import os
import sys
from os.path import exists 
username = sys.argv[1]
filename = sys.argv[2]
page = sys.argv[3]
#相对路径
page_path = "/Users/mingzhehuang/project/files/"+username+"/output/"+filename+"/"+page+"/"
os.makedirs(page_path)
if(exists(page_path)):
	print('succcess')

else:
	print('failed')
