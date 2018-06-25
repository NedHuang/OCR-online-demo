/*****************************************************************************
created by Mingzhe Huang @ Founder IT Group, 06/2018

declare variables
1.  returned, added, deleted分别是 含有 服务器传回来的识别框，用户添加的识别框，服务器传回但是被删掉的识别框（false positive的例子) 的数组
2.  _backups后缀意为备份，想用户提供一键清除所有改动服务
3.  每一个识别框长以json形式存储，包含 category 和 vertexes属性，前者可以为table,formula, image, 后者为一个包含四个点坐标(x,y)[左,上，右,下]
4.  box_category 是全局变量，修改此变量以改变生成的识别框的种类
5.  action_array:记录用户的操作的数组，每一项是一个json, 下称为action, index 为此array的某元素的位置。未有操作时， index初始化为-1；
6.  action为json格式，包含act和obj 两个属性，act为string,记录其操作类型， obj为操作对象(识别框),例如
    action = {'act': 'add_new_box', 'obj':{'category': 'table','vertexes':[[210,10],[310,10],[310,110],[210,110]]}}
7.  point_pair 含有两个点的坐标，记录鼠标按下与松开的位置（对角线的两个顶点生成矩形）
8.  对于任何操作，抛弃当前index以及之后的action, 把本操作加入action_array(undo 和 redo的规则)
9.  涉及到 delete的操作，清空canvas，调用 draw_all() 根据已经更新的数组重新绘制
******************************************************************************/

/******************************************************************************
set some dummy variables
******************************************************************************/
  
  //loading layer
  // $('#loading').show().css('display','block');
  // $('#loading').hide().css('display','none');
  

var canvas = document.getElementById('editor_canvas');
var context = canvas.getContext('2d');

/******************************************************************************
******************************************************************************/


var canvas = document.getElementById('editor_canvas');
var context = canvas.getContext('2d');
var returned_backups = [{'category': 'image','coordinates':[10,10,100,100]}, {'category': 'table','coordinates':[50,50,140,140]}];
var added_backups = [];
var deleted_backups = [];

var returned = [{'category': 'image','coordinates':[10,10,100,100]}, {'category': 'table','coordinates':[50,50,140,140]}];
var added = [];
var deleted = [];

var action_array = [];
var box_category = 'table';
var index = - 1;
var point_pair = [];
var page;
var total_page;

function aaa (){
  alert('aaa');
}

/*********************************************************
其它JS文件调用,事件触发的function
**********************************************************/
function load_boxes(){
  returned = localStorage.getItem('returned_boxes');
  added = localStorage.getItem('added_boxes');
  deleted = localStorage.getItem('deleted_boxes');

  returned_backups = localStorage.getItem('returned_boxes');
  added_backups = localStorage.getItem('added_boxes');
  deleted_backups = localStorage.getItem('deleted_boxes');
}


/*********************************************************
监听事件.
**********************************************************/
// mousedown behavior while in edit mode
edit_mousedown = function(e) {
  // a point is a array with two element, x-coordinate and y-coordinate,
  // add the point where user start to draw the box to point pair
  draw_auxiliary_line(e.offsetX,e.offsetY);
  var point_start = [e.offsetX,e.offsetY];
  point_pair.push(point_start);
}

edit_mouseup = function(e){
  // make add the point where user release the left button of mouse to point pair
  var point_end = [e.offsetX,e.offsetY];
  point_pair.push(point_end);
  // the four coordinates for drawing a bounding box
  var upper_left = new Array();
  var upper_right = new Array();
  var lower_left = new Array();
  var lower_right = new Array();

  var left = Math.min(point_pair[0][0],point_pair[1][0]);
  var right = Math.max(point_pair[0][0],point_pair[1][0]);
  var top = Math.min(point_pair[0][1],point_pair[1][1]);
  var bot = Math.max(point_pair[0][1],point_pair[1][1]);
  var coor = [left, top, right, bot]
  console.log(coor);

  var new_box = {'category':box_category,'coordinates':coor};
  var new_action ={'act':'add_new_box', 'obj':new_box};

  added.push(new_box);
  // check if we need to abandon the modification(the rest of the action_array)
  if(index == action_array.length - 1){
    draw(new_box);
    action_array.push(new_action);
    index = index + 1;
  }
  else{
    // replace everything in the action_array after the index by this new_action
    draw(new_box);
    action_array.splice(index + 1,action_array.length - index , new_action);
    // action_array.push(new_action);
    // no need to update index, because splice replaces the everything starts from the index
    index = index + 1;
    console.log('abandon');
    
  }
  point_pair = [];
  draw_all();
  // console.log('added length: ' + added.length + ', returned length: ' + returned.length + ', deleted.length: ' + deleted.length);
}

