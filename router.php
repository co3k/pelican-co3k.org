<?php

$path = pathinfo($_SERVER['SCRIPT_FILENAME']);
if (!empty($path['extension'])) {
    return false;
}

header('Content-Type: text/html');
echo file_get_contents($_SERVER['SCRIPT_FILENAME']);
