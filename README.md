# TaskHub — CP3 MVP

Web app hỗ trợ doanh nghiệp du lịch nhỏ và vừa. Local dùng React/Vite + Node.js 24 + SQLite; web công khai dùng Sites Workers + D1 từ cùng nguồn FE/BE.

**Web:** https://taskhub-travel.pages.dev/ — hoạt động độc lập với máy chủ repo.

Danh mục tham khảo gồm 13 tour từ nguồn Én Việt do chủ dự án cung cấp. Xem [dữ liệu tour và cách đưa vào điều hành](docs/TOUR_CATALOG.md). Ngày đi, sức chứa, số khách và lịch trình từng ngày vẫn cần người quản lý xác nhận trước khi công khai một tour vận hành.

Giao diện chạy trên Cloudflare Pages; gateway dùng tiếp backend/database cloud hiện có. Xem [vận hành Pages](docs/PAGES_DEPLOYMENT.md); `npm run build:pages` tạo gói FE/gateway từ cùng nguồn. URL Sites cũ vẫn hoạt động và dùng cùng dữ liệu.

## Chạy trên máy anh

Máy hiện tại đã cài thư viện. Trong terminal ở thư mục TaskHub:

```powershell
npm run dev
```

Mở http://127.0.0.1:5173. Frontend dùng port 5173; API port 3001. Dừng bằng Ctrl+C.

- **Dùng thử TaskHub**: tạo tài khoản và không gian riêng trống. Người dùng tự nhập tour/công việc; tour mới mặc định chưa công khai. Không tự tạo giá, lịch hoặc tên nhân sự.
- **Điều hành**: bấm Đăng nhập. Tài khoản local mặc định `admin@taskhub.local`, mật khẩu `TaskHub-Local-2026!`. Mặc định chỉ bind localhost. Tài khoản này xem kết quả và tải CSV.
- Mật khẩu trên chỉ dành cho local. Khi deploy phải đặt mật khẩu riêng ít nhất 12 ký tự trong biến môi trường `ADMIN_PASSWORD`; production không có mật khẩu mặc định.
- Nếu chuyển sang máy khác: cài Node.js **24 LTS**, chạy `npm ci` trước. Không dùng Node 18/20 vì backend dùng `node:sqlite`.
- Dữ liệu nằm trong `data/taskhub.sqlite` (và tệp WAL/SHM khi chạy). `data/` và `.env` đã được bỏ khỏi Git.

## Phạm vi bản 0.2

| CP2 / CP3                         | MVP chạy được                                                                                     | Cách kiểm tra                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| P1: thông tin rời rạc             | Tour và công việc gắn chung tour; người phụ trách, hạn và trạng thái                              | Tạo việc → chuyển Đang thực hiện → Hoàn thành  |
| P2: khách cần thông tin ngoài giờ | Cổng tour công khai: ngày, giá, lịch trình, số chỗ; gửi yêu cầu tư vấn                            | Mở cổng khách hàng, xem tour và gửi yêu cầu    |
| Lịch / số chỗ dùng chung          | API điều hành và portal dùng cùng SQLite; portal đọc lại mỗi 5 giây khi tab đang hiển thị         | Sửa số khách hoặc ngày, kiểm tra portal        |
| Tránh cập nhật sai                | Kiểm tra số khách không vượt sức chứa; phiên bản tour để từ chối ghi đè bản cũ                    | Thử vượt sức chứa hoặc sửa đồng thời ở hai tab |
| CP3: người dùng thử thật          | Đăng ký tự nguyện; lịch sử thao tác; đánh giá 3 tính năng, độ dễ dùng, ý định và mức sẵn sàng trả | Tester dùng MVP rồi gửi phản hồi               |
| CP3: dữ liệu gốc                  | Quản trị xuất `taskhub-interactions.csv` và `taskhub-feedback.csv` có email                       | Phản hồi MVP → tải CSV                         |

CP2 mục 6.2 giới hạn bản đầu ở cổng tour, lịch/số chỗ và giao việc. Đối soát B2B đầy đủ, net price/markup, thanh toán, chatbot, Excel import, Google login/xác minh email và gửi email tự động **chưa được xây**. Người phụ trách là tên nhập trong demo, chưa có tài khoản nhân viên riêng hoặc thông báo đến người đó. Chưa có reset mật khẩu. Đây là các giới hạn cần nói rõ khi demo.

Yêu cầu tư vấn không giữ chỗ hoặc xác nhận booking; chưa có tiền giao dịch thật. Tour, giá, lịch và người phụ trách phải do người quản lý nhập; bản cài mới không tự tạo dữ liệu kinh doanh. Giá SaaS chưa chốt; 500.000 VND/tháng trong CP2 là giả định, không dùng làm kết quả khảo sát. MVP thu mức sẵn sàng trả đơn giản, **không** triển khai mô hình Van Westendorp.