// mousedown event for erase_mode(deleting), mouseup后清除mousemove事件
// this function generates an array of points and for each points, it calls delete_box()
erase_mousedown = function(e){
  context.strokeStyle = '#111111';
  eraser_path = [];
  x_start = e.offsetX;
  y_start = e.offsetY;
  context.beginPath();
  eraser_path.push([x_start,y_start]);  
  context.moveTo(x_start, y_start);

}
// 哈密顿距离 大于 20像素，则点的坐标array
erase_onmousemove = function (e) {
  var x_end = e.offsetX;
  var y_end = e.offsetY;
    context.strokeStyle = '#000000';
  context.lineTo(x_end, y_end);
  context.stroke();
  if(Math.abs(x_start - x_end) + Math.abs(y_start - y_end) > 20){
    x_start = x_end;
    v_start = y_end;
    eraser_path.push([x_start,y_start]);
  }
}

erase_mouseup = function () {
  delete_box(eraser_path);
  console.log('1');
  draw_all();
  eraser_path = [];
  context.closePath();
  canvas.onmousemove = null;
}


//鼠标按下显示定位十字
function draw_auxiliary_line(x,y){
  console.log('draw_auxiliary_line');
  context.strokeStyle = '#000000';
  context.beginPath();
  context.moveTo(x,y);
  context.lineTo(x+15,y); 
  context.stroke();
  context.moveTo(x,y);
  context.lineTo(x,y+15); 
  context.stroke();
  context.moveTo(x,y);
  context.lineTo(x-15,y); 
  context.stroke();
  context.moveTo(x,y);
  context.lineTo(x,y-15); 
  context.stroke();
  context.closePath();
}


// function clear_auxiliary_line(x,y){
//   context.clear
// }

/*********************************************************
添加/删除 box
**********************************************************/

// call calculate_distance for each box and it returns true if the distance <= 10 pixel。
// if the box is in added array, just delete, otherwise, delete and append it into deleted array
function delete_box(path){
  for(var i = 0; i < path.length; i++){
    var x = path[i][0];
    var y = path[i][1];
    for(var j =0; j < added.length;j++){
      var left = added[j].coordinates[0];
      var top = added[j].coordinates[1];
      var right = added[j].coordinates[2];
      var bot = added[j].coordinates[3];
      if(calculate_diatance(x,y,left,top,right,bot)){
        var deleted_box = added[j];
        added.splice(j,1);
        var new_action = {'act':'delete_added_box', 'obj':deleted_box};
        // update the index when delete a box
        j = j - 1;
        if(index == action_array.length - 1){
          action_array.push(new_action);
          index = index + 1;
        }
        else{
          action_array.splice(index, action_array.length - index);
          action_array.push(new_action);
        }
      }
    }
    for(var j =0; j < returned.length;j++){
      var top = returned[j].coordinates[0];
      var left = returned[j].coordinates[1];
      var right = returned[j].coordinates[2];
      var bot = returned[j].coordinates[3];
      if(calculate_diatance(x,y,left,top,right,bot)){
        var deleted_box = returned[j];
        returned.splice(j,1);
        // record this false positive instance by pushing the box into 'deleted'array
        deleted.push(deleted_box);
        var new_action = {'act':'delete_returned_box', 'obj':deleted_box};
        // update the index
        j = j - 1;
        if(index == action_array.length - 1){
          action_array.push(new_action);
          index = index + 1;
        }
        else{
          action_array.splice(index, action_array.length - index);
          action_array.push(new_action);
        }
      }      
    }
  }
}


