package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	_ "github.com/denisenkom/go-mssqldb"
	"github.com/xuri/excelize/v2"
)

type app struct {
	db          *sql.DB
	appRoot     string
	uploadDir   string
	uploadURL   string
	allowedCORS string
}

type record struct {
	ID             int      `json:"id"`
	CreatedAt      *string  `json:"created_at"`
	Hostname       *string  `json:"hostname"`
	IPAddress      *string  `json:"ip_address"`
	Username       *string  `json:"username"`
	WindowsVersion *string  `json:"windows_version"`
	CPUName        *string  `json:"cpu_name"`
	RAMTotalGB     *float64 `json:"ram_total_gb"`
	OfficeVersion  *string  `json:"Office_Version"`
	Detail         *string  `json:"Detail"`
	Users          *string  `json:"Users"`
	Dep            *string  `json:"Dep"`
	AssetNo        *string  `json:"asset_no"`
	ImagePNG       *string  `json:"img_png"`
	StatusMac      *string  `json:"Status_mac"`
	UserCheck      *string  `json:"user_check"`
}

type diskRecord struct {
	DriveLetter *string
	Model       *string
	DiskType    *string
	TotalGB     *float64
	FreeGB      *float64
	UsedGB      *float64
	UsedPercent *float64
}

type imageInfo struct {
	ImagesCount  int      `json:"images_count"`
	ImagesAdded  int      `json:"images_added"`
	UploadErrors []string `json:"upload_errors"`
}

type mutationResponse struct {
	Success bool      `json:"success"`
	Message string    `json:"message"`
	Images  imageInfo `json:"images,omitempty"`
}

func main() {
	wd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	appRoot := getenv("APP_ROOT", filepath.Clean(filepath.Join(wd, "..")))
	uploadDir := getenv("UPLOAD_DIR", filepath.Join(appRoot, "uploads", "imgs"))
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Fatalf("create upload dir: %v", err)
	}

	db, err := sql.Open("sqlserver", buildDSN())
	if err != nil {
		log.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("connect database: %v", err)
	}

	a := &app{
		db:          db,
		appRoot:     appRoot,
		uploadDir:   uploadDir,
		uploadURL:   strings.Trim(getenv("UPLOAD_URL", "uploads/imgs/"), "/") + "/",
		allowedCORS: getenv("CORS_ORIGIN", "*"),
	}

	mux := http.NewServeMux()
	uploadFiles := http.FileServer(http.Dir(filepath.Dir(uploadDir)))
	mux.HandleFunc("/health", a.withCORS(a.health))
	mux.HandleFunc("/agents", a.withCORS(a.agents))
	mux.HandleFunc("/export", a.withCORS(a.exportExcel))
	mux.HandleFunc("/api/agents", a.withCORS(a.agents))
	mux.HandleFunc("/api/export", a.withCORS(a.exportExcel))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", uploadFiles))
	mux.HandleFunc("/api/SSO_Check/health", a.withCORS(a.health))
	mux.HandleFunc("/api/SSO_Check/agents", a.withCORS(a.agents))
	mux.HandleFunc("/api/SSO_Check/export", a.withCORS(a.exportExcel))
	mux.Handle("/api/SSO_Check/uploads/", http.StripPrefix("/api/SSO_Check/uploads/", uploadFiles))
	a.mountFrontend(mux)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/SSO_Check/", http.StatusFound)
	})

	addr := ":" + getenv("PORT", "10100")
	log.Printf("SSO Check backend listening on http://localhost%s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func (a *app) mountFrontend(mux *http.ServeMux) {
	frontendDir := getenv("FRONTEND_DIR", filepath.Join(a.appRoot, "frontend", "dist"))
	if stat, err := os.Stat(frontendDir); err != nil || !stat.IsDir() {
		return
	}

	fileServer := http.FileServer(http.Dir(frontendDir))
	mux.HandleFunc("/SSO_Check/", func(w http.ResponseWriter, r *http.Request) {
		rel := strings.TrimPrefix(r.URL.Path, "/SSO_Check/")
		if rel == "" {
			http.ServeFile(w, r, filepath.Join(frontendDir, "index.html"))
			return
		}
		target := filepath.Join(frontendDir, filepath.FromSlash(rel))
		if stat, err := os.Stat(target); err == nil && !stat.IsDir() {
			http.StripPrefix("/SSO_Check/", fileServer).ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(frontendDir, "index.html"))
	})
}

