# Đọc và sửa mã nguồn TaskHub

Tài liệu này dành cho thành viên mới nhận code. TaskHub dùng React để hiển thị, API Node.js để xử lý và SQLite để lưu dữ liệu khi chạy trên máy. Bản public dùng Cloudflare Pages, gateway và Workers/D1 từ cùng nguồn FE/BE. Không cần học thêm một bộ framework khác để sửa nội dung hoặc một biểu mẫu.

## 1. Chạy bản local trước

Cài Git và **Node.js 24 LTS**. Backend dùng `node:sqlite` có sẵn trong Node.js 24; Node.js 18/20 không chạy được bản này.

```powershell
git clone --branch dev https://github.com/skunlainro3-glitch/TaskHub.git
cd TaskHub
npm ci
Copy-Item -LiteralPath .env.example -Destination .env
```

Đặt `ADMIN_EMAIL` và `ADMIN_PASSWORD` riêng ít nhất 12 ký tự trong `.env`, giữ `HOST=127.0.0.1` cho local; không commit mật khẩu. Sau đó:

```powershell
npm run dev
```

Mở http://127.0.0.1:5173. Một lệnh `dev` mở cả frontend cổng 5173 và API cổng 3001. Dừng bằng `Ctrl+C`. Vite chuyển yêu cầu `/api` sang API local; không cần tự nhập URL production vào code.

Đọc [README](../README.md) để dùng tài khoản local và cấu hình `.env` nếu cần. Dữ liệu local nằm trong `data/`, tách khỏi database public. Tài khoản người thử mới có không gian trống; code không tự tạo tour, nhân viên hoặc phản hồi khảo sát.

## 2. Tìm đúng tệp cần sửa

Các đường dẫn dưới đây tính từ thư mục gốc repo.