## Kịch bản demo khoảng 5 phút

1. Đăng nhập / tạo không gian dùng thử. Chỉ ba mục: quản lý tour, công việc và cổng khách hàng.
2. Tạo tour bằng thông tin tự nhập, kiểm tra và chọn công khai. Mở lại tour để đổi ngày hoặc số khách giữ chỗ rồi lưu.
3. Mở cổng khách hàng: đối chiếu số chỗ, ngày và giá với thông tin vừa cập nhật. Xem lịch trình.
4. Gửi yêu cầu tư vấn bằng **email giả**; về điều hành xem yêu cầu mới. Giải thích chưa xác nhận booking.
5. Tạo việc “Chốt danh sách khách”, chỉ định người phụ trách và hạn. Chuyển sang hoàn thành.
6. Tester vào Phản hồi MVP để gửi đánh giá. Quản trị xem / tải dữ liệu gốc.

## Thử với ít nhất 20 người

CP3 Requirements mục 2.1 yêu cầu ít nhất **20 cá nhân**, xem/dùng MVP rồi đánh giá tính năng. Mời >20 người theo lịch nhóm để dự phòng. Gửi **link gốc của web** (nút Dùng thử TaskHub), không gửi link `/portal/<id>` riêng của người khác.

- Mỗi người tự tạo tài khoản bằng email và đồng ý thông báo dữ liệu. Email do người dùng nhập, **chưa xác minh**; không suy luận số email = số người độc lập.
- Yêu cầu sửa tour, xem portal, tạo/đổi trạng thái việc rồi đánh giá. Tải lại tự động không ghi nhận thêm lượt xem.
- `interactions.csv`: email, vai trò, quy mô, consent timestamp/version, action, entity và thời gian UTC. `feedback.csv`: cùng thông tin đối chiếu và điểm từng tính năng, ý định, mức trả, câu trả lời mở.
- Admin/reviewer xem tài khoản, phản hồi và số phản hồi có đủ thao tác thử trước khi gửi (sửa tour, mở portal, tạo việc, đổi trạng thái). Nhóm vẫn phải đối chiếu người thử thật; bộ đếm không xác minh danh tính, thứ tự thử hoặc mức hiểu tính năng. Không tính dữ liệu tự động/QA vào khảo sát.
- Không tự quyết định Iterate/Persevere hoặc giá khi chưa có dữ liệu thật. Phần slide, BMC và phân tích giá thuộc phân công riêng; repo chỉ cung cấp dữ liệu phục vụ các phần đó.

Hướng dẫn thực hiện: [khảo sát và dữ liệu CP3](docs/CP3_TESTING_GUIDE.md). Sau khi quản trị/reviewer tải hai CSV, chạy:

```powershell
npm run research:report -- work/research/input/taskhub-feedback.csv work/research/input/taskhub-interactions.csv work/research/report
```

Tool tạo `summary.md` và `summary.json` chỉ có thống kê tổng hợp, kiểm tra dữ liệu và đối chiếu thao tác trước phản hồi; không sửa bản gốc, xuất email, tự chọn giá hoặc kết luận sản phẩm. `work/` không được commit. Báo cáo rỗng ghi rõ chưa có dữ liệu; 20 email không được coi là 20 cá nhân đã xác minh.

Tài liệu trình diễn và giải thích kỹ thuật: [bàn giao FE/BE](docs/CP3_FE_BE_HANDOFF.md). Trạng thái còn thiếu được cập nhật ở [đối chiếu CP3](docs/CP3_READINESS.md).

## Bảo vệ / lưu dữ liệu

Cookie phiên đăng nhập HttpOnly/SameSite; production dùng Secure. Mật khẩu người thử được salt/hash bằng scrypt. SQL dùng prepared statements. API điều hành giới hạn theo workspace; export chỉ cho quản trị và reviewer được cấp quyền. Public portal chỉ đọc tour đã công khai và không trả email/khách hàng/công việc. Có kiểm tra origin và header riêng cho thao tác thay đổi, giới hạn tần suất đăng ký/đăng nhập/gửi yêu cầu.

Thông báo đồng ý xuất hiện trước khi đăng ký; consent v1 được ghi cùng thời gian. Người thử xóa tài khoản và dữ liệu tại Hướng dẫn & hỗ trợ. Dữ liệu khảo sát/yêu cầu tư vấn quá **180 ngày** được xóa khi server khởi động và mỗi 12 giờ server chạy. `npm run data:purge` có thể chạy thủ công. Nhóm cần xóa riêng CSV, bản backup và bản đã chia sẻ; chức năng này không thể xóa bản ngoài hệ thống. Không tuyên bố quy trình đã được kiểm toán tuân thủ pháp luật.

