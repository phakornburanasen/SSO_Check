<?php
$userCheck = isset($_GET['userCheck']) ? htmlspecialchars($_GET['userCheck']) : '';
?><!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SSO Agent Check</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'Prompt', 'system-ui', 'sans-serif'],
                    },
                    colors: {
                        brand: { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81' }
                    }
                }
            }
        }
    </script>
    <style>
        * { -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Inter', 'Prompt', system-ui, sans-serif; letter-spacing: -0.01em; }
        .glass { background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.6); }
        .card { border-radius: 20px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06); transition: box-shadow 0.3s ease; }
        .card:hover { box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 10px 15px rgba(0,0,0,0.03); }
        .pill { border-radius: 9999px; padding: 0.5rem 1.25rem; font-size: 0.8125rem; font-weight: 500; transition: all 0.2s ease; letter-spacing: 0; }
        .btn-primary { background: linear-gradient(135deg, #4f46e5, #6366f1); color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,0.3); }
        .btn-primary:hover { background: linear-gradient(135deg, #4338ca, #4f46e5); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,0.4); }
        .input-focus { transition: all 0.2s ease; border: 2px solid #e5e7eb; }
        .input-focus:focus { border-color: #6366f1; outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .row-fade { animation: fadeSlide 0.35s ease-out; }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .img-preview-thumb { width:80px; height:80px; object-fit:cover; border-radius:12px; border:2px solid #f3f4f6; cursor:pointer; transition:all 0.25s ease; }
        .img-preview-thumb:hover { border-color: #6366f1; transform: scale(1.08); box-shadow: 0 4px 12px rgba(99,102,241,0.15); }
        table th { position:sticky; top:0; background:#f9fafb; color:#6b7280; font-weight:600; letter-spacing:0.025em; text-transform:uppercase; font-size:0.6875rem; }
        .modal-overlay { background: rgba(15,23,42,0.45); backdrop-filter: blur(4px); }
        @media (max-width:640px) {
            .responsive-table { font-size:0.75rem; }
            .responsive-table th, .responsive-table td { padding:0.5rem 0.35rem; }
        }
    </style>
</head>
<body class="bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 min-h-screen">
<header class="glass sticky top-0 z-40 border-b border-gray-100/80">
    <div class="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl flex items-center justify-center" style="background:linear-gradient(135deg,#4f46e5,#6366f1); box-shadow:0 4px 12px rgba(99,102,241,0.3);">
                <i class="fas fa-microchip text-xl text-white"></i>
            </div>
            <div>
                <h1 class="text-xl font-bold text-gray-900 tracking-tight">Agent TNLX</h1>
                <p class="text-xs text-gray-400 font-medium">Asset Management System</p>
            </div>
        </div>
        <div class="flex items-center gap-2.5 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
            <i class="fas fa-fingerprint text-indigo-400"></i>
            <span id="headerUserCheck" class="font-medium text-gray-700"><?= $userCheck ? $userCheck : '-' ?></span>
        </div>
    </div>
</header>
<main class="max-w-7xl mx-auto px-4 py-8">
    <div class="card p-5 mb-6">
        <div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div class="flex flex-wrap items-center gap-3">
                <button onclick="openAddModal()" class="btn-primary pill px-6 py-2.5 flex items-center gap-2 font-semibold">
                    <i class="fas fa-plus-circle text-base"></i> เพิ่มอุปกรณ์
                </button>
                <div class="flex flex-wrap gap-1.5">
                    <button data-type="" onclick="filterByType('')" class="type-filter-btn pill border-2 border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold">ทั้งหมด</button>
                    <button data-type="C" onclick="filterByType('C')" class="type-filter-btn pill border-2 border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"><i class="fas fa-desktop mr-1.5 text-xs"></i>Computer</button>
                    <button data-type="P" onclick="filterByType('P')" class="type-filter-btn pill border-2 border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"><i class="fas fa-print mr-1.5 text-xs"></i>Printer</button>
                    <button data-type="M" onclick="filterByType('M')" class="type-filter-btn pill border-2 border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"><i class="fas fa-tv mr-1.5 text-xs"></i>Monitor</button>
                    <button data-type="U" onclick="filterByType('U')" class="type-filter-btn pill border-2 border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"><i class="fas fa-bolt mr-1.5 text-xs"></i>UPS</button>
                    <button data-type="S" onclick="filterByType('S')" class="type-filter-btn pill border-2 border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"><i class="fas fa-barcode mr-1.5 text-xs"></i>Scanner</button>
                </div>
            </div>
            <div class="flex items-center gap-3 w-full lg:w-auto">
                <div class="relative flex-1 lg:w-56">
                    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                    <input type="text" id="searchInput" onkeyup="searchTable()" placeholder="ค้นหา..."
                        class="input-focus w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-gray-50">
                </div>
                <span id="recordCount" class="text-sm font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg whitespace-nowrap"></span>
            </div>
        </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
        <div class="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table class="w-full responsive-table" id="dataTable">
                <thead>
                    <tr class="text-sm">
                        <th class="py-3 px-3 text-left whitespace-nowrap">#</th>
                        <th class="py-3 px-3 text-left whitespace-nowrap">Hostname</th>
                        <th class="py-3 px-3 text-left whitespace-nowrap">IP</th>
                        <th class="py-3 px-3 text-left whitespace-nowrap">Username</th>
                        <th class="py-3 px-3 text-left whitespace-nowrap">Type</th>
                        <th class="py-3 px-3 text-left whitespace-nowrap">Windows</th>
                        <th class="py-3 px-3 text-left whitespace-nowrap">CPU</th>
                        <th class="py-3 px-3 text-center whitespace-nowrap">RAM</th>
                        <th class="py-3 px-3 text-left whitespace-nowrap">Office</th>
                        <th class="py-3 px-3 text-left whitespace-nowrap">Detail</th>
                        <th class="py-3 px-3 text-left whitespace-nowrap">Users</th>
                        <th class="py-3 px-3 text-center whitespace-nowrap">รูปภาพ</th>
                        <th class="py-3 px-3 text-left whitespace-nowrap">User Check</th>
                        <th class="py-3 px-3 text-center whitespace-nowrap">จัดการ</th>
                    </tr>
                </thead>
                <tbody id="tableBody" class="text-sm">
                    <tr><td colspan="14" class="text-center py-8 text-gray-400">กำลังโหลดข้อมูล...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</main>
<!-- Add/Edit Modal -->
<div id="formModal" class="fixed inset-0 modal-overlay z-50 hidden items-center justify-center p-4">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
        <div class="glass sticky top-0 border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
            <h2 class="text-xl font-bold text-gray-900" id="modalTitle">เพิ่มอุปกรณ์</h2>
            <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition text-lg">&times;</button>
        </div>
        <form id="deviceForm" onsubmit="submitForm(event)" class="p-6 space-y-4" enctype="multipart/form-data">
            <input type="hidden" name="id" id="editId">
            <input type="hidden" name="action" id="formAction" value="create">

            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">ประเภทอุปกรณ์ <span class="text-red-500">*</span></label>
                <select name="Status_mac" id="typeSelect" onchange="toggleFields()" required
                    class="w-full input-focus rounded-xl px-4 py-3 text-base bg-white">
                    <option value="">-- เลือกประเภท --</option>
                    <option value="C">Computer</option>
                    <option value="P">Printer</option>
                    <option value="M">Monitor</option>
                    <option value="U">UPS</option>
                    <option value="S">Scanner</option>
                </select>
            </div>

            <!-- Common Fields -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Hostname <span class="text-red-500">*</span></label>
                    <input type="text" name="hostname" id="f_hostname" required maxlength="100"
                        class="w-full input-focus rounded-xl px-4 py-3" placeholder="เช่น TNL1471">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">IP Address <span class="text-red-500">*</span></label>
                    <input type="text" name="ip_address" id="f_ip" required maxlength="50"
                        class="w-full input-focus rounded-xl px-4 py-3" placeholder="เช่น 10.115.2.61">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                    <input type="text" name="username" id="f_username" maxlength="100"
                        class="w-full input-focus rounded-xl px-4 py-3" placeholder="THANULUX\t9058">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Users</label>
                    <input type="text" name="Users" id="f_Users" maxlength="100"
                        class="w-full input-focus rounded-xl px-4 py-3" placeholder="ชื่อผู้ใช้งาน">
                </div>
            </div>

<!-- Computer-only Fields -->
            <div id="computerFields" class="hidden space-y-4">
                <div class="border-t pt-4">
                    <h3 class="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">ข้อมูล Computer</h3>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Windows Version</label>
                        <select name="windows_version" id="f_windows" class="w-full input-focus rounded-xl px-4 py-3 bg-white">
                            <option value="">-- เลือก --</option>
                            <option>Windows XP Pro</option><option>Windows 7 Pro</option><option>Windows 8.1 Pro</option><option>Windows 10 Pro</option><option>Windows 11 Pro</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Office Version</label>
                        <select name="Office_Version" id="f_office" class="w-full input-focus rounded-xl px-4 py-3 bg-white">
                            <option value="">-- เลือก --</option>
                            <option>Microsoft Office 2010 Home AND Business</option><option>Microsoft Office 2013 Home AND Business</option>
                            <option>Microsoft Office 2016 Home AND Business</option><option>Microsoft Office 2019 Home AND Business</option>
                            <option>Microsoft Office 2021 Home AND Business</option><option>Microsoft Office 2024 Home AND Business</option>
                            <option>Microsoft 365 Basic</option><option>Microsoft 365 STD</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">CPU</label>
                        <input type="text" name="cpu_name" id="f_cpu" maxlength="255"
                            class="w-full input-focus rounded-xl px-4 py-3" placeholder="12th Gen Intel i5-1235U">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">RAM (GB)</label>
                        <input type="number" name="ram_total_gb" id="f_ram" step="0.01" min="0" max="999"
                            class="w-full input-focus rounded-xl px-4 py-3" placeholder="15.68">
                    </div>
                </div>
            </div>
<!-- Non-Computer Fields -->
            <div id="otherFields" class="hidden space-y-4">
                <div class="border-t pt-4"><h3 class="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">รายละเอียดเพิ่มเติม</h3></div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Detail</label>
                    <textarea name="Detail" id="f_detail" maxlength="100" rows="2"
                        class="w-full input-focus rounded-xl px-4 py-3" placeholder="รายละเอียดเพิ่มเติม เช่น ยี่ห้อ/รุ่น"></textarea>
                </div>
            </div>

            <!-- Image Upload -->
            <div class="border-t pt-4">
                <h3 class="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">รูปภาพ (สูงสุด 3 รูป)</h3>
                <div class="flex flex-wrap items-end gap-4">
                    <div>
                        <input type="file" id="imageInput" accept="image/*" capture="environment" multiple
                            onchange="previewImages(event)" class="text-sm border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-indigo-400 focus:outline-none transition w-full block">
                        <p class="text-xs text-gray-400 mt-1">คลิกเพื่อเลือก หรือถ่ายรูปจากมือถือ</p>
                    </div>
                    <div id="imagePreviewContainer" class="flex flex-wrap gap-2"></div>
                </div>
                <input type="hidden" name="img_png" id="existingImages" value="">
                <div id="existingImagesContainer" class="flex flex-wrap gap-2 mt-2"></div>
            </div>

            <input type="hidden" name="user_check" id="userCheckInput" value="<?= $userCheck ?>">

            <div class="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
                <button type="button" onclick="closeModal()" class="px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition order-2 sm:order-1">ยกเลิก</button>
                <button type="submit" class="btn-primary px-6 py-3 rounded-xl font-semibold transition shadow flex items-center justify-center gap-2 order-1 sm:order-2"><i class="fas fa-save"></i> บันทึกข้อมูล</button>
            </div>
        </form>
    </div>
</div>

<!-- Image Viewer Modal -->
<div id="imageViewerModal" class="fixed inset-0 modal-overlay z-50 hidden items-center justify-center p-4" onclick="closeImageViewer()">
    <div class="relative max-w-3xl w-full">
        <button onclick="closeImageViewer()" class="absolute -top-10 right-0 text-white text-3xl">&times;</button>
        <img id="imageViewerImg" src="" class="w-full rounded-xl shadow-2xl max-h-[85vh] object-contain">
    </div>
</div>
<script>
    const API_URL = 'api.php';
    const USER_CHECK = '<?= $userCheck ?>';
    let currentFilter = '';
    let selectedImageFiles = [];
    let removedExistingImages = [];
    // Cache for records so edit/delete don't depend on inline onclick
    let recordsCache = [];

    document.addEventListener('DOMContentLoaded', () => { loadData(); });

    async function loadData() {
        try {
            const params = new URLSearchParams({ action: 'read' });
            if (currentFilter) params.append('Status_mac', currentFilter);
            const res = await fetch(API_URL + '?' + params);
            const data = await res.json();
            recordsCache = data;
            renderTable(data);
            document.getElementById('recordCount').textContent = '(' + data.length + ' รายการ)';
        } catch (e) {
            Swal.fire('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้', 'error');
        }
    }

    function renderTable(data) {
        const tbody = document.getElementById('tableBody');
        if (!data.length) {
            tbody.innerHTML = '<tr><td colspan="14" class="text-center py-8 text-gray-400">ไม่มีข้อมูล</td></tr>';
            return;
        }
        const typeLabels = { C: 'Computer', P: 'Printer', M: 'Monitor', U: 'UPS', S: 'Scanner' };
        tbody.innerHTML = data.map((row, i) => {
            const images = row.img_png ? row.img_png.split(',').filter(Boolean) : [];
            let imgHtml = '<span class="text-gray-300">-</span>';
            if (images.length) {
                imgHtml = '<div class="flex gap-1 justify-center flex-wrap">' + images.map(img =>
                    '<img src="' + img.trim() + '" data-viewimg="' + img.trim() + '" class="img-preview-thumb" title="คลิกเพื่อดูรูปใหญ่">'
                ).join('') + '</div>';
            }
            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50 transition row-fade ' + (i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white');
            tr.innerHTML = '<td class="py-2 px-3 text-gray-500">' + row.id + '</td>' +
                '<td class="py-2 px-3 font-medium text-gray-800">' + esc(row.hostname) + '</td>' +
                '<td class="py-2 px-3 font-mono text-xs text-gray-600">' + esc(row.ip_address) + '</td>' +
                '<td class="py-2 px-3 text-xs text-gray-600">' + esc(row.username) + '</td>' +
                '<td class="py-2 px-3"><span class="px-2 py-1 rounded-full text-xs font-semibold ' + getTypeBadge(row.Status_mac) + '">' + (typeLabels[row.Status_mac] || row.Status_mac) + '</span></td>' +
                '<td class="py-2 px-3 text-xs text-gray-600">' + esc(row.windows_version) + '</td>' +
                '<td class="py-2 px-3 text-xs max-w-[120px] truncate text-gray-600">' + esc(row.cpu_name) + '</td>' +
                '<td class="py-2 px-3 text-center text-gray-700">' + (row.ram_total_gb || '-') + '</td>' +
                '<td class="py-2 px-3 text-xs max-w-[120px] truncate text-gray-600">' + esc(row.Office_Version) + '</td>' +
                '<td class="py-2 px-3 text-xs max-w-[100px] truncate text-gray-600">' + esc(row.Detail) + '</td>' +
                '<td class="py-2 px-3 text-xs text-gray-600">' + esc(row.Users) + '</td>' +
                '<td class="py-2 px-3">' + imgHtml + '</td>' +
                '<td class="py-2 px-3 text-xs text-gray-600">' + esc(row.user_check) + '</td>' +
                '<td class="py-2 px-3"><div class="flex gap-1 justify-center">' +
                    '<button data-edit="' + row.id + '" class="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-100 transition" title="แก้ไข"><i class="fas fa-edit"></i></button>' +
                    '<button data-del="' + row.id + '" class="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-100 transition" title="ลบ"><i class="fas fa-trash-alt"></i></button>' +
                '</div></td>';
            return tr.outerHTML;
        }).join('');
    }

    function esc(str) { return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }
    function getTypeBadge(type) {
        const map = { C: 'bg-blue-100 text-blue-700', P: 'bg-green-100 text-green-700', M: 'bg-purple-100 text-purple-700', U: 'bg-yellow-100 text-yellow-700', S: 'bg-pink-100 text-pink-700' };
        return map[type] || 'bg-gray-100 text-gray-700';
    }

    // Event delegation for edit / delete / view image (table)
    document.getElementById('tableBody').addEventListener('click', function(e) {
        const editBtn = e.target.closest('[data-edit]');
        const delBtn = e.target.closest('[data-del]');
        const imgEl = e.target.closest('[data-viewimg]');
        if (editBtn) { openEditModal(editBtn.getAttribute('data-edit')); return; }
        if (delBtn) { deleteRecord(delBtn.getAttribute('data-del')); return; }
        if (imgEl) { viewImage(e, imgEl.getAttribute('data-viewimg')); return; }
    });

    // Event delegation for existing image remove buttons + view (edit modal)
    document.getElementById('existingImagesContainer').addEventListener('click', function(e) {
        const rmBtn = e.target.closest('[data-rmimg]');
        const imgEl = e.target.closest('[data-viewimg]');
        if (rmBtn) { removeExistingImage(rmBtn.getAttribute('data-rmimg'), rmBtn); return; }
        if (imgEl) { viewImage(e, imgEl.getAttribute('data-viewimg')); return; }
    });

    // Event delegation for new image remove buttons (edit modal)
    document.getElementById('imagePreviewContainer').addEventListener('click', function(e) {
        const rmBtn = e.target.closest('[data-rmnew]');
        if (rmBtn) { removeNewImage(rmBtn, parseInt(rmBtn.getAttribute('data-rmnew'), 10)); return; }
    });

    function filterByType(type) {
        currentFilter = type;
        document.querySelectorAll('.type-filter-btn').forEach(b => {
            b.classList.remove('border-indigo-200', 'bg-indigo-50', 'text-indigo-700', 'font-semibold');
            b.classList.add('border-gray-200', 'text-gray-500');
        });
        const sel = document.querySelector('[data-type="' + type + '"]');
        if (sel) {
            sel.classList.remove('border-gray-200', 'text-gray-500');
            sel.classList.add('border-indigo-200', 'bg-indigo-50', 'text-indigo-700', 'font-semibold');
        }
        loadData();
    }

    function searchTable() {
        const q = document.getElementById('searchInput').value.toLowerCase();
        document.querySelectorAll('#tableBody tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    }
// ========= MODAL =========
    function openAddModal() {
        document.getElementById('editId').value = '';
        document.getElementById('formAction').value = 'create';
        document.getElementById('modalTitle').textContent = 'เพิ่มอุปกรณ์ใหม่';
        resetForm();
        document.getElementById('formModal').classList.remove('hidden');
        document.getElementById('formModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    async function openEditModal(id) {
        try {
            const res = await fetch(API_URL + '?action=get&id=' + id);
            const row = await res.json();
            if (row.error) { Swal.fire('ผิดพลาด', row.error, 'error'); return; }
            // Reset FIRST, then set edit mode + fill values
            resetForm();
            document.getElementById('editId').value = row.id;
            document.getElementById('formAction').value = 'update';
            document.getElementById('modalTitle').textContent = 'แก้ไขอุปกรณ์';
            document.getElementById('userCheckInput').value = USER_CHECK;
            fillForm(row);
            document.getElementById('formModal').classList.remove('hidden');
            document.getElementById('formModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } catch (e) {
            Swal.fire('ผิดพลาด', 'ไม่สามารถโหลดข้อมูล', 'error');
        }
    }

    function closeModal() {
        document.getElementById('formModal').classList.add('hidden');
        document.getElementById('formModal').style.display = 'none';
        document.body.style.overflow = '';
        resetForm();
    }

    function resetForm() {
        document.getElementById('deviceForm').reset();
        document.getElementById('editId').value = '';
        document.getElementById('typeSelect').value = '';
        document.getElementById('computerFields').classList.add('hidden');
        document.getElementById('otherFields').classList.add('hidden');
        document.getElementById('imagePreviewContainer').innerHTML = '';
        document.getElementById('existingImagesContainer').innerHTML = '';
        document.getElementById('existingImages').value = '';
        document.getElementById('imageInput').value = '';
        selectedImageFiles = [];
        removedExistingImages = [];
    }

    function fillForm(row) {
        document.getElementById('typeSelect').value = row.Status_mac || '';
        document.getElementById('f_hostname').value = row.hostname || '';
        document.getElementById('f_ip').value = row.ip_address || '';
        document.getElementById('f_username').value = row.username || '';
        document.getElementById('f_Users').value = row.Users || '';
        document.getElementById('f_detail').value = row.Detail || '';
        document.getElementById('f_windows').value = row.windows_version || '';
        document.getElementById('f_office').value = row.Office_Version || '';
        document.getElementById('f_cpu').value = row.cpu_name || '';
        document.getElementById('f_ram').value = row.ram_total_gb || '';
        document.getElementById('userCheckInput').value = row.user_check || USER_CHECK;
        document.getElementById('existingImages').value = row.img_png || '';
        toggleFields();

        if (row.img_png) {
            const container = document.getElementById('existingImagesContainer');
            const images = row.img_png.split(',').filter(Boolean);
            container.innerHTML = images.map(function(img) {
                const src = img.trim();
                const div = document.createElement('div');
                div.className = 'relative group';
                const imgEl = document.createElement('img');
                imgEl.src = src;
                imgEl.className = 'img-preview-thumb';
                imgEl.setAttribute('data-viewimg', src);
                imgEl.title = 'คลิกเพื่อดูรูปใหญ่';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-700';
                btn.textContent = 'x';
                btn.setAttribute('data-rmimg', src);
                div.appendChild(imgEl);
                div.appendChild(btn);
                return div.outerHTML;
            }).join('');
        }
    }

    function removeExistingImage(imgPath, btn) {
        removedExistingImages.push(imgPath);
        btn.parentElement.remove();
        updateExistingImagesHidden();
    }

    function updateExistingImagesHidden() {
        var remaining = [];
        document.querySelectorAll('#existingImagesContainer img[data-viewimg]').forEach(function(img) {
            var src = img.getAttribute('data-viewimg');
            if (removedExistingImages.indexOf(src) === -1) remaining.push(src);
        });
        document.getElementById('existingImages').value = remaining.join(',');
    }

    function toggleFields() {
        var type = document.getElementById('typeSelect').value;
        document.getElementById('computerFields').classList.toggle('hidden', type !== 'C');
        document.getElementById('otherFields').classList.toggle('hidden', type === 'C' || type === '');
    }
// ========= IMAGE HANDLING (with client-side compression) =========
    function compressImage(file, callback) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                var maxDim = 1600, w = img.width, h = img.height;
                if (w > maxDim || h > maxDim) { var r = maxDim/Math.max(w,h); w=Math.round(w*r); h=Math.round(h*r); }
                var c = document.createElement('canvas'); c.width=w; c.height=h;
                c.getContext('2d').drawImage(img,0,0,w,h);
                var m = file.type==='image/png'?'image/png':'image/jpeg';
                var q = m==='image/jpeg'?0.75:1.0;
                c.toBlob(function(blob){
                    var ts = new Date().toISOString().replace(/[-:T]/g,'').substring(0,14);
                    var rnd = Math.random().toString(36).substring(2,8);
                    var ext = m==='image/png'?'png':'jpg';
                    var fn = ts+'_'+rnd+'.'+ext;
                    var pu = URL.createObjectURL(blob);
                    callback(null,{blob:blob,name:fn,previewUrl:pu,mime:m});
                },m,q);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function previewImages(event) {
        var files = Array.from(event.target.files);
        var curN = selectedImageFiles.length;
        var curE = document.querySelectorAll('#existingImagesContainer img').length - removedExistingImages.length;
        if (curN+curE+files.length > 3) { Swal.fire('แจ้งเตือน','รูปสูงสุด 3 รูป','warning'); document.getElementById('imageInput').value=''; return; }
        var ct = document.getElementById('imagePreviewContainer');
        var pend = files.length;
        files.forEach(function(file){
            if (file.size > 30*1024*1024) { Swal.fire('ผิดพลาด','ไฟล์ใหญ่เกิน (30MB)','warning'); pend--; return; }
            compressImage(file, function(err,res){
                if (err||!res) { pend--; return; }
                var idx = selectedImageFiles.length; selectedImageFiles.push(res);
                var d=document.createElement('div'); d.className='relative group';
                var im=document.createElement('img'); im.src=res.previewUrl; im.className='img-preview-thumb';
                var bn=document.createElement('button'); bn.type='button';
                bn.className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-700';
                bn.textContent='x'; bn.setAttribute('data-rmnew',idx);
                d.appendChild(im); d.appendChild(bn); ct.appendChild(d);
                pend--; 
            });
        });
    }

    function removeNewImage(btn, idx) {
        selectedImageFiles.splice(idx, 1);
        btn.parentElement.remove();
        document.getElementById('imageInput').value = '';
        // Re-index remaining new-image remove buttons by DOM order
        document.querySelectorAll('#imagePreviewContainer [data-rmnew]').forEach(function(b, i) {
            b.setAttribute('data-rmnew', i);
        });
    }

    // ========= FORM SUBMIT =========
    async function submitForm(e) {
        e.preventDefault();
        var form = document.getElementById('deviceForm');
        var formData = new FormData(form);

        // Append compressed image blobs
        for (var i = 0; i < selectedImageFiles.length; i++) {
            formData.append('images[]', selectedImageFiles[i].blob, selectedImageFiles[i].name);
        }
        formData.append('removed_images', removedExistingImages.join(','));

        var existing = document.getElementById('existingImages').value.split(',').filter(Boolean);
        if (existing.length + selectedImageFiles.length > 3) {
            Swal.fire('แจ้งเตือน', 'สามารถเก็บรูปได้สูงสุด 3 รูป', 'warning');
            return;
        }

        Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: function() { Swal.showLoading(); } });

        try {
            var res = await fetch(API_URL, { method: 'POST', body: formData });
            var result = await res.json();
            Swal.close();
            if (result.success) {
                var msg = result.message || 'บันทึกสำเร็จ';
                if (result.images && result.images.upload_errors && result.images.upload_errors.length > 0) {
                    msg += ' (รูป: ' + result.images.upload_errors.join(', ') + ')';
                }
                Swal.fire('สำเร็จ', msg, 'success');
                closeModal();
                loadData();
            } else {
                var detail = result.message || result.error || 'เกิดข้อผิดพลาด';
                if (detail.toLowerCase().indexOf('upload') !== -1) { detail = 'อัปโหลดรูปไม่สำเร็จ: ' + detail; }
                Swal.fire('ผิดพลาด', detail, 'error');
            }
        } catch (e) {
            Swal.close();
            Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
        }
    }

    // ========= DELETE =========
    async function deleteRecord(id) {
        var hostname = '';
        for (var i = 0; i < recordsCache.length; i++) {
            if (String(recordsCache[i].id) === String(id)) { hostname = recordsCache[i].hostname; break; }
        }
        var result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            html: 'คุณต้องการลบ <b>' + hostname + '</b> ใช่หรือไม่?<br><small class="text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</small>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก'
        });
        if (!result.isConfirmed) return;

        try {
            var formData = new FormData();
            formData.append('action', 'delete');
            formData.append('id', id);
            var res = await fetch(API_URL, { method: 'POST', body: formData });
            var data = await res.json();
            if (data.success) {
                Swal.fire('ลบแล้ว!', data.message, 'success');
                loadData();
            } else {
                Swal.fire('ผิดพลาด', data.message, 'error');
            }
        } catch (e) {
            Swal.fire('ผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
        }
    }

    // ========= IMAGE VIEWER =========
    function viewImage(e, src) {
        e.stopPropagation();
        document.getElementById('imageViewerImg').src = src;
        document.getElementById('imageViewerModal').classList.remove('hidden');
        document.getElementById('imageViewerModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeImageViewer() {
        document.getElementById('imageViewerModal').classList.add('hidden');
        document.getElementById('imageViewerModal').style.display = 'none';
        document.body.style.overflow = '';
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { closeModal(); closeImageViewer(); }
    });
</script>
</body>
</html>