| Tệp / thư mục | Nhiệm vụ |
| --- | --- |
| `src/main.jsx` | Ghép ứng dụng, tổng quan, tour/công việc và điều hướng. Đăng nhập và portal đã tách riêng. |
| `src/portal-ui.jsx` | Portal, thẻ tour và chi tiết/báo giá/tư vấn; portal không hiển thị danh mục tham khảo nội bộ. |
| `src/demo-ui.jsx`, `src/demo.css` | Nạp bộ mẫu giả lập tùy chọn vào không gian trống. |
| `src/tour-media.jsx` | Ảnh minh họa có nguồn và xử lý ảnh lỗi. |
| `src/operations-ui.jsx` | Biểu mẫu Excel/CSV, đổi số khách và ghép tour B2B. |
| `src/quotes-ui.jsx`, `src/quotes.css` | Báo giá theo số khách, gửi duyệt, lịch sử và xuất bản đã duyệt. Chức năng xuất thông tin tour cũ vẫn ở `portal-ui.jsx`. |
| `shared/quotes.mjs`, `server/quotes.mjs` | Kiểm tra số tiền, trạng thái, quyền duyệt và bản chụp nội dung báo giá; ghi phiên bản/lịch sử và chống tạo trùng. |
| `src/task-templates-ui.jsx`, `src/task-templates.css` | Tạo bộ mẫu từ quy trình nhóm nhập, xem trước và thêm nhiều việc cho tour. |
| `shared/task-templates.mjs`, `server/task-templates.mjs` | Mốc hạn tương đối, kiểm tra người phụ trách và áp dụng bộ mẫu một lần theo mã tạo. |
| `src/accounts-ui.jsx` | Tài khoản, lời mời, quyền nhân viên; xuất log/lịch sử theo quyền và tự xóa tài khoản. Form khảo sát và màn Hướng dẫn trong web đã gỡ ở 0.7.2. |
| `src/styles.css`, `src/portal-filters.css`, `src/operations-polish.css`, `src/accounts.css` | Màu, khoảng cách, bố cục và cách hiển thị trên điện thoại. `experience.css` đã được xóa. |
| `src/api.mjs` | Hàm gọi HTTP của trình duyệt; tập trung xử lý lỗi và thời gian chờ. |
| `src/dates.mjs` | Hàm lấy ngày hiện tại theo giờ Việt Nam. |
| `src/tour-search.mjs` | Chuẩn hóa tìm không dấu dùng chung cho tour/việc/tư vấn và lọc ngày/tình trạng chỗ; không gọi mạng hoặc tự sửa dữ liệu. |
| `src/import-tours.mjs` | Đọc tệp nhập thành các dòng để xem trước và gửi API. |
| `src/interactions.mjs` | Gom và gửi mã thao tác nút/menu của người thử đã đồng ý. |
| `server/index.mjs` | API, đăng nhập, phân quyền, kiểm tra đầu vào và các thao tác tour/công việc/tư vấn. |
| `shared/analytics.mjs`, `server/analytics.mjs` | Kỳ báo cáo, công thức tổng hợp theo role/workspace; cùng định nghĩa cho giao diện và xuất số liệu. |
| `src/analytics-ui.jsx`, `src/analytics.css` | Dashboard lọc ngày, biểu đồ, bảng và bộ lọc báo cáo. |
| `shared/xlsx.mjs`, `src/export-file.mjs` | Xuất bảng XLSX bằng ZIP/OOXML, giữ số và ghi chữ an toàn. `fflate` đã có gián tiếp qua bộ đọc Excel, nay khai báo trực tiếp. |
| `src/print-page.jsx`, `src/print-page.css` | Bản in riêng đặt ở body; In/Lưu PDF qua trình duyệt, không truyền tài liệu sang dịch vụ khác. |
| `scripts/optimize-tour-images.py`, `src/tour-image-variants.mjs` | Tạo WebP từ ảnh đã có nguồn; danh sách 404 để không tải lại ảnh hỏng. Muốn cập nhật ảnh, sửa nguồn được nhóm duyệt rồi chạy lại script bằng Python/Pillow. |
| `shared/access.mjs` | Chính sách bộ phận và quyền xem/sửa dùng chung frontend/backend. |
| `shared/planning.mjs`, `server/planning.mjs` | Kiểm tra/công thức giả định kinh doanh; lưu kế hoạch theo workspace và phiên bản. |
| `src/workflow-ui.jsx`, `src/planning-ui.jsx` | Sơ đồ vận hành và bản nháp giá trị/gói/doanh thu nội bộ. |
| `src/sync-status.jsx`, `src/sync-state.mjs` | Trạng thái mới/cũ/offline dựa trên lần đọc thành công. |
| `server/accounts.mjs` | Token email, thành viên và vòng đời tài khoản. |
| `server/demo.mjs` | Bộ dữ liệu mẫu tùy chọn; không tạo bằng chứng người thử thật. |
| `server/operations.mjs` | Nhập tour, các bước B2B và lưu tương tác. |
| `server/feature-feedback.mjs` | Đọc/phân tích/xuất phản hồi sáu nhóm tính năng đã lưu; không còn API gửi phản hồi mới. |
| `server/db.mjs`, `server/connection.mjs` | Khởi tạo bảng local và lớp truy vấn database. |
| `server/pooling-triggers.sql` | Quy tắc giữ/hoàn chỗ và bảo vệ sổ B2B ở database. |
| `server/productivity-schema.sql` | Bảng bổ sung cho báo giá, lịch sử và bộ mẫu công việc của bản 0.8.0; không chứa dữ liệu nghiệp vụ điền sẵn. |
| `catalog/enviet-tours.json` | Danh mục nội dung tour tham khảo có nguồn; không phải tồn kho mở bán. |
| `tests/` | Kiểm tra nghiệp vụ/API, CSV, gateway và luồng trình duyệt. |
| `scripts/` | Chạy local, xuất nguồn cloud, build, sao lưu và tổng hợp CSV. |
| `cloud/schema.ts`, `cloud/drizzle/` | Cấu trúc và các lần bổ sung bảng/cột cho D1 public. |
| `cloud/pages/` | Gateway của Pages và thông tin triển khai; không chứa mật khẩu. |

Các module giao diện nhận những thành phần dùng chung như `Modal`, `Button` và `api` qua hàm `createOperationsUI` hoặc `createPortalUI`. Cách này giúp dùng cùng nút/hộp thoại mà không lặp lại chúng. `createExperienceUI` và màn khảo sát/Hướng dẫn đã gỡ, không khôi phục khi sửa chức năng khác. Khi sửa một biểu mẫu, bắt đầu từ hàm mang tên biểu mẫu đó; chưa cần tách thêm một tầng thư viện.

## 3. Một thao tác đi qua hệ thống thế nào?

Ví dụ sửa tour:

1. Người dùng mở `TourEditor` trong `src/main.jsx` và bấm Lưu.
2. Giao diện gọi `api('/tours/' + id, 'PUT', dữ_liệu)`; hàm HTTP thêm tiền tố `/api`.
3. `server/index.mjs` kiểm tra đăng nhập, workspace, dữ liệu và phiên bản hiện tại.
4. Database lưu thay đổi; API trả kết quả. Giao diện tải lại dữ liệu.
5. Portal của cùng workspace đọc cùng nguồn tour và tự động cập nhật định kỳ, khoảng 5 giây sau khi lượt tải trước hoàn tất khi tab hiển thị và có mạng.