func buildDSN() string {
	q := url.Values{}
	q.Set("database", getenv("DB_NAME", "SSO_Agent_tnlx"))
	q.Set("encrypt", getenv("DB_ENCRYPT", "disable"))
	q.Set("TrustServerCertificate", getenv("DB_TRUST_SERVER_CERTIFICATE", "true"))

	u := &url.URL{
		Scheme:   "sqlserver",
		User:     url.UserPassword(getenv("DB_USER", "sa"), getenv("DB_PASS", "Thanulux2569")),
		Host:     getenv("DB_SERVER", "10.0.32.165"),
		RawQuery: q.Encode(),
	}
	return u.String()
}

func (a *app) withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && (a.allowedCORS == "*" || origin == a.allowedCORS) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

func (a *app) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (a *app) agents(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		a.getAgents(w, r)
	case http.MethodPost:
		a.postAgents(w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
	}
}

func (a *app) exportExcel(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	userChecks := selectedUserChecks(r)
	records, err := a.exportRecords(r.Context(), userChecks)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	file, err := a.buildExcel(r.Context(), records)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer func() { _ = file.Close() }()

	filename := "SSO_Check.xlsx"
	if len(userChecks) == 1 {
		filename = "SSO_Checker_" + safeFilename(userChecks[0]) + ".xlsx"
	} else if len(userChecks) > 1 {
		filename = "SSO_Checker_Selected.xlsx"
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.WriteHeader(http.StatusOK)
	if err := file.Write(w); err != nil {
		log.Printf("write excel: %v", err)
	}
}

func (a *app) exportRecords(ctx context.Context, userChecks []string) ([]record, error) {
	query := `SELECT id, created_at, hostname, ip_address, username, windows_version, cpu_name, ram_total_gb,
Office_Version, Detail, Users, Dep, asset_no, img_png, Status_mac, user_check FROM Agent_TNLX`
	args := []any{}
	if len(userChecks) > 0 {
		placeholders := make([]string, len(userChecks))
		for i, userCheck := range userChecks {
			placeholders[i] = fmt.Sprintf("@p%d", i+1)
			args = append(args, userCheck)
		}
		query += " WHERE user_check IN (" + strings.Join(placeholders, ",") + ")"
	}
	query += " ORDER BY id DESC"

	rows, err := a.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := []record{}
	for rows.Next() {
		rec, err := scanRecord(rows)
		if err != nil {
			return nil, err
		}
		records = append(records, rec)
	}
	return records, rows.Err()
}

func selectedUserChecks(r *http.Request) []string {
	if r.URL.Query().Get("all") == "1" {
		return nil
	}

	seen := map[string]bool{}
	values := []string{}
	for _, raw := range r.URL.Query()["userCheck"] {
		for _, part := range strings.Split(raw, ",") {
			value := strings.TrimSpace(part)
			if value == "" || seen[value] {
				continue
			}
			seen[value] = true
			values = append(values, value)
		}
	}
	return values
}

func (a *app) buildExcel(ctx context.Context, records []record) (*excelize.File, error) {
	const sheet = "SSO_Check"
	file := excelize.NewFile()
	defaultSheet := file.GetSheetName(file.GetActiveSheetIndex())
	if defaultSheet != sheet {
		if err := file.SetSheetName(defaultSheet, sheet); err != nil {
			return nil, err
		}
	}

	headers := map[string]string{
		"A3": "No.",
		"B3": "Asset No",
		"C3": "Hostname",
		"D3": "Detail (Spec)",
		"E3": "Windows",
		"F3": "Ram",
		"G3": "CPU",
		"H3": "IP Address",
		"I3": "Office Version",
		"J3": "Type",
		"K3": "Dep",
		"L3": "Check",
		"M3": "Drive_letter",
		"N3": "Model",
		"O3": "Disk_type",
		"P3": "Total_go",
		"Q3": "Free_gb",
		"R3": "Used_gb",
		"S3": "Used_persent",
		"T3": "Users",
		"U3": "Username",
	}
	for cell, value := range headers {
		if err := file.SetCellValue(sheet, cell, value); err != nil {
			return nil, err
		}
	}

	headerStyle, err := file.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "Century", Size: 12, Bold: true},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "D0D7E2", Style: 1},
			{Type: "right", Color: "D0D7E2", Style: 1},
			{Type: "top", Color: "D0D7E2", Style: 1},
			{Type: "bottom", Color: "D0D7E2", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"E8EDF4"}, Pattern: 1},
	})
	if err != nil {
		return nil, err
	}
	bodyStyle, err := file.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "Century", Size: 12},
		Alignment: &excelize.Alignment{Vertical: "center"},
	})
	if err != nil {
		return nil, err
	}
	if err := file.SetCellStyle(sheet, "A3", "U3", headerStyle); err != nil {
		return nil, err
	}

	row := 4
	for index, rec := range records {
		values := map[string]any{
			"A": index + 1,
			"B": stringValue(rec.AssetNo),
			"C": stringValue(rec.Hostname),
			"D": stringValue(rec.Detail),
			"E": stringValue(rec.WindowsVersion),
			"F": floatValue(rec.RAMTotalGB),
			"G": stringValue(rec.CPUName),
			"H": stringValue(rec.IPAddress),
			"I": stringValue(rec.OfficeVersion),
			"J": stringValue(rec.StatusMac),
			"K": stringValue(rec.Dep),
			"L": stringValue(rec.UserCheck),
			"T": stringValue(rec.Users),
			"U": stringValue(rec.Username),
		}
		if err := setRowValues(file, sheet, row, values); err != nil {
			return nil, err
		}
		row++

		hostname := stringValue(rec.Hostname)
		if hostname == "" {
			continue
		}
		disks, err := a.diskRecords(ctx, hostname)
		if err != nil {
			return nil, err
		}
		for _, disk := range disks {
			values := map[string]any{
				"M": stringValue(disk.DriveLetter),
				"N": stringValue(disk.Model),
				"O": stringValue(disk.DiskType),
				"P": floatValue(disk.TotalGB),
				"Q": floatValue(disk.FreeGB),
				"R": floatValue(disk.UsedGB),
				"S": floatValue(disk.UsedPercent),
			}
			if err := setRowValues(file, sheet, row, values); err != nil {
				return nil, err
			}
			row++
		}
	}

	if row > 4 {
		if err := file.SetCellStyle(sheet, "A4", fmt.Sprintf("U%d", row-1), bodyStyle); err != nil {
			return nil, err
		}
	}
	widths := map[string]float64{
		"A": 8, "B": 14, "C": 22, "D": 28, "E": 18, "F": 10, "G": 32, "H": 18, "I": 34, "J": 14, "K": 14,
		"L": 14, "M": 15, "N": 28, "O": 16, "P": 14, "Q": 14, "R": 14, "S": 16, "T": 20, "U": 24,
	}
	for col, width := range widths {
		if err := file.SetColWidth(sheet, col, col, width); err != nil {
			return nil, err
		}
	}
	if err := file.SetPanes(sheet, &excelize.Panes{
		Freeze:      true,
		Split:       false,
		XSplit:      0,
		YSplit:      3,
		TopLeftCell: "A4",
		ActivePane:  "bottomLeft",
	}); err != nil {
		return nil, err
	}

	return file, nil
}