// if the sum of distance from the point to a pair of edges is smaller than the height/width + 20 pixel, return true;
function calculate_diatance(x,y,x_1,y_1,x_2,y_2){
  if( (Math.abs(x-x_1)+Math.abs(x_2-x)<=Math.abs(x_1-x_2)+20) && (Math.abs(y-y_1)+Math.abs(y_2-y)<=Math.abs(y_1-y_2)+20) ){
    return true;
  }
  return false;
}



/*********************************************************
画图
**********************************************************/

function draw(input_box){

  var coordinates = input_box['coordinates'];
  if(input_box.category == 'image'){
    context.lineWidth = 2;
    context.strokeStyle = '#3232CD';
  }

  if(input_box.category == 'formula'){
    context.lineWidth = 2;
    context.strokeStyle = '#F5270B';
  }
  if(input_box.category == 'table'){
    context.lineWidth = 2;
    context.strokeStyle = '#32CD32';
  }
  // draw the box
  context.beginPath();
  //左，上，右，下
  context.moveTo(coordinates[0],coordinates[1]);//左上
  context.lineTo(coordinates[2],coordinates[1]); //右上
  context.stroke();
  context.moveTo(coordinates[2],coordinates[1]);//右上
  context.lineTo(coordinates[2],coordinates[3]); //右下
  context.stroke();
  context.moveTo(coordinates[2],coordinates[3]);//右下
  context.lineTo(coordinates[0],coordinates[3]);//左下
  context.stroke();
  context.moveTo(coordinates[0],coordinates[3]);//左下
  context.lineTo(coordinates[0],coordinates[1]);//左上
  context.stroke();

  //console.log('draw rectangle: ' + input_box);
  context.closePath();
}


function draw_all(){
  console.log('re-draw ' + added.length +'items in added and ' + returned.length + ' items in returned, in index ' + index);
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  for (var i = 0; i < added.length; i++) {
    console.log('added.length '+added.length);
    draw(added[i]);
  }
  for (var i = 0; i < returned.length; i++) {
    draw(returned[i]);
  }
}


function reset_canvas(){
  context.clearRect(0, 0, canvas.width, canvas.height);
}
/*********************************************************
操作+实现逻辑
**********************************************************/

// enter the edit mode and change the eventlistner
function edit_mode(){
  console.log('enter edit_mode');
  canvas = document.getElementById('editor_canvas');
  context = canvas.getContext('2d');
  canvas.removeEventListener('mousedown',erase_mousedown);
  canvas.removeEventListener('onmousemove', erase_onmousemove);
  canvas.removeEventListener('mouseup',erase_mouseup);
  canvas.addEventListener('mousedown', edit_mousedown);
  canvas.addEventListener('mouseup',edit_mouseup);
}


  // change the eventlistener
function erase_mode(){
  var canvas = document.getElementById('editor_canvas');
  var context = canvas.getContext('2d');
  canvas.removeEventListener('mousedown', edit_mousedown);
  canvas.removeEventListener('mouseup',edit_mouseup);
  context.lineWidth = 2;
  context.strokeStyle = '#000000';
  canvas.addEventListener('mousedown',erase_mousedown);
  canvas.addEventListener('onmousemove', erase_onmousemove);
  canvas.addEventListener('mouseup',erase_mouseup);
}


function undo(){
  //console.log('before undo, index is: ' + index +', length is: ' + action_array.length + ', added length is ' + added.length);
  if(index == -1){
    // nothing can be undone, disable the button
    alert('nothing can be undone');
  }
  else{
    var last_action = action_array[index];
    console.log(last_action.act);
    index = index - 1;
    if(last_action.act == 'add_new_box'){
      added.splice(added.length-1,1);
      console.log('2');
      draw_all();
      //console.log('undo adding box, after undo, index is: ' + index +', action length is: ' + action_array.length + ', added length is ' + added.length);
    }
    if(last_action.act == 'delete_added_box'){
      // alert('undo delete_added_box');
      added.push(last_action.obj);
      console.log('3');
      draw_all();
      //console.log('undo deleting added box, after undo, index is: ' + index +', action length is: ' + action_array.length + ', added length is ' + added.length);
    }
    if(last_action.act == 'delete_returned_box'){
      returned.push(last_action.obj);
      deleted.pop();
      console.log('4');
      // returned.push(deleted.pop());
      draw_all();
    }
  }  
}

