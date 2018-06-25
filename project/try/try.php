<?php
ini_set('memory_limit', '256M');
$pdfname = './a.pdf';
echo "<pre>";
print_r(count_pages($pdfname));
echo "</pre>";
exit;

function count_pages($pdfname) {
    $pdftext = file_get_contents($pdfname);
    $num = preg_match_all("/\/Page\W/", $pdftext, $dummy);
    return $num;
}
?>