func (a *app) diskRecords(ctx context.Context, hostname string) ([]diskRecord, error) {
	rows, err := a.db.QueryContext(ctx, `SELECT drive_letter, model, disk_type, total_gb, free_gb, used_gb, Used_percent
FROM Agent_Disk WHERE hostname = @p1 ORDER BY drive_letter`, hostname)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	disks := []diskRecord{}
	for rows.Next() {
		var disk diskRecord
		var driveLetter, model, diskType sql.NullString
		var totalGB, freeGB, usedGB, usedPercent sql.NullFloat64
		if err := rows.Scan(&driveLetter, &model, &diskType, &totalGB, &freeGB, &usedGB, &usedPercent); err != nil {
			return nil, err
		}
		disk.DriveLetter = nullStringPtr(driveLetter)
		disk.Model = nullStringPtr(model)
		disk.DiskType = nullStringPtr(diskType)
		disk.TotalGB = nullFloatPtr(totalGB)
		disk.FreeGB = nullFloatPtr(freeGB)
		disk.UsedGB = nullFloatPtr(usedGB)
		disk.UsedPercent = nullFloatPtr(usedPercent)
		disks = append(disks, disk)
	}
	return disks, rows.Err()
}

func setRowValues(file *excelize.File, sheet string, row int, values map[string]any) error {
	for col, value := range values {
		if err := file.SetCellValue(sheet, fmt.Sprintf("%s%d", col, row), value); err != nil {
			return err
		}
	}
	return nil
}