function redo(){
  console.log('before redo index is: ' + index +', length is: ' + action_array.length + ', added length is ' + added.length);
  if(index >= action_array.length-1){
    alert('nothing can be redone');
  }else{
    index = index + 1;
    var action_to_be_revoked = action_array[index];
    if(action_to_be_revoked.act == 'add_new_box'){
      added.push(action_to_be_revoked.obj);
      console.log('5');
      draw_all();
      console.log('after redo index is: ' + index +', length is: ' + action_array.length + ', added length is ' + added.length);
    }
    if(action_to_be_revoked.act == 'delete_added_box'){
      added.pop(action_to_be_revoked.obj);
      console.log('6');
      draw_all();
    }
    if(action_to_be_revoked.act == 'delete_returned_box'){
      returned.pop();
      deleted.push(action_to_be_revoked.obj);
      // deleted.push(returned.pop());
      console.log('7');
      draw_all();
    }
  }
}


function change_category_to_formula(){
  box_category = 'formula';
}

function change_category_to_image(){
  box_category = 'image';
}

function change_category_to_table(){
  box_category = 'table';
}

//保存修改，将参数存入 backups
function save_change(){
  returned_backups = new Array();
  returned_backups = returned.concat();
  added_backups = new Array();
  added_backups = added.concat();
  deleted_backups = new Array();
  deleted_backups = deleted.concat();
}


/*********************************************************
测试用 function
**********************************************************/

// print all retuened box to console
function print_returned(){
  console.log('returned_box:');
  for(var i =0; i< returned.length; i++){
    print_box(returned[i]);
  }
}

// print all added box to console
function print_added(){
  console.log('added_box:');
  for(var i=0;i<added.length; i++){
    print_box(added[i]);
  }
}

// print all deleted object to console
function print_deleted(){
  console.log('deleted_box:' + deleted.length);
  for(var i =0; i< deleted.length; i++){
    print_box(deleted[i]);
  }
}

function print_box(box){
  console.log('category: '+box.category+'; coordinates: left: '+box.coordinates[0]+', top: '+box.coordinates[1]+', right: '+box.coordinates[2]+', bot: '+box.coordinates[3]);
}

  //重置所有改动, abandon all changes
function reset() {
  returned = new Array();
  returned = returned_backups.concat();
  added = new Array();
  added = added_backups.concat();
  deleted = new Array();
  deleted = deleted_backups.concat();
}

//将保存后的结果传回 server
function save_change_to_server(){
  save_change();
  var obj = 
  {
    'operation': 'save_change',
    'filename': localStorage.getItem('filename'),
    'username': localStorage.getItem('username'),
    'page' : localStorage.getItem('page'),
    'extension': localStorage.getItem('extension'),
    'file_directory':localStorage.getItem('file_directory'),
    'returned_boxes': returned_backups,
    'added_boxes': added_backups,
    'deleted_boxes': deleted_backups,
  }
  alert("operation: " + obj['operation']);
  $.ajax(
  {
    url: '../php/convert.php',
    type:'post',
    data: obj,
    // processData:false,
    // contentType:false,

    success:function(res){
      console.log(res);
      alert(res);
      alert('您所做的修改已保存到服务器');
    },
    error:function(err){
      alert('网络链接失败');
    }
  })
}

function get_conveted_result(){
  console.log('get_conveted_result');
  var obj = 
  {
    'operation': 'get_data',
    'filename': localStorage.getItem('filename'),
    'username': localStorage.getItem('username'),
    'page' : localStorage.getItem('page'),
    'extension': localStorage.getItem('extension'),
    'file_directory':localStorage.getItem('file_directory'),
  }
  $.ajax(
  {
    url: '../php/convert.php',
    type:'post',
    data: obj,
    // processData:false,
    // contentType:false,
    success:function(res){
      console.log(res);
      obj = JSON.parse(res);
      var box_array = [];
      // alert(obj['returned_boxes']);
      var boxes = obj['returned_boxes'].split('\n');
      for(var i = 0; i < boxes.length; i++){
        var box = boxes[i].split(' ');
        if( ! (box[4] == "table" || box[4] == "formula" ||box[4] == "image") ){
        }
        else{
          // console.log(box);
          var box_str = '{ "category" : ' +'"'+ box[4]+'"' +', "coordinates" : [' + parseInt(box[0]) +', '
          +parseInt(box[1]) +', '+ parseInt(box[2]) +', ' +parseInt(box[3]) +']}';
          // console.log('yes '+box_str);
          var b = JSON.parse(box_str);
          console.log(b);
          box_array.push(b);
        }
      }
      returned_backups = new Array().concat(box_array);
      added_backups = new Array();
      deleted_backups = new Array();
      returned = returned_backups.concat();
      added = added_backups.concat();
      deleted = deleted_backups.concat();
    },
    error:function(err){
      alert('网络链接失败');
    }
  })
}

