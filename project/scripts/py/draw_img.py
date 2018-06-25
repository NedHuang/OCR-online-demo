import sys
import os
import cv2
from os.path import join as osj
import shutil
from common_func import *

def main():
    reload(sys)
    bmppath = sys.argv[1]
    print bmppath
    xmlpath = sys.argv[2]
    targetpath = sys.argv[3]

    data = filedata()
    data.readtxt(xmlpath)

    img = cv2.imread(bmppath)
    # if not img.all():
    if type(img) is np.ndarray:
      saveProcessImage(img,data.pageLines,targetpath)
    else:
    	print xmlpath

if __name__=="__main__":
	main()
