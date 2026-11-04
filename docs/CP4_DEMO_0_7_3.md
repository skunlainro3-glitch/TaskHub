# TaskHub CP4 — chuẩn bị demo bản 0.7.3

Ngày cập nhật: **04/11/2026**. Phạm vi: FE/BE, triển khai và bàn giao. Tài liệu mô tả bản sửa đang chuẩn bị; chỉ dùng tag `cp4-demo-v0.7.3` sau khi commit, kiểm tra và deployment được ghi tại [VALIDATION](VALIDATION.md). Không di chuyển tag 0.7.2 hoặc các tag dự phòng đã phát hành.

Web: https://taskhub-travel.pages.dev/ · Điều hành: https://taskhub-travel.pages.dev/app · Code: https://github.com/skunlainro3-glitch/TaskHub/tree/build. `dev` giữ để chủ repo duyệt.

## Phạm vi và bằng chứng

Đối chiếu CP4 Paths Requirements trang 3, rubric MVP Demonstration và [Timeline CP4 của nhóm](https://docs.google.com/spreadsheets/d/1qvVwdp1zHSm48SIosN7uZZ6Z6SBhFfcXPWIKeYPNG_4/edit?gid=1199392845#gid=1199392845). “100% tính năng chính” là tính năng chính của MVP đã công bố, không phải mọi định hướng BMC hoặc ý tưởng Premium.

| Loại | Nội dung | Cách chứng minh / giới hạn |
| --- | --- | --- |
| Web bắt buộc nếu chọn Path 2 | Sản phẩm triển khai được, các tính năng chính hoạt động | Demo portal, tour/chỗ/việc, B2B, nhập tệp, báo cáo và quyền bằng hành vi. Xem kết quả kiểm tra thực tế trong VALIDATION, không chỉ ảnh giao diện. |
| Web bắt buộc nếu chọn Path 2 | Analytics dashboard, UI/UX rõ và nhận diện | Báo cáo vận hành theo kỳ/quyền, bố cục responsive, tên/logo TaskHub. Không đồng nghĩa đã đo SLA hoặc đủ scalability thương mại. |
| Phạm vi CP2/CP3 và phân công | Portal ngoài giờ, nguồn lịch/chỗ chung, công việc, B2B tối giản, Excel/CSV, xuất PDF/XLSX, log tester | [Bảng P1–P3/S-1–S-4](CP2_FEATURE_MAP.md) nêu giới hạn. PDF là In/Lưu PDF của trình duyệt. |
| Tùy chọn, không tự thêm | Thanh toán ngân hàng, booking, đối tác tự duyệt, tự động hóa Premium, bảng giá SaaS công khai | Chưa triển khai; không trình bày như tính năng hiện có hoặc tự áp dụng hạn mức gói. |
| Ngoài website | Path/pre-approval, innovation, số đo 4G/đồng bộ/đồng thời, tester thật, giá/gói, BMC/P&L, deck và tập present | Cần quyết định/bằng chứng nhóm. Thêm một màn hình không thay thế các phần này. Không thêm báo cáo hoặc tính năng AI vào sản phẩm. |

Thông báo giảng viên về pre-approval Path 2 là điều kiện nhóm phải xác nhận riêng; chức năng SaaS thông thường không tự chứng minh cốt lõi công nghệ riêng/IP. Bài thuyết trình cả nhóm theo PDF là 15 phút và 5 phút Q&A; 6 phút dưới đây là phần demo nhóm phân cho Tuấn/Huy.

## Đối chiếu phân công ngày 04/11

| Người / mục Timeline | Tình trạng sheet được đọc ngày 04/11 | Tình trạng bàn giao sản phẩm |
| --- | --- | --- |
| Tuấn 19 | Xong | Có ảnh WebP và dashboard. Chưa coi tối ưu ảnh là phép đo 4G thật. |
| Tuấn 24, 38 | Xong | Sheet đánh dấu freeze mềm 30/10 và freeze 03/11 xong. Bản sửa lỗi cần chốt commit/tag mới sau kiểm tra; không sửa lịch sử tag. |
| Tuấn 32 | Xong | Có kịch bản 6 phút; trạng thái sheet không tự chứng minh đã tập trực tiếp đủ thời gian. |
| Huy 4, 8, 12 | Chưa làm | Nhánh `build`, phân vai và xuất PDF/XLSX đã có trong mã nguồn. Nhóm đối chiếu checklist với sản phẩm, không dùng ô chưa đánh dấu làm bằng chứng thiếu chức năng. |
| Huy 29 | Chưa làm | Có nội dung nháp MVP Demo/Solving Pains/Innovation trong bàn giao; chưa có bằng chứng đã ghép và duyệt deck. |

Không chỉnh bảng phân công trong đợt code này. Các mốc 30/10 và 03/11 đã qua; chỉ ghi đúng nguồn trạng thái, không gọi là mốc tương lai hoặc tự xác nhận công việc con người.

## Chuẩn bị trước khi lên trình bày

1. Dùng **không gian demo riêng**, dữ liệu giả lập đã duyệt; không thao tác trên dữ liệu nhóm/public đang được người khác dùng. Mở hai cửa sổ điều hành và portal cùng workspace.
2. Có tour chưa khởi hành/còn chỗ; một việc chưa xong; một phiếu B2B chờ chưa thu. Giữ ngày đi phù hợp ngày demo. Không xóa tour có phiếu/số thu để minh họa thao tác thường ngày.
3. Đăng nhập sẵn chủ/điều hành; nếu demo quyền thì chuẩn bị thêm tài khoản Kinh doanh hoặc Kế toán đã được chủ mời. Không đưa mật khẩu, token hay liên kết lời mời lên slide/GitHub.
4. Thử nhập một tệp Excel/CSV trong môi trường demo; xem trước rồi nhập **một lần**. Tour nhập là bản nháp; kiểm tra trước khi công khai. Không nhập lại cả đợt để sửa một trường.
5. Mở Báo cáo vận hành đúng kỳ có tour cần demo. Thử tải `.xlsx` và hộp thoại In/Lưu PDF trước giờ present; trình duyệt phải cho phép tải/in.
6. Chuẩn bị bản local đã cài thư viện, có dữ liệu riêng và chạy thử. Đọc [README](../README.md) cho Node 24+, `npm ci`, `.env`, `npm run dev` hoặc `npm run build`/`npm start`.
7. Ghi lại commit/tag và phiên bản public tại VALIDATION. Tắt thông báo cá nhân. Không cập nhật thư viện/refactor lớn ngay trước demo.

## Demo live 6 phút theo P1–P3

| Thời gian | Thao tác | Điều cần nói / quan sát |
| --- | --- | --- |
| 00:00–00:35 | Mở Quy trình vận hành | Ai chuẩn bị tour, tiếp nhận khách, xác nhận chỗ và đối soát; cùng một nguồn tour. Gọi đây là core feature. |
| 00:35–01:40 | P1: Quản lý tour → xem chi tiết → Sửa tour hoặc Đổi số chỗ; giao việc và đổi trạng thái | Dữ liệu tập trung, rõ người phụ trách/hạn. Không bỏ kiểm tra sức chứa/phiên bản. Ngày và chỗ phải do điều hành xác nhận. |
| 01:40–02:45 | P2: portal cùng workspace → tìm/lọc → xem lịch/giá/chỗ → Báo giá Excel | Thông tin công khai đọc cùng nguồn; không cần máy Tuấn bật. Tư vấn chưa phải booking/giữ chỗ. Có thể chỉ nút In/Lưu PDF, không mất thời gian lưu cả hai tệp. |
| 02:45–04:15 | P3: tạo phiếu ghép 2 khách → xác nhận → đối chiếu chỗ portal → ghi tổng thu giả lập | Phiếu chờ chưa cộng khách. Xác nhận giữ đúng số chỗ một lần. Kế toán/chủ ghi tổng thu lũy kế đã đối chiếu, không phải khoản tăng thêm hay chuyển tiền qua ngân hàng. |
| 04:15–05:10 | Báo cáo đúng kỳ và công nợ Excel/PDF | Tổng tiền loại phiếu chờ/hủy. Excel/CSV công nợ toàn không gian; PDF theo bộ lọc hiện tại. Không so hai phạm vi khác nhau rồi kết luận lệch số. |
| 05:10–06:00 | Đổi role hoặc nêu ma trận quyền; chỉ bảng P1–P3/S-1–S-4 trong tài liệu | API chặn thao tác trái quyền. Nêu S-3 tối giản; S-4 cần dữ liệu thật/giá. Kết thúc đúng thời gian, không mở form khảo sát hoặc màn Hướng dẫn đã xóa. |

**Báo giá:** bấm tên/ảnh tour để xem chi tiết; **Sửa tour** là thao tác riêng dành cho người có quyền. Trong chi tiết có **Báo giá Excel** và **In / lưu báo giá PDF**. Bản hiện có là thông tin tour/giá mỗi khách, chưa tính báo giá cá nhân theo số người/chiết khấu. Portal cũng mở được cùng thông tin công khai.

**Hủy B2B:** nếu cần minh họa ngoài phần 6 phút, dùng phiếu thử chưa thu hoặc đối soát tổng thu về 0 trước. Hủy phiếu xác nhận trả chỗ đúng một lần; không có hoàn tiền thực tế. Không tự sửa số tiền chưa rõ để thao tác chạy qua.

## Khi mạng chậm hoặc có xung đột

- Cảnh báo dữ liệu cũ/offline: giữ bản đang xem, chờ kết nối rồi tải lại. Polling đọc khoảng 5 giây sau lượt trước hoàn tất, không cam kết cập nhật ngay.
- Timeout khi lưu/xác nhận/ghi thu: chưa kết luận thất bại; tải lại đối chiếu trước khi bấm thêm. Không tự gửi lặp thao tác ghi.
- Báo bản cũ: đọc dữ liệu mới, đối chiếu rồi chọn lưu lại. Hai tab cùng sửa là tình huống bảo vệ dữ liệu, không phải lý do bỏ kiểm tra phiên bản.
- Nếu public không dùng được: chuyển sang bản local đã chuẩn bị và nói rõ môi trường. Nếu dùng video dự phòng thì nói đúng là video, không gọi là live.

## Dữ liệu kiểm thử và thông tin còn thiếu

Admin/reviewer: **Tài khoản & nhóm → Dữ liệu kiểm thử → Nhật ký thao tác CSV**. Các CSV phản hồi đã lưu nằm trong phần mở rộng chỉ đọc. Không chiếu raw có email trên màn hình công khai và không đưa vào GitHub. Log UI dành cho tài khoản tester đã đồng ý; admin/reviewer/staff không phải mẫu khảo sát. Log có thể thiếu khi mất mạng/đóng trình duyệt; không dùng số click để đếm người thật.

Nhóm còn cần xác nhận: Path và pre-approval nếu chọn Path 2; đo 4G/độ trễ/đồng thời theo điều kiện thật; tester/khảo sát đối chiếu log; giá/gói, chi phí và căn cứ tài chính; quyền nhân viên thực tế; buổi tập đủ 15 phút của cả nhóm. Không tự điền số liệu, chốt giá hoặc tuyên bố toàn bộ CP4 hoàn tất từ QA.

Chưa gửi thông tin reviewer hoặc cấp quyền mới cho giảng viên theo yêu cầu chủ dự án. Không tự gửi email, book lịch hoặc sửa deck/P&L thay thành viên khác.
