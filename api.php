<?php
// ========================================================
// Agent TNLX API - PHP 5.6 compatible
// ========================================================
header('Content-Type: application/json; charset=utf-8');
error_reporting(0);
ini_set('display_errors', 0);

$DB_SERVER = '10.0.32.165';
$DB_NAME = 'SSO_Agent_tnlx';
$DB_USER = 'sa';
$DB_PASS = 'Thanulux2569';

function jsonResponse($data, $code) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function param($key, $default) {
    return isset($_POST[$key]) ? $_POST[$key] : (isset($_GET[$key]) ? $_GET[$key] : $default);
}

try {
    $pdo = new PDO(
        "sqlsrv:Server=" . $DB_SERVER . ";Database=" . $DB_NAME,
        $DB_USER,
        $DB_PASS,
        array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        )
    );
} catch (Exception $e) {
    jsonResponse(array('error' => 'Connection failed'), 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$uploadDir = dirname(__FILE__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'imgs' . DIRECTORY_SEPARATOR;
$uploadUrl = 'uploads/imgs/';
// ---------------- GET ----------------
if ($method === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if ($action === 'read') {
        $status = isset($_GET['Status_mac']) ? $_GET['Status_mac'] : '';
        $sql = "SELECT id, hostname, ip_address, username, windows_version, cpu_name, ram_total_gb,
                       Office_Version, Detail, Users, img_png, Status_mac, user_check
                FROM Agent_TNLX";
        if ($status !== '') { $sql .= " WHERE Status_mac = ?"; }
        $sql .= " ORDER BY id DESC";
        $stmt = $pdo->prepare($sql);
        if ($status !== '') { $stmt->execute(array($status)); } else { $stmt->execute(); }
        jsonResponse($stmt->fetchAll(), 200);
    }

    if ($action === 'get' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM Agent_TNLX WHERE id = ?");
        $stmt->execute(array((int)$_GET['id']));
        $row = $stmt->fetch();
        if ($row) { jsonResponse($row, 200); }
        jsonResponse(array('error' => 'Not found'), 404);
    }

    jsonResponse(array('error' => 'Invalid action'), 400);
}
// ---------------- POST ----------------
if ($method === 'POST') {
    $action = isset($_POST['action']) ? $_POST['action'] : '';

    // -------- DELETE --------
    if ($action === 'delete') {
        $id = (int)(isset($_POST['id']) ? $_POST['id'] : 0);
        if (!$id) jsonResponse(array('success' => false, 'message' => 'Invalid ID'), 400);

        $stmt = $pdo->prepare("SELECT img_png FROM Agent_TNLX WHERE id = ?");
        $stmt->execute(array($id));
        $row = $stmt->fetch();
        if ($row && $row['img_png']) {
            $parts = explode(',', $row['img_png']);
            foreach ($parts as $img) {
                $img = trim($img);
                $imgPath = dirname(__FILE__) . '/' . $img;
                if ($img !== '' && file_exists($imgPath)) { @unlink($imgPath); }
            }
        }

        $stmt = $pdo->prepare("DELETE FROM Agent_TNLX WHERE id = ?");
        $stmt->execute(array($id));
        jsonResponse(array('success' => true, 'message' => 'ลบข้อมูลเรียบร้อย'), 200);
    }
// -------- CREATE / UPDATE --------
    $id = (int)(isset($_POST['id']) ? $_POST['id'] : 0);
    $Status_mac = isset($_POST['Status_mac']) ? $_POST['Status_mac'] : '';
    $hostname = isset($_POST['hostname']) ? $_POST['hostname'] : '';
    $ip_address = isset($_POST['ip_address']) ? $_POST['ip_address'] : '';
    $username = isset($_POST['username']) ? $_POST['username'] : '';
    $Users = isset($_POST['Users']) ? $_POST['Users'] : '';
    $Detail = isset($_POST['Detail']) ? $_POST['Detail'] : '';
    $cpu_name = isset($_POST['cpu_name']) ? $_POST['cpu_name'] : '';
    $windows_version = isset($_POST['windows_version']) ? $_POST['windows_version'] : '';
    $Office_Version = isset($_POST['Office_Version']) ? $_POST['Office_Version'] : '';
    $user_check = isset($_POST['user_check']) ? $_POST['user_check'] : '';

    $ram_raw = isset($_POST['ram_total_gb']) ? $_POST['ram_total_gb'] : '';
    $ram_val = ($ram_raw !== '' && $ram_raw !== null) ? (float)$ram_raw : null;

    // Handle new uploaded images
    $newImages = array();
    $uploadErrors = array();
    if (!is_dir($uploadDir)) { @mkdir($uploadDir, 0777, true); }
    if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
        foreach ($_FILES['images']['name'] as $i => $name) {
            $errCode = isset($_FILES['images']['error'][$i]) ? $_FILES['images']['error'][$i] : UPLOAD_ERR_NO_FILE;
            $size = isset($_FILES['images']['size'][$i]) ? $_FILES['images']['size'][$i] : 0;
            if ($errCode === UPLOAD_ERR_NO_FILE || $size <= 0) { continue; }
            if ($errCode !== UPLOAD_ERR_OK) {
                $msg = 'upload error ' . $errCode;
                if ($errCode === UPLOAD_ERR_INI_SIZE || $errCode === UPLOAD_ERR_FORM_SIZE) { $msg = 'file too large'; }
                $uploadErrors[] = $msg;
                continue;
            }
            $tmpPath = $_FILES['images']['tmp_name'][$i];
            if (!is_uploaded_file($tmpPath)) { $uploadErrors[] = 'invalid file'; continue; }

            // Determine extension from filename (client-side compression always sends valid ext)
            $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            if (!in_array($ext, array('jpg', 'jpeg', 'png', 'gif', 'webp'))) {
                $ext = 'jpg'; // fallback
            }
            if ($ext === 'jpeg') { $ext = 'jpg'; }

            $newName = date('YmdHis') . '_' . substr(md5(uniqid('', true)), 0, 8) . '.' . $ext;
            $destPath = $uploadDir . $newName;
            if (move_uploaded_file($tmpPath, $destPath)) {
                // Validate after move (file is now inside open_basedir)
                $info = @getimagesize($destPath);
                if ($info === false || !isset($info['mime'])) {
                    @unlink($destPath);
                    $uploadErrors[] = 'not valid image';
                    continue;
                }
                $mime = $info['mime'];
                $validMime = array('image/jpeg', 'image/png', 'image/gif', 'image/webp');
                if (!in_array($mime, $validMime)) {
                    @unlink($destPath);
                    $uploadErrors[] = 'unsupported type ' . $mime;
                    continue;
                }
                $newImages[] = $uploadUrl . $newName;
            } else {
                $uploadErrors[] = 'save failed';
            }
        }
    }

    // Get existing images (for update)
    $existingImages = array();
    if ($id > 0) {
        $stmt = $pdo->prepare("SELECT img_png FROM Agent_TNLX WHERE id = ?");
        $stmt->execute(array($id));
        $row = $stmt->fetch();
        if ($row && $row['img_png']) {
            $existingImages = array_filter(explode(',', $row['img_png']));
        }
    }

    // Handle removed images
    $removedStr = isset($_POST['removed_images']) ? $_POST['removed_images'] : '';
    $removedImages = ($removedStr !== '') ? array_filter(explode(',', $removedStr)) : array();
    foreach ($removedImages as $rimg) {
        $rimg = trim($rimg);
        $rPath = dirname(__FILE__) . '/' . $rimg;
        if ($rimg !== '' && file_exists($rPath)) { @unlink($rPath); }
    }

    $existingImages = array_diff($existingImages, $removedImages);
    $allImages = array_merge($existingImages, $newImages);
    $allImages = array_slice($allImages, 0, 3);
    $img_png = implode(',', $allImages);

    $imgInfo = array(
        'images_count' => count($allImages),
        'images_added' => count($newImages),
        'upload_errors' => $uploadErrors
    );
try {
        if ($action === 'create' || ($action === 'update' && $id === 0)) {
            $sql = "INSERT INTO Agent_TNLX (hostname, ip_address, username, windows_version, cpu_name,
                    ram_total_gb, Status_mac, user_check, Office_Version, Detail, Users, img_png)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(array(
                ($hostname !== '') ? $hostname : null,
                ($ip_address !== '') ? $ip_address : null,
                ($username !== '') ? $username : null,
                ($windows_version !== '') ? $windows_version : null,
                ($cpu_name !== '') ? $cpu_name : null,
                $ram_val,
                ($Status_mac !== '') ? $Status_mac : null,
                ($user_check !== '') ? $user_check : null,
                ($Office_Version !== '') ? $Office_Version : null,
                ($Detail !== '') ? $Detail : null,
                ($Users !== '') ? $Users : null,
                ($img_png !== '') ? $img_png : null
            ));
            jsonResponse(array('success' => true, 'message' => 'เพิ่มข้อมูลเรียบร้อย', 'images' => $imgInfo), 200);
        }

        if ($action === 'update' && $id > 0) {
            $sql = "UPDATE Agent_TNLX SET
                    hostname=?, ip_address=?, username=?, windows_version=?, cpu_name=?,
                    ram_total_gb=?, Status_mac=?, user_check=?, Office_Version=?, Detail=?, Users=?,
                    img_png=?, updated_at=GETDATE()
                    WHERE id=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(array(
                ($hostname !== '') ? $hostname : null,
                ($ip_address !== '') ? $ip_address : null,
                ($username !== '') ? $username : null,
                ($windows_version !== '') ? $windows_version : null,
                ($cpu_name !== '') ? $cpu_name : null,
                $ram_val,
                ($Status_mac !== '') ? $Status_mac : null,
                ($user_check !== '') ? $user_check : null,
                ($Office_Version !== '') ? $Office_Version : null,
                ($Detail !== '') ? $Detail : null,
                ($Users !== '') ? $Users : null,
                ($img_png !== '') ? $img_png : null,
                $id
            ));
            jsonResponse(array('success' => true, 'message' => 'อัปเดตข้อมูลเรียบร้อย', 'images' => $imgInfo), 200);
        }

        jsonResponse(array('success' => false, 'message' => 'Invalid action'), 400);
    } catch (Exception $e) {
        jsonResponse(array('success' => false, 'message' => 'DB Error: ' . $e->getMessage()), 500);
    }
}

jsonResponse(array('error' => 'Method not allowed'), 405);