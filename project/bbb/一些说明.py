0.	目录结构
    root    |----user1----|----uploaded_file---|-file1
            |             |                    |-file2
            |             |                    |-file2
            |             |
            |             |----converted_file---|-file1-
            |             |                     |           
            |             |                     |-file2
            |             |                     |-file2
root{
    user1{
        uploaded_file{
            file1
            file2
            file3
            .

        }
        converted_file{
            file1{
                file1_all{
                    all_information.txt
                }
                file1_page_1{
                    file1_page_1.txt
                    file1_page_1.pdf/png/bmp...
                }
                file2_page_2}{

                }
            file2{

            }
            .
            
        }

    }
    user2{

    }
    user3{

    }
    .

}


1.	标注框对象的生成，写入与存储规则

	生成的标注框存在txt文件中，一行存一个标注框，格式为：所在页码+ 逗号 + JSON.stringify(标示框);
	'1', "{'category': 'image','vertexes':[[10,10],[110,10],[110,110],[10,110]]}" (第一页有一个image标识框)
	每一个文件包含至多 300（暂定） 行， 文件名命名为 原文件名+"_"+起始页码+"_"+结束页码, txt文件
	对一页完成页面对象识别后，执行一次写入，检查文件行数，大于300行，强制保存文件，并且从下一次开始新建文件（无论是否超出300行，都修改文件名，更新结束页码）



2.	数据库
    2.1
    2.2
    2.3
    2.4