<?php
// 保存 file


/*****************************************************
declare variables
*****************************************************/
$operation = '';
$errorcode = '';
$filename = '';
$file_guid = '';
$user_guid = '';
$username ='';
$user_guid = '';
$extension = '';
$file_directory = '';
$page_directory = '';
$file_string = 'aaa';
$errorcode = '';
$count = 0;
$imginfo = '';

// 未登陆(session isn't set),设置一个GUID给用户. 否则，获取username
// if(!isset($_SESSION['username'])){
//   session_start();
// 	$guid = uniqid();
// 	$username = $guid;
//   $user_guid = $guid;
//   $_SESSION['username'] = $guid;
//   $_SESSION['user_guid'] = $guid;
// }
// // echo "guid is : ".$guid;
// else{
// 	$username = $_SESSION['username'];
// 	$user_guid = $_SESSION['user_guid'];
// }

// if(isset($_POST['operation'])){
//   if($_POST['operation'] == 'convert')}{
//     convert();
//     echo 'convert';
//   }
//   if($_POST['operation'] == 'save_change'){
//     save_change();
//     echo 'save_change';
//   }
// }
// session information is set when uploading the files
if(isset($_POST)){
  if($_POST['operation'] == 'save_change'){
    $res = save_change();
    echo $res;
  }
  if($_POST['operation'] == 'get_image'){
    $res = get_image();
    echo $res;
  }
  if($_POST['operation'] == 'get_data'){
    $res = get_data();
    echo $res;
    // echo file_get_contents("../files/a.txt");
  }
}




function get_image(){
  $filename = $_POST['filename'];
  $username = $_POST['username'];
  $page = $_POST['page'];
  $extension = $_POST['extension'];
  $file = $_POST['file_directory'];
  $added_boxes = $_POST['added_boxes'];
  $returned_boxes = $_POST['returned_boxes'];
  $deleted_boxes = $_POST['deleted_boxes'];
  $file_directory = $_POST['file_directory'];
  $page_directory = $file_directory.strval($page).'/';
  $cmd1 = "";
  $cmd2 = "";

  // if(in_array($page,$_SESSION['completed_page_array'])){
  //   $cmd1  .= "already converted";
  //   $imginfo = getimagesize($page_directory.strval($page).".png");
  //   // txtinfo = .....
  // }

  if((file_exists($page_directory.strval($page).'.png')) ){
    $imginfo = getimagesize($page_directory.strval($page).".png");
    $errorcode .= "file_already exist";
  }
  else{
    mkdir($page_directory,0777);
    $cmd1 = "python /home/mingzhe/project/scripts/convert_to_img.py ".$file_directory.$filename." ".strval($page)." 400 0 ".$page_directory.strval($page).".png"." 1";
    exec($cmd1,$res);
    $imginfo = getimagesize($page_directory.strval($page).".png");
    // $txtinfo ...

    /***********************************************
    $cmd2 = "";
    exec($cmd2,$res2);
    ***********************************************/

    // elseif(!file_exists($page_directory.strval($page).".png")){
    //   $cmd1 = "error, no image generated";
    // }
    // **********************************************
    // if(!file_exists($page_directory.strval($page).txt])){
    //   $cmd1 = "error, no return from OCR";
    // }
    // **********************************************
    // else{
    //   array_push($_SESSION['completed_page_array'],$page);
    //   $imginfo = getimagesize($page_directory.strval($page).".png");
    //   // $txtinfo ...
    // }
  }



  $arr = array(
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
  'errorcode' => $errorcode,
  'completed_page_array'=> $_SESSION['completed_page_array'],
  'imginfo'=>$imginfo,
  'txtinfo'=>$txtinfo,
  );
  return json_encode($arr);
}




function get_data(){
  $filename = $_POST['filename'];
  $username = $_POST['username'];
  $page = $_POST['page'];
  $extension = $_POST['extension'];
  $file = $_POST['file_directory'];
  $added_boxes = $_POST['added_boxes'];
  $returned_boxes = $_POST['returned_boxes'];
  $deleted_boxes = $_POST['deleted_boxes'];
  $file_directory = $_POST['file_directory'];
  $page_directory = $file_directory.strval($page).'/';
  $source_file_dir = $page_directory.strval($page).'source.txt';
  $source_file_dir = '../files/a.txt';
  $imginfo = getimagesize($page_directory.strval($page).".png");
  
  // dummy file path
  // $res = [];
  $s = '';
  if(!file_exists($source_file_dir)){
    $errorcode .= ' error, no data generated after OCR';
  }
  else{
    $s = file_get_contents($source_file_dir);
  }
    $arr = array(
    'filename' => $filename,
    'username' =>  $username,
    'page' => $page,
    'extension' => $extension,
    'file_directory' => $file_directory,
    'file' => $file,
    'errorcode' => $errorcode,
    'returned_boxes' => $s,
    'imginfo' => $imginfo,

  );
  return (json_encode($arr));
}