Frontend giúp nhập dễ hơn; backend mới quyết định dữ liệu có được lưu hay không. Không bỏ kiểm tra backend chỉ vì giao diện đã có `required`, giới hạn số hoặc nút bị vô hiệu hóa.

| API chính | Cách dùng |
| --- | --- |
| `GET /api/session` | Lấy người dùng đang đăng nhập. |
| `POST /api/register`, `/api/login`, `/api/logout` | Đăng ký tự nguyện, đăng nhập, đăng xuất. |
| `GET /api/public/:workspace` | Chỉ đọc tour đã công khai trong một cổng tour. |
| `POST /api/public/:workspace/inquiries` | Gửi yêu cầu tư vấn; không tự giữ chỗ. |
| `GET /api/workspace` | Lấy tour, việc, tư vấn và B2B trong không gian của tài khoản. |
| `POST /api/tours`; `PUT`, `DELETE /api/tours/:id` | Tạo, sửa, xóa tour. |
| `POST /api/tasks`; `PUT`, `PATCH`, `DELETE /api/tasks/:id` | Tạo, sửa, đổi trạng thái, xóa công việc. |
| `GET /api/task-people` | Danh sách mã/tên tài khoản phụ trách cùng workspace; không trả email. |
| `GET`, `POST /api/task-templates`; `PUT /api/task-templates/:id` | Đọc, tạo, sửa hoặc ngừng dùng bộ mẫu. |
| `POST /api/task-templates/:id/preview`, `/apply` | Tính hạn để xem trước, rồi tạo việc có kiểm tra phiên bản và mã lần tạo. |
| `GET`, `POST /api/quotes`; `GET`, `PUT`, `PATCH /api/quotes/:id` | Danh sách/chi tiết, tạo/sửa nháp và chuyển trạng thái báo giá. |
| `GET /api/quotes/:id/export.xlsx`, `/export-data` | Xuất Excel hoặc lấy nội dung chuẩn cho PDF; API chỉ cho bản đã duyệt. |
| `POST /api/tours/import` | Kiểm tra/xem trước hoặc lưu một đợt nhập. |
| `POST /api/pooling`; `PATCH /api/pooling/:id` | Tạo phiếu và thực hiện xác nhận/ghi nhận thu/hủy. |
| `GET /api/pooling/export`, `/api/pooling/history/export` | Xuất sổ B2B/lịch sử trong workspace. |
| `POST /api/interactions` | Lưu mã thao tác của tài khoản tester đã đồng ý; không thu nội dung gõ. API gửi feedback cũ đã gỡ. |
| `GET /api/research`, `/api/export/*` | Tổng hợp và xuất nghiên cứu theo quyền quản trị/reviewer. |

`:id` và `:workspace` là giá trị thay vào URL, không phải chữ gửi nguyên. Reviewer có quyền xem/xuất, không sửa dữ liệu. Nhân viên có lời mời và quyền chỉ xem/được sửa; đối tác B2B chưa có tài khoản tự duyệt. Công việc mới có thể gắn `assignee_id`; tên nhập tay cũ vẫn được giữ để đối chiếu.

## 4. Hiểu các bảng dữ liệu

| Bảng | Lưu gì? |
| --- | --- |
| `workspaces` | Không gian dữ liệu riêng của từng tài khoản dùng thử; `agency` là không gian điều hành demo. |
| `users`, `sessions` | Tài khoản, đồng ý tham gia và phiên đăng nhập. |
| `tours` | Ngày, giá, sức chứa, khách đã giữ, nội dung và trạng thái công khai. |
| `tasks` | Công việc gắn một tour, tên phụ trách, tài khoản `assignee_id` tùy chọn, hạn, ưu tiên và trạng thái. |
| `task_templates`, `task_template_runs` | Nội dung bộ mẫu do nhóm tạo và dấu lần áp dụng để chống thêm việc trùng. |
| `quotes`, `quote_audit` | Nội dung báo giá lưu riêng, trạng thái/phiên bản và lịch sử người thực hiện cùng bản chụp từng lần ghi. |
| `inquiries` | Yêu cầu tư vấn riêng tư, gắn tour. |
| `pooling` | Phiếu B2B, khách ghép, giá net, tổng thu đã ghi nhận và trạng thái. |
| `pooling_audit` | Ai thực hiện, lúc nào, số thu/trạng thái trước và sau. |
| `events` | Log nghiệp vụ và mã thao tác của người thử. |
| `feature_feedback` | Phản hồi sáu nhóm tính năng đã lưu từ phiên bản trước; bản xuất chỉ đọc, không nhận phản hồi mới. |
| `feedback` | Phản hồi phiên bản trước; giữ riêng, không đổi sang thang điểm mới. |

