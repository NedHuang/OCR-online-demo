<?php
// 保存 file


// 设置 username(可能是临时的GUID)和 filename

$errorcode = '';
$filename = '';
$file_guid = '';
$user_guid = '';
$username = $user_guid;
$extension = '';
$tempname = '';
$status='';
// page should be zero when a file is uploaded
$page = 1;
$total_page = 1;
// one directory for each page in the pdf file
$page_directory = '';
$cmd1 = '';
$cmd2 = '';
$imginfo = '';
$txtinfo = '';
// 未登陆(session isn't set),设置一个GUID给用户. 否则，获取username
if(!isset($_SESSION['username'])){
  session_start();
	$guid = uniqid();
	$username = $guid;
  $user_guid = $guid;
  $_SESSION['username'] = $guid;
  $_SESSION['user_guid'] = $guid;
}
// echo "guid is : ".$guid;
else{
	$username = $_SESSION['username'];
	$user_guid = $_SESSION['user_guid'];
}
// 获取文件
if($_FILES['file']['name'] != ''){
    $filename = $_FILES['file']['name'];
    $extension = substr($filename, strrpos($filename, '.')+1);
    $_SESSION['filename'] = $filename;
    $_SESSION['page'] = [];
    // echo $filename;
}

$file_directory = "../files/".$username."/".$filename."/";


if(!file_exists($file_directory)){
    mkdir ($file_directory,0777,true);
} else {
    $errorcode. "error: ".'file_directory exists already: '. $file_directory;
}
if(file_exists($file_directory."/".$filename)){
  $errorcode. "error: uploaded file ".$filename." already exists in ".$file_directory;

} else {
  // 复制文件到指定目录下，至此文件上传成功
move_uploaded_file($_FILES["file"]["tmp_name"],$file_directory."/".$filename);
}

if(file_exists($file_directory."/".$filename)){
  $status = "file uploaded";
}
else{
  $status = 'failed';
}

// deal with pdf file, convert first page to img
if(strtolower($extension) == 'pdf'){
  $total_page = count_pages($file_directory."/".$filename);
  $page_directory = $file_directory.strval($page)."/";
  mkdir($page_directory,0777);
  $cmd1 = "python /home/mingzhe/project/scripts/convert_to_img.py ".$file_directory.$filename." ".strval($page)." 400 0 ".$page_directory.strval($page).".png"." 1";
   // $res =  system($cmd1, $return_val);
  exec($cmd1,$res1);
  /***********************************************
  $cmd2 = "";
  exec($cmd2,$res2);
  ***********************************************/

  array_push($_SESSION['completed_page_array'],$page);
  $imginfo = getimagesize($page_directory.strval($page).".png");
}

// image was saved under file_directory
// if(in_array(strtolower($extension), array('bmp', 'png', 'jpeg','jpg'))){
//   $page_directory = 'single-paged file';
//   $img_url = $file_directory."/".$filename;
//   $imginfo = getimagesize($file_directory."/".$filename);
//   /***********************************************
//   $cmd2 = "";
//   exec($cmd2,$res2);
//   ***********************************************/
// }


$arr = array(
  'status' => $status,
	'filename'=>$filename,
  'file_directory' =>$file_directory,
  'username'=>$username,
  'user_guid'=>$user_guid,
  'page'=> strval($page),
  'total_page'=>strval($total_page),
  'extension'=>$extension,
  'page_directory'=>$page_directory,
  'img_url'=> $page_directory.$page.'.png',
  'cmd1' => $cmd1,
  'return_val' => $res,
  'completed_page_array'=> $_SESSION['completed_page_array'],
  'imginfo'=>$imginfo,
  'txtinfo'=>$txtinfo,
  'errorcode' => $errorcode,
);

echo json_encode($arr);




// /***************************************************
// functions
// ***************************************************/
function count_pages($pdfname) {
    $pdftext = file_get_contents($pdfname);
    $num = preg_match_all("/\/Page\W/", $pdftext, $dummy);
    return $num;
}
?>