## Kiểm tra và build

```powershell
npm test
npm run build
npm start
```

`npm start` phục vụ cả FE build và API tại http://127.0.0.1:3001. Không cần Vite trên production. Test tích hợp dùng SQLite tạm, kiểm tra consent, phân tách tenant, sync, sức chứa, ghi đồng thời, task, inquiry, CSV, lưu sau restart và xóa dữ liệu. Test không nhập email hoặc dữ liệu CP2 thật.

Kiểm thử UI: để `npm run dev` đang chạy trong terminal thứ nhất, chạy `npm run test:ui` trong terminal thứ hai. Windows dùng Edge chạy ẩn; hệ điều hành khác cần `npx playwright install chromium`. Có thể đặt `PLAYWRIGHT_CHANNEL` hoặc `TEST_URL` nếu dùng môi trường khác. Script tạo tài khoản/email giả, thử tour → portal → inquiry → task → feedback, kiểm tra màn hình 320/390/768/1440px, phục hồi kết nối và tìm kiếm, rồi xóa tài khoản test. Ảnh QA lưu trong `work/`. Không chạy với dữ liệu sản xuất.

Giao diện ngày 14/10 dùng nền xanh dương nhạt, nút xanh đậm, chữ slate và điểm nhấn mint/lavender. Tổng quan có lộ trình thử 3 bước. Khi mạng lỗi, web phân biệt dữ liệu chưa tải được với tìm kiếm không có kết quả, và cho phép tải lại. Menu mobile có lớp nền, nút đóng, Escape và trạng thái truy cập bằng bàn phím.

Xem [bảng đối chiếu CP3](docs/CP3_READINESS.md) cho phần đã xây, giới hạn và bằng chứng còn cần thu.

## Deploy

**Web cloud đã hoạt động:** https://taskhub-travel.pages.dev/ — FE chạy trên Pages, API đi qua gateway có chữ ký tới Sites Workers và dữ liệu lưu ở D1; máy chủ repo tắt vẫn truy cập được. Xem [vận hành Pages](docs/PAGES_DEPLOYMENT.md) và [backend cloud](docs/CLOUD_HOSTING.md); không dùng link Quick Tunnel cũ để thu khảo sát.

Phương án hosting thay thế đã chuẩn bị: **Render Free + Turso Free**, xem [hướng dẫn deploy](docs/DEPLOYMENT.md). Chưa triển khai phương án này; không cần tạo Render/Turso để dùng URL cloud hiện tại.

Cũng có Dockerfile/Compose cho VPS hoặc hosting có persistent disk, dùng một instance Node + SQLite volume. Các bước dưới đây chỉ áp dụng khi tự host với ổ đĩa bền vững:

1. Copy `.env.example` thành `.env`, đặt `ADMIN_EMAIL` và mật khẩu mạnh riêng trong `ADMIN_PASSWORD`. Không commit `.env`.
2. Máy có Docker: `docker compose up -d --build`. App ở `127.0.0.1:3001`; dữ liệu trong named volume `taskhub_data`.
3. Đặt reverse proxy HTTPS phía trước app, giữ nguyên Host/origin. Khi `NODE_ENV=production`, cookie Secure cần trình duyệt truy cập qua HTTPS để đăng nhập. Compose không tự cấu hình domain/chứng chỉ.
4. Với platform deploy trực tiếp Node: Build `npm ci && npm run build`, Start `npm start`; đặt `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT` do platform cấp, `DATA_DIR` tới persistent disk và admin credentials. Chỉ chạy **một instance** với SQLite này.
5. Kiểm tra `/api/health`, đăng ký thử, sửa tour, refresh portal và restart service để xác minh disk giữ dữ liệu. Xóa tài khoản QA trước khi mời tester.

Dockerfile là phương án tự host đã chuẩn bị; Docker daemon chưa chạy nên chưa xác nhận build container. Web cloud hiện tại dùng Workers/D1 và đã được triển khai thực tế.

Sao lưu SQLite đang chạy bằng `node --env-file-if-exists=.env scripts/backup.mjs` (dùng SQLite backup API, không copy mỗi tệp `.sqlite` khi WAL đang hoạt động). Bản backup chứa dữ liệu cá nhân; nhóm giữ riêng và quản lý thời hạn. Để restore: dừng app, xác minh thư mục dữ liệu, sao lưu hiện trạng, thay DB bằng bản backup bằng thao tác file có chủ đích; không xóa volume để restart/deploy.