func (a *app) getAgents(w http.ResponseWriter, r *http.Request) {
	action := r.URL.Query().Get("action")
	switch action {
	case "read":
		a.readRecords(w, r)
	case "get":
		a.getRecord(w, r)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid action"})
	}
}

func (a *app) readRecords(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("Status_mac")
	query := `SELECT id, created_at, hostname, ip_address, username, windows_version, cpu_name, ram_total_gb,
Office_Version, Detail, Users, Dep, asset_no, img_png, Status_mac, user_check FROM Agent_TNLX`
	args := []any{}
	if status != "" {
		query += " WHERE Status_mac = @p1"
		args = append(args, status)
	}
	query += " ORDER BY id DESC"

	rows, err := a.db.QueryContext(r.Context(), query, args...)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	records := []record{}
	for rows.Next() {
		rec, err := scanRecord(rows)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		records = append(records, rec)
	}
	writeJSON(w, http.StatusOK, records)
}

func (a *app) getRecord(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(r.URL.Query().Get("id"))
	if id <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
		return
	}

	row := a.db.QueryRowContext(r.Context(), `SELECT id, created_at, hostname, ip_address, username, windows_version, cpu_name, ram_total_gb,
Office_Version, Detail, Users, Dep, asset_no, img_png, Status_mac, user_check FROM Agent_TNLX WHERE id = @p1`, id)
	rec, err := scanRecord(row)
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, rec)
}

func (a *app) postAgents(w http.ResponseWriter, r *http.Request) {
	if strings.Contains(strings.ToLower(r.Header.Get("Content-Type")), "application/json") {
		var values map[string]string
		if err := json.NewDecoder(r.Body).Decode(&values); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"success": "false", "message": "Invalid JSON data"})
			return
		}
		action := values["action"]
		if action == "delete" {
			a.deleteRecordValues(w, r, values)
			return
		}
		a.saveRecordValues(w, r, action, values, nil)
		return
	}

	if err := r.ParseMultipartForm(96 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"success": "false", "message": "Invalid form data"})
		return
	}
	action := r.FormValue("action")
	if action == "delete" {
		a.deleteRecord(w, r)
		return
	}
	a.saveRecord(w, r, action)
}

func (a *app) deleteRecord(w http.ResponseWriter, r *http.Request) {
	a.deleteRecordValues(w, r, map[string]string{"id": r.FormValue("id")})
}

