from data_structure import *
import numpy as np
import Queue
import cv2
import os

def saveProcessImage(img,line_list,save_img_path):
    img = writeImg(img,line_list)
    cv2.imwrite(save_img_path,img)

def writeImg(img,line_list):
    for line in line_list:
        mrect = line.rect
        cate = line.kind
        #mrect.show()
        cv2.rectangle(img,(mrect.l,img.shape[0]-mrect.d),(mrect.r,img.shape[0]-mrect.u),getColor(kinds.index(cate)),3)
    return img

def getFileList(path):
    ret = []
    for rt,dirs,files in os.walk(path):
        for filename in files:
            ret.append(filename)
    return ret
def getColor(cate):
    if cate == 0 : return (0,0,255)#red formula
    if cate == 1 : return (255,0,0)#blue figure
    if cate == 2 : return (0,255,0)#green table
    if cate == 3 : return (255,0,255)#gray paragraph
    if cate == 4 : return (255, 255, 0)
