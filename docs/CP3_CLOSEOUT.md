# Hoàn thiện các việc trong file tiến độ của Tuấn

Cập nhật quy trình nhánh 05/11/2026 theo yêu cầu chủ dự án. Code mới vào `dev`, mở PR `dev → main` để chủ repo duyệt; `main` là nhánh chính, mặc định và được bảo vệ. Xem [demo CP4 hiện hành](CP4_DEMO_0_7_3.md) và [VALIDATION](VALIDATION.md) để chọn đúng phiên bản. Tag cố định mã nguồn, không cố định dữ liệu live; không di chuyển tag đã phát hành.

| Việc trong file cũ | Đã xử lý | Việc thực tế còn phụ thuộc |
| --- | --- | --- |
| B2B tối giản | Phiếu đối tác, xác nhận giữ chỗ, ghi nhận thu/còn phải thu, CSV và hủy hoàn chỗ | Bản sổ nội bộ, chưa có đối tác tự duyệt hoặc thanh toán thật. |
| Import Excel | XLSX/CSV, xem lỗi/xem trước, nhập nguyên lô tối đa 20 tour và lưu bản nháp | Tệp phải có đủ ngày/lịch/sức chứa; không tự điền dữ liệu thiếu. |
| Log nút/menu | Log nghiệp vụ và mã điều khiển/thời gian cho participant đã đồng ý | Mất mạng hoặc đóng đột ngột có thể thiếu; không thu nội dung gõ hoặc mật khẩu. |
| 1–2 chạm | Dùng tour, đổi số chỗ, giao việc từ thẻ và đổi trạng thái nhanh | Việc nhập dữ liệu còn cần gõ; bước xem trước Excel được giữ để kiểm tra. |
| Dữ liệu demo được duyệt | Có 13 nội dung Én Việt trong điều hành; bộ giả lập gồm 3 tour, 3 công việc và 3 phiếu B2B (2 xác nhận/1 chờ), theo quy ước chủ dự án cho phép chốt | Chỉ là dữ liệu giả lập, không xác minh giao dịch thật. Không tự áp quy ước demo lên dữ liệu mới chưa rõ. Xem [bàn giao dữ liệu](OWNER_DEMO_DATA_2026-10-18.md). |
| Tuấn tập demo | Có lời dẫn P1–P3, lịch tập, xử lý lỗi và checklist trong CP3_REHEARSAL.md | Tuấn phải tự thực hành; không đánh dấu đã tập thay Tuấn. |
| 20 tester và phân tích | Sheet 12 câu/6 nhóm chức năng, công cụ tổng hợp CSV app và công cụ cho hai tab raw của An | Mốc kiểm tra 18/10 chưa có phản hồi người thử được xác nhận. Bảng ví dụ 22 dòng chưa đủ căn cứ để tính là khảo sát thật; cần đối chiếu cá nhân, consent, thời điểm trải nghiệm và đơn vị tiền. |
| Chuyển reviewer/phụ lục giảng viên | Có hướng dẫn và tài khoản reviewer chỉ xem/xuất | **Anh yêu cầu chưa gửi giảng viên lúc này.** Không gửi thông tin hoặc cấp quyền mới. |

## Thu dữ liệu thật

An dùng Sheet riêng đã bàn giao. Đọc thông báo đồng ý trước khi thu email; dừng nếu người đó không đồng ý. Ghi một dòng ở Raw_testers cho mỗi người và một dòng ở Raw_features cho mỗi tính năng đã đánh giá. Phân biệt tự dùng với xem demo; không yêu cầu người chưa thử chấm điểm.

Nhóm tự ghi kênh tuyển, thời gian, vai trò/quy mô và nguồn mời. Mời hơn 20 người theo kế hoạch nhóm để dự phòng, nhưng chỉ báo đạt yêu cầu sau khi đối chiếu ít nhất 20 cá nhân thực tế. Không dùng tài khoản QA hoặc tạo phản hồi thay người thử.

Lời mời có thể dùng: “Nhóm mình đang kiểm thử TaskHub hỗ trợ điều hành tour. Bạn có thể tự dùng hoặc xem trình diễn các chức năng rồi cho ý kiến, kể cả điểm không thích. Tham gia tự nguyện; nhóm giải thích việc thu email và thao tác trước khi bắt đầu. Bạn có thể dừng bất cứ lúc nào.” Nhóm chọn người/kênh gửi; công cụ không tự phát lời mời hàng loạt.

## Tổng hợp hai tab raw của An

Tải từng tab Raw_testers và Raw_features từ Sheet thành CSV riêng, giữ nguyên tiêu đề cột. Lưu raw trong thư mục hạn chế quyền; không commit vào Git. Lệnh mới:

```powershell
npm run survey:report -- work/research/Raw_testers.csv work/research/Raw_features.csv work/research/survey-report
```

Lệnh tạo `survey-summary.md` và `survey-summary.json`, chỉ gồm tổng hợp; không thay bản gốc hoặc xuất email/ý kiến tự do. Cả 6 nhóm chức năng được báo riêng. Tự dùng và xem demo có số lượng/ý định riêng; độ dễ dùng chỉ lấy từ người tự thao tác. Thiếu điểm không bị đổi thành 0. WTP chấp nhận 0, không đổi “chưa xác định” thành 0. Các cột và lựa chọn nằm trong [hướng dẫn cho An](CP3_SURVEY_QUESTIONS.md).

Từ 0.7.2 app không nhận phản hồi mới. Admin/reviewer vào **Tài khoản & nhóm → Dữ liệu kiểm thử → Bản xuất khảo sát đã lưu** nếu cần CSV Người thử/Đánh giá tính năng lịch sử đúng cấu trúc `Raw_testers`/`Raw_features`. `research:report` dành cho Phản hồi bản trước và nhật ký tương tác; không dùng thay cho hai CSV sáu nhóm tính năng. Không cộng email giữa hai báo cáo thành người độc lập, không nhập khảo sát ngoài web vào log để tạo bằng chứng. Nhóm đối chiếu bản gốc/cá nhân và đọc ý kiến mở trước khi chốt giá hoặc Iterate/Persevere.

## Bàn giao giảng viên khi anh yêu cầu lại

1. Anh xác nhận thời điểm và người nhận. Hiện chưa gửi theo yêu cầu mới nhất.
2. Chuyển URL web và thông tin tài khoản reviewer qua kênh riêng; không gửi mật khẩu quản trị hoặc commit mật khẩu. Reviewer đã có thể xem/xuất, nhưng chưa có bằng chứng giảng viên đã nhận.
3. Cấp quyền **chỉ xem** phụ lục gốc có email cho đúng người nhận; không mở quyền anyone/public. Giữ bản raw và mốc xuất gốc; không dùng QA làm phụ lục khảo sát.
4. Nhóm theo dõi thời hạn lưu khoảng sáu tháng và xóa các bản xuất/chia sẻ khi có yêu cầu phù hợp. Xóa tài khoản trên web không xóa file CSV đã tải.