func (a *app) deleteRecordValues(w http.ResponseWriter, r *http.Request, values map[string]string) {
	id, _ := strconv.Atoi(values["id"])
	if id <= 0 {
		writeJSON(w, http.StatusBadRequest, mutationResponse{Success: false, Message: "Invalid ID"})
		return
	}

	var images sql.NullString
	if err := a.db.QueryRowContext(r.Context(), "SELECT img_png FROM Agent_TNLX WHERE id = @p1", id).Scan(&images); err != nil && !errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusInternalServerError, mutationResponse{Success: false, Message: err.Error()})
		return
	}
	if images.Valid {
		a.removeImages(strings.Split(images.String, ","))
	}

	if _, err := a.db.ExecContext(r.Context(), "DELETE FROM Agent_TNLX WHERE id = @p1", id); err != nil {
		writeJSON(w, http.StatusInternalServerError, mutationResponse{Success: false, Message: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, mutationResponse{Success: true, Message: "ลบข้อมูลเรียบร้อย"})
}

func (a *app) saveRecord(w http.ResponseWriter, r *http.Request, action string) {
	a.saveRecordValues(w, r, action, requestValues(r), r.MultipartForm)
}

func (a *app) saveRecordValues(w http.ResponseWriter, r *http.Request, action string, values map[string]string, multipartForm *multipart.Form) {
	id, _ := strconv.Atoi(values["id"])
	if action != "create" && action != "update" {
		writeJSON(w, http.StatusBadRequest, mutationResponse{Success: false, Message: "Invalid action"})
		return
	}

	existingImages := []string{}
	if id > 0 {
		var images sql.NullString
		err := a.db.QueryRowContext(r.Context(), "SELECT img_png FROM Agent_TNLX WHERE id = @p1", id).Scan(&images)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, http.StatusInternalServerError, mutationResponse{Success: false, Message: err.Error()})
			return
		}
		if images.Valid {
			existingImages = splitImages(images.String)
		}
	}

	removedImages := splitImages(values["removed_images"])
	a.removeImages(removedImages)
	existingImages = difference(existingImages, removedImages)

	newImages, uploadErrors := a.saveUploadedImages(multipartForm)
	allImages := append(existingImages, newImages...)
	if len(allImages) > 3 {
		allImages = allImages[:3]
	}

	form := map[string]any{
		"hostname":        nullable(values["hostname"]),
		"ip_address":      nullable(values["ip_address"]),
		"username":        nullable(values["username"]),
		"windows_version": nullable(values["windows_version"]),
		"cpu_name":        nullable(values["cpu_name"]),
		"ram_total_gb":    nullableFloat(values["ram_total_gb"]),
		"Status_mac":      nullable(values["Status_mac"]),
		"user_check":      nullable(values["user_check"]),
		"Office_Version":  nullable(values["Office_Version"]),
		"Detail":          nullable(values["Detail"]),
		"Users":           nullable(values["Users"]),
		"Dep":             nullable(values["Dep"]),
		"asset_no":        nullable(values["asset_no"]),
		"img_png":         nullable(strings.Join(allImages, ",")),
	}

	imgInfo := imageInfo{ImagesCount: len(allImages), ImagesAdded: len(newImages), UploadErrors: uploadErrors}
	if action == "create" || (action == "update" && id == 0) {
		_, err := a.db.ExecContext(r.Context(), `INSERT INTO Agent_TNLX
(hostname, ip_address, username, windows_version, cpu_name, ram_total_gb, Status_mac, user_check, Office_Version, Detail, Users, Dep, asset_no, img_png, created_at, updated_at)
VALUES (@p1,@p2,@p3,@p4,@p5,@p6,@p7,@p8,@p9,@p10,@p11,@p12,@p13,@p14,GETDATE(),GETDATE())`,
			form["hostname"], form["ip_address"], form["username"], form["windows_version"], form["cpu_name"],
			form["ram_total_gb"], form["Status_mac"], form["user_check"], form["Office_Version"], form["Detail"], form["Users"], form["Dep"], form["asset_no"], form["img_png"])
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, mutationResponse{Success: false, Message: "DB Error: " + err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, mutationResponse{Success: true, Message: "เพิ่มข้อมูลเรียบร้อย", Images: imgInfo})
		return
	}

	if id <= 0 {
		writeJSON(w, http.StatusBadRequest, mutationResponse{Success: false, Message: "Invalid ID"})
		return
	}
	_, err := a.db.ExecContext(r.Context(), `UPDATE Agent_TNLX SET
hostname=@p1, ip_address=@p2, username=@p3, windows_version=@p4, cpu_name=@p5, ram_total_gb=@p6,
Status_mac=@p7, user_check=@p8, Office_Version=@p9, Detail=@p10, Users=@p11, Dep=@p12, asset_no=@p13, img_png=@p14, updated_at=GETDATE()
WHERE id=@p15`,
		form["hostname"], form["ip_address"], form["username"], form["windows_version"], form["cpu_name"],
		form["ram_total_gb"], form["Status_mac"], form["user_check"], form["Office_Version"], form["Detail"], form["Users"], form["Dep"], form["asset_no"], form["img_png"], id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, mutationResponse{Success: false, Message: "DB Error: " + err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, mutationResponse{Success: true, Message: "อัปเดตข้อมูลเรียบร้อย", Images: imgInfo})
}

func (a *app) saveUploadedImages(form *multipart.Form) ([]string, []string) {
	if form == nil || form.File == nil {
		return nil, nil
	}
	files := form.File["images[]"]
	if len(files) == 0 {
		files = form.File["images"]
	}

	images := []string{}
	errs := []string{}
	for _, header := range files {
		if header.Size <= 0 {
			continue
		}
		if header.Size > 30<<20 {
			errs = append(errs, "file too large")
			continue
		}
		ext := strings.ToLower(filepath.Ext(header.Filename))
		if ext == ".jpeg" {
			ext = ".jpg"
		}
		if !map[string]bool{".jpg": true, ".png": true, ".gif": true, ".webp": true}[ext] {
			ext = ".jpg"
		}

		src, err := header.Open()
		if err != nil {
			errs = append(errs, "invalid file")
			continue
		}
		defer src.Close()

		sniff := make([]byte, 512)
		n, _ := src.Read(sniff)
		mime := http.DetectContentType(sniff[:n])
		if !strings.HasPrefix(mime, "image/") {
			errs = append(errs, "not valid image")
			continue
		}
		if _, err := src.Seek(0, io.SeekStart); err != nil {
			errs = append(errs, "invalid file")
			continue
		}

		name := fmt.Sprintf("%s_%d%s", time.Now().Format("20060102150405"), time.Now().UnixNano()%100000000, ext)
		destPath := filepath.Join(a.uploadDir, name)
		dest, err := os.Create(destPath)
		if err != nil {
			errs = append(errs, "save failed")
			continue
		}
		if _, err := io.Copy(dest, src); err != nil {
			_ = dest.Close()
			_ = os.Remove(destPath)
			errs = append(errs, "save failed")
			continue
		}
		_ = dest.Close()
		images = append(images, a.uploadURL+name)
	}
	return images, errs
}

