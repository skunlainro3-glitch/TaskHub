# Bàn giao Tuấn và Huy — cập nhật 04/11/2026

Bản sửa ổn định **0.7.3** đang được chuẩn bị theo yêu cầu chủ dự án: sửa bố cục Quản lý tour 320px, bảo vệ trạng thái tư vấn khi cùng sửa, bỏ danh mục tham khảo khỏi portal, làm rõ xem chi tiết/báo giá với Sửa tour, nhãn phạm vi xuất và tìm kiếm không dấu. Dùng [Demo CP4 0.7.3](CP4_DEMO_0_7_3.md) cho hướng dẫn hiện hành. Chỉ coi phát hành/kiểm tra hoàn tất theo bằng chứng trong [VALIDATION](VALIDATION.md), không từ nội dung tài liệu này.

Cập nhật 29/10/2026: gỡ màn Hướng dẫn và các liên kết góp ý GitHub, dòng DÀNH CHO KHÁCH HÀNG, liên kết Nguồn ảnh ở chân trang; ghi công ảnh vẫn nằm trong chi tiết ảnh. Xuất dữ liệu và tự xóa tài khoản chuyển về Tài khoản & nhóm. Form mời nhân viên được căn hàng và kiểm tra responsive.

Đối chiếu [CP4_Timeline_TaskHub](https://docs.google.com/spreadsheets/d/1qvVwdp1zHSm48SIosN7uZZ6Z6SBhFfcXPWIKeYPNG_4/edit?gid=1199392845#gid=1199392845), tab Timeline và Phân công; CP4 Paths Requirements trang 3; rubric MVP Demonstration; phản hồi trong hai file khảo sát người dùng cung cấp. Không chỉnh bảng phân công hoặc phần slide/P&L của thành viên khác.

Trạng thái **0.7.2**: gỡ menu/form **Phản hồi MVP** và câu hỏi mức sẵn sàng trả trên web; gỡ banner dài “không gian dùng thử”, thẻ workspace trang trí, khối minh họa Tổng quan và badge “Chưa giữ chỗ tự động”. Tách workspace, phân quyền, log nghiệp vụ/nút/menu có đồng ý và cảnh báo offline/dữ liệu cũ vẫn giữ. Dữ liệu phản hồi đã có và các bản xuất lịch sử chỉ đọc được bảo vệ cho admin/reviewer, không xóa hoặc nhập lại thành phản hồi mới.

CP3 mục 2.1–2.3 vẫn cần tối thiểu 20 người thử, phản hồi tính năng và raw interactions; tài liệu không yêu cầu form khảo sát phải là một chức năng trong website. Nhóm dùng công cụ khảo sát bên ngoài và đối chiếu với nhật ký thao tác. Đợt này không tạo hay công bố Google Forms/Sheet mới; không suy ra việc gỡ form đã hoàn thành khảo sát, phân tích giá hoặc CP3/CP4. Phần rà 0.7.1 dưới đây là lịch sử, không phải hướng dẫn mở lại form đã bỏ.

Rà lại bản **0.7.1**: kiểm tra chức năng thực tế, sửa bảo vệ phiên bản khi đổi trạng thái việc, thống nhất công nợ CSV/Excel, phục hồi báo cáo và lỗi tải Excel; sửa ngày giờ Việt Nam, tìm không dấu, menu bàn phím và thông tin quyền đang đăng nhập. Giảm khẩu hiệu và gom định nghĩa báo cáo vào “Cách tính số liệu”. Dữ liệu trình diễn vẫn có nhãn giả lập; không đưa lại chức năng AI, xác minh email hoặc đo thời gian bài thử đã bỏ. Kết quả cụ thể tại [VALIDATION](VALIDATION.md).

## Đúng phạm vi và trạng thái

| Người / STT Timeline | Việc giao | Kết quả FE/BE và bàn giao |
| --- | --- | --- |
| Huy — 4 | Danh sách kỹ thuật, nhánh build | Có nhánh `build`, checklist/tài liệu này và mã nguồn tách module. `dev` giữ để duyệt. |
| Huy — 8 | Role Sales, Điều hành, Giám đốc | Đã có Kinh doanh, Điều hành, Kế toán, Quản lý, Chủ không gian, chỉ xem và người đánh giá. Menu/nút/API/CSV/XLSX áp dụng quyền; đổi quyền có hiệu lực ở request kế tiếp. Chủ không gian vẫn cần chọn bộ phận cho nhân viên thực tế. |
| Huy — 12 | PDF/Excel công nợ và báo giá | B2B: **Công nợ Excel** xuất `.xlsx` toàn không gian; **In / lưu công nợ PDF** theo bộ lọc đang xem. Tour: bấm tên/ảnh để xem chi tiết → **Báo giá Excel** hoặc **In / lưu báo giá PDF**; **Sửa tour** là thao tác riêng. Không tích hợp ngân hàng, không tạo hóa đơn hoặc xác nhận booking. |
| Tuấn — 19 | Ảnh 4G, dashboard | WebP 480/960px cho 3 ảnh đang có; bỏ tải lại 13 nguồn ảnh 404, giữ minh họa có nhãn. Thêm **Báo cáo vận hành** lọc ngày, biểu đồ lịch tour/khách đã giữ, công việc/tư vấn và công nợ theo quyền. |
| Huy — 29 | Nội dung MVP Demo, Solving Pains, Innovation | Có phần nội dung chuyển sang deck ở dưới. Đây là bản nháp để Lợi ghép, không phải deck đã nộp. |
| Tuấn — 32 | Kịch bản demo 6 phút P1–P3 | Có lịch demo và tiêu chí quan sát ở dưới. Tuấn vẫn phải tập trực tiếp, cả nhóm kiểm tra số liệu trước trình bày. |
| Tuấn — 24 và 38 | Freeze mềm 30/10, freeze cuối 03/11 | Sheet đọc ngày 04/11 đánh dấu Xong. Hai mốc đã qua; bản sửa lỗi tiếp theo cần ghi commit/tag và kết quả kiểm tra mới. Trạng thái sheet không tự chứng minh đã tập demo hoặc phát hành bản sửa. |

Bảng đọc trực tiếp ngày 04/11 chỉ còn tab Timeline: Tuấn 19/24/32/38 đánh dấu Xong; Huy 4/8/12/29 vẫn ghi Chưa làm, dù nhánh, phân quyền và xuất tệp đã có trong mã nguồn. Nhóm đối chiếu lại tiến độ với sản phẩm và xác nhận nội dung slide đã ghép; không kết luận thiếu chức năng chỉ từ ô chưa đánh dấu. Các nhận xét về tab Phân công/Tiến độ trong lần đọc 28/10 là lịch sử, không dùng làm trạng thái hiện tại. Không sửa sheet trong đợt web này.

## Dùng dashboard và xuất tệp

**Báo cáo vận hành** dùng dữ liệu workspace đang đăng nhập. Mặc định từ đầu tháng hiện tại đến hết 5 tháng sau; chọn tối đa 24 tháng. Các định nghĩa:

- Tour, khách đã giữ, tỷ lệ lấp đầy và B2B theo **ngày khởi hành**. Công việc theo **hạn**. Yêu cầu tư vấn theo **ngày gửi**, giờ Việt Nam.
- Lấp đầy = tổng khách đã giữ / tổng sức chứa, không lấy trung bình tỷ lệ của từng tour. Trống mẫu thì tỷ lệ không hiển thị 0% giả.
- Tổng tiền chỉ tính phiếu **đã xác nhận**; phiếu chờ/hủy vẫn hiện riêng để đối chiếu. Tiền đã thu là lũy kế hiện tại do nhân viên ghi, không phải dòng tiền phát sinh trong tháng hoặc kết nối ngân hàng. Không gọi đây là doanh thu SaaS hay lợi nhuận.
- Báo cáo đọc lại sau khoảng 30 giây khi đang xem, có nút tải lại và thời điểm lập riêng. Tour/portal/workspace vẫn theo chu kỳ khoảng 5 giây sau lần đọc trước, có backoff khi lỗi. Không công bố SLA hoặc mức 4G chưa đo.
- Báo cáo Excel là bảng số liệu tổng hợp, không có email/liên hệ tư vấn. Người Kinh doanh không nhận sổ B2B; Kế toán không nhận liên hệ tư vấn. Không tự cấp quyền hoặc làm lộ dữ liệu nội bộ trên portal.

**PDF:** bấm In/Lưu PDF → trong hộp thoại trình duyệt chọn “Save as PDF/Lưu dưới dạng PDF”, khổ A4. Đây là luồng in thật, không tự tải một tệp PDF bằng máy chủ. Không dùng QR thanh toán hoặc thông tin hỗ trợ khi nhóm chưa cung cấp.

**Excel:** tệp `.xlsx` giữ số tiền là kiểu số, có dòng tiêu đề/bộ lọc/đóng băng hàng đầu; nội dung bắt đầu `=` được ghi là chữ, không thực thi công thức. Tối đa 5.000 dòng mỗi tệp để giữ giới hạn bộ nhớ MVP; lớn hơn dùng CSV/kỳ nhỏ hơn. CSV và lịch sử đối soát cũ vẫn giữ. Excel B2B xuất toàn workspace; PDF B2B theo bộ lọc đang chọn — giao diện/bản in có ghi rõ.

## Chuẩn bị trước demo

1. Chọn một không gian chỉ dùng dữ liệu giả lập. Mở riêng hai cửa sổ: điều hành và portal cùng workspace. Không demo bằng thông tin khách thật.
2. Có một tour sắp khởi hành, số chỗ còn đủ; một việc chưa xong; một phiếu B2B chờ chưa thu. Không dùng phiếu đã ghi nhận tiền để minh họa xóa tour.
3. Đăng nhập sẵn tài khoản chủ/điều hành; nếu demo role, chuẩn bị tài khoản Kinh doanh hoặc Kế toán đã được chủ mời. Không đưa mật khẩu/liên kết lời mời lên slide hoặc GitHub.
4. Mở sẵn Báo cáo vận hành đúng kỳ ngày khởi hành của tour. Thử nút In và tải Excel trước giờ trình bày. Tắt thông báo cá nhân trên máy.
5. Dùng tag/bản phát hành đã kiểm tra; kiểm tra link public và bản local. Chạy local bằng Node 24+, `npm ci`, tạo `.env` từ `.env.example` với mật khẩu quản trị riêng, `npm run dev`. Có thể dùng bộ mẫu tùy chọn trong workspace trống.

Tag `cp4-demo-v0.7.2`, `cp4-demo-v0.7.1` và `cp4-demo-v0.7.0` giữ nguyên làm mốc dự phòng. Chỉ chọn `cp4-demo-v0.7.3` sau khi commit/tag/deployment được xác nhận trong VALIDATION. Không tự di chuyển tag cũ hoặc coi tập demo/ghép slide đã hoàn tất chỉ vì code đã phát hành.

## Demo live 6 phút

| Thời gian | Thao tác | Câu giải thích / dấu hiệu đúng |
| --- | --- | --- |
| 00:00–00:35 | Mở Quy trình vận hành | Giới thiệu ai làm bước nào, một nguồn tour/lịch/chỗ; đây là core feature. |
| 00:35–01:40 | P1: mở tour, đổi số khách hoặc lịch; mở việc theo tour và đổi trạng thái | Thông tin tập trung, rõ người phụ trách/hạn. Không phải tích hợp Zalo. |
| 01:40–02:45 | P2: sang portal đúng workspace, tìm tour/xem lịch/giá/chỗ; xuất báo giá | Cổng tra cứu công khai 24/7 khi hosting/mạng hoạt động. Yêu cầu tư vấn không tự giữ chỗ. Không hứa cập nhật tức thời. |
| 02:45–04:15 | P3: tạo phiếu ghép 2 khách → xác nhận → đối chiếu chỗ portal → ghi thu giả lập | Phiếu chờ chưa trừ chỗ. Xác nhận tăng đúng số khách một lần. Ghi nhận thu là tổng lũy kế, chưa chuyển tiền qua ngân hàng. Dùng đúng tài khoản Kế toán/chủ khi ghi thu. |
| 04:15–05:10 | Báo cáo vận hành đúng kỳ; Excel công nợ hoặc PDF | Số liệu khớp tour/phiếu, loại phiếu chờ khỏi tổng tiền. Không coi giá trị tour là doanh thu SaaS. |
| 05:10–06:00 | Đổi sang role khác hoặc nêu ma trận quyền; chỉ giới hạn và hướng tiếp | Backend chặn thao tác trái quyền. Nêu phần đã có, phần cần dữ liệu/đo kiểm, kết thúc đúng 6 phút. |

Nếu mạng chậm: chờ hoàn tất, chỉ nút/cảnh báo đồng bộ, tải lại đối chiếu. Không bấm ghi tiền/xác nhận nhiều lần hoặc tự suy đoán giao dịch thất bại. Khi cần quay lại dữ liệu mẫu, dùng một workspace QA mới; không xóa lịch sử đã thu trong workspace nhóm.

## Nội dung nháp để ghép slide phần Tuấn/Huy

**MVP Demo:** TaskHub đã có tour/lịch/chỗ dùng chung, giao việc, portal tra cứu/tư vấn, B2B tối giản, nhập Excel/CSV, phân vai, dashboard và xuất báo giá/công nợ. Trình diễn hành vi thực tế ở cả hai phía, không chỉ ảnh giao diện.

**Solving Pains:** P1 nối dữ liệu điều hành/công việc và giảm nhập lại bằng Excel; P2 cho khách tra cứu và gửi tư vấn ngoài giờ; P3 dùng xác nhận chỗ và lịch sử đối soát để giảm sai lệch. Chưa đo được mức tiết kiệm thực tế hay tăng doanh thu; cần quan sát/phỏng vấn để lượng hóa.

**Innovation và giới hạn:** gọi các luồng hiện có là core feature. Chưa có bằng chứng tính độc nhất, công nghệ riêng, IP hoặc đủ điều kiện Path 2. Đặc điểm có thể chứng minh là cùng dữ liệu tour, kiểm tra sức chứa/phiên bản, phân vai và truy vết đối soát; đây không phải tuyên bố đối thủ không làm được. Nhóm vẫn cần giảng viên pre-approve nếu chọn Path 2.

**Thử nghiệm:** file CP2 có 100 dòng, CP3 có 22 dòng/22 email khác nhau; cả 22 email CP3 trùng email có ở CP2. Không cộng thành 122 người độc lập. CP3 là phản hồi tự khai báo, chưa có cột timestamp/consent hay đối chiếu log trong file này để xác nhận 20 người thử thật. Việc leader rà email thành viên và hỏi mentor vẫn còn. Không nhập các dòng này vào log web hoặc tạo feedback giả.

BMC DOCX và PPTX đính kèm là mẫu chưa điền; không phải giá/gói đã được duyệt. Giá/gói/benchmark/giá trị thuộc An; P&L và đo hiệu năng thuộc Đạt; Path/approval/book lịch/ghép deck thuộc leader. Không đưa giả định chưa khóa thành thông tin mở bán trên web.

## Cần nhóm bổ sung / xác nhận

- Nguồn ảnh thay thế nếu tiếp tục dùng danh mục Én Việt nội bộ; 13 nội dung tham khảo không còn nằm ở portal. Không tự dùng ảnh chuyến đi/khách hàng khác để lấp chỗ trống.
- Bộ phận/quyền thực tế của nhân viên; tên người duyệt chỗ và người đối soát. Hiện có cơ chế, chưa tự gán tên người cho nhóm.
- Giá và gói An đã chốt; điều kiện dịch vụ/đơn vị liên hệ nếu muốn có báo giá chính thức. Bản hiện tại là giá tham khảo từ dữ liệu tour.
- Approval Path 2, số liệu mạng/thiết bị thực tế từ Đạt và xác minh 22 phản hồi từ Lợi. Web đầy đủ hơn không tự hoàn tất các phần này.
- Link và người quản lý khảo sát bên ngoài nếu tiếp tục thu dữ liệu. Nhóm cần ghi thời điểm/định danh đối chiếu với log; không tự dùng link cũ làm bằng chứng khảo sát đang hoạt động hoặc điền phản hồi thay tester.

Các bằng chứng QA tự động nằm trong `docs/VALIDATION.md`, không dùng làm số người khảo sát. Dữ liệu nhóm/public được giữ nguyên; source files và Google Sheet không bị sửa trong đợt này.