Các bản ghi nghiệp vụ có workspace. API phải lọc theo workspace lấy từ **phiên đăng nhập**, không tin một workspace do người dùng gửi để đọc/sửa dữ liệu. Portal chỉ nhận các trường công khai; không đưa email tư vấn, ghi chú đối tác hoặc giá net nội bộ vào dữ liệu public.

### Vì sao có `version`?

Ví dụ hai tab cùng mở tour phiên bản 3. Tab A lưu thành phiên bản 4. Tab B vẫn gửi phiên bản 3 nên API trả `409` thay vì ghi đè thông tin mới. Giao diện giữ nháp và cho người dùng chọn **Nạp bản mới**, xem lại rồi lưu.

Khi thêm một thao tác sửa, giữ điều kiện `WHERE id=? AND workspace=? AND version=?`, tăng phiên bản sau khi thành công và kiểm tra số dòng thực sự thay đổi. Không tự lặp lại một thao tác ghi khi mất mạng vì lần trước có thể đã được lưu.

### Phiếu B2B hoạt động thế nào?

- **Chờ (`pending`)**: đã lưu thỏa thuận; chưa cộng khách vào tour.
- **Xác nhận (`confirmed`)**: kiểm tra phiên bản/sức chứa rồi cộng khách đúng một lần.
- **Ghi nhận thu**: lưu **tổng tiền lũy kế đã đối chiếu**, không phải số tiền tăng thêm; tối đa bằng số khách nhân giá net.
- **Hủy (`cancelled`)**: nếu đã ghi thu thì đối soát về 0 trước; phiếu từng xác nhận trả chỗ đúng một lần.

Các bước có batch/trigger để giữ trạng thái phiếu và số chỗ nhất quán. `pooling_audit` ghi trước/sau cùng thao tác thành công. Không tự tạo lịch sử cho bản ghi cũ, và không gọi ghi sổ là chuyển tiền hay hoàn tiền thực tế.

### Báo giá 0.8.0 khác thông tin tour thế nào?

`quotes.payload` giữ người nhận, số khách, đơn giá, giảm giá cả đoàn, hạn hiệu lực và bản chụp thông tin tour. Tổng tiền được tính lại ở server bằng số nguyên VND. Sửa tour nguồn không tự thay nội dung báo giá đã lưu; xóa tour không xóa báo giá đã chốt.

Luồng là nháp → chờ duyệt → đã duyệt hoặc cần sửa. API kiểm tra vai trò, workspace, trạng thái và phiên bản mỗi lần ghi. Chủ không gian là người quyết định cuối, có thể tự duyệt với xác nhận và lịch sử; nhân viên Quản lý không tự duyệt báo giá do mình tạo. Sửa bản đã duyệt phải mở lại nháp và duyệt lại. Chỉ bản đã duyệt được xuất; PDF lấy dữ liệu chuẩn mới từ API trước khi in, không dùng lại bản hiển thị cũ.

`request_id` ổn định trên lần tạo nháp giúp thao tác gửi lại không tạo hai báo giá. Báo giá không công khai trên portal, không giữ chỗ, không tạo giao dịch hoặc tự gửi email. Nút xuất trong chi tiết tour vẫn là thông tin tour/giá một khách, không thay thế luồng duyệt mới.

### Bộ mẫu và “Việc của tôi” hoạt động thế nào?

Mẫu chứa danh sách việc do nhóm nhập, mốc ngày so với khởi hành, ưu tiên và tài khoản phụ trách tùy chọn. API tính ngày và trả xem trước; lúc áp dụng kiểm tra lại phiên bản tour/mẫu/người phụ trách. Một batch ghi dấu `run_id` cùng toàn bộ việc, nên gửi lại cùng lần tạo không thêm việc lần nữa. Dùng lại mẫu ở lần mới sẽ thêm bộ việc mới; không cập nhật ngược việc cũ. Ngừng dùng mẫu chỉ ẩn mẫu khỏi danh sách đang dùng.