type scanner interface {
	Scan(dest ...any) error
}

func scanRecord(row scanner) (record, error) {
	var rec record
	var hostname, ip, username, win, cpu, office, detail, users, dep, assetNo, img, status, userCheck sql.NullString
	var ram sql.NullFloat64
	var createdAt sql.NullTime
	err := row.Scan(&rec.ID, &createdAt, &hostname, &ip, &username, &win, &cpu, &ram, &office, &detail, &users, &dep, &assetNo, &img, &status, &userCheck)
	if err != nil {
		return rec, err
	}
	rec.CreatedAt = nullTimeStringPtr(createdAt)
	rec.Hostname = nullStringPtr(hostname)
	rec.IPAddress = nullStringPtr(ip)
	rec.Username = nullStringPtr(username)
	rec.WindowsVersion = nullStringPtr(win)
	rec.CPUName = nullStringPtr(cpu)
	rec.RAMTotalGB = nullFloatPtr(ram)
	rec.OfficeVersion = nullStringPtr(office)
	rec.Detail = nullStringPtr(detail)
	rec.Users = nullStringPtr(users)
	rec.Dep = nullStringPtr(dep)
	rec.AssetNo = nullStringPtr(assetNo)
	rec.ImagePNG = nullStringPtr(img)
	rec.StatusMac = nullStringPtr(status)
	rec.UserCheck = nullStringPtr(userCheck)
	return rec, nil
}

func (a *app) removeImages(images []string) {
	uploadRoot := filepath.Clean(filepath.Dir(a.uploadDir))
	for _, img := range images {
		img = strings.TrimSpace(strings.TrimLeft(img, "/\\"))
		if img == "" {
			continue
		}
		rel := filepath.ToSlash(img)
		if strings.HasPrefix(rel, "uploads/") {
			rel = strings.TrimPrefix(rel, "uploads/")
		}
		target := filepath.Clean(filepath.Join(uploadRoot, filepath.FromSlash(rel)))
		if !strings.HasPrefix(strings.ToLower(target), strings.ToLower(uploadRoot)+string(os.PathSeparator)) {
			continue
		}
		_ = os.Remove(target)
	}
}

func splitImages(value string) []string {
	out := []string{}
	for _, item := range strings.Split(value, ",") {
		item = strings.TrimSpace(item)
		if item != "" {
			out = append(out, item)
		}
	}
	return out
}

func requestValues(r *http.Request) map[string]string {
	values := map[string]string{}
	for key, items := range r.Form {
		if len(items) > 0 {
			values[key] = items[0]
		}
	}
	return values
}

func difference(values, removed []string) []string {
	blocked := map[string]bool{}
	for _, item := range removed {
		blocked[item] = true
	}
	out := []string{}
	for _, item := range values {
		if !blocked[item] {
			out = append(out, item)
		}
	}
	return out
}

func nullable(value string) any {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return value
}

func nullableFloat(value string) any {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	v, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return nil
	}
	return v
}

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func nullFloatPtr(value sql.NullFloat64) *float64 {
	if !value.Valid {
		return nil
	}
	return &value.Float64
}

func nullTimeStringPtr(value sql.NullTime) *string {
	if !value.Valid {
		return nil
	}
	formatted := value.Time.Format("2006-01-02 15:04:05")
	return &formatted
}

func stringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func floatValue(value *float64) any {
	if value == nil {
		return ""
	}
	return *value
}

func safeFilename(value string) string {
	re := regexp.MustCompile(`[^A-Za-z0-9_-]+`)
	value = re.ReplaceAllString(value, "_")
	value = strings.Trim(value, "_")
	if value == "" {
		return "export"
	}
	return value
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