function get_image(){
  console.log('get_image');

  //localStorage.setItem('completed_page_array', localStorage.getItem('completed_page_array').push(page));
    var obj = 
  {
    'operation': 'get_image',
    'filename': localStorage.getItem('filename'),
    'username': localStorage.getItem('username'),
    'page' : localStorage.getItem('page'),
    'extension': localStorage.getItem('extension'),
    'file_directory':localStorage.getItem('file_directory'),
  }
  $.ajax(
  {
    url: '../php/convert.php',
    type:'post',
    data: obj,
    // processData:false,
    // contentType:false,
    success:function(res){
      console.log(res);
      obj = JSON.parse(res);
      var page_directory = obj['page_directory'];
      var img_url = obj['img_url'];
      var completed_page_array = obj['completed_page_array'];
      var imginfo = obj['imginfo'];
      var errorcode = obj['errorcode'];
      showImg(img_url);
      reset_canvas();
      resize_canvas_img(parseInt(imginfo['0']),parseInt(imginfo['1'])); 
    },
    error:function(err){
      alert('网络链接失败');
    }
  })
}

function showNextPage(){ 
  page = parseInt(localStorage.getItem('page'));
  total_page = parseInt(localStorage.getItem('total_page'));
  console.log( + page + "out of" + total_page);
  if(page < total_page){
    page = parseInt(page) + 1;
    localStorage.setItem('page',page);
    console.log('showNextPage ' + page + "out of" + total_page);
    get_image();
  }else{
    alert("已到达最后一页");
  }
}


function showPrevPage(){
  page = parseInt(localStorage.getItem('page'));
  total_page = parseInt(localStorage.getItem('total_page'));
  console.log( + page + "out of" + total_page);
  if(page > 1){
    page = parseInt(page) - 1;
    localStorage.setItem('page',page);
    console.log('showPrevPage ' + page + "out of" + total_page);
    get_image();
  }else{
    alert("已到达一页");
  }
}

function showFirstPage(){
  page = parseInt(localStorage.getItem('page'));
  total_page = parseInt(localStorage.getItem('total_page'));
  console.log( + page + "out of" + total_page);
  page = 1;
  localStorage.setItem('page',page);
  get_image();
}

function showLastPage(){
  page = parseInt(localStorage.getItem('page'));
  total_page = parseInt(localStorage.getItem('total_page'));
  console.log( + page + "out of" + total_page);
  page = total_page;
  localStorage.setItem('page',page);
  get_image();
}




function showImg(url,w,h){
  console.log('show img: '+ url + ' w: ' + w + ' h: '+h);
  $('#input_img').attr('src',url);
  // .css('max-width','1000px').css('margin','auto').css('width',);
  // 显示图片则disable掉 跳转页码的按钮

  // var w = $('#input_img')[0].naturalWidth;
  // var h = $('#input_img')[0].naturalHeight;
  // console.log('show img: '+ url + 'naturalWidth: ' + w +', naturalHeight: ' + h);
}


function showPageNumber(){
  $('#pages_indicator').empty();
  $('#pages_indicator').html("页数: " + page + " / " + total_page);
  document.getElementById('myNumber').value = page;
  document.getElementById('myNumber').max = total_page+"";

}




function select_page() {
  var selected_page = document.getElementById("myNumber").value;
  if(selected_page <=0 || selected_page > total_page){
    alert("请输入有效的页码");
  }
  page = Number(selected_page);
  convert_request(localStorage.getItem('input_full_path'),selected_page);
  console.log("jump to page: " + page);
}








// function showImg(url,w,h){
//   console.log('show img: '+ url + ' w: ' + w + ' h: '+h);
//   $('#input_img').attr('src',url);
// }