`assignee_id` liên kết việc với tài khoản trong cùng workspace; tên phụ trách vẫn lưu để đọc dữ liệu cũ. Bộ lọc **Việc của tôi** so sánh đúng ID đang đăng nhập, không đoán theo tên giống nhau. Chọn người và ghi dữ liệu đều phải kiểm tra họ còn thuộc workspace; việc chỉ nhập tên không tự gắn tài khoản. Thêm lựa chọn mẫu/báo giá ở kế hoạch gói chỉ phục vụ bản nháp nội bộ, không tạo thuê bao hoặc quyền trả phí.

## 5. Sửa ở nguồn gốc, rồi xuất sang cloud

Nguồn FE/BE chính nằm trong **repo TaskHub này**. `scripts/export-sites.mjs` chuyển/copy các tệp cần thiết vào checkout Sites đã chuẩn bị, đổi phần kết nối Node/SQLite sang Workers/D1 và giữ các kiểm tra nghiệp vụ. `npm run build:pages` tạo frontend/gateway Pages từ nguồn hiện tại.

Khi sửa, làm ở `src/`, `server/`, `catalog/` hoặc script tương ứng trong repo gốc. Không sửa riêng một bản API/giao diện đã xuất trong checkout cloud, vì lần xuất tiếp theo sẽ ghi lại tệp đó. Schema D1 và các migration nằm tại `cloud/`; thêm thay đổi tương thích, giữ nguyên migration đã phát hành và dữ liệu đang có.

Đọc [vận hành Pages](PAGES_DEPLOYMENT.md) và [backend cloud](CLOUD_HOSTING.md) trước khi phát hành. Deploy không cần máy chủ repo tiếp tục bật. Giữ `.env`, database, bản xuất có email và credential trong khu vực riêng đã bị Git bỏ qua.

## 6. Ví dụ: muốn đổi gì thì bắt đầu ở đâu?

| Muốn đổi | Bắt đầu từ |
| --- | --- |
| Màu nút, khoảng cách, bố cục điện thoại | CSS tương ứng; kiểm tra thêm 320/390 px. |
| Tên nhãn hoặc hướng dẫn một biểu mẫu | Component biểu mẫu trong `main.jsx` hoặc `operations-ui.jsx`. |
| Cách tìm/lọc tour | `tour-search.mjs` và nơi gọi trong `main.jsx`; kiểm tra tour có dấu/không dấu, ngày và chỗ. |
| Thêm trường tour | Biểu mẫu, `tourInput`/API, schema local, schema/migration D1 và xuất cloud; kiểm tra dữ liệu cũ. |
| Quy tắc giữ chỗ hoặc tiền B2B | `server/operations.mjs` và `server/pooling-triggers.sql`; chạy kiểm tra đồng thời và lịch sử. |
| Trạng thái, phép tính hoặc quyền báo giá | `shared/quotes.mjs`, `server/quotes.mjs`, `src/quotes-ui.jsx`; kiểm tra bản đã duyệt, sửa lại và dữ liệu tour đổi sau khi chốt. |
| Mốc ngày hoặc cách áp dụng bộ mẫu | `shared/task-templates.mjs`, `server/task-templates.mjs`, `src/task-templates-ui.jsx`; kiểm tra gửi lặp và người phụ trách vừa bị thu hồi. |
| Khảo sát ngoài web / CSV lịch sử | Bộ câu hỏi trong `docs/`; `server/feature-feedback.mjs` chỉ đọc/xuất dữ liệu cũ, công cụ tổng hợp tương ứng. |

Sau thay đổi, chạy các kiểm tra liên quan rồi build:

```powershell
npm test
npm run build
```

Nếu thay giao diện/luồng thao tác, chạy `npm run test:ui` trên môi trường thử theo [README](../README.md). Kiểm tra dữ liệu cũ, thao tác sai, mất mạng và xung đột phiên bản khi có liên quan. Không lấy tài khoản QA hoặc dữ liệu DEMO làm bằng chứng người dùng thật.

Code mới đưa lên `dev`, ghi rõ thay đổi và cách kiểm tra, rồi mở PR `dev → main` để chủ repo duyệt. `main` là nhánh chính, mặc định và được bảo vệ. Các con số kiểm thử/deployment nằm ở [VALIDATION.md](VALIDATION.md); bản demo hiện hành, kịch bản và việc Tuấn/Huy còn cần làm trực tiếp nằm ở [CP4_TUAN_HUY_HANDOFF.md](CP4_TUAN_HUY_HANDOFF.md). [CP3_DEMO_RELEASE.md](CP3_DEMO_RELEASE.md) giữ các mốc dự phòng cũ.