// save changes to files
function save_change(){
  
  // get variables
  $filename = $_POST['filename'];
  $username = $_POST['username'];
  $page = $_POST['page'];
  $extension = $_POST['extension'];
  $file = $_POST['file_directory'];
  $added_boxes = $_POST['added_boxes'];
  $returned_boxes = $_POST['returned_boxes'];
  $deleted_boxes = $_POST['deleted_boxes'];
  $file_directory = $_POST['file_directory'];
  $canvas_width = $_POST['canvas_width'];
  $original_width = $_POST['original_width'];
  $ratio = floatval(floatval($original_width)/floatval($canvas_width));
  // $count = count($returned_boxes);
  $file = '';
  // go throgh all returned box, convert them into string and write to files


  // for ($i=0; $i <  count($returned_boxes); $i++) { 
  //   $oneline = strval($returned_boxes[$i]['coordinates'][0]*$ratio)." ". strval($returned_boxes[$i]['coordinates'][1]*$ratio)." ".strval($returned_boxes[$i]['coordinates'][2]*$ratio)." ".strval($returned_boxes[$i]['coordinates'][3]*$ratio)." ".$returned_boxes[$i]['category']." ". 'returned'."\n";
  //   $file.=$oneline;
  // }
  // // repreat for the deleted boxs
  // for ($i=0; $i <  count($deleted_boxes); $i++) { 
  //   $oneline = strval($deleted_boxes[$i]['coordinates'][0]*$ratio)." ". strval($deleted_boxes[$i]['coordinates'][1]*$ratio)." ".strval($deleted_boxes[$i]['coordinates'][2]*$ratio)." ".strval($deleted_boxes[$i]['coordinates'][3]*$ratio)." ".$deleted_boxes[$i]['category']." ". 'deleted'."\n";
  //   $file.=$oneline;
  // }
  // // again, for the added_boxes
  // for ($i=0; $i <  count($added_boxes); $i++) { 
  //   $oneline = strval($added_boxes[$i]['coordinates'][0]*$ratio)." ". strval($added_boxes[$i]['coordinates'][1]*$ratio)." ".strval($added_boxes[$i]['coordinates'][2]*$ratio)." ".strval($added_boxes[$i]['coordinates'][3]*$ratio)." ".$added_boxes[$i]['category']." ". 'added'."\n";
  //   $file.=$oneline;
  // }



  for ($i=0; $i <  count($returned_boxes); $i++) {
    $box = $returned_boxes[$i];
    $coor = $box['coordinates'];
    $oneline = strval(floatval($coor[0])*$ratio)." ".strval(floatval($coor[1])*$ratio)." ".strval(floatval($coor[2])*$ratio)." ".strval(floatval($coor[3])*$ratio)." ".$box['category']." ". 'returned'."\n";
    $file.=$oneline;
  }
  // repreat for the deleted boxs
  for ($i=0; $i <  count($deleted_boxes); $i++) { 
    $box = $deleted_boxes[$i];
    $coor = $box['coordinates'];
    $oneline = strval(floatval($coor[0])*$ratio)." ".strval(floatval($coor[1])*$ratio)." ".strval(floatval($coor[2])*$ratio)." ".strval(floatval($coor[3])*$ratio)." ".$box['category']." ". 'deleted'."\n";
    $file.=$oneline;
  }
  // again, for the added_boxes
  for ($i=0; $i <  count($added_boxes); $i++) { 
    $box = $added_boxes[$i];
    $coor = $box['coordinates'];
    $oneline = strval(floatval($coor[0])*$ratio)." ".strval(floatval($coor[1])*$ratio)." ".strval(floatval($coor[2])*$ratio)." ".strval(floatval($coor[3])*$ratio)." ".$box['category']." ". 'added'."\n";
    $file.=$oneline;
  }



  // save the file under file_directory/page/page.txt
  // the directory has been  generated since when the image is created in last step
  if($file_directory!= ''){
    $txt_file_dir = $file_directory.strval($page)."/".strval($page).".txt";    
    $txt_file = fopen($txt_file_dir,'w');
    fwrite($txt_file, $file);
    fclose($txt_file);
  }

  if(!file_exists($txt_file_dir)){
    $errorcode.' error: failed to save change into txt file';
  }



  $arr = array(
    'filename' => $filename,
    'username' =>  $username,
    'page' => $page,
    'extension' => $extension,
    'file_directory' => $file_directory,
    '$added_boxes' => $added_boxes,
    'returned_boxes' => $returned_boxes,
    'deleted_boxes' => $deleted_boxes,
    'file' => $file,
    'errorcode' => $errorcode,
    'count' => strval($count),
    'canvas_width' => $canvas_width,
    'original_width' => $original_width,
    'ratio' =>$ratio,
    // 'type' => strval(gettype($returned_boxes[0][0]))
  );
  return (json_encode($arr));
  // return "ccc";
}

?>