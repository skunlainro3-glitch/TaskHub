# Kiểm chứng TaskHub

## Cách gọi cập nhật định kỳ — 05/11/2026

Chỉ sửa nhãn trạng thái, tooltip và phần giải thích Quy trình vận hành sang **tự động cập nhật định kỳ**; làm rõ mô tả trong CODE_GUIDE/CONTENT_REVIEW. Không đổi scheduler, API, database, chu kỳ tải hoặc cảnh báo mất mạng/dữ liệu cũ; không sửa các trích dẫn lịch sử CP2. Bốn bài polling và build Pages đạt. Các tag demo đã phát hành giữ nguyên; lần chỉnh câu chữ này được ghi theo commit trên `build` và metadata deployment hiện hành.

Đã phát hành runtime `44e6189`, Sites version 24 và Pages `e6ce4932-75be-44b3-9e39-1356ce3d415f`. Build Sites đạt. Kiểm tra public chỉ đọc xác nhận nhãn/tooltip và phần Quy trình mới, không tràn ngang 320/390/1440px, không lỗi JavaScript hay ghi nghiệp vụ. Không tạo tài khoản/dữ liệu QA cho lần sửa này; page-view của admin không lưu vào log nghiên cứu. Giữ nguyên `dev`, audience public, environment revision 2 và D1/migrations.

## Bản ổn định 0.7.3 — 04/11/2026

