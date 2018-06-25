<?php
    //header('Access-Control-Allow-Origin:*');//注意！跨域要加这个头 上面那个没有

// dummy vars
$username = "hmz";
$filename = "kkk.pdf";

$error_msg = "";
$data = $_POST['obj'];
$page = $_POST['page'];
// $filename = $_POST['filename'];
$file_extension = (substr(strrchr($fff, '.'), 1));
$file_basename = basename($filename,$extension);


$added_boxes = $_POST["added_boxes"];
$returned_boxes = $_POST["returned_boxes"];
$deleted_boxes = $_POST["deleted_boxes"];





function save_xml_by_page($username_input,$filename_input,$page_input){
  $file_path = "../file/".$username_input."/".$filename_input;
  if(!file_exists($file_path)){
    mkdir($file_path,0777,true);
  }
  else{
    $error_msg." error: 创建目录失败: ".$file_path."; ";
  }
  // 生成 string并且写入文件
  $content = generate_xml();
  $xml_file = fopen($file_path."/".$page."txt","w");
  fwrite($xml_file,$content);
  fclose($xml_file);
  if(!file_exists($file_path."/".$page."txt")){
    $error_msg." error: failed to save changes: ".$file_path."; "; 
  }
}


//遍历所有box,生成xml,
function generate_xml_file(){
  $file_content= '';
  for($i = 0; $i <count($returned_boxes); ++$i){
    $file_string = $file_string.make_string($returned_boxes[$i],"returned");
  }
  for($i = 0; $i <count($added_boxes); ++$i){
    $file_string = $file_string.make_string($returned_boxes[$i],"added");
  }
  for($i = 0; $i <count($added_boxes); ++$i){
    $file_string = $file_string.make_string($deleted_boxes[$i],"deleted");
  }
  return $file_content;
}

// 根据box和生成box的操作，
function make_string($box,$operation){
  // 50,50,100,100, table returned
  return strval($box['coordinates'][0])."\t".strval($box['coordinates'][1])."\t".strval($box['coordinates'][2])."\t".strval($box['coordinates'][3])."\t".$box['category']."\t".$operation."\n";
}

..
/*******
测试
*****/
// $fff = "aaa.pdf";
// $ext = (substr(strrchr($fff, '.'), 1));
// echo($ext);
// echo '<br>';
// echo(basename($fff,$ext));

?>