- **Bản chốt hiện hành:** runtime `a90491c18a2709857ea97c24436547b7b5a61c17`, tag `cp4-demo-v0.7.3-final` gồm code và tài liệu phát hành. Chỉnh thêm khoảng cách ghi công ảnh để không đè lên mép ảnh; đã xem lại ảnh chụp mobile và chạy lại delivery UI trên public đạt. [CI 41861017750](https://github.com/skunlainro3-glitch/TaskHub/actions/runs/41861017750) đạt đúng runtime cuối. Sites version **23**, source `aec62087c8bb0366f91460a5c9885b10757eb19e`, deployment `appgdep_6aeb53be73d88191bd9b7558957211ba`; Pages `525ce1ae-f6ea-436b-8682-2d326f9f6a2b`. Không đổi API/schema sau bản đầu dưới đây. Đối chiếu checksum nghiệp vụ sau bản chốt vẫn đạt; env/audience/D1 giữ nguyên.
- Đối chiếu lại CP4, rubric, Timeline hiện tại và mã nguồn trước khi sửa. Tính năng MVP, cải thiện tùy chọn và phần cần bằng chứng ngoài web được tách tại [bàn giao demo](CP4_DEMO_0_7_3.md). Chưa xác nhận toàn bộ CP4 hoặc chấp thuận Path 2.
- Sửa tràn ngang Quản lý tour ở 320px: hàng nút tự xuống dòng, thao tác nhanh có chỗ cho nút **Sửa tour**. Bấm tên/ảnh mở chi tiết và báo giá; sửa là thao tác riêng. Rà cả danh sách, chi tiết và editor ở 320/390/768/1440px.
- Tư vấn dùng phiên bản: kiểm tra trước và trong UPDATE, từ chối bản cũ/cạnh tranh/trạng thái quay lại giá trị cũ bằng 409; UI tải lại và yêu cầu người dùng kiểm tra, không tự gửi lại thay đổi. Migration `0005_inquiry_version.sql` chỉ thêm `version INTEGER NOT NULL DEFAULT 1`. Kiểm tra nâng cấp D1/SQLite giữ nguyên các trường nghiệp vụ, khóa ngoại và mở lại an toàn; lịch sử migration cũ không đổi.
- Portal không còn danh mục 13 tour tham khảo, bộ lọc/số đếm/ghi chú của danh mục hoặc dữ liệu catalog trong public response. Điều hành tải `/api/catalog` một lần khi mở và dùng lại trong phiên. Workspace chỉ truy vấn các mảng role được đọc. Mẫu JSON tách riêng phần catalog giảm 9.377 byte/lần đọc; đây là giảm payload, không phải số đo 4G hay SLA.
- Tìm kiếm công việc/tư vấn dùng chuẩn hóa tiếng Việt không dấu. Nút Excel công nợ ghi rõ toàn bộ; PDF ghi rõ theo bộ lọc. Chức năng khảo sát/hướng dẫn/AI/xác minh email/đo bài thử đã gỡ không được đưa lại.
- `npm test`: **104/104** đạt trên SQLite và **104/104** với libSQL. Build Vite và Pages đạt. Schema D1 qua `npm run db:generate` khớp migration đã kiểm tra, không phát sinh thay đổi thêm.
- Bảy browser suites đạt trên build local: `ui`, `v05-ui`, `cp4-ui`, `cp4-delivery-ui`, `ux051-ui`, `performance-ui`, `stability-ui`. Kiểm tra tour/task/tư vấn/B2B/import, phân quyền/CSV/log tester, mạng chậm/offline/lỗi xuất, tải XLSX thật và bản in PDF. Bài mới xác nhận tư vấn stale409 không tự retry, tìm không dấu và catalog chỉ tải một lần. Tài khoản QA tách riêng và xóa sau thử; không tính là tester thật.
- Runtime commit **`98612cd41c668c73b23096973ee0fb1edcd2976a`**. Tag **`cp4-demo-v0.7.3`** khóa code này cùng tài liệu/metadata phát hành bổ sung, không thay đổi hành vi runtime. [CI 41859585837](https://github.com/skunlainro3-glitch/TaskHub/actions/runs/41859585837) đạt trên đúng runtime commit: unit, libSQL, builds và bảy browser suites. `build` đã đẩy GitHub; `dev` giữ nguyên `f08af8a` để chủ repo duyệt. Nhãn production branch `dev` của Pages không phải thao tác merge Git.
- Sites version **22** triển khai thành công, cloud source `4896d0f4886d9b0967da65b32bb96fd94d8cac2e`, deployment `appgdep_6aeb513c386c8191911db15592aaaac6`; Pages deployment **`b1ef68bd-c4f1-4d77-ab77-ea76afbed922`** dùng runtime trên. Audience public, D1 binding và environment revision 2 giữ nguyên. `/api/health` trả 200/version **0.7.3**.
- Kiểm tra production sau phát hành: `cloud-api`, `stability-ui`, `cp4-delivery-ui` đạt. Bao gồm migration/phiên bản trên D1 thật, quyền reviewer/CSV cũ/log tester, XLSX tải thật, báo cáo/bản in, lỗi API, tìm không dấu, catalog nội bộ và tour list/details/editor responsive. Lượt gọi cloud-api đầu thiếu biến môi trường đăng nhập QA dừng tại validation400; chạy lại với cấu hình đã có đạt, không có lỗi sản phẩm cần sửa. Tài khoản QA đều xóa sau thử.
- Checksum trước/sau giống nhau cho các trường nghiệp vụ gốc: **3 tour, 3 việc, 3 phiếu B2B, 2 yêu cầu tư vấn, 7 lịch sử B2B**. Chỉ loại cột metadata `inquiries.version` mới thêm khỏi so sánh; mọi trường cũ vẫn được so sánh. Đây không phải bản sao lưu đầy đủ database. Không công khai raw records/credentials.
- Bản demo/local dự phòng và các phần cần người thật/quyết định của nhóm nằm tại [CP4_DEMO_0_7_3](CP4_DEMO_0_7_3.md). Các mục phía dưới là lịch sử theo phiên bản, không dùng chỉ dẫn UI cũ làm hướng dẫn hiện hành.

## Rút gọn giao diện 0.7.2 — 29/10/2026

- Theo các ảnh/yêu cầu của chủ dự án: gỡ menu/form Phản hồi MVP và câu hỏi mức phí; banner workspace dài, thẻ không gian dùng thử, hero minh họa Tổng quan, badge Chưa giữ chỗ tự động; màn Hướng dẫn; dòng DÀNH CHO KHÁCH HÀNG; liên kết góp ý GitHub và Nguồn ảnh ở chân trang. Mã component/CSS không còn dùng được gỡ, không chỉ ẩn bằng CSS. Ghi công/giấy phép ảnh trong chi tiết ảnh vẫn giữ.
- CP3 yêu cầu khảo sát và raw interactions, không bắt buộc khảo sát/hướng dẫn nằm trong sản phẩm. Khảo sát mới dùng công cụ ngoài web do nhóm chọn; đợt này không tạo Form/Sheet/link mới hoặc giả định đã đủ người thử. Log có đồng ý, bảo vệ workspace/role và cảnh báo offline/dữ liệu cũ được giữ. Xuất log/khảo sát lịch sử theo quyền và tự xóa tài khoản chuyển về Tài khoản & nhóm.
- `/api/feedback` và `/api/feedback/features` trả 404 cho mọi role; bỏ hàm ghi và validator chỉ phục vụ form. Workspace không còn truy vấn/trả feedback/featureFeedback/completedActions. Bảng và dữ liệu cũ không bị xóa; API/CSV đọc lịch sử vẫn được phân quyền. Không đổi schema/migration hoặc nhập dữ liệu khảo sát vào web.
- Sửa form mời nhân viên: chuyển mô tả vai trò xuống dưới hàng nhập, thống nhất chiều cao input/select/nút; 4 cột desktop, 2 cột tablet, 1 cột mobile. Có assertion tọa độ cho ba ô/nút và kiểm tra không tràn 320/390/768/1440 px. Tên, quyền và API mời nhân viên giữ nguyên.
- `npm test`: **101/101** đạt trên SQLite và libSQL. Full UI, v05, CP4, CP4 delivery, UX051 và performance browser suites đạt local sau điều chỉnh locator reviewer theo nhãn chỉ xem đang có. Bao gồm xác nhận UI đã gỡ, raw click logs còn ghi, reviewer đọc export ở Tài khoản, staff tự xóa giữ nghiệp vụ chung, các luồng tour/task/B2B/import/Excel/PDF và mạng chậm/xung đột. Dữ liệu QA riêng đã xóa.
- Vite/Pages và Sites Vinext build thành công, không warning cú pháp CSS. Kết quả public/CI và mã triển khai được ghi tiếp sau phát hành.
- Đã phát hành Sites version 21 (`appgdep_6ae2a39385648191840519e570272958`, source cloud `f9fb044`) và Pages production `af73f3dd-6898-4b57-a5d0-3a2a09b9dc14`, source runtime `324a915`. Health public trả 200/version **0.7.2**. [CI runtime 40801499986](https://github.com/skunlainro3-glitch/TaskHub/actions/runs/40801499986) hoàn tất thành công cho đúng commit này.
- Cloud API, full UI và CP4 role/layout suites đã đạt trên **https://taskhub-travel.pages.dev**. Đã kiểm việc form/menu bị gỡ, log còn ghi, quyền xuất lịch sử, căn hàng lời mời, mobile, nhập XLSX và các luồng nghiệp vụ; QA riêng được xóa. Không lỗi JavaScript hoặc tràn ngang trong các màn hình đã thử.
- Checksum dữ liệu nghiệp vụ trước/sau giống nhau: **3 tour, 3 công việc, 3 phiếu B2B, 2 yêu cầu tư vấn, 7 lịch sử B2B**. Bảng khảo sát cũ không bị xóa. Không đổi schema/migration/D1/secrets hoặc audience; code mới trên `build`, `dev` giữ nguyên.

## Rà cuối 0.7.1 — 28/10/2026

- Đối chiếu lại Timeline Tuấn/Huy, CP4 requirements/rubric và chức năng thực tế. Không phát hiện thêm tính năng MVP bắt buộc còn thiếu trong phạm vi FE/BE. Không đánh dấu tập demo/ghép slide/freeze tương lai, người thử thật, giá/gói hay Path 2 đã hoàn tất. Bàn giao cập nhật ở [CP4_TUAN_HUY_HANDOFF](CP4_TUAN_HUY_HANDOFF.md).
- Sửa PATCH trạng thái công việc bắt buộc phiên bản: thiếu trả 400, bản cũ trả 409, không ghi đè. CSV công nợ để trống số còn phải thu của phiếu chờ/hủy, thống nhất XLSX/dashboard. Server local trả MIME ảnh JPEG/WebP/ICO chuẩn. `npm test` **101/101** đạt trên SQLite và libSQL; tests kiểm tra cả thiếu/stale version và công nợ ngoài trạng thái xác nhận.
- Sửa báo cáo để bấm Xem báo cáo cùng kỳ vẫn tải lại sau lỗi; lượt đọc lỗi kích hoạt backoff; phân biệt lỗi kỳ nhập, tải số liệu và xuất tệp. Excel dashboard/B2B được tải bằng fetch có kiểm status/MIME và timeout, báo lỗi tại trang thay vì điều hướng app sang JSON.
- Sửa ngày Tổng quan/lịch sử B2B theo giờ Việt Nam, tìm tour nội bộ/danh mục không dấu, vòng Tab/Shift+Tab menu mobile, nhãn quyền tài khoản cập nhật theo polling và nút đóng khi form đang gửi. Giảm slogan, rút gọn nhãn dữ liệu giả lập; gom định nghĩa báo cáo vào mục mở rộng. Không thêm giá/liên hệ/ảnh nguồn hoặc tuyên bố người dùng thật.
- Toàn bộ browser suites `ui`, `v05-ui`, `cp4-ui`, `cp4-delivery-ui`, `ux051-ui`, `performance-ui` đạt local. Delivery QA bổ sung lỗi tải báo cáo rồi retry cùng kỳ, Excel 401/403 vẫn giữ app và tải lại thành công, tìm `da nang`, vòng bàn phím menu mobile. Có kiểm tra responsive 320/390/768/1440 px, các luồng mất mạng/đọc chậm/xung đột, role và các tệp Excel/PDF; không lỗi JavaScript trong những luồng đã chạy. Các dữ liệu/tài khoản QA riêng được xóa, không tính thành khảo sát thật.
- Build Vite/Pages và backend Sites Vinext đạt. Không thay schema/migration hoặc bí mật triển khai. Kết quả public, CI và mã triển khai được ghi tiếp sau phát hành.
- Đã phát hành Sites version 20, deployment `appgdep_6ae10aaa556c81919777c003dfb77b37`, source cloud `6777326`; Pages `973a6009-5e64-4b29-8238-433ba50b57f4`, source runtime `63f557a`. `/api/health` public trả 200/version **0.7.1**. [CI runtime 40578958813](https://github.com/skunlainro3-glitch/TaskHub/actions/runs/40578958813) hoàn tất thành công cho đúng commit này. Code trên `build`; tag `cp4-demo-v0.7.1` là mốc mới, `dev` và các tag cũ giữ nguyên.
- Sau phát hành, **cloud API**, **full UI**, **CP4 role/workflow/draft** và **CP4 delivery** đều đạt trên link public. Gồm nhập XLSX thật thành nháp, tư vấn, task CRUD/status, B2B giữ/hoàn chỗ/thu/lịch sử, feedback/log, reviewer chỉ xem, đổi quyền đang đăng nhập, mạng chậm, xung đột, tải Excel/PDF và lỗi tải tệp được hiển thị trong app. Không lỗi JavaScript hoặc tràn ngang trong các màn hình đã chạy; dữ liệu QA riêng được xóa.
- Checksum trước/sau triển khai giống nhau cho dữ liệu nhóm: **3 tour, 3 công việc, 3 phiếu B2B, 2 yêu cầu tư vấn và 7 lịch sử B2B**. Nhãn giả lập còn trên portal, báo cáo và bản in; dữ liệu khảo sát đính kèm không được nhập thành log hay khách hàng thật.

## Bổ sung 0.7.0 — 28/10/2026

- Đọc bảng CP4_Timeline_TaskHub bằng quyền người dùng đã xác nhận, xuất bản chỉ đọc để đối chiếu Timeline/Phân công; không sửa Google Sheet. Đọc CP4 requirements/rubric, BMC/PPTX mẫu và hai file khảo sát. [Bàn giao Tuấn/Huy](CP4_TUAN_HUY_HANDOFF.md) ghi đúng từng STT, phần MVP cho slide, kịch bản 6 phút và thông tin nhóm còn cần cung cấp.
- `npm test`: **101/101** đạt trên SQLite và libSQL. Thêm kiểm tra ngày/kỳ báo cáo, tỷ lệ lấp đầy có trọng số, phiếu chờ/hủy không cộng tổng tiền, role/workspace và dữ liệu cá nhân, tệp XLSX thật có số/tiếng Việt/chữ không thực thi công thức và giới hạn 5.000 dòng. API xuất sổ B2B chặn Sales; báo cáo không nạp liên hệ tư vấn vào thống kê.
- Browser QA mới `tests/cp4-delivery-ui.mjs` đạt local và **https://taskhub-travel.pages.dev**: lọc báo cáo, tải rồi đọc lại XLSX báo cáo/công nợ/báo giá, thao tác In/Lưu PDF, ảnh responsive, bố cục 320/390/768/1440 px, không lỗi JavaScript trong các luồng đã thử. Bản in lịch trình dài 70 bước tạo PDF 3 trang, đã đọc lại trang cuối và rà ảnh; trang in nền trắng, không bị giới hạn bởi chiều cao modal. PDF dùng hộp thoại in của trình duyệt, chưa có dịch vụ tạo PDF phía máy chủ.
- Lượt QA public đầu vướng bài kiểm tra bấm menu khi ứng dụng chưa tải xong. Đã thêm chờ tiêu đề Tổng quan rồi chạy lại toàn bộ bài delivery trên public thành công. Workspace/tài khoản QA đã xóa; dữ liệu tự động không được tính thành khảo sát thật.
- Các bài hồi quy UI/CP4/UX/mạng chậm đạt local. [GitHub Actions runtime 40573003769](https://github.com/skunlainro3-glitch/TaskHub/actions/runs/40573003769) đạt unit/libSQL/build/Pages và các bài browser cho commit `0f919a5`. Vite/Pages và Sites Vinext build thành công; gắn tag `cp4-demo-v0.7.0` tại commit runtime này. `dev` không đổi.
- 3 ảnh JPEG đã có nguồn được chuyển thành WebP 480/960 px; tổng bản 960 px là 196.398 byte so với 377.422 byte JPEG gốc (giảm khoảng 48%). Đây là kích thước tệp, không phải kết quả đo độ trễ 4G. 13 URL ảnh Én Việt đang trả 404 được nhận diện để dùng minh họa có nhãn; chưa có ảnh nguồn thay thế được nhóm duyệt. Nguồn nội dung tour vẫn giữ nguyên.
- Backend Sites phiên bản 19, deployment `appgdep_6ae10170710c8191b5aa28ea8ef92001`, source cloud `fe6cb82`; Pages production `0f08d645-0f75-420b-9091-1694b7a94763`, source runtime `0f919a5`. Giữ D1/secrets/migration qua 0004, không thêm schema hoặc đặt lại dữ liệu. Chi tiết ở `cloud/site.json` và `cloud/pages/deployment.json`.
- `/api/health` public trả 200/version **0.7.0**. Checksum dữ liệu nghiệp vụ trước/sau giống nhau: 3 tour, 3 công việc, 3 phiếu B2B, 2 yêu cầu tư vấn, 7 lịch sử B2B. Báo cáo không gian nhóm có nhãn giả lập. Không đưa phản hồi khảo sát/email nguồn vào dữ liệu public hoặc log web.
- Chưa xác nhận Path 2/pre-approval, tính độc quyền/IP, SLA mạng, giá/gói hay người thử thật từ QA. Mốc freeze 30/10 và 03/11 vẫn là mốc tương lai cần nhóm thực hiện, không tự đánh dấu hoàn tất. Không gửi giảng viên hoặc sửa phần việc kinh doanh của thành viên khác.

## Bổ sung 0.6.0 — 27/10/2026

- `npm test`: **95/95** đạt; cùng bộ kiểm tra đạt với driver libSQL. Bổ sung kiểm tra phân vai/API trái quyền, ẩn dữ liệu/CSV theo bộ phận, kế hoạch theo workspace, lưu cạnh tranh trả 409, số 0/ô trống/kết quả âm và ngưỡng dữ liệu cũ.
- `tests/cp4-ui.mjs` đạt trên Node local, preview Workers/D1 và **https://taskhub-travel.pages.dev**: workflow 5 bước; phân vai/đổi quyền khi đang đăng nhập; bảng tính/lưu/xung đột và giữ bản nhập; cảnh báo bỏ bản nháp; mất mạng/phục hồi. Rà bố cục 320/390/768/1440 px, không tràn ngang hoặc lỗi JavaScript trong các luồng đã chạy. Bài QA chờ dữ liệu/response trước khi kiểm tra, không giả định mạng public nhanh như local.
- Các bài hồi quy `v05-ui`, `ux051-ui`, `performance-ui` đạt local; GitHub Actions [run 40474237999](https://github.com/skunlainro3-glitch/TaskHub/actions/runs/40474237999) đạt unit/libSQL/build/Pages và toàn bộ các luồng browser, gồm CP4, cho commit runtime `d3bcba1`.
- Build Vite/Pages và Sites Vinext thành công. Backend Sites phiên bản 18 triển khai thành công; migration 0004 chỉ thêm cột/bảng. Pages deployment `ce4bd834-0c29-4f86-a4f4-8a9e55926dbb` trỏ source `d3bcba1`. Thông tin đầy đủ ở `cloud/site.json` và `cloud/pages/deployment.json`.
- `/api/health` public trả 200/version 0.6.0. Checksum trước/sau giống nhau cho workspace trình diễn: 3 tour, 3 công việc, 3 phiếu B2B, 2 yêu cầu tư vấn, 7 bản ghi lịch sử B2B. Kế hoạch mới có version 0 và chưa có giả định giá/doanh thu.
- Các tài khoản/workspace QA bị xóa. Không dùng kết quả tự động làm bằng chứng người thử thật, kết quả thị trường, SLA hoặc chấp thuận Path 2. Xem [phạm vi và thông tin còn thiếu](CP4_MENTOR_REVIEW.md).

Các mục phía dưới là lịch sử kiểm tra theo thời điểm, không phải trạng thái phát hành hiện tại.

- `npm run build`: thành công, tạo FE production.
- `npm test`: 13/13 test pass (12 trường hợp con và test tổng). Cùng bộ test đạt trên SQLite local và driver libSQL với database file; chưa thay thế kiểm tra database Turso thật.
- `npm run test:ui`: pass trên Edge chạy ẩn, kiểm tra portal/workspace ở 320/390/768/1440 px; ảnh desktop 1440×1050, mobile 390×844. Các luồng: tìm kiếm/xóa bộ lọc → mất mạng/tải lại → đăng ký/đồng ý → sửa số chỗ → kiểm tra portal → gửi/nhận yêu cầu tư vấn → tạo việc/chuyển hoàn thành → phản hồi. Menu mobile đóng bằng Escape. Không có lỗi JavaScript hoặc tràn ngang trong các màn hình kiểm tra.
- API đã xác minh: tách workspace; public response không chứa email/công việc; chống vượt sức chứa và ghi đè phiên bản cũ; phản hồi lưu một bản mỗi tài khoản; CSV có phân quyền; logout; persistence sau restart; xóa tài khoản; xóa dữ liệu quá 180 ngày. Reviewer không sửa/xóa được dữ liệu và không tính vào số người khảo sát.
- `npm run data:backup`: tạo được SQLite backup bằng backup API.
- Dữ liệu QA đã xóa. Sau kiểm thử: **0 tài khoản tester, 0 feedback, 0 interaction event** trong database local. Tour/công việc mẫu còn lại phục vụ demo và không được tính là khảo sát thật.
- Ảnh QA trong `work/`; không phải bằng chứng người dùng thật.
- Đã kiểm tra 20 lượt đọc workspace đồng thời, phân tách đúng từng tài khoản; hai lượt đăng ký trùng đồng thời chỉ tạo một tài khoản và trả 409 cho lượt còn lại. Đây là request tự động, không phải 20 người khảo sát thật, và chưa đo tải/độ trễ trên hosting.
- UI đã thử phản hồi mạng chậm hơn chu kỳ 5 giây: không chồng thêm lượt tải nền. Yêu cầu API quá 20 giây được báo chậm; không tự gửi lại thao tác ghi. Truy vấn cloud ngoài transaction được xử lý song song; database file vẫn dùng hàng đợi để giữ transaction an toàn.
- Có Dockerfile/Compose, nhưng Docker daemon trên máy hiện chưa chạy nên **chưa build hoặc chạy container**.
- **Chưa deploy công khai**. Đã chuẩn bị Render Free + Turso Free, CI và hướng dẫn deploy. Chờ chủ tài khoản đăng nhập/cấu hình hai dịch vụ; cần kiểm tra Turso thật, HTTPS và redeploy giữ dữ liệu trước khi phát link khảo sát.
- Đợt chỉnh giao diện 14/10: bảng màu xanh dương nhạt, độ tương phản chữ rõ hơn, hướng dẫn dùng thử ngay tổng quan, trạng thái tải lại/mất kết nối và empty search riêng. Đã rà ảnh portal, dashboard, tasks, feedback và reviewer trên desktop/mobile.
- API nghiên cứu đã kiểm tra: phản hồi chưa có đủ 4 thao tác không được tính vào bộ đếm đối chiếu; thao tác xảy ra sau phản hồi không làm đủ điều kiện cho phản hồi cũ; gửi cập nhật phản hồi sau khi thử thì được tính. Bộ đếm này không xác nhận cá nhân độc lập.
- GitHub Actions: run cũ `38436404455` lỗi billing trên tài khoản cũ. Run mới `38620884849` đã thành công trên tài khoản mới, đúng commit `22f3f24`; PR #1 đã được chủ repo duyệt và merge ngày 15/10 thành `811004d`. Hai nhánh dev/build được đồng bộ.

## Cloud — 15/10/2026

- Web chính: https://taskhub-travel.pages.dev/; Pages gateway nối tới backend Sites tại https://taskhub.ninaninohihi.chatgpt.site và cùng D1, độc lập với máy chủ repo. Không import dữ liệu cá nhân local/CP2.
- D1 API local và cloud đều đạt suite `tests/cloud-api.mjs`, gồm atomic signup, optimistic concurrency, tenant isolation, chính xác interaction logs, feedback upsert/đủ thao tác, CSV có quyền/an toàn công thức và reviewer chỉ xem.
- UI qua URL cloud đạt các luồng và màn hình trong suite hiện có. Sau redeploy, phiên/công việc/phản hồi QA vẫn còn. QA đã xóa; trước bàn giao có 0 tester, 0 feedback, 0 event. Các test này không chứng minh 20 người thử thật.

## Rà nội dung — 15/10/2026

- Bản này bỏ seed tour/công việc và tên nhân sự tự điền; tour mới mặc định chưa công khai. Form đăng ký yêu cầu người dùng chọn vai trò/quy mô.
- 22/22 kiểm tra API và gateway đạt trên SQLite và driver libSQL. Có kiểm tra không gian mới trống, quyền sở hữu/phiên bản khi xóa tour và dữ liệu phụ thuộc.
- UI local đạt tạo tour bằng thông tin tự nhập, cập nhật/tra cứu, tư vấn, công việc, phản hồi, xác nhận/hủy xóa tour; responsive 320/390/768/1440 px, phục hồi lỗi mạng, tải chậm và quyền reviewer.
- Đây là QA tự động, không phải phản hồi khảo sát người thật. Xem `CONTENT_REVIEW.md` để đối chiếu nội dung với dữ liệu chủ dự án cung cấp.
- Đã triển khai bản rà nội dung lên Pages và backend hiện có. Bộ API cloud và UI production đều đạt, gồm chọn nhân khẩu học, tạo từ form trống và xác nhận/hủy xóa tour. Ba tour cùng sáu việc mẫu cũ được đối chiếu đầy đủ với seed nguyên bản, sao lưu riêng rồi gỡ; không xóa dữ liệu người tham gia.

## Bàn giao và công cụ dữ liệu — 17/10/2026

- Bổ sung `research:report`: đọc hai CSV có quyền xuất, chỉ tạo báo cáo tổng hợp; không thay đổi API, giao diện, schema, dữ liệu public hoặc báo cáo AI.
- 30 kiểm tra đã đạt, gồm dữ liệu CSV rỗng/sai/cắt, email trùng và QA, mốc consent/feedback, mức trả 0, không nhận email là người đã xác minh, không xuất dữ liệu nhận diện/nội dung tự do vào báo cáo, không ghi đè bản gốc.
- Chạy trên CSV thật tại thời điểm rà: 0 phản hồi, 0 tương tác; không tạo kết quả khảo sát. Không có tài khoản QA mới được tạo trên cloud trong đợt này.
- 20 request đọc public đồng thời trả 200; không phải 20 người khảo sát và không được dùng làm bằng chứng SLA.

## Danh mục tour được chủ dự án cung cấp — 17/10/2026

- Nhập 13 nội dung tour Én Việt, có mã nguồn, tuyến đi, thời lượng, giá tham khảo, điểm nổi bật và ngày ghi nhận. 1 tour giữ giá “Liên hệ”. Không tạo ngày đi hoặc tồn chỗ không có nguồn; không seed tour vận hành hay công việc.
- Rà 13 ảnh nguồn: loại 5 ảnh sai/không phù hợp; 8 ảnh còn lại gắn nhãn minh họa. Có trạng thái thay thế khi ảnh thiếu hoặc tải lỗi.
- 33/33 kiểm tra đạt trên SQLite và libSQL. Bao gồm danh mục chỉ đọc, nguồn/giá chưa xác định, không trộn vào tour đã công khai của không gian khác và từ chối yêu cầu đặt chỗ vào mã tham khảo.
- Build Vite, Pages gateway và Sites backend đạt. UI local đạt trên 320/390/768/1440 px; đã thử mở chi tiết, tìm mã tour, dùng nội dung có/không có giá và xác nhận các trường ngày/sức chứa/khách/lịch trình vẫn trống, chưa công khai. Các luồng tour/tư vấn/công việc/phản hồi/reviewer hiện có tiếp tục đạt.
- Đã triển khai lên backend Sites version 4 và Pages production `d0c1eadc-fb1e-4e30-95fb-6c6bddbdb3bb`. API public trả đúng 13 bản ghi tham khảo, 1 giá chưa xác định và 0 tour vận hành tại lúc rà. Bộ API D1 và UI qua URL Pages đều đạt; các tài khoản QA tạm đã xóa. Rà giao diện thực tế: 13 thẻ, 8 ảnh nguồn, 5 trạng thái chờ ảnh, không tràn chiều ngang. Không thay schema hoặc đặt lại dữ liệu; không sửa nhánh Git `dev`.

## MVP 0.3 — B2B, Excel, thao tác nhanh và bàn giao An — 18/10/2026

- 40/40 kiểm tra đạt trên SQLite và driver libSQL; bổ sung giữ/hoàn chỗ B2B đồng thời, phiên bản cũ, tách workspace, giới hạn thanh toán ghi sổ, chặn xóa tour còn phiếu hoạt động và xóa tài khoản có phiếu. XLSX/CSV kiểm tra ngày/số/cột bắt buộc, nhập nguyên lô, chống gửi lặp; log UI không nhận nội dung biểu mẫu. `npm audit --omit=dev`: 0 lỗ hổng tại lúc rà.
- Build FE, Pages gateway và Sites backend đạt. Migration D1 mới chỉ bổ sung bảng/index/trigger B2B; migration 0000 đã áp dụng được giữ nguyên. Đã chạy cả hai migration trên D1 local riêng trước khi triển khai; không đặt lại database production.
- UI local đạt: file XLSX thật nhập thành tour nháp, chọn nội dung trong hai lần chạm, đổi số khách nhanh, giao việc; B2B tạo → xác nhận giữ chỗ → ghi nhận thu → đưa số ghi sổ về 0 → hủy hoàn chỗ. Log bấm nút của participant đã xuất hiện trên server. Reviewer vẫn chỉ xem. Rà ảnh B2B desktop/mobile, không tràn ngang và không có lỗi JavaScript trong các luồng đã thử.
- Backend Sites version 5 và Pages production `5a4876dc-0f28-4b2e-9119-ea53f91b2663` đã triển khai thành công, giữ nguyên binding D1 và revision secrets 2. Bộ API production `tests/cloud-api.mjs` đạt sau migration. UI qua URL Pages đạt thêm B2B giữ/hoàn chỗ, ghi sổ thu, XLSX thật, thao tác nhanh và xác nhận log UI đã đến server; reviewer chỉ xem và không có lỗi JavaScript. Các tài khoản QA tạm đã xóa.
- Google Sheet khảo sát đã tạo và kiểm tra 6 tab, 12 câu, múi giờ Việt Nam, điểm 1–5 và raw trống. Đã thực hiện thao tác chia sẻ theo email anh cung cấp cho An; đọc lại quyền cho thấy email đó đã là chủ sở hữu và có quyền chỉnh sửa. Không mở bảng raw công khai hoặc tạo phản hồi mẫu.
- Bảng P1–P3/S-1–S-4 và kịch bản demo nêu rõ phạm vi B2B sổ nội bộ, log UI có thể thiếu khi mất mạng, giới hạn thao tác 1–2 chạm và S-4 còn cần người thử/dữ liệu thật.
- Sau QA production: API health trả phiên bản 0.3.0; 0 participant, 0 feedback, 0 event, 0 phản hồi đủ log để đối chiếu. Không tạo kết quả khảo sát; dữ liệu demo của nhóm vẫn cần được duyệt và ít nhất 20 người thật còn phải thử.

## Hoàn thiện các việc trong file tiến độ — 18/10/2026

- Bổ sung `survey:report` cho hai tab raw của An, đánh giá riêng 6 nhóm tính năng. 47/47 kiểm tra đạt trên SQLite và libSQL, gồm tách self/demo, không lấy điểm dễ dùng của người chỉ xem, chống dùng dữ liệu trước consent, sửa câu trả lời trùng, giá 0 và không xuất email/ý kiến mở vào báo cáo. Nguồn CSV được bảo vệ khỏi ghi đè.
- Đọc lại web và toàn bộ 1000 dòng khả dụng của hai tab Raw_testers/Raw_features: web vẫn 0 participant/feedback/event; Sheet chỉ có hàng tiêu đề. Chạy lệnh mới trên các CSV tương ứng cho kết quả 0, không tạo thống kê hoặc giá giả.
- Hoàn thiện kịch bản lời dẫn theo P1–P3, ba vòng tập, checklist trình bày và bảng thông tin demo cần nhóm duyệt. Chưa đánh dấu Tuấn đã tập hoặc dữ liệu demo đã được duyệt khi chưa có xác nhận thực tế.
- Chủ dự án yêu cầu chưa gửi giảng viên: không gửi email, thông tin đăng nhập hoặc cấp quyền mới. Bản hướng dẫn bàn giao giữ lại cho lúc anh yêu cầu tiếp.
- Đợt này chỉ bổ sung công cụ offline và tài liệu, không thay giao diện/API/schema/dữ liệu production; tag demo đã phát hành được giữ nguyên.

## Rà soát toàn bộ web và tài liệu nhóm bản 0.4 — 18/10/2026

- Đọc CP3_Task mới, requirements/rubric và phạm vi first release trong CP2. Giữ ba chức năng cốt lõi cùng các phần Task2 đã phân công; không tự điền thông tin kinh doanh còn thiếu.
- 58/58 kiểm tra đạt trên SQLite và libSQL. Thêm khảo sát 6 tính năng với self/demo/untried, giá thiếu khác 0, quyền xuất CSV và giữ phản hồi cũ; task CRUD có phiên bản; lịch sử B2B nguyên tử, rollback khi audit lỗi, tách khỏi research; chặn tư vấn tour đã khởi hành theo ngày Việt Nam.
- Build FE, Pages và Sites đạt. Migration 0002 chỉ tạo feature_feedback, pooling_audit và thêm tasks.version; migration 0000/0001 không đổi. Cả ba migration đã chạy thành công trên D1 QA riêng được xác nhận trống.
- UI local đạt tạo/sửa/xóa việc và bộ lọc, tour rút công khai rồi khôi phục, lịch sử B2B, form 6 tính năng, giá chưa biết/null rồi cập nhật 0, 3 CSV reviewer, XLSX thật và log nút/menu. Không có lỗi JavaScript/tràn ngang trong các luồng kiểm tra ở 320/390/768/1440px.
- Kiểm tra riêng tour editor, đổi số khách, task editor và đối soát: sau 409 giữ giá trị nháp, nút Nạp bản mới lấy đúng dữ liệu/version mới và có thể lưu lại. Hướng dẫn mới có đủ 6 nhóm chức năng, lối mở trực tiếp và bảng P1–P3/S-1–S-4.
- Tài khoản QA được xóa sau từng lần thử. Kết quả production và mã deployment được ghi tiếp sau khi phát hành; chưa dùng QA làm bằng chứng người thử thật.
- Đã phát hành backend Sites version 6, deployment `appgdep_6ad4c2cce484819194a4ff2560c32726`, giữ nguyên revision secrets 2; Pages production `93a2ff2b-c832-4bad-a409-ecf63a43cf02`. Các migration bổ sung chạy trên cùng D1, không đặt lại dữ liệu hoặc sửa migration cũ.
- Production API legacy đạt. UI đầy đủ qua Pages đạt: rút/khôi phục tour trong lúc mở chi tiết, task CRUD/bộ lọc, B2B có audit, khảo sát 6 tính năng/giá null→0, reviewer/CSV, XLSX và logs; không có lỗi JavaScript hoặc tràn ngang trong các màn hình kiểm tra. Kiểm tra riêng 4 form xung đột cũng đạt qua URL production.
- Hai CSV khảo sát production đã kiểm schema/quyền reviewer, bỏ mục chưa thử, không gán điểm dễ dùng cho người chỉ xem, giữ giá thiếu khác 0 và chống công thức trong nội dung tự do. Mọi tài khoản QA riêng của các bộ kiểm tra đều xóa thành công.
- Sau khi dọn QA: health trả `0.4.0`; bộ đếm nghiên cứu trả 0 participants, 0 feedback, 0 events và 0 readyToReview. Những lần thử kỹ thuật không được tính thành người tham gia nghiên cứu.

## Bộ dữ liệu demo do chủ dự án cung cấp — 18/10/2026

- Nhập 3 tour có lịch/giá/sức chứa/số khách theo nguồn; portal hiển thị còn 8, 7 và 8 chỗ. Tạo 3 phiếu B2B chờ xác nhận với `paid=0`, không tự cộng khách hoặc suy diễn khoản đã thu từ nguồn mâu thuẫn.
- Nhập TASK-01 và TASK-02 với tour liên quan rõ, giữ người phụ trách/trạng thái/hạn. TASK-03 chưa có tour liên quan nên chưa nhập. [Bàn giao dữ liệu và điểm cần xác nhận](OWNER_DEMO_DATA_2026-10-18.md).
- Kiểm tra production chỉ đọc đạt: portal agency có nhãn giả lập, form yêu cầu thử nghiệm, 3 tour, 3 phiếu chờ và 2 công việc; không tràn ngang ở 320/390/768px, không lỗi JavaScript. Nhãn không thay đổi luồng của không gian người thử riêng.
- Bảng tester không được nhập thành phản hồi hoặc tài khoản. Sau nhập và kiểm tra, các bộ đếm nghiên cứu vẫn bằng 0; liên hệ B2B không xuất hiện trong API công khai.
- UI CI ban đầu vướng câu thông báo reviewer cũ. Cập nhật assertion theo thông báo dữ liệu giả lập mới và giữ nguyên toàn bộ kiểm tra chặn quyền sửa/xóa/xuất dữ liệu.
- Full UI regression production đã đạt lại với bộ dữ liệu demo hiện hữu: người thử riêng, portal, tư vấn, task CRUD, B2B/audit, phản hồi, XLSX và reviewer; tài khoản QA được xóa. Pages deployment `996531fa-b887-4523-ba56-cfbbc81267fe`; Sites version 7 deployment `appgdep_6ad4e342e2448191b393df7ba7345532` thành công, secrets revision 2 giữ nguyên.

## Hoàn thiện MVP 0.4.1 — 19/10/2026

- 66/66 kiểm tra tự động đạt trên SQLite và libSQL: thêm các tình huống inquiry vừa ẩn/đầy/qua ngày/xóa, B2B phiên bản tương lai và log sai cấu trúc; lọc ngày/chỗ/tìm không dấu và mốc ngày Việt Nam.
- UI local đạt bộ lọc ngày bao gồm biên, khoảng ngày đảo ngược, hết chỗ/đã đi, danh mục chưa có lịch được giải thích riêng và reset. Hero mobile 390px rộng khoảng 361px cao; không có tràn ngang ở 320/390/768/1440px trong màn hình đã thử.
- Full UI local đạt network recovery/slow polling, tour ẩn khi đang mở, task CRUD, B2B/history, khảo sát sáu tính năng, reviewer và nhập XLSX thành nháp. Lần nhập cố ý bị giữ response để kiểm modal không đóng khi Escape/nền/nút Đóng; tiếp tục response vẫn nhập đúng một lần.
- Build Vite, Pages và Sites đạt. Không thêm dependency ứng dụng, schema hoặc migration. Source cloud dùng các module chung mới qua exporter, không sửa riêng hai bản logic.
- Chi tiết thay đổi và thông tin nhóm còn cần cung cấp: [rà soát 19/10](WEB_REVIEW_2026-10-19.md). Kết quả production được ghi tiếp sau phát hành.
- Đã phát hành Sites version 8 (`appgdep_6ad507f051688191a18bd61376671ed2`) và Pages (`0ed61021-f452-475e-a3b9-8969fd3329a2`); health production trả `0.4.1`. Secrets revision 2, D1 và các migration cũ giữ nguyên.
- Sau khi cả FE/BE mới đều live, production API và full browser regression đã đạt lại, gồm log sai trả 400, các luồng lõi, bộ lọc lịch/chỗ, reviewer và nhập XLSX cố ý giữ response để kiểm khóa đóng. Không có lỗi JavaScript/tràn ngang trong màn hình kiểm tra; tài khoản QA đã xóa.
- Readback sau rollout vẫn đúng 3 tour, 3 phiếu chờ `paid=0`, 2 việc và số khách 22/30, 18/25, 12/20. Bộ đếm nghiên cứu sau dọn QA vẫn 0 participants, 0 feedback, 0 events, 0 readyToReview; không đưa bộ tester mẫu vào dữ liệu nghiên cứu.

## Phát hành 0.5 — 19/10/2026

86/86 kiểm tra trên SQLite và libSQL đạt. API production và cả hai bộ browser cũ/mới đạt; QA tạm được xóa. Đã kiểm tra 3 tour công khai với ảnh, 3 công việc, B2B xác nhận2/chờ1, số khách22/18/12 và thu giả lập33,6tr/8,5tr/0. Admin không làm tăng khảo sát. Bộ demo quản trị không tràn ngang320/390/1440px, không lỗi JS.

Migration0003 bổ sung bảng tài khoản; Sites version10 và Pages sourcef695f2d đã phát hành, D1 và secrets revision2 giữ nguyên. Chi tiết ở RELEASE_0_5.md; metadata deployment ở cloud/site.json và cloud/pages/deployment.json. Xác minh email/gửi khôi phục còn chờ nhà cung cấp; không có tester thật hay giao dịch thật tự phát sinh.

## UX 0.5.1 - 23/10/2026

89/89 kiểm tra trên SQLite và libSQL đạt. Các bộ trình duyệt local/public kiểm tra luồng cũ, tài khoản/nhân viên và sáu cải thiện UX; không ghi nhận lỗi JavaScript hoặc tràn ngang trong màn hình kiểm tra ở 320/390 px. Ẩn tour giữ nguyên số khách, phiếu, số thu và phiên bản phiếu. Không tự đổi số tiền để xóa tour. API production đạt sau phát hành; dữ liệu QA được xóa.

Sites version11 và Pages runtime source96109bd đã phát hành; schema/migration/secrets và dữ liệu nghiệp vụ hiện có giữ nguyên. Xem RELEASE_0_5_1.md và metadata cloud để truy nguyên.

## Giảm thời gian chờ giao diện — 24/10/2026

- Một lần đo trên Pages trước sửa: tiêu đề hiện sau 2.831 ms, tour sau 3.665 ms; riêng GET session mất 2.105 ms. Điều hướng nội bộ trong cùng lần thử mất khoảng 128–193 ms gồm 100 ms chờ của bộ đo. Đây là số đo quan sát trên một thiết bị/kết nối, không phải SLA hay benchmark đại diện.
- Cổng public tải song song với kiểm tra phiên. Điều hành và liên kết tài khoản vẫn đợi kiểm tra phiên; phản hồi phiên cũ không thể ghi đè đăng nhập vừa hoàn thành. Danh mục tham khảo chưa mở không dựng các thẻ vào DOM.
- Đồng bộ đọc vẫn có nhịp cơ bản 5 giây sau khi lần trước kết thúc; không chồng yêu cầu, tạm ngưng khi tab ẩn/offline, tải ngay khi quay lại/online và giãn nhịp lỗi tối đa 30 giây. Không tự gửi lại thao tác ghi.
- 93/93 kiểm tra tự động đạt; thêm kiểm tra lịch đồng bộ bằng đồng hồ giả. Full UI và UX 0.5.1 local đạt lại, gồm mạng chậm, khôi phục kết nối, tour/công việc/B2B/XLSX và mobile. Bộ performance-ui mới đạt: cố ý giữ response session, portal vẫn dùng được; đăng nhập mới không bị response cũ hủy; workspace chưa hiện khi phiên chưa được kiểm tra.
- Không thêm dependency, đổi schema/migration hoặc sửa dữ liệu nghiệp vụ. Kết quả và mã triển khai public được ghi sau khi phát hành.
- Sau phát hành: Sites version13 và Pages source88c5606 thành công, secrets revision2 giữ nguyên. Cả performance-ui, full UI và UX 0.5.1 trên public đều đạt; dữ liệu QA đã được xóa. Trang chủ không tràn ngang ở 320/390/1440px, không có lỗi JavaScript trong các luồng đã thử. GitHub CI của source88c5606 đạt.
- Lần đo lại trên cùng máy: tiêu đề 835 ms, tour 1.271 ms, workspace 222 ms; không thấy long task trong lần đo này. Với CPU giả lập chậm4x và cache sẵn: tiêu đề 294 ms, tour508 ms (trước sửa1.075/1.088 ms). Cache và mạng giữa các lần đo có thể khác; không suy ra phần trăm cải thiện hoặc cam kết thời gian cho mọi người dùng. Các phép thử giữ session bằng route interception xác nhận độc lập rằng portal không còn phụ thuộc thời gian phản hồi session.

## Tách cổng khách hàng và điều hành — 24/10/2026

- Cổng `/` và `/portal/<workspace>` vào thẳng tra cứu tour: bỏ toàn bộ hero/khối mô tả công cụ điều hành, CTA doanh nghiệp và khẩu hiệu chân trang theo bốn ảnh của chủ dự án. Logo chung đổi từ `taskhub` thành `TaskHub`. Giữ nhãn dữ liệu giả lập, nguồn ảnh, lịch/giá/chỗ, bộ lọc, chi tiết và gửi yêu cầu.
- `/app` khi chưa đăng nhập hiển thị trang vào riêng cho điều hành; CTA doanh nghiệp chỉ còn ở khu vực này. Đăng nhập hoặc dùng thử được mở từ đây. Tài khoản đã có giữ nguyên workspace, quyền chỉnh sửa/xem, log và dữ liệu; khách xem tour không cần tạo tài khoản. Vai trò nghề nghiệp trong survey khác quyền truy cập hệ thống.
- 93/93 kiểm tra tự động đạt. Full UI, v0.5 và UX 0.5.1 local đạt lại. Performance-ui kiểm cả hai giao diện ở 320/390/1440px, khách chưa đăng nhập gửi yêu cầu vào workspace QA thật và API nội bộ vẫn trả401; phản hồi phiên chậm/cũ không làm hỏng đăng nhập, và workspace đợi phiên được kiểm tra. Phiếu yêu cầu QA, tour và tài khoản tạm được xóa cùng workspace.
- Không đổi schema, migration, mật khẩu hay quyền của tài khoản hiện có. Thông tin triển khai public được cập nhật sau khi kiểm tra.
- Public Pages sourcef32bc6f và Sites version15 đã phát hành, giữ D1/migration/secrets revision2. Full UI và v0.5 trên Pages đạt lại; bộ performance-ui đạt trên cả Pages và Sites, gồm khách gửi yêu cầu không có session, API nội bộ401 và các kiểm tra giao diện theo hai vai trò. QA được xóa sau kiểm tra.
- Kiểm tra mở trực tiếp `/app` ở Sites phát hiện React418 do SPA đọc đường dẫn trình duyệt khác HTML SSR. Exporter nay dựng một trạng thái tải chung rồi mount SPA trên trình duyệt; kiểm tra lại không còn lỗi console/hydration. Pages không cần thay bản build vì thay đổi này chỉ ở exporter cho Sites. GitHub CI của sourcefc80251 đã đạt.

## Thu gọn tài khoản và dừng xác minh email — 24/10/2026

- Theo yêu cầu chủ dự án, thẻ Tài khoản & bảo mật chỉ còn tiêu đề/icon, tên/email của người đang đăng nhập và quyền hiện tại. Bỏ badge/nút xác minh, mô tả email provider và đoạn thời hạn lưu tại thẻ này. Thông báo dữ liệu tại đăng ký/Hướng dẫn vẫn giữ đúng thực tế.
- Dừng hai API xác minh cũ bằng410, không gửi thư hay sửa trạng thái tài khoản; bỏ màn hình xác nhận và xóa tham số verify cũ khỏi URL. Giữ dữ liệu/cột lịch sử, không đánh dấu toàn bộ tài khoản là đã xác minh và không thay đổi quyền hoặc mật khẩu. Lời mời/khôi phục mật khẩu là luồng riêng, giữ hành vi hiện có.
- 94/94 kiểm tra tự động đạt. V0.5 UI local đạt: đúng hai dòng nội dung trong thẻ, không badge/nút/mô tả, tên/email động, không tràn ở320/390px; mời, nhận, thu hồi quyền nhân viên và xử lý reset vẫn đúng. Performance-ui local đạt lại, khách và điều hành vẫn tách biệt. QA được xóa sau kiểm tra.
- Đã phát hành Sites version16 và Pages sourcec877478, giữ nguyên D1/migration/secrets revision2. V0.5 UI production đạt lại, gồm thẻ tài khoản tối giản, API xác minh trả410, liên kết cũ không mở dialog và luồng nhân viên/reset. QA được xóa; GitHub CI sourcec877478 đạt.

## Xóa chức năng ngoài phạm vi được yêu cầu — 24/10/2026

- Đối chiếu trực tiếp CP3 Requirements mục 2.1–2.3 và CP3_Task/phần Tuấn: cần ít nhất 20 người thử, đánh giá tính năng và raw user interaction data; không yêu cầu giao diện bấm bắt đầu/kết thúc, tính thời gian bài thử hoặc CSV thời gian riêng. Do chủ dự án yêu cầu bỏ, đã xóa frontend, CSS, backend, API, thống kê và exporter của tính năng này. Nạp dữ liệu mẫu được tách thành demo-ui/demo.css riêng.
- Xóa các hàm tạo thư/xác nhận email, truy vấn profile và cờ trạng thái khỏi API tài khoản; đường dẫn cũ không còn route (404). Lời mời nhân viên và reset mật khẩu vẫn có kiểm tra token một lần/hết hạn, không dùng chung với xác minh email nữa. Giữ nguyên schema/migration lịch sử và dữ liệu hiện có, không drop bảng để xóa chức năng.
- Xóa thêm 48 selector CSS của hero/khối giới thiệu khách hàng đã bị bỏ trước đó; slogan đã bỏ không còn trong sidebar. Khối giới thiệu doanh nghiệp vẫn ở cửa vào điều hành đúng yêu cầu tách hai cách xem.
- 91/91 kiểm tra hiện hành đạt; bỏ ba kiểm tra dành riêng cho tính năng thời gian đã xóa, giữ và cập nhật kiểm tra reset/lời mời/quyền. Full UI, UX 0.5.1, v0.5 và performance-ui local đạt. Xác nhận API cũ không còn hoạt động và log nút/menu, khảo sát, CSV, B2B, Excel, mobile vẫn đúng. QA được xóa sau kiểm tra.
- Đã phát hành Sites version17 và Pages source42d2262; database, migration và secrets revision2 giữ nguyên. Full UI, v0.5 và performance-ui public đạt lại, gồm các API bị xóa trả404, log nút/menu vẫn được lưu và quyền khách/điều hành vẫn đúng. QA được xóa, GitHub CI source42d2262 đã đạt. Các tệp trial cũ cũng đã bị xóa khỏi repository cloud, không chỉ khỏi bundle giao diện.
